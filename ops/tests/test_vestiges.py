"""Tests for V1 vestiges: dynamic_orchestrator, memory_rag, knowledge sentinel."""
import json
from unittest.mock import patch


class TestDynamicOrchestrator:
    """Tests for ops/dynamic_orchestrator.py."""

    def test_update_score(self, tmp_project):
        from ops.dynamic_orchestrator import update_score

        # Setup a minimal registry
        registry = {"skills": {"critik": {"type": "dynamic", "weight": 40, "score": 0, "usage_count": 0}}}
        with patch("ops.dynamic_orchestrator.REGISTRY_PATH", tmp_project / "experts" / "registry.yaml"):
            import yaml
            reg_path = tmp_project / "experts" / "registry.yaml"
            reg_path.parent.mkdir(parents=True, exist_ok=True)
            reg_path.write_text(yaml.dump(registry))

            with patch("ops.dynamic_orchestrator.REGISTRY_PATH", reg_path):
                score = update_score("critik")
                assert score == 1

    def test_unknown_agent(self, tmp_project):
        from ops.dynamic_orchestrator import update_score

        with patch("ops.dynamic_orchestrator.REGISTRY_PATH", tmp_project / "nope.yaml"):
            score = update_score("nonexistent")
            assert score == 0

    def test_get_leaderboard(self, tmp_project):
        from ops.dynamic_orchestrator import get_leaderboard

        with patch("ops.dynamic_orchestrator.REGISTRY_PATH", tmp_project / "nope.yaml"):
            board = get_leaderboard()
            assert isinstance(board, list)

    def test_record_activity(self, tmp_project):
        from ops.dynamic_orchestrator import record_activity

        with patch("ops.dynamic_orchestrator.REGISTRY_PATH", tmp_project / "nope.yaml"):
            results = record_activity(["ghost1", "ghost2"])
            assert all(v == 0 for v in results.values())


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

        with patch("ops.memory_rag.ROOT", tmp_project), \
             patch("ops.memory_rag.INDEX_PATH", tmp_project / "logs" / "memory_index.json"), \
             patch("ops.memory_rag.SEARCH_DIRS", [brain_dir]):
            index = build_index()
            assert index["metadata"]["doc_count"] >= 1
            assert "governance" in index["words"]

    def test_query(self, tmp_project):
        from ops.memory_rag import build_index, query

        brain_dir = tmp_project / "brain"
        brain_dir.mkdir(exist_ok=True)
        (brain_dir / "gov.json").write_text('{"governance": "rules and principles for the system"}')

        with patch("ops.memory_rag.ROOT", tmp_project), \
             patch("ops.memory_rag.INDEX_PATH", tmp_project / "logs" / "memory_index.json"), \
             patch("ops.memory_rag.SEARCH_DIRS", [brain_dir]):
            build_index()
            results = query("governance rules")
            assert len(results) >= 1
            assert results[0]["title"] == "gov.json"

    def test_query_empty(self, tmp_project):
        from ops.memory_rag import query

        with patch("ops.memory_rag.INDEX_PATH", tmp_project / "nope.json"), \
             patch("ops.memory_rag.ROOT", tmp_project), \
             patch("ops.memory_rag.SEARCH_DIRS", []):
            results = query("")
            assert results == []


class TestKnowledgeSentinel:
    """Tests for core/sentinels/knowledge.py."""

    def test_no_memory(self, tmp_project):
        from core.sentinels.knowledge import check_knowledge

        with patch("core.sentinels.knowledge.MEMORY_PATH", tmp_project / "nope.json"):
            result = check_knowledge()
            assert result["status"] == "NO_MEMORY"

    def test_ok_status(self, tmp_project):
        from core.sentinels.knowledge import check_knowledge

        mem = {"entries": [{"id": "REX-001", "status": "active", "category": "pattern", "tags": []}]}
        mem_path = tmp_project / "memory.json"
        mem_path.write_text(json.dumps(mem))

        with patch("core.sentinels.knowledge.MEMORY_PATH", mem_path):
            result = check_knowledge()
            assert result["status"] == "OK"
            assert result["pending"] == 0

    def test_ingestion_required(self, tmp_project):
        from core.sentinels.knowledge import check_knowledge

        entries = [{"id": f"REX-{i}", "status": "pending", "category": "error", "tags": ["build"]} for i in range(6)]
        mem = {"entries": entries}
        mem_path = tmp_project / "memory.json"
        mem_path.write_text(json.dumps(mem))

        with patch("core.sentinels.knowledge.MEMORY_PATH", mem_path), \
             patch("core.sentinels.knowledge.set_flag"):
            result = check_knowledge()
            assert result["status"] == "INGESTION_REQUIRED"
            assert result["pending"] == 6

    def test_signal_alert(self, tmp_project):
        from core.sentinels.knowledge import signal_alert

        ok_result = {"status": "OK", "pending": 0, "targets": {}}
        assert signal_alert(ok_result) is False

        alert_result = {"status": "INGESTION_REQUIRED", "pending": 5, "targets": {"roadmap": ["R1", "R2"]}}
        alerts_path = tmp_project / "alerts.jsonl"
        with patch("core.sentinels.knowledge.ALERTS_PATH", alerts_path):
            assert signal_alert(alert_result) is True
            assert alerts_path.exists()

    def test_target_classification(self, tmp_project):
        from core.sentinels.knowledge import check_knowledge

        entries = [
            {"id": "R1", "status": "pending", "category": "calibration", "tags": ["personality"]},
            {"id": "R2", "status": "pending", "category": "defect", "tags": ["build"]},
            {"id": "R3", "status": "pending", "category": "pattern", "tags": ["D01"]},
            {"id": "R4", "status": "pending", "category": "pattern", "tags": ["governance"]},
            {"id": "R5", "status": "pending", "category": "insight", "tags": ["random"]},
        ]
        mem = {"entries": entries}
        mem_path = tmp_project / "memory.json"
        mem_path.write_text(json.dumps(mem))

        with patch("core.sentinels.knowledge.MEMORY_PATH", mem_path), \
             patch("core.sentinels.knowledge.set_flag"):
            result = check_knowledge()
            targets = result["targets"]
            assert "personality" in targets
            assert "roadmap" in targets
            assert "principles" in targets
            assert "governance" in targets
            assert "general" in targets
