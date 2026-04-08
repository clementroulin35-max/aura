"""Tests for sync pipeline and infra modules."""
import time
from pathlib import Path

from core.sync.brain_layer import sync_brain_layer
from core.sync.rules_layer import sync_rules_layer
from core.sync.srp_layer import sync_srp_layer
from core.sync.manifest import compute_hashes, detect_changes
from core.sync.orchestrator import run_sync
from core.infra.telemetry import Telemetry
from core.infra.event_bus import EventBus


class TestBrainLayer:
    def test_sync_with_valid_files(self, tmp_project: Path):
        results = sync_brain_layer(tmp_project)
        assert all(r["status"] == "OK" for r in results)

    def test_sync_detects_missing(self, tmp_path: Path):
        (tmp_path / "brain").mkdir()
        results = sync_brain_layer(tmp_path)
        assert any(r["status"] == "MISSING" for r in results)


class TestRulesLayer:
    def test_sync_with_valid_rules(self, tmp_project: Path):
        results = sync_rules_layer(tmp_project)
        assert len(results) > 0
        assert all(r["status"] == "OK" for r in results)

    def test_missing_rules_dir(self, tmp_path: Path):
        results = sync_rules_layer(tmp_path)
        assert results[0]["status"] == "MISSING_DIR"


class TestSRPLayer:
    def test_no_violations_in_project(self):
        violations = sync_srp_layer()
        assert len(violations) == 0, f"SRP violations found: {violations}"


class TestManifest:
    def test_compute_hashes(self):
        hashes = compute_hashes()
        assert isinstance(hashes, dict)
        assert len(hashes) > 0


class TestOrchestrator:
    def test_run_sync(self):
        result = run_sync(verbose=False)
        assert result["status"] in ("OK", "ISSUES")
        assert "brain" in result
        assert "rules" in result


class TestTelemetry:
    def test_track_tokens(self):
        t = Telemetry()
        t.track_tokens(100, 50)
        snap = t.get_snapshot()
        assert snap["tokens"]["total"] == 150

    def test_track_intelligence(self):
        t = Telemetry()
        t.track_intelligence("local")
        t.track_intelligence("simulation")
        snap = t.get_snapshot()
        assert snap["intelligence"]["local"] == 1
        assert snap["intelligence"]["simulation"] == 1


class TestEventBus:
    def test_emit(self, tmp_path: Path):
        log_file = tmp_path / "events.jsonl"
        bus = EventBus(log_path=log_file)
        bus.emit("TEST", "TestEvent", "OK", "context")
        time.sleep(0.2)  # Wait for writer thread
        bus.shutdown()
        time.sleep(0.1)
        assert log_file.exists()
        assert log_file.stat().st_size > 0
