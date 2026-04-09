"""
GSS Orion V3 — Promote to Main.

In HIGH mode on the 'high' branch: push high → main after a successful build.
Called automatically at the end of `make build`. No-op in FAST mode.
"""

import json
import logging
import subprocess
import sys

from core.paths import ROOT
from core.ui import print_step

logger = logging.getLogger(__name__)

CONFIG_PATH = ROOT / "brain" / "llm_config.json"


def _get_mode() -> str:
    """Read current sovereignty mode from config."""
    if not CONFIG_PATH.exists():
        return "fast"
    try:
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        return config.get("sovereignty", {}).get("mode", "fast").lower()
    except Exception as e:
        logger.warning("Failed to read llm_config: %s", e)
        return "fast"


def _get_branch() -> str:
    """Return the current git branch name."""
    try:
        return subprocess.check_output(
            ["git", "branch", "--show-current"], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        return "UNKNOWN"


def promote_to_main() -> bool:
    """
    Push high → main if we are in HIGH mode on the 'high' branch.
    This finalizes the build cycle and promotes validated work to production.
    """
    mode = _get_mode()
    branch = _get_branch()

    if mode != "high":
        print_step("PROMOTE", f"Skipped (mode={mode.upper()}, only HIGH tier promotes to main).", "INFO")
        return True

    if branch != "high":
        print_step("PROMOTE", f"Skipped (branch={branch}, promotion only runs from 'high').", "INFO")
        return True

    try:
        subprocess.check_call(["git", "push", "origin", "high:main"])
        print_step("PROMOTE", "high → main promotion complete.", "OK")
        return True
    except subprocess.CalledProcessError as e:
        print_step("PROMOTE", f"Promotion failed: {e}", "FAIL")
        logger.error("git push origin high:main failed: %s", e)
        return False


if __name__ == "__main__":
    if not promote_to_main():
        sys.exit(1)
    sys.exit(0)
