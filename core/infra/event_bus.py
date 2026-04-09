"""
GSS Orion V3 — Event Bus.
Thread-safe JSONL writer with automatic file rotation.

Evolutive hooks:
- WebSocket broadcast list (self._ws_connections) for Portal real-time events
- Redis Pub/Sub can be added via set_external_sink() method
- Middleware pipeline: self._middlewares list for event transformation
"""

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
        self._queue: queue.Queue[dict | None] = queue.Queue(maxsize=max_queue_size)
        self._ws_connections: set[Any] = set()  # Evolutive: WebSocket connections
        self._middlewares: list[Any] = []  # Evolutive: event transform pipeline
        self._start_writer()

    def _start_writer(self) -> None:
        """Start background writer thread."""

        def writer() -> None:
            while True:
                item = self._queue.get()
                if item is None:
                    break
                try:
                    with open(self.log_path, "a", encoding="utf-8") as f:
                        f.write(json.dumps(item, ensure_ascii=False) + "\n")
                    # Auto-rotation: keep file under 5MB
                    if self.log_path.exists() and self.log_path.stat().st_size > 5 * 1024 * 1024:
                        self._rotate()
                except Exception as e:
                    logger.error("EventBus write error: %s", e)
                self._queue.task_done()

        t = threading.Thread(target=writer, daemon=True, name="eventbus-writer")
        t.start()

    def emit(self, actor: str, event: str, status: str = "OK", context: str = "") -> dict:
        """Emit an event. Non-blocking (drops on full queue)."""
        payload = {
            "timestamp": datetime.now().isoformat(),
            "actor": actor,
            "event": event,
            "status": status,
            "context": context,
        }
        try:
            self._queue.put_nowait(payload)
        except queue.Full:
            logger.warning("EventBus queue full. Dropping event: %s/%s", actor, event)
        return payload

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
