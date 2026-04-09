"""
GSS Orion V3 — QUALITY Team Node.
Pipeline: critik (red-team) → corrector (blue-team) → qualifier (judge).
Critik does real scans. Corrector + Qualifier use LLM.
"""

import logging
import re
from pathlib import Path

from langchain_core.messages import SystemMessage

from core.graph.skills import load_skill
from core.llm import call_llm
from core.paths import ROOT

logger = logging.getLogger(__name__)

SKIP_DIRS = {"venv", "__pycache__", "node_modules", ".git", ".venv"}


def _critik_stage(root: Path) -> dict:
    """Stage 1: Critik — red-team audit. Real scans."""
    load_skill("critik")
    threats = {}

    # SRP scan
    srp = []
    for py in root.rglob("*.py"):
        if any(s in py.parts for s in SKIP_DIRS):
            continue
        try:
            count = len(py.read_text(encoding="utf-8").splitlines())
            if count > 200:
                srp.append({"file": str(py.relative_to(root)), "lines": count})
        except Exception:
            pass
    threats["MENACE_ARCH"] = srp if srp else "Clean"

    # Bare except scan
    bare = []
    for py in root.rglob("*.py"):
        if any(s in py.parts for s in SKIP_DIRS):
            continue
        try:
            for i, line in enumerate(py.read_text(encoding="utf-8").splitlines(), 1):
                if re.match(r"^\s*except\s*:", line):
                    bare.append({"file": str(py.relative_to(root)), "line": i})
        except Exception:
            pass
    threats["MENACE_SEC"] = bare if bare else "None detected"

    # Import direction check (core/ must not import ops/ or portal/)
    import_violations = []
    for py in (root / "core").rglob("*.py"):
        if "__pycache__" in str(py):
            continue
        try:
            content = py.read_text(encoding="utf-8")
            if "from ops" in content or "from portal" in content or "import ops" in content:
                import_violations.append(str(py.relative_to(root)))
        except Exception:
            pass
    threats["MENACE_DETTE"] = import_violations if import_violations else "Clean"

    has_threats = any(v not in ("Clean", "None detected") for v in threats.values())
    return {
        "agent": "critik",
        "action": "AUDIT",
        "threats": threats,
        "verdict": "ISSUES_FOUND" if has_threats else "CLEAN",
    }


def _corrector_stage(critik_result: dict) -> dict:
    """Stage 2: Corrector — LLM proposes fixes for critik findings."""
    skill = load_skill("corrector")
    threats = critik_result.get("threats", {})

    if critik_result["verdict"] == "CLEAN":
        return {"agent": "corrector", "action": "SKIP", "proposals": [], "reason": "No findings to correct"}

    summary = []
    for category, findings in threats.items():
        if findings not in ("Clean", "None detected"):
            summary.append(f"{category}: {findings}")

    resp = call_llm(
        system_prompt=skill,
        user_message=f"Critik found these issues:\n{chr(10).join(summary)}\nPropose max 5 actionable fixes.",
    )
    return {
        "agent": "corrector",
        "action": "PATCH",
        "proposals": resp.get("content", ""),
        "critique_ref": critik_result["verdict"],
    }


def _qualifier_stage(critik_result: dict, corrector_result: dict) -> dict:
    """Stage 3: Qualifier — LLM validates corrector proposals."""
    skill = load_skill("qualifier")

    if corrector_result["action"] == "SKIP":
        return {
            "agent": "qualifier",
            "action": "STAMP",
            "verdict": "CERTIFIED",
            "reason": "Codebase clean — no corrections needed",
        }

    resp = call_llm(
        system_prompt=skill,
        user_message=f"Critik verdict: {critik_result['verdict']}\nCorrector proposals:\n{corrector_result['proposals']}\nApprove or reject.",
    )
    verdict = "CERTIFIED" if "approv" in resp.get("content", "").lower() else "NEEDS_REVIEW"
    return {"agent": "qualifier", "action": "STAMP", "verdict": verdict, "analysis": resp.get("content", "")[:300]}


def quality_node(state: dict) -> dict:
    """QUALITY team — critik → corrector → qualifier pipeline."""
    critik = _critik_stage(ROOT)
    corrector = _corrector_stage(critik)
    qualifier = _qualifier_stage(critik, corrector)

    result = {
        "team": "QUALITY",
        "pipeline": "critik → corrector → qualifier",
        "stages": [critik, corrector, qualifier],
        "verdict": qualifier["verdict"],
    }
    return {
        "results": [result],
        "messages": [
            SystemMessage(
                content=f"[QUALITY] critik({critik['verdict']}) → corrector → qualifier({qualifier['verdict']})"
            )
        ],
    }
