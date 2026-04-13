"""
Tests for LangGraph: state, router, compiler.
Wave 2 validation.
"""

import pytest

from core.graph.compiler import build_graph, execute_mission
from core.graph.nodes import supervisor_node
from core.graph.persistence import SKILLS
from core.graph.state import GSSState


@pytest.mark.asyncio
class TestState:
    """GSSState TypedDict structure."""

    async def test_state_has_required_keys(self):
        keys = GSSState.__annotations__
        required = ["messages", "mission_title", "selected_skills", "team_history", "results", "iteration"]
        for k in required:
            assert k in keys, f"GSSState missing key: {k}"


@pytest.mark.asyncio
class TestCompiler:
    """Graph compilation and execution (V4 Dynamic)."""

    async def test_skills_loaded(self):
        assert len(SKILLS) > 0
        assert "core" in SKILLS

    async def test_build_graph(self):
        graph = build_graph()
        assert graph is not None

    async def test_supervisor_route(self):
        state = {"mission_title": "Test", "selected_skills": ["core", "governance"], "team_history": [], "iteration": 0}
        result = supervisor_node(state)
        assert result["next_team"] == "core"
        assert result["iteration"] == 1

    async def test_supervisor_finish(self):
        state = {"mission_title": "Test", "selected_skills": ["core"], "team_history": ["core"], "iteration": 1}
        result = supervisor_node(state)
        assert result["next_team"] == "FINISH"

    async def test_execute_mission(self, mock_llm):
        mission_data = {
            "id": "M_TEST",
            "title": "Audit Orion",
            "context": "Verification session",
            "objectives": ["Test graph"],
            "selected_skills": ["core", "governance"],
        }
        result = await execute_mission(mission_data)
        assert result["status"] == "COMPLETED"
        assert "core" in result["teams_visited"]
        assert len(result["results"]) >= 2
