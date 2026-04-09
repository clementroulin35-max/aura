"""
GSS Orion V3 — Sovereignty Guard.
Prevents pushing to wrong branches based on active model tier and identity seal.
Cross-checks: Config Mode + Identity Seal + Git Branch.
"""

import json
import subprocess
import sys
import time

from core.paths import ROOT
from core.ui import print_step

CONFIG_PATH = ROOT / "brain" / "llm_config.json"
SEAL_PATH = ROOT / "logs" / "identity_seal.json"

# Branch rules: which branches each tier can push to
ALLOWED_BRANCHES = {
    "fast": ["flash"],
    "high": ["high", "main", "master"],
}


def get_current_branch():
    try:
        return subprocess.check_output(
            ["git", "branch", "--show-current"], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        return "UNKNOWN"


def get_sovereignty_mode():
    """Read configured sovereignty mode from llm_config.json."""
    if not CONFIG_PATH.exists():
        return "fast"
    try:
        config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        return config.get("sovereignty", {}).get("mode", "fast")
    except Exception:
        return "fast"


def get_identity_seal():
    """Retrieve and validate the identity seal. Returns nature or error string."""
    if not SEAL_PATH.exists():
        return None
    try:
        data = json.loads(SEAL_PATH.read_text(encoding="utf-8"))
        if time.time() - data.get("timestamp", 0) > 3600:
            return "STALE"
        return data.get("nature")
    except Exception:
        return None


def validate_push():
    """
    Full sovereignty validation (3-way check).
    1. Config mode must match Identity Seal.
    2. Branch must be in the allowed list for that tier.
    3. FAST tier is strictly forbidden from branches: high, main.
    """
    mode = get_sovereignty_mode()
    branch = get_current_branch()
    seal = get_identity_seal()

    # 1. Identity Seal Cross-Check (only required for HIGH)
    if mode == "high":
        if seal is None:
            print_step(
                "GUARD",
                "Missing identity seal. Run 'python -m ops.identity_seal --nature high --model <name>' first.",
                "FAIL",
            )
            return False
        if seal == "STALE":
            print_step("GUARD", "Identity Seal expired. Re-certify identity before building.", "FAIL")
            return False
        if seal == "fast":
            print_step("GUARD", "ELEVATION DENIED: Fast model attempting HIGH-tier operation.", "FAIL")
            return False

    # 2. Branch scope enforcement for FAST tier
    if mode == "fast":
        if branch not in ALLOWED_BRANCHES["fast"]:
            print_step("GUARD", f"FAST tier BLOCKED on branch '{branch}'. Only 'flash' is authorized.", "FAIL")
            print_step("GUARD", "Run: git checkout flash", "INFO")
            return False
        print_step("GUARD", f"Sovereignty Valid: FAST on '{branch}'.", "OK")
        return True

    # 3. HIGH tier branch check
    if mode == "high" and seal == "high":
        if branch not in ALLOWED_BRANCHES["high"]:
            print_step("GUARD", f"HIGH tier on unexpected branch '{branch}'. Expected: high or main.", "WARN")
            return False
        print_step("GUARD", f"Sovereignty Valid: HIGH on '{branch}'. Production access granted.", "OK")
        return True

    return False


if __name__ == "__main__":
    if not validate_push():
        sys.exit(1)
    sys.exit(0)
