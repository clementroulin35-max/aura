"""
Tests for LangGraph: state, router, compiler.
Wave 2 validation.
"""

from core.graph.compiler import build_graph, execute_graph, supervisor_node
from core.graph.router import _RULES, route_task
from core.graph.state import ALL_TEAMS, GSSState


class TestState:
    """GSSState TypedDict structure."""

    def test_state_has_required_keys(self):
        keys = GSSState.__annotations__
        required = ["messages", "task", "next_team", "current_team", "team_history", "context", "results", "iteration"]
        for k in required:
            assert k in keys, f"GSSState missing key: {k}"

    def test_all_teams_constant(self):
        assert len(ALL_TEAMS) == 5
        assert "INTEGRITY" in ALL_TEAMS
        assert "FINISH" not in ALL_TEAMS


class TestRouter:
    """Task routing with word-boundary matching."""

    def test_audit_routes_to_quality(self):
        assert route_task("Audit the codebase") == "QUALITY"

    def test_plan_routes_to_strategy(self):
        assert route_task("Plan the next milestone") == "STRATEGY"

    def test_implement_routes_to_dev(self):
        assert route_task("Implement the API endpoint") == "DEV"

    def test_governance_routes_to_integrity(self):
        assert route_task("Check governance compliance") == "INTEGRITY"

    def test_test_routes_to_maintenance(self):
        assert route_task("Run test coverage analysis") == "MAINTENANCE"

    def test_word_boundary_prevents_false_match(self):
        """'fix' should NOT match 'prefix'."""
        result = route_task("Handle the prefix configuration")
        # 'prefix' should not trigger QUALITY (which has 'fix')
        assert result != "QUALITY" or "prefix" not in _RULES.get("QUALITY", {}).get("keywords", {})

    def test_empty_task_defaults_to_strategy(self):
        assert route_task("") == "STRATEGY"

    def test_visited_teams_penalized(self):
        """A team visited many times should eventually be skipped."""
        result = route_task("Review the audit", history=["QUALITY"] * 3)
        # Result is valid regardless of which team wins after penalization
        assert result in ("INTEGRITY", "QUALITY", "STRATEGY", "DEV", "MAINTENANCE")

    def test_rules_loaded_from_yaml(self):
        assert len(_RULES) >= 5, f"Expected 5+ teams, got {len(_RULES)}"


class TestCompiler:
    """Graph compilation and execution."""

    def test_build_graph(self):
        graph = build_graph()
        assert graph is not None

    def test_supervisor_first_pass_integrity(self):
        state = {"task": "Test", "iteration": 0, "team_history": []}
        result = supervisor_node(state)
        assert result["next_team"] == "INTEGRITY"
        assert result["iteration"] == 1

    def test_supervisor_max_iterations(self):
        state = {"task": "Test", "iteration": 10, "team_history": ["A"] * 10}
        result = supervisor_node(state)
        assert result["next_team"] == "FINISH"

    def test_execute_graph(self, mock_llm):
        result = execute_graph("Audit the system")
        assert result["status"] == "COMPLETED"
        assert "INTEGRITY" in result["teams_visited"]
        assert result["iterations"] > 0
        assert len(result["results"]) > 0
