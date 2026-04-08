"""
GSS Orion V3 — Integrity Check.
SHA-256 hash protection on critical files.
Detects unauthorized modifications between syncs.
Ported from V1's tools/integrity_check.py.
"""
import hashlib
import json
import logging

from core.paths import ROOT

logger = logging.getLogger(__name__)

HASHES_PATH = ROOT / "logs" / "integrity_hashes.json"

PROTECTED_FILES = [
    "brain/principles.json",
    "brain/personality.json",
    "experts/rules/routing.yaml",
    "experts/rules/governance.yaml",
    "experts/rules/roadmap.yaml",
    "Makefile",
    "VERSION",
]


def _file_hash(path) -> str:
    """Compute SHA-256 hash of a file."""
    return hashlib.sha256(path.read_bytes()).hexdigest()


def _load_hashes() -> dict:
    if HASHES_PATH.exists():
        try:
            return json.loads(HASHES_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def _save_hashes(hashes: dict) -> None:
    HASHES_PATH.parent.mkdir(parents=True, exist_ok=True)
    HASHES_PATH.write_text(json.dumps(hashes, indent=2), encoding="utf-8")


def check_integrity(update: bool = True) -> dict:
    """Check protected files for hash drift. Returns drift report."""
    known = _load_hashes()
    report = {"checked": 0, "drifted": [], "missing": [], "new": []}

    for rel_path in PROTECTED_FILES:
        full_path = ROOT / rel_path
        if not full_path.exists():
            report["missing"].append(rel_path)
            continue

        current = _file_hash(full_path)
        stored = known.get(rel_path)
        report["checked"] += 1

        if stored is None:
            report["new"].append(rel_path)
        elif stored != current:
            report["drifted"].append(rel_path)
            logger.warning("Integrity drift: %s (was %s..., now %s...)", rel_path, stored[:12], current[:12])

        if update:
            known[rel_path] = current

    if update:
        _save_hashes(known)

    return report


if __name__ == "__main__":
    from core.ui import print_step
    r = check_integrity()
    drift_count = len(r["drifted"])
    missing_count = len(r["missing"])
    status = "OK" if drift_count == 0 and missing_count == 0 else "WARN"
    print_step("INTEGRITY", f"Checked {r['checked']} files. Drift: {drift_count}. Missing: {missing_count}.", status)
