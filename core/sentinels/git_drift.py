"""
GSS Orion V3 — Git Drift Sentinel.
Monitors uncommitted changes via `git status --porcelain`.
Raises health flags at configurable thresholds.
"""
import logging
import subprocess
import time

from core.paths import ROOT
from core.sentinels.health import set_flag

logger = logging.getLogger(__name__)

WARN_THRESHOLD = 50
CRITICAL_THRESHOLD = 100
IGNORED_PATTERNS = ["watchdog.log", "backend.log", "system_health.json", "system_atlas.json", ".pyc", "__pycache__"]


def check_git_drift() -> dict:
    """Check uncommitted file count. Returns drift status."""
    try:
        result = subprocess.run(
            ["git", "status", "--porcelain"],
            cwd=str(ROOT), capture_output=True, text=True, timeout=10,
        )
        if result.returncode != 0:
            return {"status": "GIT_ERROR", "count": 0}

        lines = result.stdout.strip().split("\n") if result.stdout.strip() else []
        changes = [ln for ln in lines if not any(p in ln for p in IGNORED_PATTERNS)]
        count = len(changes)

        if count >= CRITICAL_THRESHOLD:
            set_flag("git_drift", f"CRITICAL:{count} files")
            logger.warning("Git drift CRITICAL: %d files", count)
            return {"status": "CRITICAL", "count": count}

        if count >= WARN_THRESHOLD:
            set_flag("git_drift", f"WARN:{count} files")
            logger.warning("Git drift WARNING: %d files", count)
            return {"status": "WARNING", "count": count}

        return {"status": "OK", "count": count}

    except Exception as e:
        logger.error("Git drift check failed: %s", e)
        return {"status": "ERROR", "count": 0}


def git_drift_loop(interval: int = 60) -> None:
    """Sentinel loop: check git drift every interval seconds."""
    logger.info("Git drift sentinel started (interval=%ds)", interval)
    while True:
        try:
            check_git_drift()
        except Exception as e:
            logger.error("Git drift loop error: %s", e)
        time.sleep(interval)


if __name__ == "__main__":
    git_drift_loop()
