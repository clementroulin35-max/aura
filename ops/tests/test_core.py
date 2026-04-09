"""
Tests for core foundation: paths, version, config, ui.
Wave 1 validation — these must pass before proceeding.
"""

from pathlib import Path

from core.config import _deep_merge, load_full_config, load_json_safe, load_yaml_safe
from core.paths import ROOT
from core.version import get_version, get_version_tuple


class TestPaths:
    """R05: ROOT must be the project root directory."""

    def test_root_exists(self):
        assert ROOT.exists(), "ROOT directory does not exist"

    def test_root_is_project(self):
        assert (ROOT / "VERSION").exists(), "ROOT does not contain VERSION file"

    def test_root_has_core(self):
        assert (ROOT / "core").is_dir(), "ROOT does not contain core/ package"


class TestVersion:
    """R02: Single source of version from VERSION file."""

    def test_get_version_returns_string(self):
        version = get_version()
        assert isinstance(version, str)
        assert version.startswith("v")

    def test_get_version_matches_file(self):
        expected = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
        assert get_version() == expected

    def test_get_version_tuple(self):
        t = get_version_tuple()
        assert len(t) == 3
        assert all(isinstance(x, int) for x in t)
        assert t[0] == 3  # Major version


class TestConfigLoaders:
    """Config loading primitives."""

    def test_load_json_safe_valid(self, tmp_path: Path):
        f = tmp_path / "test.json"
        f.write_text('{"key": "value"}', encoding="utf-8")
        assert load_json_safe(f) == {"key": "value"}

    def test_load_json_safe_missing(self, tmp_path: Path):
        assert load_json_safe(tmp_path / "missing.json") == {}

    def test_load_json_safe_invalid(self, tmp_path: Path):
        f = tmp_path / "bad.json"
        f.write_text("not json", encoding="utf-8")
        assert load_json_safe(f) == {}

    def test_load_yaml_safe_valid(self, tmp_path: Path):
        f = tmp_path / "test.yaml"
        f.write_text("key: value\n", encoding="utf-8")
        assert load_yaml_safe(f) == {"key": "value"}

    def test_load_yaml_safe_missing(self, tmp_path: Path):
        assert load_yaml_safe(tmp_path / "missing.yaml") == {}

    def test_deep_merge(self):
        base = {"a": 1, "b": {"x": 10}}
        overlay = {"b": {"y": 20}, "c": 3}
        result = _deep_merge(base, overlay)
        assert result == {"a": 1, "b": {"x": 10, "y": 20}, "c": 3}


class TestFullConfig:
    """Full config loading pipeline with tmp_project fixture."""

    def test_load_full_config(self, tmp_project: Path):
        config = load_full_config(tmp_project)
        assert "principles" in config
        assert "personality" in config
        assert "bridge" in config
        assert "memory" in config
        assert "version" in config
        assert "skills" in config
        assert "extensions" in config  # Evolutive hook

    def test_config_principles_loaded(self, tmp_project: Path):
        config = load_full_config(tmp_project)
        assert len(config["principles"].get("rules", [])) >= 1

    def test_config_memory_structure(self, tmp_project: Path):
        config = load_full_config(tmp_project)
        assert "active" in config["memory"]
        assert "total" in config["memory"]
