"""
GSS Orion V3 — MAINTENANCE Team Node.
Coverage analysis, version check, and memory health monitoring.
No LLM call — pure analysis.
"""
import json
import logging
from pathlib import Path

from langchain_core.messages import SystemMessage

from core.paths import ROOT
from core.version import get_version

logger = logging.getLogger(__name__)


def _check_test_coverage(root: Path) -> dict:
    """Assess test coverage by matching core modules to test files."""
    core_modules = set()
    for py_file in (root / "core").rglob("*.py"):
        if "__pycache__" not in str(py_file) and py_file.name != "__init__.py":
            core_modules.add(py_file.stem)

    test_files = set()
    tests_dir = root / "ops" / "tests"
    if tests_dir.exists():
        for tf in tests_dir.glob("test_*.py"):
            test_files.add(tf.stem.replace("test_", ""))

    covered = core_modules & test_files
    uncovered = core_modules - test_files
    pct = round(len(covered) / len(core_modules) * 100) if core_modules else 0

    return {"covered": sorted(covered), "uncovered": sorted(uncovered), "percentage": pct}


def _check_memory_health(root: Path) -> dict:
    """Assess adaptive memory health."""
    mem_path = root / "brain" / "memory.json"
    if not mem_path.exists():
        return {"status": "MISSING", "entries": 0}
    try:
        data = json.loads(mem_path.read_text(encoding="utf-8"))
        entries = len(data.get("entries", []))
        return {"status": "OK" if entries < 50 else "NEEDS_COMPACTION", "entries": entries}
    except Exception as e:
        return {"status": f"ERROR: {e}", "entries": 0}


def maintenance_node(state: dict) -> dict:
    """MAINTENANCE team — coverage, version, memory health."""
    coverage = _check_test_coverage(ROOT)
    memory_health = _check_memory_health(ROOT)
    version = get_version()

    verdict_parts: list[str] = []
    verdict_parts.append(f"coverage:{coverage['percentage']}%")
    verdict_parts.append(f"memory:{memory_health['status']}")
    verdict_parts.append(f"version:{version}")
    verdict = " | ".join(verdict_parts)

    result = {
        "team": "MAINTENANCE",
        "coverage": coverage,
        "memory_health": memory_health,
        "version": version,
        "verdict": verdict,
    }

    return {
        "results": [result],
        "messages": [SystemMessage(content=f"[MAINTENANCE] {verdict}")],
    }
