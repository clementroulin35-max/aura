"""
GSS Orion V3 — Task Router.
Weighted keyword routing with word-boundary regex matching.
Fixes V2 substring matching bug ('fix' in 'prefix').
"""

import logging
import re

import yaml

from core.paths import ROOT

logger = logging.getLogger(__name__)


def _load_routing_rules() -> dict[str, dict]:
    """Load routing keywords from experts/rules/routing.yaml."""
    path = ROOT / "experts" / "rules" / "routing.yaml"
    if not path.exists():
        return _fallback_rules()
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        return data.get("teams", _fallback_rules())
    except Exception as e:
        logger.warning("Routing rules load error: %s", e)
        return _fallback_rules()


def _fallback_rules() -> dict[str, dict]:
    """Hardcoded fallback if YAML is missing."""
    return {
        "INTEGRITY": {"keywords": {"governance": 3, "integrity": 3, "srp": 3, "security": 3}},
        "QUALITY": {"keywords": {"audit": 3, "review": 3, "bug": 3, "fix": 2, "refactor": 2}},
        "STRATEGY": {"keywords": {"plan": 3, "roadmap": 3, "strategy": 3, "milestone": 2}},
        "DEV": {"keywords": {"implement": 3, "code": 2, "create": 3, "api": 3, "feature": 2}},
        "MAINTENANCE": {"keywords": {"coverage": 3, "test": 2, "version": 2, "deploy": 2}},
    }


# Load once at module import
_RULES: dict[str, dict] = _load_routing_rules()


def route_task(task: str, history: list[str] | None = None) -> str:
    """
    Route a task to a team using weighted keyword matching.
    Uses \\b word boundaries to avoid false positives.
    Penalizes already-visited teams to prevent infinite loops.
    """
    task_lower = task.lower()
    visited = history or []
    scores: dict[str, int] = {}

    for team, config in _RULES.items():
        score = 0
        for keyword, weight in config.get("keywords", {}).items():
            if re.search(rf"\b{re.escape(keyword)}\b", task_lower):
                score += weight
        # Penalize visited teams
        visit_count = visited.count(team)
        if visit_count > 0:
            score = max(0, score - visit_count * 8)
        if score > 0:
            scores[team] = score

    if not scores:
        return "STRATEGY"  # Default fallback

    return max(scores, key=lambda k: scores[k])
