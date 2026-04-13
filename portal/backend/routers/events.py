"""
GSS Orion V3 — Events Router (WebSocket /ws/events).
Real-time event streaming via WebSocket.

Evolutive hook: EventBus.register_ws() allows plugging this into live event flow.
"""
import asyncio
import contextlib
import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.infra.event_bus import event_bus
from core.paths import ROOT

router = APIRouter(tags=["events"])

EVENTS_FILE = ROOT / "logs" / "events.jsonl"


@router.websocket("/ws/events")
async def events_websocket(ws: WebSocket):
    """Stream events to connected WebSocket clients."""
    await ws.accept()
    event_bus.register_ws(ws)

    try:
        # Heartbeat loop
        while True:
            await asyncio.sleep(15)
            try:
                await ws.send_json({"actor": "GATEWAY", "event": "HEARTBEAT", "status": "NOMINAL"})
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        event_bus.unregister_ws(ws)
