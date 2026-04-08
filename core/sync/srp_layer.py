"""
GSS Orion V3 — SRP Layer Sync.
Scans all Python files for SRP compliance (Rule R01: < 200 lines).
"""
import logging
from pathlib import Path

from core.paths import ROOT

logger = logging.getLogger(__name__)

MAX_LINES = 200
SKIP_DIRS = {"venv", "__pycache__", "node_modules", ".git", ".venv"}


def sync_srp_layer(root: Path | None = None) -> list[dict]:
    """Scan for SRP violations. Returns list of violation details."""
    r = root or ROOT
    violations: list[dict] = []

    for py_file in r.rglob("*.py"):
        if any(skip in py_file.parts for skip in SKIP_DIRS):
            continue
        try:
            lines = py_file.read_text(encoding="utf-8").splitlines()
            if len(lines) > MAX_LINES:
                violations.append({
                    "file": str(py_file.relative_to(r)),
                    "lines": len(lines),
                    "over_by": len(lines) - MAX_LINES,
                    "status": "VIOLATION",
                })
        except Exception as e:
            logger.warning("SRP scan error on %s: %s", py_file, e)

    return violations
