"""
GSS Orion V4 — Shared Graph State (TypedDict).
All LangGraph nodes read/write this shared state.
"""

import operator
from typing import Annotated, Literal, TypedDict

from langgraph.graph.message import add_messages


class GSSState(TypedDict):
    """Shared state across all LangGraph nodes for project-based missions."""

    messages: Annotated[list, add_messages]

    # Mission Spec
    mission_id: str
    mission_title: str
    mission_context: str
    objectives: list[str]
    constraints: list[str]
    expected_deliverables: list[str]

    # Execution Tracking
    selected_skills: list[str]
    team_history: Annotated[list[str], operator.add]
    results: Annotated[list[dict], operator.add]
    iteration: int
    status: Literal["PENDING", "IN_PROGRESS", "SUCCESS", "FAILED"]
