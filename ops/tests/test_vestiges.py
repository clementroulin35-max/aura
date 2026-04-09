"""Tests for V1 vestiges: dynamic_orchestrator, memory_rag, knowledge sentinel."""

import json
from unittest.mock import patch


class TestDynamicOrchestrator:
    """Tests for ops/dynamic_orchestrator.py."""

    def test_update_score(self, tmp_project):
        from ops.dynamic_orchestrator import update_score

        # Setup a minimal registry + scores
        registry = {"skills": {"critik": {"type": "dynamic", "weight": 40, "description": "test"}}}
        scores_data = {"metadata": {}, "scores": {"critik": {"score": 0, "usage_count": 0, "weight": 40}}}
        import yaml

        reg_path = tmp_project / "experts" / "registry.yaml"
        reg_path.parent.mkdir(parents=True, exist_ok=True)
        reg_path.write_text(yaml.dump(registry))
        scores_path = tmp_project / "brain" / "scores.json"
        scores_path.write_text(json.dumps(scores_data))

        with (
            patch("ops.dynamic_orchestrator.REGISTRY_PATH", reg_path),
            patch("ops.dynamic_orchestrator.SCORES_PATH", scores_path),
        ):
            score = update_score("critik")
            assert score == 1
            # Verify scores.json was updated
            saved = json.loads(scores_path.read_text(encoding="utf-8"))
            assert saved["scores"]["critik"]["score"] == 1

    def test_unknown_agent(self, tmp_project):
        from ops.dynamic_orchestrator import update_score

        with (
            patch("ops.dynamic_orchestrator.REGISTRY_PATH", tmp_project / "nope.yaml"),
            patch("ops.dynamic_orchestrator.SCORES_PATH", tmp_project / "nope_scores.json"),
        ):
            score = update_score("nonexistent")
            assert score == 0

    def test_get_leaderboard(self, tmp_project):
        from ops.dynamic_orchestrator import get_leaderboard

        with (
            patch("ops.dynamic_orchestrator.REGISTRY_PATH", tmp_project / "experts" / "registry.yaml"),
            patch("ops.dynamic_orchestrator.SCORES_PATH", tmp_project / "brain" / "scores.json"),
        ):
            board = get_leaderboard()
            assert isinstance(board, list)
            assert len(board) >= 1  # At least "core" from fixture

    def test_record_activity(self, tmp_project):
        from ops.dynamic_orchestrator import record_activity

        with (
            patch("ops.dynamic_orchestrator.REGISTRY_PATH", tmp_project / "nope.yaml"),
            patch("ops.dynamic_orchestrator.SCORES_PATH", tmp_project / "nope_scores.json"),
        ):
            results = record_activity(["ghost1", "ghost2"])
            assert all(v == 0 for v in results.values())

    def test_scores_separated_from_registry(self, tmp_project):
        """Verify that scores don't pollute registry.yaml (D6 fix)."""
        import yaml

        from ops.dynamic_orchestrator import update_score

        reg_path = tmp_project / "experts" / "registry.yaml"
        scores_path = tmp_project / "brain" / "scores.json"

        with (
            patch("ops.dynamic_orchestrator.REGISTRY_PATH", reg_path),
            patch("ops.dynamic_orchestrator.SCORES_PATH", scores_path),
        ):
            update_score("core")
            # Registry must NOT have score/usage_count
            reg_data = yaml.safe_load(reg_path.read_text(encoding="utf-8"))
            assert "score" not in reg_data["skills"]["core"]
            assert "usage_count" not in reg_data["skills"]["core"]
            # Scores.json must have them
            s_data = json.loads(scores_path.read_text(encoding="utf-8"))
            assert s_data["scores"]["core"]["score"] == 1


class TestMemoryRAG:
    """Tests for ops/memory_rag.py."""

    def test_tokenize(self):
        from ops.memory_rag import _tokenize

        tokens = _tokenize("Hello World, this is a TEST!")
        assert "hello" in tokens
        assert "world" in tokens
        assert "test" in tokens
        # Stopwords and short words filtered
        assert "this" not in tokens
        assert "is" not in tokens

    def test_build_index(self, tmp_project):
        from ops.memory_rag import build_index

        # Create a test file in brain/
        brain_dir = tmp_project / "brain"
        brain_dir.mkdir(exist_ok=True)
        (brain_dir / "test.json").write_text('{"key": "value governance integrity"}')

        with (
            patch("ops.memory_rag.ROOT", tmp_project),
            patch("ops.memory_rag.INDEX_PATH", tmp_project / "logs" / "memory_index.json"),
            patch("ops.memory_rag.SEARCH_DIRS", [brain_dir]),
        ):
            index = build_index()
            assert index["metadata"]["doc_count"] >= 1
            assert "governance" in index["words"]

    def test_query(self, tmp_project):
        from ops.memory_rag import build_index, query

        brain_dir = tmp_project / "brain"
        brain_dir.mkdir(exist_ok=True)
        (brain_dir / "gov.json").write_text('{"governance": "rules and principles for the system"}')

        with (
            patch("ops.memory_rag.ROOT", tmp_project),
            patch("ops.memory_rag.INDEX_PATH", tmp_project / "logs" / "memory_index.json"),
            patch("ops.memory_rag.SEARCH_DIRS", [brain_dir]),
        ):
            build_index()
            results = query("governance rules")
            assert len(results) >= 1
            assert results[0]["title"] == "gov.json"

    def test_query_empty(self, tmp_project):
        from ops.memory_rag import query

        with (
            patch("ops.memory_rag.INDEX_PATH", tmp_project / "nope.json"),
            patch("ops.memory_rag.ROOT", tmp_project),
            patch("ops.memory_rag.SEARCH_DIRS", []),
        ):
            results = query("")
            assert results == []
