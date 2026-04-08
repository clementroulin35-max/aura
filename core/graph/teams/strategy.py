"""
GSS Orion V3 — STRATEGY Team Node.
Roadmap analysis and strategic planning via LLM.
Reads roadmap.yaml but NEVER writes to it (fixes V2 file corruption risk).
"""
import logging

import yaml
from langchain_core.messages import SystemMessage

from core.llm import call_llm
from core.paths import ROOT

logger = logging.getLogger(__name__)


def _load_roadmap() -> dict:
    """Load roadmap from YAML. Read-only."""
    path = ROOT / "experts" / "rules" / "roadmap.yaml"
    if not path.exists():
        return {"roadmap": {"mission": "undefined", "milestones": []}}
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    except Exception as e:
        logger.warning("Roadmap load error: %s", e)
        return {}


def strategy_node(state: dict) -> dict:
    """STRATEGY team — roadmap analysis + LLM strategic planning."""
    task = state.get("task", "")
    roadmap = _load_roadmap()
    milestones = roadmap.get("roadmap", {}).get("milestones", [])

    # Calculate progress
    total = len(milestones)
    done = sum(1 for m in milestones if m.get("status", "").upper() in ("DONE", "CONSOLIDATED"))
    in_progress = sum(1 for m in milestones if "PROGRESS" in m.get("status", "").upper())
    progress_pct = round(done / total * 100) if total > 0 else 0

    # LLM strategic analysis
    roadmap_summary = "\n".join(
        f"- {m.get('id', '?')}: {m.get('name', '?')} [{m.get('status', '?')}]" for m in milestones
    )
    resp = call_llm(
        system_prompt="You are a project strategist. Analyze the roadmap and suggest next priorities. Be concise.",
        user_message=f"Task: {task}\n\nRoadmap ({progress_pct}% done):\n{roadmap_summary}",
    )

    result = {
        "team": "STRATEGY",
        "progress": f"{done}/{total} ({progress_pct}%)",
        "in_progress": in_progress,
        "analysis": resp.get("content", ""),
        "verdict": f"{progress_pct}% complete",
    }

    return {
        "results": [result],
        "messages": [SystemMessage(content=f"[STRATEGY] Roadmap: {progress_pct}% complete. {in_progress} in progress.")],
    }
