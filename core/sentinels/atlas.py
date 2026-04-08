"""
GSS Orion V3 — Atlas Sentinel.
Periodically aggregates system state into system_atlas.json.
"""
import json
import logging
import time
from datetime import datetime
from pathlib import Path

import psutil

from core.paths import ROOT
from core.version import get_version

logger = logging.getLogger(__name__)

ATLAS_PATH = ROOT / "logs" / "system_atlas.json"


def collect_snapshot() -> dict:
    """Collect a point-in-time system snapshot."""
    # Count modules per package
    modules: dict[str, int] = {}
    for pkg in ["core", "ops", "portal"]:
        pkg_path = ROOT / pkg
        if pkg_path.exists():
            modules[pkg] = sum(1 for _ in pkg_path.rglob("*.py") if "__pycache__" not in str(_))

    # Brain files
    brain_files = list((ROOT / "brain").glob("*.json")) if (ROOT / "brain").exists() else []

    return {
        "timestamp": datetime.now().isoformat(),
        "version": get_version(),
        "modules": modules,
        "brain_files": len(brain_files),
        "system": {
            "cpu_percent": psutil.cpu_percent(interval=0.1),
            "memory_percent": psutil.virtual_memory().percent,
        },
    }


def write_atlas(snapshot: dict | None = None) -> None:
    """Write atlas snapshot to disk."""
    ATLAS_PATH.parent.mkdir(parents=True, exist_ok=True)
    data = snapshot or collect_snapshot()
    try:
        ATLAS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as e:
        logger.error("Atlas write error: %s", e)


def atlas_loop(interval: int = 30) -> None:
    """Sentinel loop: collect + write every interval seconds."""
    logger.info("Atlas sentinel started (interval=%ds)", interval)
    while True:
        try:
            write_atlas()
        except Exception as e:
            logger.error("Atlas loop error: %s", e)
        time.sleep(interval)


if __name__ == "__main__":
    atlas_loop()
