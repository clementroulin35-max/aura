"""
GSS Orion V3 — QUALITY Team Node.
SRP audit + LLM-powered code critique.
"""
import logging
import re
from pathlib import Path

from langchain_core.messages import SystemMessage

from core.llm import call_llm
from core.paths import ROOT

logger = logging.getLogger(__name__)


def _scan_srp(root: Path, max_lines: int = 200) -> list[dict]:
    """Scan Python files for SRP violations (> max_lines)."""
    violations: list[dict] = []
    for py_file in root.rglob("*.py"):
        if any(skip in str(py_file) for skip in ["venv", "__pycache__", "node_modules", ".git"]):
            continue
        try:
            lines = py_file.read_text(encoding="utf-8").splitlines()
            if len(lines) > max_lines:
                violations.append({
                    "file": str(py_file.relative_to(root)),
                    "lines": len(lines),
                    "severity": "HIGH" if len(lines) > max_lines * 1.5 else "MEDIUM",
                })
        except Exception as e:
            logger.warning("SRP scan error on %s: %s", py_file, e)
    return violations


def _count_bare_excepts(root: Path) -> list[dict]:
    """Find bare except clauses (Rule R03)."""
    findings: list[dict] = []
    for py_file in root.rglob("*.py"):
        if any(skip in str(py_file) for skip in ["venv", "__pycache__", "node_modules"]):
            continue
        try:
            content = py_file.read_text(encoding="utf-8")
            for i, line in enumerate(content.splitlines(), 1):
                if re.match(r"^\s*except\s*:", line):
                    findings.append({"file": str(py_file.relative_to(root)), "line": i})
        except Exception:
            pass
    return findings


def quality_node(state: dict) -> dict:
    """QUALITY team — SRP scan + LLM critique."""
    task = state.get("task", "")

    # Stage 1: SRP scan
    violations = _scan_srp(ROOT)
    bare_excepts = _count_bare_excepts(ROOT)

    # Stage 2: LLM critique (if violations found)
    critique = ""
    if violations:
        violation_summary = "\n".join(f"- {v['file']}: {v['lines']} lines" for v in violations[:10])
        resp = call_llm(
            system_prompt="You are a code quality auditor. Be concise and actionable.",
            user_message=f"SRP violations found:\n{violation_summary}\nSuggest fixes in 3 bullet points.",
        )
        critique = resp.get("content", "")

    verdict = "CLEAN" if not violations and not bare_excepts else f"{len(violations)} SRP, {len(bare_excepts)} R03"
    result = {
        "team": "QUALITY",
        "srp_violations": violations,
        "bare_excepts": bare_excepts,
        "critique": critique,
        "verdict": verdict,
    }

    return {
        "results": [result],
        "messages": [SystemMessage(content=f"[QUALITY] {verdict}. {len(violations)} SRP violations.")],
    }
