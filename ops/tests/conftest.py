"""
Pytest global configuration for GSS Orion V3.
Provides fixtures for LLM mocking and temporary project structures.
"""

import json
import sys
from pathlib import Path
from unittest.mock import patch

import pytest

# Ensure project root is on path
ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


@pytest.fixture(autouse=True)
def mock_llm():
    """Globally mock LLM calls to prevent real API calls in tests."""
    mock_response = {
        "content": "[TEST] Mock response for testing.",
        "model": "test-mock",
        "source": "simulation",
    }
    try:
        with (
            patch("core.llm.call_llm", return_value=mock_response) as mock,
            patch("core.llm._detect_ollama", return_value=False),
            patch("core.llm._has_cloud_keys", return_value=False),
            patch("core.graph.teams.quality.call_llm", return_value=mock_response),
            patch("core.graph.teams.strategy.call_llm", return_value=mock_response),
            patch("core.graph.teams.dev.call_llm", return_value=mock_response),
        ):
            yield mock
    except (AttributeError, ModuleNotFoundError):
        yield None


@pytest.fixture
def tmp_project(tmp_path: Path) -> Path:
    """Create a minimal valid project structure for isolated testing."""
    (tmp_path / "VERSION").write_text("v3.0.0\n", encoding="utf-8")

    # brain/
    brain = tmp_path / "brain"
    brain.mkdir()
    (brain / "principles.json").write_text(
        json.dumps({"meta": {"version": "3.0.0"}, "rules": [{"id": "R01", "name": "SRP", "rule": "test"}]}),
        encoding="utf-8",
    )
    (brain / "personality.json").write_text(
        json.dumps({"persona": "Test", "tone": "neutral", "traits": ["test"], "directives": []}),
        encoding="utf-8",
    )
    (brain / "bridge.json").write_text(
        json.dumps({"version": "v3.0.0", "pulse": "NOMINAL", "last_session": None}),
        encoding="utf-8",
    )
    (brain / "memory.json").write_text(
        json.dumps({"stats": {"total_entries": 0, "compactions": 0}, "entries": []}),
        encoding="utf-8",
    )
    (brain / "scores.json").write_text(
        json.dumps({"metadata": {}, "scores": {"core": {"score": 0, "usage_count": 0, "weight": 30}}}),
        encoding="utf-8",
    )

    # experts/
    experts = tmp_path / "experts"
    experts.mkdir()
    (experts / "registry.yaml").write_text("skills:\n  core:\n    type: static\n    weight: 30\n", encoding="utf-8")
    rules = experts / "rules"
    rules.mkdir()
    (rules / "core.yaml").write_text("core:\n  identity: test\n", encoding="utf-8")
    (rules / "roadmap.yaml").write_text("roadmap:\n  mission: test\n  milestones: []\n", encoding="utf-8")

    # logs/
    (tmp_path / "logs").mkdir()

    return tmp_path
