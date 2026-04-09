"""
GSS Orion V3 — Telemetry & Metrics.
Lightweight in-memory aggregator for tracking tokens, latency, and intelligence source.

Evolutive hooks:
- export_prometheus() → future Prometheus metrics endpoint
- Snapshot can be persisted to logs/telemetry.json for historical analysis
"""

import threading
import time
from typing import Any


class Telemetry:
    """Thread-safe in-memory metrics aggregator. Module-level instance (not singleton)."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.metrics: dict[str, Any] = {
            "tokens": {"prompt": 0, "completion": 0, "total": 0},
            "latency": {},
            "errors": {},
            "intelligence": {"local": 0, "remote": 0, "simulation": 0},
            "start_time": time.time(),
        }

    def track_tokens(self, prompt: int, completion: int) -> None:
        """Update token consumption counters."""
        with self._lock:
            self.metrics["tokens"]["prompt"] += prompt
            self.metrics["tokens"]["completion"] += completion
            self.metrics["tokens"]["total"] += prompt + completion

    def track_latency(self, endpoint: str, duration: float) -> None:
        """Track execution time for a specific endpoint."""
        with self._lock:
            if endpoint not in self.metrics["latency"]:
                self.metrics["latency"][endpoint] = []
            entries = self.metrics["latency"][endpoint]
            entries.append(duration)
            # Keep only last 100 for memory efficiency
            if len(entries) > 100:
                self.metrics["latency"][endpoint] = entries[-100:]

    def track_error(self, actor: str) -> None:
        """Increment error count for an actor."""
        with self._lock:
            self.metrics["errors"][actor] = self.metrics["errors"].get(actor, 0) + 1

    def track_intelligence(self, source: str) -> None:
        """Track local vs remote vs simulation LLM usage."""
        with self._lock:
            if source in self.metrics["intelligence"]:
                self.metrics["intelligence"][source] += 1

    def get_snapshot(self) -> dict[str, Any]:
        """Return a calculated snapshot of current performance."""
        with self._lock:
            return {
                "uptime_seconds": round(time.time() - self.metrics["start_time"], 2),
                "tokens": self.metrics["tokens"].copy(),
                "intelligence": self.metrics["intelligence"].copy(),
                "errors": self.metrics["errors"].copy(),
                "avg_latency": {
                    ep: round(sum(durs) / len(durs), 4) for ep, durs in self.metrics["latency"].items() if durs
                },
            }


# Module-level instance (Rule R08: no singleton pattern)
telemetry = Telemetry()
