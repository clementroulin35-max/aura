"""
GSS Orion V3 — Graph Router (POST /v1/graph/run).
Executes a LangGraph mission and returns results.
"""
from fastapi import APIRouter
from pydantic import BaseModel

from core.graph.compiler import execute_graph

router = APIRouter(prefix="/v1/graph", tags=["graph"])


class TaskRequest(BaseModel):
    task: str


@router.post("/run")
async def run_graph(request: TaskRequest):
    """Execute a LangGraph mission."""
    result = execute_graph(request.task)
    return result
