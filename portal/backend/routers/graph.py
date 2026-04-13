"""
GSS Orion V4 — Graph Router (POST /v1/graph/run).
Executes a LangGraph mission asynchronously and returns dispatch confirmation.
"""
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from typing import List

import logging
from core.graph.compiler import execute_mission
from core.graph.mission_io import initialize_mission_environment

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/graph", tags=["graph"])


class MissionRequest(BaseModel):
    id: str
    project_id: str | None = None
    title: str
    context: str
    objectives: List[str]
    constraints: List[str]
    expected_deliverables: List[str]
    selected_skills: List[str] = []


async def execute_mission_safe(mission_data: dict):
    """Wrapper to catch background task failures."""
    from core.infra.event_bus import event_bus
    try:
        await execute_mission(mission_data)
    except Exception as e:
        logger.error(f"Mission execution failed: {e}")
        event_bus.emit("GRAPH", "ExecutionError", "ERROR", str(e))

@router.post("/run")
async def run_graph(request: MissionRequest, background_tasks: BackgroundTasks):
    """Execute a LangGraph mission in the background."""
    mission_data = request.model_dump()
    # Immediate environment setup (SRP: Persistence layer)
    initialize_mission_environment(mission_data)
    
    background_tasks.add_task(execute_mission_safe, mission_data)
    return {"status": "MISSION_DISPATCHED", "mission_id": request.id}
