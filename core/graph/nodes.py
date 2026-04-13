"""
GSS Orion V4 — Graph Nodes.
Contains the Supervisor and Dynamic Node logic.
"""

import logging

from langgraph.graph import END

from core.graph.persistence import SKILLS
from core.infra.event_bus import event_bus
from core.llm import acall_llm

logger = logging.getLogger(__name__)
MAX_ITERATIONS = 10


def dynamic_node_factory(skill_id: str, skill_data: dict):
    """Creates a generic LangGraph node for a given skill (Async)."""

    async def node(state: dict) -> dict:
        event_bus.emit(f"NODE:[{skill_id.upper()}]", "TaskStarted", "INFO", "Working...")
        system_prompt = (
            f"You are the {skill_data.get('name', skill_id)}.\n"
            f"Role: {skill_data.get('role', '')}\n"
            f"Responsibilities: {', '.join(skill_data.get('responsibilities', []))}\n"
            f"Constraints: {', '.join(skill_data.get('constraints', []))}\n"
            f"Output Format: {skill_data.get('output_format', '')}\n"
        )
        user_prompt = (
            f"Mission: {state.get('mission_title', '')}\n"
            f"Context: {state.get('mission_context', '')}\n"
            f"Objectives: {', '.join(state.get('objectives', []))}\n"
            f"Please execute your step and provide the deliverable."
        )
        result = await acall_llm(system_prompt, user_prompt)
        text = result.get("content", "No output generated.")
        event_bus.emit(f"NODE:[{skill_id.upper()}]", "TaskFinished", "OK", "Deliverable ready")
        new_result = {
            "filename": f"{skill_id}_output.md",
            "content": text,
            "type": "document",
            "team": skill_id,
            "verdict": "COMPLETED",
        }
        return {"results": [new_result], "team_history": [skill_id]}

    return node


def supervisor_node(state: dict) -> dict:
    """The main router deciding which skill acts next based on selected_skills sequence."""
    iteration = state.get("iteration", 0)
    selected = state.get("selected_skills", [])
    history = state.get("team_history", [])

    if iteration >= MAX_ITERATIONS:
        event_bus.emit("SUPERVISOR", "MissionComplete", "OK", f"Finished: Max iterations ({MAX_ITERATIONS}) reached.")
        return {"next_team": "FINISH", "iteration": iteration + 1}

    if len(history) >= len(selected):
        event_bus.emit("SUPERVISOR", "MissionComplete", "OK", f"Finished: All {len(selected)} tasks completed.")
        return {"next_team": "FINISH", "iteration": iteration + 1}

    next_team = selected[len(history)]
    if next_team not in SKILLS:
        msg = f"Skill '{next_team}' NOT FOUND."
        logger.warning(msg)
        event_bus.emit("SUPERVISOR", "RouteError", "ERROR", msg)
        return {"next_team": "FINISH", "iteration": iteration + 1}

    event_bus.emit(
        "SUPERVISOR", "RouteDecision", "INFO", f"Step {len(history) + 1}/{len(selected)}: Delegating to {next_team}"
    )
    return {"next_team": next_team, "iteration": iteration + 1}


def route_conditional(state: dict) -> str:
    next_team = state.get("next_team", "FINISH")
    return END if next_team == "FINISH" else next_team
