"""
GSS Orion V3 — Session Crystallizer.
Persists session state to bridge.json and triggers atlas snapshot.
Runnable as `python -m ops.crystallize`.
"""
import json
import logging
from datetime import datetime

from core.paths import ROOT
from core.sentinels.atlas import collect_snapshot, write_atlas
from core.version import get_version
from core.ui import print_step

logger = logging.getLogger(__name__)


def crystallize() -> None:
    """Persist session state: update bridge + write atlas snapshot."""
    bridge_path = ROOT / "brain" / "bridge.json"

    # Update bridge
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

    # Write atlas snapshot
    write_atlas()
    print_step("ATLAS", "Snapshot written", "OK")


if __name__ == "__main__":
    crystallize()
