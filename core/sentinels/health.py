"""
GSS Orion V3 — Health Manager.
Atomic read/write of system_health.json for sentinel coordination.
"""

import json
import logging
from datetime import datetime

from core.paths import ROOT

logger = logging.getLogger(__name__)

HEALTH_PATH = ROOT / "logs" / "system_health.json"


def read_health() -> dict:
    """Read current system health state."""
    if not HEALTH_PATH.exists():
        return {"status": "UNKNOWN", "flags": {}, "last_update": None}
    try:
        return json.loads(HEALTH_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning("Health read error: %s", e)
        return {"status": "ERROR", "flags": {}, "last_update": None}


def write_health(flags: dict | None = None, status: str = "OK") -> None:
    """Write system health state atomically."""
    HEALTH_PATH.parent.mkdir(parents=True, exist_ok=True)
    current = read_health()
    current["status"] = status
    current["last_update"] = datetime.now().isoformat()
    if flags:
        current.setdefault("flags", {}).update(flags)
    try:
        HEALTH_PATH.write_text(json.dumps(current, indent=2), encoding="utf-8")
    except Exception as e:
        logger.error("Health write error: %s", e)


def set_flag(key: str, value: str) -> None:
    """Set a specific health flag."""
    write_health(flags={key: value})


def clear_flags() -> None:
    """Clear all health flags."""
    HEALTH_PATH.parent.mkdir(parents=True, exist_ok=True)
    data = {"status": "OK", "flags": {}, "last_update": datetime.now().isoformat()}
    try:
        HEALTH_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception as e:
        logger.error("Health clear error: %s", e)
