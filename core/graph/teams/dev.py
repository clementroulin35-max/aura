"""
GSS Orion V3 — DEV Team Node.
Module analysis + LLM-driven implementation guidance.
"""

import logging
from pathlib import Path

from langchain_core.messages import SystemMessage

from core.llm import call_llm
from core.paths import ROOT

logger = logging.getLogger(__name__)

PACKAGES = ["core", "ops", "portal"]


def _scan_modules(root: Path) -> dict[str, int]:
    """Count Python modules per package."""
    counts: dict[str, int] = {}
    for pkg in PACKAGES:
        pkg_path = root / pkg
        if pkg_path.exists():
            counts[pkg] = sum(1 for _ in pkg_path.rglob("*.py") if "__pycache__" not in str(_))
        else:
            counts[pkg] = 0
    return counts


def dev_node(state: dict) -> dict:
    """DEV team — analyze modules and provide implementation guidance."""
    task = state.get("task", "")
    module_counts = _scan_modules(ROOT)

    summary = ", ".join(f"{pkg}: {count}" for pkg, count in module_counts.items())
    total = sum(module_counts.values())

    # LLM guidance
    resp = call_llm(
        system_prompt="You are a Python architect. Suggest implementation steps. Be concise.",
        user_message=f"Task: {task}\n\nProject modules ({total} total): {summary}",
    )

    result = {
        "team": "DEV",
        "modules": module_counts,
        "total_modules": total,
        "guidance": resp.get("content", ""),
        "verdict": f"{total} modules across {len(module_counts)} packages",
    }

    return {
        "results": [result],
        "messages": [SystemMessage(content=f"[DEV] {total} modules analyzed. Guidance provided.")],
    }
