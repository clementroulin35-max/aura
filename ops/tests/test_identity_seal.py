"""
Tests for ops.identity_seal — auto-seal, manual seal, and config loading.
"""

import json
import time
from pathlib import Path
from unittest.mock import patch

import pytest


@pytest.fixture
def tmp_seal_env(tmp_project: Path):
    """Extend tmp_project with a minimal llm_config.json for seal tests."""
    llm_config = {
        "sovereignty": {
            "mode": "flash",
            "active_model": "gemini-2.5-flash",
            "tiers": {"flash": [], "high": []},
        }
    }
    (tmp_project / "brain" / "llm_config.json").write_text(json.dumps(llm_config), encoding="utf-8")
    return tmp_project


class TestIdentitySeal:
    def test_seal_identity_writes_file(self, tmp_project: Path):
        """seal_identity() must write a JSON file with correct structure."""
        seal_path = tmp_project / "logs" / "identity_seal.json"

        with (
            patch("ops.identity_seal.ROOT", tmp_project),
            patch("ops.identity_seal.SEAL_PATH", seal_path),
            patch("ops.identity_seal.print_step"),
        ):
            from ops.identity_seal import seal_identity

            seal_identity("high", "claude-sonnet")

        assert seal_path.exists()
        data = json.loads(seal_path.read_text(encoding="utf-8"))
        assert data["nature"] == "high"
        assert data["model"] == "claude-sonnet"
        assert isinstance(data["timestamp"], float)
        assert data["timestamp"] <= time.time()

    def test_seal_identity_normalises_nature(self, tmp_project: Path):
        """Nature must be stored lowercase regardless of input case."""
        seal_path = tmp_project / "logs" / "identity_seal.json"

        with (
            patch("ops.identity_seal.ROOT", tmp_project),
            patch("ops.identity_seal.SEAL_PATH", seal_path),
            patch("ops.identity_seal.print_step"),
        ):
            from ops.identity_seal import seal_identity

            seal_identity("HIGH", "claude-sonnet")

        data = json.loads(seal_path.read_text(encoding="utf-8"))
        assert data["nature"] == "high"

    def test_auto_seal_reads_llm_config(self, tmp_seal_env: Path):
        """auto_seal() must derive nature and model from llm_config.json."""
        seal_path = tmp_seal_env / "logs" / "identity_seal.json"

        with (
            patch("ops.identity_seal.ROOT", tmp_seal_env),
            patch("ops.identity_seal.SEAL_PATH", seal_path),
            patch("ops.identity_seal.CONFIG_PATH", tmp_seal_env / "brain" / "llm_config.json"),
            patch("ops.identity_seal.print_step"),
        ):
            from ops.identity_seal import auto_seal

            auto_seal()

        data = json.loads(seal_path.read_text(encoding="utf-8"))
        assert data["nature"] == "flash"
        assert data["model"] == "gemini-2.5-flash"

    def test_auto_seal_fallback_when_config_missing(self, tmp_project: Path):
        """auto_seal() must fall back to flash/unknown if llm_config.json is absent."""
        seal_path = tmp_project / "logs" / "identity_seal.json"
        missing_config = tmp_project / "brain" / "llm_config_missing.json"

        with (
            patch("ops.identity_seal.ROOT", tmp_project),
            patch("ops.identity_seal.SEAL_PATH", seal_path),
            patch("ops.identity_seal.CONFIG_PATH", missing_config),
            patch("ops.identity_seal.print_step"),
        ):
            from ops.identity_seal import auto_seal

            auto_seal()

        data = json.loads(seal_path.read_text(encoding="utf-8"))
        assert data["nature"] == "flash"
        assert data["model"] == "unknown"
