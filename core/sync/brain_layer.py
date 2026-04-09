"""
GSS Orion V3 — Brain Layer Sync.
Validates that all brain/*.json files are parsable.
"""

import json
import logging
from pathlib import Path

from core.paths import ROOT

logger = logging.getLogger(__name__)

REQUIRED_BRAIN_FILES = ["principles.json", "personality.json", "bridge.json", "memory.json"]


def sync_brain_layer(root: Path | None = None) -> list[dict]:
    """Validate all brain JSON files. Returns list of check results."""
    r = root or ROOT
    brain_dir = r / "brain"
    results: list[dict] = []

    for fname in REQUIRED_BRAIN_FILES:
        fpath = brain_dir / fname
        if not fpath.exists():
            results.append({"file": fname, "status": "MISSING"})
            continue
        try:
            json.loads(fpath.read_text(encoding="utf-8"))
            results.append({"file": fname, "status": "OK"})
        except Exception as e:
            results.append({"file": fname, "status": f"PARSE_ERROR: {e}"})

    return results
