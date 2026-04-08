"""Tests for refactored teams (multi-agent pipelines)."""


class TestIntegrity:
    def test_returns_results_list(self, mock_llm):
        from core.graph.teams.integrity import integrity_node
        out = integrity_node({"task": "check", "results": [], "messages": []})
        assert isinstance(out["results"], list)
        assert len(out["results"]) == 1

    def test_returns_messages(self, mock_llm):
        from core.graph.teams.integrity import integrity_node
        out = integrity_node({"task": "check", "results": [], "messages": []})
        assert len(out["messages"]) >= 1

    def test_has_pipeline(self, mock_llm):
        from core.graph.teams.integrity import integrity_node
        out = integrity_node({"task": "check", "results": [], "messages": []})
        r = out["results"][0]
        assert r["pipeline"] == "governance → core"
        assert len(r["stages"]) == 2

    def test_governance_stage(self, mock_llm):
        from core.graph.teams.integrity import integrity_node
        out = integrity_node({"task": "check", "results": [], "messages": []})
        gov = out["results"][0]["stages"][0]
        assert gov["agent"] == "governance"
        assert "R01_SRP" in gov["checks"]

    def test_core_stage(self, mock_llm):
        from core.graph.teams.integrity import integrity_node
        out = integrity_node({"task": "check", "results": [], "messages": []})
        core = out["results"][0]["stages"][1]
        assert core["agent"] == "core"
        assert "checks" in core


class TestQuality:
    def test_returns_single_result(self, mock_llm):
        from core.graph.teams.quality import quality_node
        out = quality_node({"task": "audit code", "results": [], "messages": []})
        assert len(out["results"]) == 1

    def test_has_pipeline(self, mock_llm):
        from core.graph.teams.quality import quality_node
        out = quality_node({"task": "audit", "results": [], "messages": []})
        r = out["results"][0]
        assert r["pipeline"] == "critik → corrector → qualifier"
        assert len(r["stages"]) == 3

    def test_critik_stage(self, mock_llm):
        from core.graph.teams.quality import quality_node
        out = quality_node({"task": "audit", "results": [], "messages": []})
        critik = out["results"][0]["stages"][0]
        assert critik["agent"] == "critik"
        assert "threats" in critik

    def test_qualifier_stage(self, mock_llm):
        from core.graph.teams.quality import quality_node
        out = quality_node({"task": "audit", "results": [], "messages": []})
        qualifier = out["results"][0]["stages"][2]
        assert qualifier["agent"] == "qualifier"
        assert qualifier["verdict"] in ("CERTIFIED", "NEEDS_REVIEW")


class TestStrategy:
    def test_returns_single_result(self, mock_llm):
        from core.graph.teams.strategy import strategy_node
        out = strategy_node({"task": "plan next phase", "results": [], "messages": []})
        assert len(out["results"]) == 1

    def test_has_pipeline(self, mock_llm):
        from core.graph.teams.strategy import strategy_node
        out = strategy_node({"task": "plan", "results": [], "messages": []})
        r = out["results"][0]
        assert r["pipeline"] == "captain → task → brainstorming"
        assert len(r["stages"]) == 3

    def test_has_progress(self, mock_llm):
        from core.graph.teams.strategy import strategy_node
        out = strategy_node({"task": "plan", "results": [], "messages": []})
        assert "progress" in out["results"][0]


class TestDev:
    def test_returns_single_result(self, mock_llm):
        from core.graph.teams.dev import dev_node
        out = dev_node({"task": "implement feature", "results": [], "messages": []})
        assert len(out["results"]) == 1

    def test_has_module_counts(self, mock_llm):
        from core.graph.teams.dev import dev_node
        out = dev_node({"task": "implement", "results": [], "messages": []})
        assert "modules" in out["results"][0]


class TestMaintenance:
    def test_returns_single_result(self, mock_llm):
        from core.graph.teams.maintenance import maintenance_node
        out = maintenance_node({"task": "coverage check", "results": [], "messages": []})
        assert len(out["results"]) == 1

    def test_has_coverage(self, mock_llm):
        from core.graph.teams.maintenance import maintenance_node
        out = maintenance_node({"task": "check", "results": [], "messages": []})
        assert "coverage" in out["results"][0]

    def test_has_version(self, mock_llm):
        from core.graph.teams.maintenance import maintenance_node
        out = maintenance_node({"task": "check", "results": [], "messages": []})
        assert "version" in out["results"][0]
