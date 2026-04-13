"""
GSS Orion V4 — Graph Compiler.
Builds and executes the LangGraph mission using dynamic skills.
"""

import json
import logging

from langgraph.graph import START, StateGraph

from core.graph.mission_io import persist_mission_results, save_mission_results
from core.graph.nodes import dynamic_node_factory, route_conditional, supervisor_node
from core.graph.persistence import SKILLS, forge_skill, load_skills
from core.graph.state import GSSState
from core.infra.event_bus import event_bus

logger = logging.getLogger(__name__)


def build_graph() -> StateGraph:
    """Constructs the directed graph linking Supervisor to all loaded skills."""
    graph = StateGraph(GSSState)
    graph.add_node("supervisor", supervisor_node)

    for skill_id, data in SKILLS.items():
        graph.add_node(skill_id, dynamic_node_factory(skill_id, data))

    graph.add_edge(START, "supervisor")

    cond_map = {s: s for s in SKILLS}
    cond_map["FINISH"] = "FINISH"  # Virtual marker if needed by LangGraph, but we use END

    # In LangGraph 0.2+, the cond_map values must be the actual node names or END
    from langgraph.graph import END

    actual_cond_map = {s: s for s in SKILLS}
    actual_cond_map[END] = END

    # We simplify: any skill maps to its node, everything else to END
    graph.add_conditional_edges("supervisor", route_conditional)

    for s in SKILLS:
        graph.add_edge(s, "supervisor")

    return graph


async def execute_mission(mission_data: dict) -> dict:
    """Entry point for the API to run a complete LangGraph mission (Async)."""
    global SKILLS
    SKILLS = load_skills()

    selected = mission_data.get("selected_skills", [])
    for sid in selected:
        if sid not in SKILLS and forge_skill(sid):
            SKILLS = load_skills()

    graph = build_graph()
    compiled = graph.compile()

    initial_state = {
        "mission_id": mission_data.get("id", "M_000"),
        "mission_title": mission_data.get("title", "Untitled"),
        "mission_context": mission_data.get("context", ""),
        "objectives": mission_data.get("objectives", []),
        "selected_skills": mission_data.get("selected_skills", list(SKILLS.keys())[:2]),
        "team_history": [],
        "results": [],
        "iteration": 0,
    }

    event_bus.emit("GRAPH", "MissionStarted", "INFO", f"Executing: {initial_state['mission_title']}")

    final_state = await compiled.ainvoke(initial_state)

    # 1. Update projects.json structure
    persist_mission_results(mission_data.get("project_id"), final_state.get("team_history", []))

    # 2. Save physical files to Workspace
    results = final_state.get("results", [])
    save_mission_results(mission_data.get("id"), mission_data.get("project_id"), results)

    # 3. Emit Completion Signal for HUD
    event_bus.emit(
        "GRAPH",
        "MISSION_COMPLETED",
        "OK",
        json.dumps(
            {
                "mission_id": initial_state["mission_id"],
                "project_id": mission_data.get("project_id"),
                "results": results,
                "teams_visited": final_state.get("team_history", []),
            },
            ensure_ascii=False,
        ),
    )

    return {
        "status": "COMPLETED",
        "mission_id": initial_state["mission_id"],
        "teams_visited": final_state.get("team_history", []),
        "results": results,
        "full_state": final_state,
    }
