"""
GSS Orion V3 — Graph Compiler.
Builds the LangGraph StateGraph and executes tasks.

Architecture:
  START → supervisor → conditional_edges → team_nodes → supervisor → ... → FINISH
"""
import argparse
import logging

from langchain_core.messages import SystemMessage
from langgraph.graph import END, START, StateGraph

from core.graph.router import route_task
from core.graph.state import ALL_TEAMS, GSSState
from core.graph.teams.dev import dev_node
from core.graph.teams.integrity import integrity_node
from core.graph.teams.maintenance import maintenance_node
from core.graph.teams.quality import quality_node
from core.graph.teams.strategy import strategy_node
from core.infra.event_bus import event_bus

logger = logging.getLogger(__name__)

MAX_ITERATIONS = 5

# ── Team node registry ──
TEAM_NODES = {
    "INTEGRITY": integrity_node,
    "QUALITY": quality_node,
    "STRATEGY": strategy_node,
    "DEV": dev_node,
    "MAINTENANCE": maintenance_node,
}


def supervisor_node(state: dict) -> dict:
    """Supervisor: routes task to the appropriate team."""
    iteration = state.get("iteration", 0)
    history = state.get("team_history", [])
    task = state.get("task", "")

    if iteration >= MAX_ITERATIONS:
        event_bus.emit("SUPERVISOR", "MaxIterations", "WARN", f"Stopped at iter {iteration}")
        return {
            "next_team": "FINISH",
            "iteration": iteration + 1,
            "messages": [SystemMessage(content=f"[SUPERVISOR] Max iterations ({MAX_ITERATIONS}) reached. Finishing.")],
        }

    # First pass: always INTEGRITY preflight
    if iteration == 0:
        team = "INTEGRITY"
    else:
        team = route_task(task, history)
        # If team already visited 2+ times, finish
        if history.count(team) >= 2 and iteration > 2:
            event_bus.emit("SUPERVISOR", "MissionComplete", "OK", f"iter={iteration}")
            return {
                "next_team": "FINISH",
                "iteration": iteration + 1,
                "messages": [SystemMessage(content="[SUPERVISOR] Mission complete — teams exhausted.")],
            }

    event_bus.emit("SUPERVISOR", "RouteDecision", "OK", f"→ {team} (iter {iteration})")

    return {
        "next_team": team,
        "current_team": team,
        "iteration": iteration + 1,
        "team_history": [team],
        "messages": [SystemMessage(content=f"[SUPERVISOR] → {team} (iteration {iteration})")],
    }


def _route_conditional(state: dict) -> str:
    """Conditional edge: map next_team to node name or END."""
    next_team = state.get("next_team", "FINISH")
    if next_team == "FINISH":
        return END
    return next_team


def build_graph() -> StateGraph:
    """Build the full LangGraph StateGraph."""
    graph = StateGraph(GSSState)

    # Add nodes
    graph.add_node("supervisor", supervisor_node)
    for name, func in TEAM_NODES.items():
        graph.add_node(name, func)

    # Edges: START → supervisor
    graph.add_edge(START, "supervisor")

    # Conditional edges: supervisor → team or END
    graph.add_conditional_edges("supervisor", _route_conditional, {t: t for t in ALL_TEAMS} | {END: END})

    # Each team → supervisor (loop back)
    for name in TEAM_NODES:
        graph.add_edge(name, "supervisor")

    return graph


def execute_graph(task: str) -> dict:
    """Compile and execute the graph for a given task."""
    graph = build_graph()
    compiled = graph.compile()

    initial_state: dict = {
        "messages": [SystemMessage(content=f"[INIT] Task: {task}")],
        "task": task,
        "next_team": "INTEGRITY",
        "current_team": "",
        "team_history": [],
        "context": {},
        "results": [],
        "iteration": 0,
    }

    event_bus.emit("COMPILER", "MissionStart", "OK", task[:100])
    final_state = compiled.invoke(initial_state)
    event_bus.emit("COMPILER", "MissionEnd", "OK", f"Teams: {final_state.get('team_history', [])}")

    return {
        "task": task,
        "status": "COMPLETED",
        "teams_visited": final_state.get("team_history", []),
        "iterations": final_state.get("iteration", 0),
        "results": final_state.get("results", []),
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="GSS Orion V3 — Graph Compiler")
    parser.add_argument("--task", type=str, required=True, help="Task to execute")
    args = parser.parse_args()

    from core.ui import print_banner, print_step
    print_banner("GSS ORION V3", "LangGraph Compiler")
    result = execute_graph(args.task)
    print_step("RESULT", f"Teams: {' → '.join(result['teams_visited'])}", "OK")
    print_step("STATUS", result["status"], "SUCCESS")
    for r in result.get("results", []):
        print_step(r.get("team", "?"), r.get("verdict", ""), "INFO")
