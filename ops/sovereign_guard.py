"""
GSS Orion V3 — Sovereignty Guard.
Prevents pushing to main if the active model is not in 'high' mode.
"""

import json
import subprocess
import sys
import time

from core.paths import ROOT
from core.ui import print_step

CONFIG_PATH = ROOT / "brain" / "llm_config.json"
SEAL_PATH = ROOT / "logs" / "identity_seal.json"


def get_current_branch():
    try:
        return subprocess.check_output(
            ["git", "branch", "--show-current"], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        return "UNKNOWN"


def get_identity_seal():
    """Retrieve and validate the identity seal."""
    if not SEAL_PATH.exists():
        return None
    try:
        data = json.loads(SEAL_PATH.read_text(encoding="utf-8"))
        # Expiry: 1 hour (3600 seconds)
        if time.time() - data.get("timestamp", 0) > 3600:
            return "STALE"
        return data.get("nature")
    except Exception:
        return None


def validate_push():
    """
    Validates if the current (Model Mode, Branch, Identity Seal) combination is allowed.
    - If Mode HIGH is active in config, Identity Seal MUST be 'high'.
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
    seal = get_identity_seal()

    # 1. Identity Cross-Check
    if mode == "high" and seal != "high":
        print_step("GUARD", "SOVEREIGNTY BREACH: High-level access requires a valid HIGH identity seal.", "FAIL")
        if seal == "STALE":
            print_step("GUARD", "The current Identity Seal has expired. Please re-certify identity.", "INFO")
        elif seal == "fast":
            print_step("GUARD", "ELEVATION DENIED: Fast model attempting to operate in HIGH mode.", "FAIL")
        else:
            print_step("GUARD", "Missing identity seal. Run 'python -m ops.identity_seal' first.", "INFO")
        return False

    # 2. Branch logic enforcement
    if mode == "fast":
        if branch == "main" or branch == "master":
            print_step("GUARD", f"Sovereignty Breach: Cannot push to '{branch}' in FAST mode.", "FAIL")
            return False
        print_step("GUARD", f"Sovereignty Valid: FAST mode on branch '{branch}'.", "OK")
        return True

    if mode == "high" and seal == "high":
        print_step("GUARD", f"Sovereignty Valid: HIGH level access granted on branch '{branch}'.", "OK")
        return True

    return False


if __name__ == "__main__":
    if not validate_push():
        sys.exit(1)
    sys.exit(0)
