"""
GSS Orion V3 — LLM Tool.
Manages the sovereignty mode (fast/high), active model name, and consistency status.
Primary alignment command: --align MODE MODEL
"""

import argparse
import json
import logging

from core.paths import ROOT
from core.ui import print_banner, print_step

logger = logging.getLogger(__name__)

CONFIG_PATH = ROOT / "brain" / "llm_config.json"

# Tier classification hints (for consistency check only — not enforcement)
_FAST_HINTS = ("flash", "llama", "gemini", "mistral", "deepseek")
_HIGH_HINTS = ("claude", "opus", "sonnet", "gpt-4", "gpt4")


def load_config() -> dict:
    if not CONFIG_PATH.exists():
        return {}
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning("Failed to load llm_config.json: %s", e)
        return {}


def save_config(config: dict) -> None:
    CONFIG_PATH.write_text(json.dumps(config, indent=2), encoding="utf-8")


def _ensure_sovereignty(config: dict) -> dict:
    """Ensure the sovereignty section exists with safe defaults."""
    if "sovereignty" not in config:
        config["sovereignty"] = {"mode": "fast", "active_model": "unknown"}
    return config


def get_status() -> None:
    """Print current mode, model, and consistency check."""
    config = load_config()
    sov = config.get("sovereignty", {})
    mode = sov.get("mode", "UNKNOWN").upper()
    model = sov.get("active_model", "UNKNOWN")

    print_banner("LLM SOVEREIGNTY STATUS")
    print_step("MODE", f"[{mode}]", "OK")
    print_step("MODEL", model, "OK")

    model_lower = model.lower()
    is_fast = any(h in model_lower for h in _FAST_HINTS)
    is_high = any(h in model_lower for h in _HIGH_HINTS)

    if mode == "FAST" and is_high:
        print_step("GUARD", "Mode/Model mismatch — FAST mode with HIGH-tier model.", "WARN")
    elif mode == "HIGH" and is_fast:
        print_step("GUARD", "Mode/Model mismatch — HIGH mode with FAST-tier model.", "WARN")
    else:
        print_step("GUARD", "Mode/Model consistent.", "OK")


def align(mode: str, model: str) -> None:
    """Explicitly set BOTH mode AND active_model (primary alignment command)."""
    config = load_config()
    _ensure_sovereignty(config)
    old_mode = config["sovereignty"].get("mode", "?")
    old_model = config["sovereignty"].get("active_model", "?")
    config["sovereignty"]["mode"] = mode
    config["sovereignty"]["active_model"] = model
    # Remove legacy tiers key if present
    config["sovereignty"].pop("tiers", None)
    save_config(config)
    print_step("SOVEREIGNTY", f"Mode:  {old_mode} → {mode}", "SUCCESS")
    print_step("SOVEREIGNTY", f"Model: {old_model} → {model}", "SUCCESS")


def toggle(model: str = None) -> None:
    """Toggle mode fast↔high. Optionally update active_model at the same time."""
    config = load_config()
    _ensure_sovereignty(config)
    sov = config["sovereignty"]
    old_mode = sov.get("mode", "fast")
    new_mode = "high" if old_mode == "fast" else "fast"
    sov["mode"] = new_mode
    if model:
        sov["active_model"] = model
    save_config(config)
    print_step("SOVEREIGNTY", f"Mode: {old_mode} → {new_mode}", "SUCCESS")
    if model:
        print_step("SOVEREIGNTY", f"Model: {model}", "SUCCESS")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Orion V3 LLM Sovereignty Tool")
    parser.add_argument("--status", action="store_true", help="Show status + consistency check")
    parser.add_argument("--toggle", action="store_true", help="Toggle mode fast ↔ high")
    parser.add_argument(
        "--align",
        nargs=2,
        metavar=("MODE", "MODEL"),
        help="Set mode AND model explicitly (e.g. --align high claude-sonnet)",
    )
    parser.add_argument(
        "--switch",
        choices=["fast", "high"],
        help="Switch to a specific mode (keeps current model unless --model given)",
    )
    parser.add_argument("--model", help="Model name for --toggle or --switch")

    args = parser.parse_args()

    if args.status:
        get_status()
    elif args.align:
        align(mode=args.align[0], model=args.align[1])
    elif args.switch:
        cfg = load_config()
        current_model = cfg.get("sovereignty", {}).get("active_model", "unknown")
        align(mode=args.switch, model=args.model or current_model)
    elif args.toggle:
        toggle(model=args.model)
    else:
        parser.print_help()
