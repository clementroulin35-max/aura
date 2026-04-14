"""
GSS Orion V3 — Identity Seal.
Certifies the Agent's real model nature (FLASH/HIGH).

Executed by the Agent before any privileged action.
Supports --auto mode (reads brain/llm_config.json) or manual --nature/--model.
"""

import argparse
import json
import logging
import time

from core.paths import ROOT
from core.ui import print_step

logger = logging.getLogger(__name__)

SEAL_PATH = ROOT / "logs" / "identity_seal.json"
CONFIG_PATH = ROOT / "brain" / "llm_config.json"


def load_llm_config() -> dict:
    """Load LLM sovereignty config from brain/llm_config.json."""
    if not CONFIG_PATH.exists():
        logger.warning("llm_config.json not found — defaulting to flash/unknown.")
        return {}
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning("Failed to load llm_config.json: %s", e)
        return {}


def seal_identity(nature: str, model: str) -> None:
    """Write a timestamped identity seal to logs/identity_seal.json."""
    data = {
        "nature": nature.lower(),
        "model": model,
        "timestamp": time.time(),
    }
    SEAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    SEAL_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print_step("SEAL", f"{nature.upper()} certified — model: {model}", "OK")


def auto_seal() -> None:
    """Auto-detect nature and model from brain/llm_config.json and seal."""
    config = load_llm_config()
    sov = config.get("sovereignty", {})
    nature = sov.get("mode", "flash")
    model = sov.get("active_model", "unknown")
    seal_identity(nature=nature, model=model)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Orion V3 Agent Identity Sealer")
    parser.add_argument(
        "--auto",
        action="store_true",
        help="Auto-detect nature and model from brain/llm_config.json",
    )
    parser.add_argument(
        "--nature",
        choices=["flash", "high"],
        help="Self-identified nature (flash/high). Required if --auto not set.",
    )
    parser.add_argument(
        "--model",
        help="Exact model name. Required if --auto not set.",
    )

    args = parser.parse_args()

    if args.auto:
        auto_seal()
    elif args.nature and args.model:
        seal_identity(args.nature, args.model)
    else:
        parser.error("Either --auto or both --nature and --model must be provided.")
