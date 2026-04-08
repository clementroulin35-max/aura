"""
GSS Orion V3 — Sync Manifest.
Hash-based diffing to detect changes since last sync.
"""
import hashlib
import json
import logging
from pathlib import Path

from core.paths import ROOT

logger = logging.getLogger(__name__)

MANIFEST_PATH = ROOT / "brain" / "manifest.json"


def _file_hash(filepath: Path) -> str:
    """Calculate SHA-256 hash of a file (first 4KB for speed)."""
    try:
        data = filepath.read_bytes()[:4096]
        return hashlib.sha256(data).hexdigest()[:16]
    except Exception:
        return "error"


def load_manifest() -> dict:
    """Load existing manifest."""
    if not MANIFEST_PATH.exists():
        return {"hashes": {}, "last_sync": 0}
    try:
        return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {"hashes": {}, "last_sync": 0}


def save_manifest(manifest: dict) -> None:
    """Save manifest to disk."""
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def compute_hashes(root: Path | None = None) -> dict[str, str]:
    """Compute hashes for all tracked files."""
    r = root or ROOT
    hashes: dict[str, str] = {}
    tracked_dirs = [r / "brain", r / "experts"]
    for d in tracked_dirs:
        if d.exists():
            for f in d.rglob("*"):
                if f.is_file() and f.name != "manifest.json":
                    key = str(f.relative_to(r))
                    hashes[key] = _file_hash(f)
    return hashes


def detect_changes() -> dict[str, list[str]]:
    """Compare current hashes with manifest. Returns added/modified/removed."""
    old = load_manifest().get("hashes", {})
    current = compute_hashes()

    added = [k for k in current if k not in old]
    modified = [k for k in current if k in old and current[k] != old[k]]
    removed = [k for k in old if k not in current]

    return {"added": added, "modified": modified, "removed": removed}
