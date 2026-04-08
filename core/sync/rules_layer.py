"""
GSS Orion V3 — Rules Layer Sync.
Validates that all YAML files in experts/rules/ are parsable.
"""
import logging
from pathlib import Path

import yaml

from core.paths import ROOT

logger = logging.getLogger(__name__)


def sync_rules_layer(root: Path | None = None) -> list[dict]:
    """Validate all YAML rules files. Returns list of check results."""
    r = root or ROOT
    rules_dir = r / "experts" / "rules"
    results: list[dict] = []

    if not rules_dir.exists():
        return [{"file": "experts/rules/", "status": "MISSING_DIR"}]

    for yaml_file in sorted(rules_dir.glob("*.yaml")):
        try:
            data = yaml.safe_load(yaml_file.read_text(encoding="utf-8"))
            if not isinstance(data, dict):
                results.append({"file": yaml_file.name, "status": "INVALID_STRUCTURE"})
            else:
                results.append({"file": yaml_file.name, "status": "OK"})
        except Exception as e:
            results.append({"file": yaml_file.name, "status": f"PARSE_ERROR: {e}"})

    return results
