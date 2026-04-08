"""Tests for sentinels: health, atlas, resources."""
import json
from pathlib import Path

from core.sentinels.health import read_health, write_health, set_flag, clear_flags
from core.sentinels.atlas import collect_snapshot, write_atlas


class TestHealthManager:
    def test_write_and_read(self):
        write_health(status="TEST")
        h = read_health()
        assert h["status"] == "TEST"
        assert h["last_update"] is not None

    def test_set_flag(self):
        clear_flags()
        set_flag("test_key", "test_value")
        h = read_health()
        assert h["flags"]["test_key"] == "test_value"

    def test_clear_flags(self):
        set_flag("temp", "data")
        clear_flags()
        h = read_health()
        assert h["flags"] == {}


class TestAtlas:
    def test_collect_snapshot(self):
        snap = collect_snapshot()
        assert "version" in snap
        assert "modules" in snap
        assert "system" in snap
        assert "cpu_percent" in snap["system"]

    def test_write_atlas(self, tmp_path: Path):
        atlas_file = tmp_path / "atlas.json"
        snap = collect_snapshot()
        atlas_file.write_text(json.dumps(snap), encoding="utf-8")
        loaded = json.loads(atlas_file.read_text(encoding="utf-8"))
        assert loaded["version"] == snap["version"]
