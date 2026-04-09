"""
GSS Orion V3 — Version Reader.
Reads from VERSION file only. Rule R02: single source of version.
"""

from core.paths import ROOT


def get_version() -> str:
    """Read version from VERSION file. Returns 'v0.0.0' if missing."""
    version_file = ROOT / "VERSION"
    if version_file.exists():
        return version_file.read_text(encoding="utf-8").strip()
    return "v0.0.0"


def get_version_tuple() -> tuple[int, ...]:
    """Return version as (major, minor, patch) tuple."""
    clean = get_version().lstrip("v")
    parts = clean.split(".")
    return tuple(int(p) for p in parts[:3])
