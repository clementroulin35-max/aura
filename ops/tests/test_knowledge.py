"""Tests for core/sentinels/knowledge.py."""

import json
from unittest.mock import patch


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

        with patch("core.sentinels.knowledge.MEMORY_PATH", mem_path), patch("core.sentinels.knowledge.set_flag"):
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

        with patch("core.sentinels.knowledge.MEMORY_PATH", mem_path), patch("core.sentinels.knowledge.set_flag"):
            result = check_knowledge()
            targets = result["targets"]
            assert "personality" in targets
            assert "roadmap" in targets
            assert "principles" in targets
            assert "governance" in targets
            assert "general" in targets
