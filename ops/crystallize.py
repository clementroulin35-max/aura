"""
GSS Orion V3 — Session Crystallizer.
Persists session state: bridge update, atlas snapshot, memory digest, cognitive flags.
Combines V1's multi-step crystallization with V3 clean architecture.
Runnable as `python -m ops.crystallize`.
"""

import json
import logging
from datetime import datetime

from core.paths import ROOT
from core.sentinels.atlas import write_atlas
from core.ui import print_step
from core.version import get_version

logger = logging.getLogger(__name__)


def _update_bridge() -> None:
    """Update bridge.json with current session state."""
    bridge_path = ROOT / "brain" / "bridge.json"
    try:
        bridge = json.loads(bridge_path.read_text(encoding="utf-8"))
    except Exception:
        bridge = {}

    bridge["version"] = get_version()
    bridge["last_session"] = datetime.now().isoformat()
    bridge["pulse"] = "NOMINAL"
    bridge["health"] = {"build": "SUCCESS", "sentinels": "STANDBY"}

    bridge_path.write_text(json.dumps(bridge, indent=2), encoding="utf-8")
    print_step("BRIDGE", f"Updated → {get_version()}", "OK")


def _persist_memory() -> None:
    """Persist session pills from brain/memory.json learnings."""
    try:
        from ops.adaptive_memory import status as mem_status

        s = mem_status()
        print_step("MEMORY", f"{s['total']} entries ({s['active']} active, {s['pending']} pending)", "OK")
        if s["status"] == "INGESTION_REQUIRED":
            print_step("MEMORY", "INGESTION REQUIRED — run 'make memory-approve'", "WARN")
    except Exception as e:
        logger.warning("Memory status failed: %s", e)


def _inject_cognitive_flags() -> None:
    """Auto-inject pending findings into roadmap."""
    try:
        from ops.cognitive_flag import inject_flags

        count = inject_flags()
        if count > 0:
            print_step("FLAGS", f"{count} cognitive flags injected into roadmap", "OK")
    except Exception as e:
        logger.warning("Cognitive flagging failed: %s", e)


def _run_integrity() -> None:
    """Update integrity hashes for protected files."""
    try:
        from ops.integrity_check import check_integrity

        report = check_integrity()
        drift = len(report.get("drifted", []))
        print_step("INTEGRITY", f"Checked {report['checked']} files. Drift: {drift}.", "OK" if drift == 0 else "WARN")
    except Exception as e:
        logger.warning("Integrity check failed: %s", e)


def crystallize() -> None:
    """Full session crystallization pipeline."""
    print_step("CRYSTALLIZE", "Persisting session state...", "START")

    # Step 1: Conscious Bridge
    _update_bridge()

    # Step 2: Atlas Snapshot
    write_atlas()
    print_step("ATLAS", "Snapshot written", "OK")

    # Step 3: Memory Awareness
    _persist_memory()

    # Step 4: Cognitive Flagging
    _inject_cognitive_flags()

    # Step 5: Integrity Hashes
    _run_integrity()

    print_step("CRYSTALLIZE", "Session sealed.", "OK")


if __name__ == "__main__":
    crystallize()
