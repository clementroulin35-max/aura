"""
GSS Orion V3 — Atlas Router (GET /v1/atlas/pulse).
Returns real-time system health and version info.
"""
from fastapi import APIRouter

from core.infra.telemetry import telemetry
from core.sentinels.health import read_health
from core.version import get_version

router = APIRouter(prefix="/v1/atlas", tags=["atlas"])


@router.get("/pulse")
async def get_pulse():
    """Return system pulse: version, health, metrics."""
    return {
        "status": "NOMINAL",
        "version": get_version(),
        "health": read_health(),
        "telemetry": telemetry.get_snapshot(),
    }
