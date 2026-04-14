"""
Tests for ops.sovereign_guard — 3-way sovereignty check:
(1) Config mode vs. branch, (2) identity seal presence/freshness, (3) elevation attempt.
"""

import json
import time
from pathlib import Path
from unittest.mock import patch

import pytest


@pytest.fixture
def tmp_guard_env(tmp_project: Path):
    """Extend tmp_project with a minimal llm_config.json for guard tests."""
    llm_config = {
        "sovereignty": {
            "mode": "flash",
            "active_model": "gemini-2.5-flash",
            "tiers": {"flash": [], "high": []},
        }
    }
    (tmp_project / "brain" / "llm_config.json").write_text(json.dumps(llm_config), encoding="utf-8")
    return tmp_project


def _write_seal(seal_path: Path, nature: str, age_seconds: float = 0.0) -> None:
    """Helper: write a fresh (or aged) identity seal."""
    seal_path.parent.mkdir(parents=True, exist_ok=True)
    seal_path.write_text(
        json.dumps({"nature": nature, "model": "test-model", "timestamp": time.time() - age_seconds}),
        encoding="utf-8",
    )


class TestSovereignGuardFlash:
    """FLASH mode: only 'flash' branch is allowed. No seal required."""

    def test_flash_on_flash_passes(self, tmp_guard_env: Path):
        seal_path = tmp_guard_env / "logs" / "identity_seal.json"
        with (
            patch("ops.sovereign_guard.CONFIG_PATH", tmp_guard_env / "brain" / "llm_config.json"),
            patch("ops.sovereign_guard.SEAL_PATH", seal_path),
            patch("ops.sovereign_guard.get_current_branch", return_value="flash"),
            patch("ops.sovereign_guard.print_step"),
        ):
            from ops.sovereign_guard import validate_push

            assert validate_push() is True

    def test_flash_on_main_blocked(self, tmp_guard_env: Path):
        seal_path = tmp_guard_env / "logs" / "identity_seal.json"
        with (
            patch("ops.sovereign_guard.CONFIG_PATH", tmp_guard_env / "brain" / "llm_config.json"),
            patch("ops.sovereign_guard.SEAL_PATH", seal_path),
            patch("ops.sovereign_guard.get_current_branch", return_value="main"),
            patch("ops.sovereign_guard.print_step"),
        ):
            from ops.sovereign_guard import validate_push

            assert validate_push() is False

    def test_flash_on_high_blocked(self, tmp_guard_env: Path):
        seal_path = tmp_guard_env / "logs" / "identity_seal.json"
        with (
            patch("ops.sovereign_guard.CONFIG_PATH", tmp_guard_env / "brain" / "llm_config.json"),
            patch("ops.sovereign_guard.SEAL_PATH", seal_path),
            patch("ops.sovereign_guard.get_current_branch", return_value="high"),
            patch("ops.sovereign_guard.print_step"),
        ):
            from ops.sovereign_guard import validate_push

            assert validate_push() is False


class TestSovereignGuardHigh:
    """HIGH mode: requires valid seal. Allowed on 'high' and 'main' branches."""

    def _high_config(self, tmp_project: Path) -> Path:
        cfg = {"sovereignty": {"mode": "high", "active_model": "claude-sonnet", "tiers": {}}}
        path = tmp_project / "brain" / "llm_config.json"
        path.write_text(json.dumps(cfg), encoding="utf-8")
        return path

    def test_high_with_seal_on_high_branch_passes(self, tmp_project: Path):
        cfg_path = self._high_config(tmp_project)
        seal_path = tmp_project / "logs" / "identity_seal.json"
        _write_seal(seal_path, "high")

        with (
            patch("ops.sovereign_guard.CONFIG_PATH", cfg_path),
            patch("ops.sovereign_guard.SEAL_PATH", seal_path),
            patch("ops.sovereign_guard.get_current_branch", return_value="high"),
            patch("ops.sovereign_guard.print_step"),
        ):
            from ops.sovereign_guard import validate_push

            assert validate_push() is True

    def test_high_with_seal_on_main_passes(self, tmp_project: Path):
        cfg_path = self._high_config(tmp_project)
        seal_path = tmp_project / "logs" / "identity_seal.json"
        _write_seal(seal_path, "high")

        with (
            patch("ops.sovereign_guard.CONFIG_PATH", cfg_path),
            patch("ops.sovereign_guard.SEAL_PATH", seal_path),
            patch("ops.sovereign_guard.get_current_branch", return_value="main"),
            patch("ops.sovereign_guard.print_step"),
        ):
            from ops.sovereign_guard import validate_push

            assert validate_push() is True

    def test_high_without_seal_blocked(self, tmp_project: Path):
        cfg_path = self._high_config(tmp_project)
        seal_path = tmp_project / "logs" / "identity_seal_missing.json"

        with (
            patch("ops.sovereign_guard.CONFIG_PATH", cfg_path),
            patch("ops.sovereign_guard.SEAL_PATH", seal_path),
            patch("ops.sovereign_guard.get_current_branch", return_value="high"),
            patch("ops.sovereign_guard.print_step"),
        ):
            from ops.sovereign_guard import validate_push

            assert validate_push() is False

    def test_high_with_stale_seal_blocked(self, tmp_project: Path):
        cfg_path = self._high_config(tmp_project)
        seal_path = tmp_project / "logs" / "identity_seal.json"
        _write_seal(seal_path, "high", age_seconds=4000)  # > 3600s TTL

        with (
            patch("ops.sovereign_guard.CONFIG_PATH", cfg_path),
            patch("ops.sovereign_guard.SEAL_PATH", seal_path),
            patch("ops.sovereign_guard.get_current_branch", return_value="high"),
            patch("ops.sovereign_guard.print_step"),
        ):
            from ops.sovereign_guard import validate_push

            assert validate_push() is False

    def test_elevation_denied_flash_seal_in_high_mode(self, tmp_project: Path):
        """A FLASH seal attempting HIGH-tier build must be blocked (elevation attack)."""
        cfg_path = self._high_config(tmp_project)
        seal_path = tmp_project / "logs" / "identity_seal.json"
        _write_seal(seal_path, "flash")  # flash model with high config → elevation attempt

        with (
            patch("ops.sovereign_guard.CONFIG_PATH", cfg_path),
            patch("ops.sovereign_guard.SEAL_PATH", seal_path),
            patch("ops.sovereign_guard.get_current_branch", return_value="high"),
            patch("ops.sovereign_guard.print_step"),
        ):
            from ops.sovereign_guard import validate_push

            assert validate_push() is False
