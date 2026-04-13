"""
GSS Orion V3 — Event Bus.
Thread-safe JSONL writer with automatic file rotation.

Evolutive hooks:
- WebSocket broadcast list (self._ws_connections) for Portal real-time events
- Redis Pub/Sub can be added via set_external_sink() method
- Middleware pipeline: self._middlewares list for event transformation
"""

import contextlib
import json
import logging
import queue
import threading
from datetime import datetime
from pathlib import Path
from typing import Any

from core.paths import ROOT

logger = logging.getLogger(__name__)


class EventBus:
    """Thread-safe event emitter with JSONL persistence and auto-rotation."""

    def __init__(self, log_path: Path | None = None, max_queue_size: int = 1000) -> None:
        self.log_path = log_path or (ROOT / "logs" / "events.jsonl")
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        # Dedicated queues to avoid competition between file write and broadcast
        self._persist_queue: queue.Queue[dict | None] = queue.Queue(maxsize=max_queue_size)
        self._broadcast_queue: queue.Queue[dict | None] = queue.Queue(maxsize=max_queue_size)
        
        self._ws_connections: set[Any] = set()
        self._middlewares: list[Any] = []
        self._start_writer()

    def _start_writer(self) -> None:
        """Background thread for file persistence."""
        def writer() -> None:
            while True:
                item = self._persist_queue.get()
                if item is None: break
                try:
                    with open(self.log_path, "a", encoding="utf-8") as f:
                        f.write(json.dumps(item, ensure_ascii=False) + "\n")
                    # Rotation
                    if self.log_path.exists() and self.log_path.stat().st_size > 5 * 1024 * 1024:
                        self._rotate()
                except Exception as e:
                    logger.error("EventBus persist error: %s", e)
                finally:
                    self._persist_queue.task_done()

        t = threading.Thread(target=writer, daemon=True, name="eventbus-writer")
        t.start()

    def emit(self, actor: str, event: str, status: str = "OK", context: str = "") -> dict:
        """Emit an event. Thread-safe, non-blocking."""
        payload = {
            "timestamp": datetime.now().isoformat(),
            "actor": actor,
            "event": event,
            "status": status,
            "context": context,
        }
        try:
            # Push to both queues
            self._persist_queue.put_nowait(payload)
            self._broadcast_queue.put_nowait(payload)
        except queue.Full:
            logger.warning("EventBus full. Dropping event: %s/%s", actor, event)
        return payload

    async def start_broadcaster(self) -> None:
        """
        Async worker to bridge the sync queue to WebSockets.
        Must be launched in the main FastAPI event loop.
        """
        import asyncio
        loop = asyncio.get_event_loop()
        logger.info("EventBus broadcaster started on main loop.")
        
        while True:
            try:
                # Thread-safe pull from sync queue without blocking the loop
                item = await loop.run_in_executor(None, self._broadcast_queue.get)
                if item is None: break
                
                if self._ws_connections:
                    # Broadcast to all registered WebSockets
                    for ws in list(self._ws_connections):
                        try:
                            await ws.send_json(item)
                        except Exception:
                            self._ws_connections.discard(ws)
                
                self._broadcast_queue.task_done()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("EventBus broadcast error: %s", e)
                await asyncio.sleep(0.1)

    def shutdown(self) -> None:
        """Graceful shutdown: send sentinel to writer thread."""
        self._queue.put(None)

    def _rotate(self) -> None:
        """Keep last 2000 lines when file exceeds size limit."""
        try:
            lines = self.log_path.read_text(encoding="utf-8").strip().split("\n")
            self.log_path.write_text("\n".join(lines[-2000:]) + "\n", encoding="utf-8")
            logger.info("EventBus rotated: kept last 2000 events")
        except Exception as e:
            logger.error("EventBus rotation error: %s", e)

    # ── Evolutive: External Sink Registration ──
    def register_ws(self, connection: Any) -> None:
        """Register a WebSocket connection for live broadcast."""
        self._ws_connections.add(connection)

    def unregister_ws(self, connection: Any) -> None:
        """Unregister a WebSocket connection."""
        self._ws_connections.discard(connection)


# Module-level instance (Rule R08: no singleton pattern)
event_bus = EventBus()
