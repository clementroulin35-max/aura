"""
GSS Orion V3 — INTEGRITY Team Node.
Pipeline: governance (R01-R06 scan) → core (structural preflight).
No LLM calls — pure filesystem validation.
"""
import json
import logging
import re
from pathlib import Path

from langchain_core.messages import SystemMessage

from core.graph.skills import load_skill
from core.paths import ROOT

logger = logging.getLogger(__name__)

REQUIRED_FILES = [
    "VERSION", "Makefile", "pyproject.toml",
    "brain/principles.json", "brain/personality.json",
    "brain/bridge.json", "brain/memory.json",
    "experts/registry.yaml", "experts/rules/routing.yaml",
    "experts/rules/roadmap.yaml",
]
SKIP_DIRS = {"venv", "__pycache__", "node_modules", ".git", ".venv"}


def _governance_stage(root: Path) -> dict:
    """Stage 1: Governance — R01-R06 compliance scan."""
    load_skill("governance")  # Load for future LLM pass
    checks = {}

    # R01: SRP
    over = [p for p in root.rglob("*.py")
            if not any(s in p.parts for s in SKIP_DIRS)
            and len(p.read_text(encoding="utf-8", errors="ignore").splitlines()) > 200]
    checks["R01_SRP"] = "FAIL" if over else "PASS"

    # R03: bare except
    bare = 0
    for py in root.rglob("*.py"):
        if any(s in py.parts for s in SKIP_DIRS):
            continue
        try:
            for line in py.read_text(encoding="utf-8").splitlines():
                if re.match(r"^\s*except\s*:", line):
                    bare += 1
        except Exception:
            pass
    checks["R03_EXCEPT"] = "FAIL" if bare else "PASS"

    # R06: Makefile
    checks["R06_MAKEFILE"] = "PASS" if (root / "Makefile").exists() else "FAIL"

    compliance = "PASS" if all(v == "PASS" for v in checks.values()) else "FAIL"
    return {"agent": "governance", "action": "DOGMA_CHECK", "checks": checks, "compliance": compliance}


def _core_stage(root: Path) -> dict:
    """Stage 2: Core — structural preflight."""
    load_skill("core")
    failures = 0
    file_checks = []

    for f in REQUIRED_FILES:
        ok = (root / f).exists()
        file_checks.append({"file": f, "status": "OK" if ok else "MISSING"})
        if not ok:
            failures += 1

    # Principles validation
    try:
        data = json.loads((root / "brain" / "principles.json").read_text(encoding="utf-8"))
        rule_count = len(data.get("rules", []))
        file_checks.append({"file": f"principles:{rule_count}/10", "status": "OK" if rule_count == 10 else "WARN"})
    except Exception as e:
        file_checks.append({"file": "principles_parse", "status": f"ERROR:{e}"})
        failures += 1

    # VERSION
    try:
        v = (root / "VERSION").read_text(encoding="utf-8").strip()
        file_checks.append({"file": f"version:{v}", "status": "OK" if v.startswith("v") else "INVALID"})
    except Exception:
        failures += 1

    verdict = "READY" if failures == 0 else f"FAIL({failures})"
    return {"agent": "core", "action": "STRUCTURAL_CHECK", "checks": file_checks, "verdict": verdict, "failures": failures}


def integrity_node(state: dict) -> dict:
    """INTEGRITY team — governance → core pipeline."""
    gov = _governance_stage(ROOT)
    core = _core_stage(ROOT)

    final_verdict = "PASS" if gov["compliance"] == "PASS" and core["verdict"] == "READY" else "FAIL"
    result = {
        "team": "INTEGRITY",
        "pipeline": "governance → core",
        "stages": [gov, core],
        "verdict": final_verdict,
    }

    return {
        "results": [result],
        "messages": [SystemMessage(
            content=f"[INTEGRITY] Pipeline: governance({gov['compliance']}) → core({core['verdict']}). Final: {final_verdict}"
        )],
    }
