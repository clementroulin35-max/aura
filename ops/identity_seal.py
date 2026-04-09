"""
GSS Orion V3 — Identity Seal.
Certifies the Agent's real model nature (FAST/HIGH).
To be executed by the Agent before any privileged action.
"""

import argparse
import json
import time

from core.paths import ROOT

SEAL_PATH = ROOT / "logs" / "identity_seal.json"


def seal_identity(nature: str, model: str):
    """Writes a timestamped identity seal to the logs."""
    data = {
        "nature": nature.lower(),  # fast or high
        "model": model,
        "timestamp": time.time(),
    }
    SEAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    SEAL_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    # Output for the agent to see confirmation
    print(f"IDENTITY SEAL: {nature.upper()} confirmed for model {model}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Orion V3 Agent Identity Sealer")
    parser.add_argument("--nature", choices=["fast", "high"], required=True, help="Self-identified nature (fast/high)")
    parser.add_argument("--model", required=True, help="Exact model name used by the agent")

    args = parser.parse_args()
    seal_identity(args.nature, args.model)
