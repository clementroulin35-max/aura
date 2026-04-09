"""
GSS Orion V3 — Cognitive Flagging.
Analyzes bridge.json pending items and adaptive memory critical entries.
Injects findings as new objectives in roadmap.yaml.
Ported from V1's tools/cognitive_flag.py.
"""

import json
import logging

import yaml

from core.paths import ROOT

logger = logging.getLogger(__name__)

BRIDGE_PATH = ROOT / "brain" / "bridge.json"
MEMORY_PATH = ROOT / "brain" / "memory.json"
ROADMAP_PATH = ROOT / "experts" / "rules" / "roadmap.yaml"


def _load_json(path) -> dict:
    if path.exists():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning("JSON load failed for %s: %s", path.name, e)
    return {}


def inject_flags() -> int:
    """Scan bridge + memory for pending items, inject into roadmap."""
    bridge = _load_json(BRIDGE_PATH)
    memory = _load_json(MEMORY_PATH)
    roadmap_data = {}

    if ROADMAP_PATH.exists():
        try:
            roadmap_data = yaml.safe_load(ROADMAP_PATH.read_text(encoding="utf-8")) or {}
        except Exception as e:
            logger.warning("Roadmap parse error: %s", e)
            return 0

    # Gather pending items from bridge
    pending = bridge.get("pending_items", [])

    # Gather critical entries from adaptive memory
    for entry in memory.get("entries", []):
        if entry.get("status") == "pending" and entry.get("category") in ("defect", "error", "insight"):
            flag_text = f"FIX_{entry.get('category', '').upper()}: {entry.get('learning', '')}"
            if flag_text not in pending:
                pending.append(flag_text)

    if not pending:
        logger.info("No cognitive flags to inject.")
        return 0

    # Inject into roadmap as cognitive_flags milestone
    milestones = roadmap_data.get("roadmap", {}).get("milestones", [])
    existing_ids = {m.get("id") for m in milestones}

    if "CF" not in existing_ids:
        milestones.append(
            {
                "id": "CF",
                "name": "COGNITIVE_FLAGS",
                "goal": "Auto-injected findings from bridge and memory.",
                "status": "IN_PROGRESS",
                "flags": pending,
            }
        )
    else:
        for m in milestones:
            if m.get("id") == "CF":
                existing_flags = m.get("flags", [])
                for flag in pending:
                    if flag not in existing_flags:
                        existing_flags.append(flag)
                m["flags"] = existing_flags
                break

    # Write back
    ROADMAP_PATH.write_text(yaml.dump(roadmap_data, sort_keys=False, allow_unicode=True), encoding="utf-8")
    logger.info("Injected %d cognitive flags into roadmap.", len(pending))
    return len(pending)


if __name__ == "__main__":
    from core.ui import print_step

    count = inject_flags()
    print_step("FLAGS", f"{count} cognitive flags processed", "OK" if count else "SKIP")
