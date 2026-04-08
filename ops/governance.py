"""
GSS Orion V3 — Governance Checker.
Validates rules R01-R10 compliance. Runnable as `python -m ops.governance`.
"""
import re
import logging
from pathlib import Path

from core.paths import ROOT
from core.ui import print_banner, print_step

logger = logging.getLogger(__name__)

SKIP_DIRS = {"venv", "__pycache__", "node_modules", ".git", ".venv"}


def check_r01_srp(root: Path) -> tuple[bool, str]:
    """R01: Max 200 lines per Python file."""
    violations = []
    for py in root.rglob("*.py"):
        if any(s in py.parts for s in SKIP_DIRS):
            continue
        try:
            count = len(py.read_text(encoding="utf-8").splitlines())
            if count > 200:
                violations.append(f"{py.relative_to(root)}:{count}L")
        except Exception:
            pass
    ok = len(violations) == 0
    return ok, f"{len(violations)} violations" + (f": {', '.join(violations[:3])}" if violations else "")


def check_r02_version(root: Path) -> tuple[bool, str]:
    """R02: VERSION file exists and is valid."""
    vf = root / "VERSION"
    if not vf.exists():
        return False, "VERSION file missing"
    v = vf.read_text(encoding="utf-8").strip()
    return v.startswith("v") and "." in v, f"VERSION={v}"


def check_r03_bare_excepts(root: Path) -> tuple[bool, str]:
    """R03: No bare except clauses."""
    findings = 0
    for py in root.rglob("*.py"):
        if any(s in py.parts for s in SKIP_DIRS):
            continue
        try:
            for line in py.read_text(encoding="utf-8").splitlines():
                if re.match(r"^\s*except\s*:", line):
                    findings += 1
        except Exception:
            pass
    return findings == 0, f"{findings} bare except(s)"


def check_r04_secrets(root: Path) -> tuple[bool, str]:
    """R04: No hardcoded secrets."""
    patterns = [r'password\s*=\s*["\']', r'secret\s*=\s*["\'].*[a-zA-Z]', r'token\s*=\s*["\'].*[a-zA-Z]']
    findings = 0
    for py in root.rglob("*.py"):
        if any(s in py.parts for s in SKIP_DIRS):
            continue
        try:
            content = py.read_text(encoding="utf-8")
            for p in patterns:
                findings += len(re.findall(p, content, re.IGNORECASE))
        except Exception:
            pass
    return findings == 0, f"{findings} potential secret(s)"


def check_r06_makefile(root: Path) -> tuple[bool, str]:
    """R06: Makefile exists."""
    return (root / "Makefile").exists(), "Makefile present" if (root / "Makefile").exists() else "MISSING"


def run_governance(root: Path | None = None, verbose: bool = True) -> bool:
    """Run all governance checks. Returns True if all pass."""
    r = root or ROOT
    checks = [
        ("R01:SRP", check_r01_srp(r)),
        ("R02:VERSION", check_r02_version(r)),
        ("R03:EXCEPT", check_r03_bare_excepts(r)),
        ("R04:SECRETS", check_r04_secrets(r)),
        ("R06:MAKEFILE", check_r06_makefile(r)),
    ]

    all_pass = True
    if verbose:
        print_banner("GSS ORION V3 — GOVERNANCE AUDIT")
    for label, (ok, msg) in checks:
        if verbose:
            print_step(label, msg, "OK" if ok else "FAIL")
        if not ok:
            all_pass = False

    return all_pass


if __name__ == "__main__":
    result = run_governance()
    raise SystemExit(0 if result else 1)
