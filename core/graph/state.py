"""
GSS Orion V3 — Shared Graph State (TypedDict).
All LangGraph nodes read/write this shared state.
"""
import operator
from typing import Annotated, Literal, TypedDict

from langgraph.graph.message import add_messages

TEAM_NAMES = Literal[
    "INTEGRITY", "QUALITY", "STRATEGY", "DEV", "MAINTENANCE", "FINISH"
]

ALL_TEAMS: list[str] = ["INTEGRITY", "QUALITY", "STRATEGY", "DEV", "MAINTENANCE"]


class GSSState(TypedDict):
    """Shared state across all LangGraph nodes."""

    messages: Annotated[list, add_messages]
    task: str
    next_team: TEAM_NAMES
    current_team: str
    team_history: Annotated[list[str], operator.add]
    context: dict
    results: Annotated[list[dict], operator.add]
    iteration: int
