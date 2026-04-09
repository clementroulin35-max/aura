"""
GSS Orion V3 — LLM Tool.
Manages the sovereignty mode (fast/high) and reports status.
"""

import argparse
import json

# Add project root to sys.path if needed for absolute imports
# (Usually handled by python -m ops.llm_tool)
from core.paths import ROOT
from core.ui import print_banner, print_step

CONFIG_PATH = ROOT / "brain" / "llm_config.json"


def load_config():
    if not CONFIG_PATH.exists():
        return {}
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))


def save_config(config):
    CONFIG_PATH.write_text(json.dumps(config, indent=2), encoding="utf-8")


def get_status():
    config = load_config()
    sov = config.get("sovereignty", {})
    mode = sov.get("mode", "UNKNOWN").upper()
    model = sov.get("active_model", "UNKNOWN")
    print_banner("LLM SOVEREIGNTY STATUS")
    print_step("MODE", f"[{mode}]", "OK")
    print_step("MODEL", model, "OK")


def switch(target_mode: str = None):
    config = load_config()
    if "sovereignty" not in config:
        config["sovereignty"] = {"mode": "fast", "active_model": "gemini-3-flash", "tiers": {"fast": [], "high": []}}

    sov = config["sovereignty"]
    old_mode = sov.get("mode", "fast")

    new_mode = target_mode if target_mode else ("high" if old_mode == "fast" else "fast")

    sov["mode"] = new_mode
    save_config(config)
    print_step("SOVEREIGNTY", f"Switched model tier: {old_mode} -> {new_mode}", "SUCCESS")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Orion V3 LLM Sovereignty Tool")
    parser.add_argument("--status", action="store_true", help="Show current sovereignty status")
    parser.add_argument("--switch", choices=["fast", "high"], help="Switch to a specific mode")
    parser.add_argument("--toggle", action="store_true", help="Toggle between fast and high modes")

    args = parser.parse_args()

    if args.status:
        get_status()
    elif args.switch:
        switch(args.switch)
    elif args.toggle:
        switch()
    else:
        parser.print_help()
