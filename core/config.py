"""
GSS Orion V3 — Configuration Loader.
Sequential YAML/JSON pipeline. Merges rules + brain + personality into one dict.

Evolutive hooks:
- load_plugin_configs(root / "plugins") → future plugin system
- config["extensions"] key reserved for plug-in modules
"""
import json
import logging
from pathlib import Path
from typing import Any

import yaml

from core.paths import ROOT

logger = logging.getLogger(__name__)


def load_yaml_safe(filepath: Path) -> dict:
    """Load a single YAML file safely. Returns {} on error."""
    if not filepath.exists():
        return {}
    try:
        data = yaml.safe_load(filepath.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception as e:
        logger.warning("YAML load error %s: %s", filepath.name, e)
        return {}


def load_yaml_dir(directory: Path) -> dict:
    """Load and deep-merge all YAML files from a directory."""
    combined: dict = {}
    if not directory.exists():
        return combined
    for yaml_file in sorted(directory.glob("*.yaml")):
        data = load_yaml_safe(yaml_file)
        combined = _deep_merge(combined, data)
    return combined


def load_json_safe(filepath: Path) -> dict:
    """Safe JSON loader. Returns {} on error."""
    if not filepath.exists():
        return {}
    try:
        return json.loads(filepath.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning("JSON load error %s: %s", filepath.name, e)
        return {}


def load_full_config(root: Path | None = None) -> dict[str, Any]:
    """
    Load complete system config: rules + brain + personality.
    Returns a unified dict consumable by templates and Graph nodes.
    """
    r = root or ROOT
    config: dict[str, Any] = {}

    # 1. Expert rules (YAML — core, governance, routing, roadmap)
    config.update(load_yaml_dir(r / "experts" / "rules"))

    # 2. Registry
    config["skills"] = load_yaml_safe(r / "experts" / "registry.yaml").get("skills", {})

    # 3. Brain data
    config["principles"] = load_json_safe(r / "brain" / "principles.json")
    config["personality"] = load_json_safe(r / "brain" / "personality.json")
    config["bridge"] = load_json_safe(r / "brain" / "bridge.json")

    # 4. Memory digest (last 5 active entries for context window efficiency)
    memory = load_json_safe(r / "brain" / "memory.json")
    entries = memory.get("entries", [])
    config["memory"] = {
        "active": [e for e in entries if e.get("status") == "active"][-5:],
        "total": len(entries),
    }

    # 5. Version
    from core.version import get_version
    config["version"] = get_version()

    # Evolutive: reserved key for future plug-ins
    config["extensions"] = {}

    return config


def _deep_merge(base: dict, overlay: dict) -> dict:
    """Recursive dict merge. Overlay wins on conflict."""
    result = base.copy()
    for key, value in overlay.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result
