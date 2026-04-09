"""
GSS Orion V3 — STRATEGY Team Node.
Pipeline: captain (direction) → task (decompose) → brainstorming (explore).
Captain reads roadmap. Task/Brainstorming use LLM.
"""

import logging

import yaml
from langchain_core.messages import SystemMessage

from core.graph.skills import load_skill
from core.llm import call_llm
from core.paths import ROOT

logger = logging.getLogger(__name__)


def _captain_stage(task: str) -> dict:
    """Stage 1: Captain — read-only strategic assessment."""
    load_skill("captain")
    plan_path = ROOT / "experts" / "rules" / "roadmap.yaml"
    phases = {}
    if plan_path.exists():
        try:
            data = yaml.safe_load(plan_path.read_text(encoding="utf-8")) or {}
            milestones = data.get("roadmap", {}).get("milestones", [])
            phases = {m.get("id"): m.get("status") for m in milestones if "id" in m}
        except Exception as e:
            logger.warning("Roadmap parse error: %s", e)

    done = sum(1 for v in phases.values() if v == "DONE")
    total = len(phases)
    progress = f"{done}/{total}" if total > 0 else "N/A"

    return {
        "agent": "captain",
        "action": "ASSESS",
        "assessment": f"Strategic analysis for: '{task[:80]}'",
        "roadmap_phases": phases,
        "progress": progress,
        "recommendation": "Continue current wave" if done == total else "Focus on incomplete milestones",
    }


def _task_stage(task: str, captain_result: dict) -> dict:
    """Stage 2: Task — LLM-powered decomposition."""
    skill = load_skill("task")
    resp = call_llm(
        system_prompt=skill,
        user_message=f"Captain assessment: {captain_result['assessment']}\nProgress: {captain_result['progress']}\nDecompose this task into 3-5 subtasks:\n{task}",
    )
    return {
        "agent": "task",
        "action": "DECOMPOSE",
        "subtasks": resp.get("content", "No subtasks generated"),
        "guidance": captain_result["recommendation"],
    }


def _brainstorming_stage(task: str, task_result: dict) -> dict:
    """Stage 3: Brainstorming — LLM explores alternatives."""
    skill = load_skill("brainstorming")
    resp = call_llm(
        system_prompt=skill,
        user_message=f"Task: {task}\nSubtasks: {task_result['subtasks']}\nPropose 2-3 alternatives and identify risks.",
    )
    return {
        "agent": "brainstorming",
        "action": "EXPLORE",
        "alternatives": resp.get("content", ""),
    }


def strategy_node(state: dict) -> dict:
    """STRATEGY team — captain → task → brainstorming pipeline."""
    task = state.get("task", "")
    captain = _captain_stage(task)
    task_result = _task_stage(task, captain)
    brainstorming = _brainstorming_stage(task, task_result)

    result = {
        "team": "STRATEGY",
        "pipeline": "captain → task → brainstorming",
        "stages": [captain, task_result, brainstorming],
        "verdict": "PLANNED",
        "progress": captain["progress"],
    }
    return {
        "results": [result],
        "messages": [
            SystemMessage(
                content=f"[STRATEGY] captain(progress:{captain['progress']}) → task → brainstorming. Direction established."
            )
        ],
    }
