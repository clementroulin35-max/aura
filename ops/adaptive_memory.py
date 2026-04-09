"""
GSS Orion V3 — Adaptive Memory Manager.
CRUD operations on brain/memory.json.
Ported from V1's tools/adaptive_memory.py with V3 architecture.
"""

import contextlib
import copy
import json
import logging
import sys
from datetime import UTC, datetime

from core.paths import ROOT
from core.ui import print_step

logger = logging.getLogger(__name__)

MEMORY_PATH = ROOT / "brain" / "memory.json"
MAX_ENTRIES = 100
INGESTION_THRESHOLD = 5

DEFAULT_STRUCTURE = {
    "version": "3.0.0",
    "last_updated": "",
    "stats": {"total_entries": 0, "sessions_recorded": 0, "compactions": 0},
    "entries": [],
    "hot_paths": {"most_edited_files": [], "reinforced_links": []},
    "session_digest": "",
}


def _load() -> dict:
    """Load memory with resilient merge against default structure."""
    data = copy.deepcopy(DEFAULT_STRUCTURE)
    if MEMORY_PATH.exists():
        try:
            loaded = json.loads(MEMORY_PATH.read_text(encoding="utf-8"))
            for k, v in DEFAULT_STRUCTURE.items():
                if k not in loaded:
                    loaded[k] = copy.deepcopy(v)
            if not isinstance(loaded.get("stats"), dict):
                loaded["stats"] = copy.deepcopy(DEFAULT_STRUCTURE["stats"])
            return loaded
        except Exception as e:
            logger.warning("Memory load failed: %s", e)
    return data


def _save(data: dict) -> None:
    """Save memory with updated timestamp and stats."""
    data["last_updated"] = datetime.now(UTC).isoformat()
    data["stats"]["total_entries"] = len(data["entries"])
    MEMORY_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")


def _next_id(data: dict) -> str:
    """Generate next REX-MEM-XXX ID."""
    ids = []
    for e in data.get("entries", []):
        eid = e.get("id", "")
        if isinstance(eid, str) and eid.startswith("REX-MEM-"):
            with contextlib.suppress(ValueError, IndexError):
                ids.append(int(eid.split("-")[-1]))
    return f"REX-MEM-{max(ids, default=0) + 1:03d}"


def log_entry(category: str, learning: str, resolution: str = "", tags: list | None = None) -> str:
    """Add a learning entry to adaptive memory."""
    data = _load()
    entry = {
        "id": _next_id(data),
        "timestamp": datetime.now(UTC).isoformat(),
        "category": category,
        "learning": learning,
        "resolution": resolution,
        "tags": tags or [],
        "hit_count": 1,
        "status": "pending",
    }
    data["entries"].append(entry)
    _save(data)
    logger.info("Memory logged: %s (%s)", entry["id"], category)
    return entry["id"]


def approve_entry(entry_id: str) -> bool:
    """Approve a pending entry to active status."""
    data = _load()
    for entry in data["entries"]:
        if entry.get("id") == entry_id:
            entry["status"] = "active"
            _save(data)
            return True
    return False


def compact() -> int:
    """Compact memory: keep only last MAX_ENTRIES."""
    data = _load()
    before = len(data["entries"])
    if before > MAX_ENTRIES:
        data["entries"] = data["entries"][-MAX_ENTRIES:]
        data["stats"]["compactions"] += 1
        _save(data)
    return before - len(data["entries"])


def digest(summary: str) -> None:
    """Update session digest."""
    data = _load()
    data["session_digest"] = summary
    data["stats"]["sessions_recorded"] += 1
    _save(data)


def status() -> dict:
    """Return memory health status."""
    data = _load()
    total = len(data["entries"])
    active = sum(1 for e in data["entries"] if e.get("status") == "active")
    pending = sum(1 for e in data["entries"] if e.get("status") == "pending")

    result = {"total": total, "active": active, "pending": pending, "status": "OK"}
    if pending >= INGESTION_THRESHOLD:
        result["status"] = "INGESTION_REQUIRED"
    elif total >= MAX_ENTRIES:
        result["status"] = "COMPACTION_NEEDED"
    return result


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] == "--status":
        s = status()
        print_step(
            "MEMORY", f"{s['total']} entries ({s['active']} active, {s['pending']} pending) — {s['status']}", "OK"
        )
    elif sys.argv[1] == "--log" and len(sys.argv) >= 4:
        entry_id = log_entry(sys.argv[2], sys.argv[3], sys.argv[4] if len(sys.argv) > 4 else "")
        print_step("MEMORY", f"Logged: {entry_id}", "OK")
    elif sys.argv[1] == "--compact":
        removed = compact()
        print_step("MEMORY", f"Compacted: {removed} entries removed", "OK")
    elif sys.argv[1] == "--approve" and len(sys.argv) >= 3:
        ok = approve_entry(sys.argv[2])
        print_step("MEMORY", f"{'Approved' if ok else 'Not found'}: {sys.argv[2]}", "OK" if ok else "WARN")
