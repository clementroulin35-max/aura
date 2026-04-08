"""
GSS Orion V3 — Path Constants.
Single source of ROOT. Rule R05: every module imports from here.
"""
from pathlib import Path

ROOT: Path = Path(__file__).resolve().parent.parent
