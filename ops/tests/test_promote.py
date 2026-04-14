"""
Tests for ops.promote — promote high → main (only in HIGH mode on 'high' branch).
"""

import json
from pathlib import Path
from unittest.mock import patch

import pytest


@pytest.fixture
def flash_config(tmp_project: Path) -> Path:
    cfg = {"sovereignty": {"mode": "flash", "active_model": "gemini-2.5-flash"}}
    path = tmp_project / "brain" / "llm_config.json"
    path.write_text(json.dumps(cfg), encoding="utf-8")
    return path


@pytest.fixture
def high_config(tmp_project: Path) -> Path:
    cfg = {"sovereignty": {"mode": "high", "active_model": "claude-sonnet-4-6"}}
    path = tmp_project / "brain" / "llm_config.json"
    path.write_text(json.dumps(cfg), encoding="utf-8")
    return path


class TestPromoteToMain:
    def test_flash_mode_is_noop(self, flash_config: Path):
        """FLASH mode must skip promotion silently (return True)."""
        with (
            patch("ops.promote.CONFIG_PATH", flash_config),
            patch("ops.promote.print_step"),
            patch("ops.promote.subprocess.check_call") as mock_push,
        ):
            from ops.promote import promote_to_main

            result = promote_to_main()

        assert result is True
        mock_push.assert_not_called()

    def test_high_mode_wrong_branch_is_noop(self, high_config: Path):
        """HIGH mode on non-'high' branch must skip promotion."""
        with (
            patch("ops.promote.CONFIG_PATH", high_config),
            patch("ops.promote._get_branch", return_value="main"),
            patch("ops.promote.print_step"),
            patch("ops.promote.subprocess.check_call") as mock_push,
        ):
            from ops.promote import promote_to_main

            result = promote_to_main()

        assert result is True
        mock_push.assert_not_called()

    def test_high_mode_high_branch_pushes_to_main(self, high_config: Path):
        """HIGH mode on 'high' branch must push high:main."""
        import subprocess
        with (
            patch("ops.promote.CONFIG_PATH", high_config),
            patch("ops.promote._get_branch", return_value="high"),
            patch("ops.promote.print_step"),
            patch("ops.promote.subprocess.check_call") as mock_call,
            patch("ops.promote.subprocess.check_output", return_value="0") as mock_output,
        ):
            from ops.promote import promote_to_main

            result = promote_to_main()

        assert result is True
        # Check that we pushed
        mock_call.assert_any_call(["git", "push", "origin", "high:main"])
        # Check that we ran the safety check
        mock_output.assert_called_with(
            ["git", "rev-list", "HEAD..origin/high", "--count"], text=True, stderr=subprocess.DEVNULL
        )

    def test_git_failure_returns_false(self, high_config: Path):
        """A git push failure must return False without raising."""
        import subprocess

        def side_effect(cmd, **kwargs):
            if "push" in cmd:
                raise subprocess.CalledProcessError(1, "git push")
            return None

        with (
            patch("ops.promote.CONFIG_PATH", high_config),
            patch("ops.promote._get_branch", return_value="high"),
            patch("ops.promote.print_step"),
            patch("ops.promote.subprocess.check_call", side_effect=side_effect),
            patch("ops.promote.subprocess.check_output", return_value="0"),
        ):
            from ops.promote import promote_to_main

            result = promote_to_main()

        assert result is False
