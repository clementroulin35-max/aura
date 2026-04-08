"""
GSS Orion V3 — Version Bump.
Auto-increments patch version in VERSION file.
Runnable as `python -m ops.version_bump`.
"""
from core.paths import ROOT
from core.ui import print_step


def bump_version() -> str:
    """Increment patch version. Returns new version string."""
    version_file = ROOT / "VERSION"
    current = version_file.read_text(encoding="utf-8").strip().lstrip("v")
    parts = current.split(".")
    parts[-1] = str(int(parts[-1]) + 1)
    new_version = "v" + ".".join(parts)
    version_file.write_text(new_version + "\n", encoding="utf-8")
    print_step("VERSION", f"{current} → {new_version}", "OK")
    return new_version


if __name__ == "__main__":
    bump_version()
