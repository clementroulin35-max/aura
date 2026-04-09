"""Tests for enhanced sentinels: git_drift, log_rotator, utils, resources."""

import json
from pathlib import Path
from unittest.mock import patch

from core.sentinels.atlas import collect_snapshot
from core.sentinels.git_drift import check_git_drift
from core.sentinels.health import clear_flags, read_health, set_flag, write_health
from core.sentinels.log_rotator import rotate_logs
from core.sentinels.utils import is_orion_alive


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


class TestGitDrift:
    def test_check_returns_dict(self):
        result = check_git_drift()
        assert isinstance(result, dict)
        assert "status" in result
        assert "count" in result

    def test_status_is_valid(self):
        result = check_git_drift()
        assert result["status"] in ("OK", "WARNING", "CRITICAL", "GIT_ERROR", "ERROR")


class TestLogRotator:
    def test_rotate_returns_dict(self, tmp_path: Path):
        # Create a fake log
        logs_dir = tmp_path / "logs"
        logs_dir.mkdir()
        (logs_dir / "test.log").write_text("test log content")

        with (
            patch("core.sentinels.log_rotator.LOGS_DIR", logs_dir),
            patch("core.sentinels.log_rotator.ARCHIVE_DIR", logs_dir / "archive"),
        ):
            result = rotate_logs(max_age_hours=0)  # Force rotation
            assert isinstance(result, dict)
            assert "rotated" in result


class TestSentinelUtils:
    def test_is_orion_alive_returns_bool(self):
        result = is_orion_alive(timeout=0.5)
        assert isinstance(result, bool)
