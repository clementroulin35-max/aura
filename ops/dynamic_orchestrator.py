"""
GSS Orion V3 — Dynamic Orchestrator.
Score/Weight auto-promotion for agents.
Each time an agent is used, its score increases.
Weight auto-promotes based on score thresholds + impact class.
Ported from V1's engine/dynamic_orchestrator.py.
"""
import logging

import yaml

from core.paths import ROOT

logger = logging.getLogger(__name__)

REGISTRY_PATH = ROOT / "experts" / "registry.yaml"

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


def _save_registry(data: dict) -> None:
    REGISTRY_PATH.write_text(
        yaml.dump(data, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )


def update_score(agent_id: str) -> int:
    """Increment score and usage_count for an agent. Returns new score."""
    registry = _load_registry()
    skills = registry.setdefault("skills", {})

    if agent_id not in skills:
        logger.warning("Agent '%s' not in registry. Score not updated.", agent_id)
        return 0

    skill = skills[agent_id]
    skill["score"] = skill.get("score", 0) + 1
    skill["usage_count"] = skill.get("usage_count", 0) + 1
    new_score = skill["score"]

    _save_registry(registry)
    logger.info("Score: %s -> %d (usage: %d)", agent_id, new_score, skill["usage_count"])

    _auto_promote_weight(agent_id, new_score)
    return new_score


def _auto_promote_weight(agent_id: str, score: int) -> None:
    """Auto-promote weight based on score thresholds and impact class."""
    registry = _load_registry()
    skill = registry["skills"].get(agent_id, {})
    impact_class = skill.get("impact_class", "DELTA")
    is_static = skill.get("type") == "static"

    floor = FLOORS.get(impact_class, 20)
    ceiling = CEILINGS.get(impact_class, 85)

    # Static agents (ALPHA) keep fixed weight
    if is_static and impact_class == "ALPHA":
        new_weight = 95
    else:
        new_weight = floor
        for threshold, weight in THRESHOLDS:
            if score >= threshold:
                new_weight = weight
                break

    # Clamp to floor/ceiling
    new_weight = max(new_weight, floor)
    new_weight = min(new_weight, ceiling)

    current = skill.get("weight", 20)
    if new_weight != current:
        registry["skills"][agent_id]["weight"] = new_weight
        _save_registry(registry)
        logger.info("Promote: %s weight %d -> %d (score=%d)", agent_id, current, new_weight, score)


def record_activity(agent_ids: list[str]) -> dict[str, int]:
    """Batch-score multiple agents. Returns {agent_id: new_score}."""
    results = {}
    for agent_id in agent_ids:
        results[agent_id] = update_score(agent_id)
    return results


def get_leaderboard() -> list[dict]:
    """Return agents sorted by score (descending)."""
    registry = _load_registry()
    skills = registry.get("skills", {})
    board = []
    for name, data in skills.items():
        board.append({
            "agent": name,
            "score": data.get("score", 0),
            "weight": data.get("weight", 0),
            "usage_count": data.get("usage_count", 0),
            "type": data.get("type", "unknown"),
        })
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
            print_detail(f"{entry['agent']:20s} W={entry['weight']:3d} S={entry['score']:3d} U={entry['usage_count']:3d}", "OK")
    else:
        print_step("USAGE", "dynamic_orchestrator.py [--score AGENT | --leaderboard]", "INFO")

