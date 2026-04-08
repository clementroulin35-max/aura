"""
GSS Orion V3 — INTEGRITY Team Node.
Preflight structural check: validates project skeleton before any work.
No LLM call — pure filesystem validation.
"""
import json
import logging
from pathlib import Path

from langchain_core.messages import SystemMessage

from core.paths import ROOT

logger = logging.getLogger(__name__)

# Files required for a valid V3 project
REQUIRED_FILES = [
    "VERSION",
    "Makefile",
    "pyproject.toml",
    "brain/principles.json",
    "brain/personality.json",
    "brain/bridge.json",
    "brain/memory.json",
    "experts/registry.yaml",
    "experts/rules/routing.yaml",
    "experts/rules/roadmap.yaml",
]


def integrity_node(state: dict) -> dict:
    """INTEGRITY team — structural preflight check."""
    checks: list[dict] = []
    failures = 0

    # 1. Required files exist
    for f in REQUIRED_FILES:
        path = ROOT / f
        ok = path.exists()
        checks.append({"check": f"exists:{f}", "status": "OK" if ok else "MISSING"})
        if not ok:
            failures += 1

    # 2. principles.json has 10 rules
    try:
        principles = json.loads((ROOT / "brain" / "principles.json").read_text(encoding="utf-8"))
        rules = principles.get("rules", [])
        rule_count = len(rules)
        ok = rule_count == 10
        checks.append({"check": f"principles_rules:{rule_count}/10", "status": "OK" if ok else "WARN"})
        if not ok:
            failures += 1
    except Exception as e:
        checks.append({"check": "principles_parse", "status": f"ERROR: {e}"})
        failures += 1

    # 3. VERSION file is parseable
    try:
        version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
        ok = version.startswith("v") and version.count(".") >= 2
        checks.append({"check": f"version:{version}", "status": "OK" if ok else "INVALID"})
    except Exception as e:
        checks.append({"check": "version_parse", "status": f"ERROR: {e}"})
        failures += 1

    verdict = "PASS" if failures == 0 else f"FAIL ({failures} issues)"
    result = {"team": "INTEGRITY", "checks": checks, "verdict": verdict, "failures": failures}

    return {
        "results": [result],
        "messages": [SystemMessage(content=f"[INTEGRITY] Preflight: {verdict}. {len(checks)} checks run.")],
    }
