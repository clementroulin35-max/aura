"""
GSS Orion V3 — Sovereignty Guard.
Prevents pushing to main if the active model is not in 'high' mode.
"""

import json
import subprocess
import sys

from core.paths import ROOT
from core.ui import print_step

CONFIG_PATH = ROOT / "brain" / "llm_config.json"


def get_current_branch():
    try:
        return subprocess.check_output(
            ["git", "branch", "--show-current"], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        return "UNKNOWN"


def validate_push():
    """
    Validates if the current (Model Mode, Branch) combination is allowed to push.
    - Mode FAST: Can push to 'flash' only. 'main' is BLOCKED.
    - Mode HIGH: Can push to 'high' or 'main'.
    """
    if not CONFIG_PATH.exists():
        print_step("GUARD", "Configuration missing. Defaulting to FAST/FLASH.", "WARN")
        mode = "fast"
    else:
        try:
            config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
            mode = config.get("sovereignty", {}).get("mode", "fast")
        except Exception:
            mode = "fast"

    branch = get_current_branch()

    # Logic enforcement
    if mode == "fast":
        if branch == "main" or branch == "master":
            print_step("GUARD", f"Sovereignty Breach: Cannot push to '{branch}' in FAST mode.", "FAIL")
            print_step("GUARD", "Please switch to Claude Opus and branch 'high' for production pushes.", "INFO")
            return False
        print_step("GUARD", f"Sovereignty Valid: FAST mode on branch '{branch}'.", "OK")
        return True

    if mode == "high":
        print_step("GUARD", f"Sovereignty Valid: HIGH mode allowed on branch '{branch}'.", "OK")
        return True

    return False


if __name__ == "__main__":
    if not validate_push():
        sys.exit(1)
    sys.exit(0)
