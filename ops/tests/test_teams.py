"""
Tests for all 5 team nodes.
Validates: each team returns {"results": [<one_dict>], "messages": [...]}.
"""
from core.graph.teams.dev import dev_node
from core.graph.teams.integrity import integrity_node
from core.graph.teams.maintenance import maintenance_node
from core.graph.teams.quality import quality_node
from core.graph.teams.strategy import strategy_node


def _make_state(task: str = "Test task") -> dict:
    return {"task": task, "team_history": [], "results": [], "context": {}}


class TestIntegrity:
    def test_returns_results_list(self):
        result = integrity_node(_make_state())
        assert "results" in result
        assert isinstance(result["results"], list)
        assert len(result["results"]) == 1

    def test_returns_messages(self):
        result = integrity_node(_make_state())
        assert "messages" in result
        assert len(result["messages"]) >= 1

    def test_result_has_verdict(self):
        result = integrity_node(_make_state())
        assert "verdict" in result["results"][0]

    def test_result_has_checks(self):
        result = integrity_node(_make_state())
        assert "checks" in result["results"][0]
        assert len(result["results"][0]["checks"]) > 0


class TestQuality:
    def test_returns_single_result(self, mock_llm):
        result = quality_node(_make_state("Audit quality"))
        assert len(result["results"]) == 1
        assert result["results"][0]["team"] == "QUALITY"

    def test_has_srp_violations_key(self, mock_llm):
        result = quality_node(_make_state())
        assert "srp_violations" in result["results"][0]


class TestStrategy:
    def test_returns_single_result(self, mock_llm):
        result = strategy_node(_make_state("Plan roadmap"))
        assert len(result["results"]) == 1
        assert result["results"][0]["team"] == "STRATEGY"

    def test_has_progress(self, mock_llm):
        result = strategy_node(_make_state())
        assert "progress" in result["results"][0]


class TestDev:
    def test_returns_single_result(self, mock_llm):
        result = dev_node(_make_state("Implement feature"))
        assert len(result["results"]) == 1
        assert result["results"][0]["team"] == "DEV"

    def test_has_module_counts(self, mock_llm):
        result = dev_node(_make_state())
        assert "modules" in result["results"][0]
        assert "total_modules" in result["results"][0]


class TestMaintenance:
    def test_returns_single_result(self):
        result = maintenance_node(_make_state("Check coverage"))
        assert len(result["results"]) == 1
        assert result["results"][0]["team"] == "MAINTENANCE"

    def test_has_coverage(self):
        result = maintenance_node(_make_state())
        assert "coverage" in result["results"][0]
        assert "percentage" in result["results"][0]["coverage"]

    def test_has_version(self):
        result = maintenance_node(_make_state())
        assert result["results"][0]["version"].startswith("v")
