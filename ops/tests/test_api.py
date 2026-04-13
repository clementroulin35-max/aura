"""Tests for FastAPI endpoints."""

import pytest
from fastapi.testclient import TestClient

from portal.backend.app import app


@pytest.fixture
def client():
    return TestClient(app)


class TestAPI:
    def test_root(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ONLINE"
        assert "Orion V3" in data["system"]

    def test_atlas_pulse(self, client):
        resp = client.get("/v1/atlas/pulse")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "NOMINAL"
        assert "version" in data
        assert "health" in data
        assert "telemetry" in data

    def test_graph_run(self, client, mock_llm):
        payload = {
            "id": "M_TEST_API",
            "title": "API Verification",
            "context": "Automated testing",
            "objectives": ["Connect", "Validate"],
            "constraints": [],
            "expected_deliverables": ["Report"],
            "selected_skills": ["core"],
        }
        resp = client.post("/v1/graph/run", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "MISSION_DISPATCHED"
        assert data["mission_id"] == "M_TEST_API"

    def test_graph_run_invalid(self, client):
        resp = client.post("/v1/graph/run", json={})
        assert resp.status_code == 422  # Validation error
