"""
GSS Orion V3 — Dynamic Orchestrator.
Score/Weight auto-promotion for agents.
Each time an agent is used, its score increases.
Weight auto-promotes based on score thresholds + impact class.
Scores stored in brain/scores.json (separated from registry.yaml).
Ported from V1's engine/dynamic_orchestrator.py.
"""

import json
import logging
from datetime import UTC, datetime

import yaml

from core.paths import ROOT

logger = logging.getLogger(__name__)

REGISTRY_PATH = ROOT / "experts" / "registry.yaml"
SCORES_PATH = ROOT / "brain" / "scores.json"

# Weight floors/ceilings by impact class
FLOORS = {"ALPHA": 90, "BETA": 40, "GAMMA": 20, "DELTA": 30}
CEILINGS = {"ALPHA": 95, "BETA": 85, "GAMMA": 85, "DELTA": 60}

# Score thresholds for promotion
THRESHOLDS = [(30, 85), (20, 60), (10, 40)]


def _load_registry() -> dict:
    if not REGISTRY_PATH.exists():
        return {"skills": {}}
    try:
        data = yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8"))
        return data or {"skills": {}}
    except Exception as e:
        logger.warning("Registry load error: %s", e)
        return {"skills": {}}


def _load_scores() -> dict:
    """Load dynamic scores from brain/scores.json."""
    if not SCORES_PATH.exists():
        return {"metadata": {}, "scores": {}}
    try:
        return json.loads(SCORES_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning("Scores load error: %s", e)
        return {"metadata": {}, "scores": {}}


def _save_scores(data: dict) -> None:
    """Persist scores to brain/scores.json."""
    data.setdefault("metadata", {})["last_updated"] = datetime.now(UTC).isoformat()
    SCORES_PATH.parent.mkdir(parents=True, exist_ok=True)
    SCORES_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")


def update_score(agent_id: str) -> int:
    """Increment score and usage_count for an agent. Returns new score."""
    registry = _load_registry()
    if agent_id not in registry.get("skills", {}):
        logger.warning("Agent '%s' not in registry. Score not updated.", agent_id)
        return 0

    scores_data = _load_scores()
    scores = scores_data.setdefault("scores", {})
    agent_scores = scores.setdefault(agent_id, {"score": 0, "usage_count": 0})

    agent_scores["score"] = agent_scores.get("score", 0) + 1
    agent_scores["usage_count"] = agent_scores.get("usage_count", 0) + 1
    new_score = agent_scores["score"]

    _save_scores(scores_data)
    logger.info("Score: %s -> %d (usage: %d)", agent_id, new_score, agent_scores["usage_count"])

    _auto_promote_weight(agent_id, new_score, scores_data)
    return new_score


def _auto_promote_weight(agent_id: str, score: int, scores_data: dict) -> None:
    """Auto-promote weight based on score thresholds and impact class."""
    registry = _load_registry()
    skill = registry["skills"].get(agent_id, {})
    impact_class = skill.get("impact_class", "DELTA")
    is_static = skill.get("type") == "static"

    floor = FLOORS.get(impact_class, 20)
    ceiling = CEILINGS.get(impact_class, 85)

    if is_static and impact_class == "ALPHA":
        new_weight = 95
    else:
        new_weight = floor
        for threshold, weight in THRESHOLDS:
            if score >= threshold:
                new_weight = weight
                break

    new_weight = max(new_weight, floor)
    new_weight = min(new_weight, ceiling)

    agent_scores = scores_data["scores"].setdefault(agent_id, {})
    current = agent_scores.get("weight", skill.get("weight", 20))
    if new_weight != current:
        agent_scores["weight"] = new_weight
        _save_scores(scores_data)
        logger.info("Promote: %s weight %d -> %d (score=%d)", agent_id, current, new_weight, score)


def record_activity(agent_ids: list[str]) -> dict[str, int]:
    """Batch-score multiple agents. Returns {agent_id: new_score}."""
    results = {}
    for agent_id in agent_ids:
        results[agent_id] = update_score(agent_id)
    return results


def get_leaderboard() -> list[dict]:
    """Return agents sorted by score (descending). Merges registry + scores."""
    registry = _load_registry()
    scores_data = _load_scores()
    skills = registry.get("skills", {})
    scores = scores_data.get("scores", {})
    board = []
    for name, data in skills.items():
        agent_scores = scores.get(name, {})
        board.append(
            {
                "agent": name,
                "score": agent_scores.get("score", 0),
                "weight": agent_scores.get("weight", data.get("weight", 0)),
                "usage_count": agent_scores.get("usage_count", 0),
                "type": data.get("type", "unknown"),
            }
        )
    return sorted(board, key=lambda x: x["score"], reverse=True)


if __name__ == "__main__":
    import sys

    from core.ui import print_detail, print_step

    if len(sys.argv) >= 3 and sys.argv[1] == "--score":
        new = update_score(sys.argv[2])
        print_step("SCORE", f"{sys.argv[2]} -> score={new}", "OK")
    elif len(sys.argv) >= 2 and sys.argv[1] == "--leaderboard":
        print_step("LEADERBOARD", "Agent rankings", "INFO")
        for entry in get_leaderboard():
            print_detail(
                f"{entry['agent']:20s} W={entry['weight']:3d} S={entry['score']:3d} U={entry['usage_count']:3d}", "OK"
            )
    else:
        print_step("USAGE", "dynamic_orchestrator.py [--score AGENT | --leaderboard]", "INFO")
