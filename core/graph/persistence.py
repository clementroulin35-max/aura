"""
GSS Orion V3 — Skill Persistence Manager.
Handles skill loading and forging.
(Mission-related logic moved to mission_io.py for SRP compliance).
"""

import logging

import yaml

from core.infra.event_bus import event_bus
from core.paths import ROOT

logger = logging.getLogger(__name__)


def load_skills() -> dict:
    """Load all authorized skills from experts/skills/*.yaml"""
    skills = {}
    skills_dir = ROOT / "experts" / "skills"
    if not skills_dir.exists():
        return skills

    for p in skills_dir.glob("*.yaml"):
        try:
            with open(p, encoding="utf-8") as f:
                data = yaml.safe_load(f)
                if data and "id" in data:
                    skills[data["id"]] = data
        except Exception as e:
            logger.error(f"Failed to load skill {p}: {e}")
    return skills


SKILLS = load_skills()


def forge_skill(skill_id: str) -> bool:
    """Dynamically creates a missing skill YAML file."""
    skills_dir = ROOT / "experts" / "skills"
    skills_dir.mkdir(parents=True, exist_ok=True)

    skill_path = skills_dir / f"{skill_id}.yaml"
    if skill_path.exists():
        return True

    event_bus.emit("FORGE", "SkillCreation", "INFO", f"Forging new skill: {skill_id}")

    default_content = {
        "id": skill_id,
        "name": skill_id.replace("_", " ").title(),
        "role": f"Specialist in {skill_id}",
        "responsibilities": [f"Handle {skill_id} related tasks", "Provide expert feedback"],
        "constraints": ["Maintain system integrity", "Follow GSS protocols"],
        "output_format": "Markdown report",
    }

    try:
        with open(skill_path, "w", encoding="utf-8") as f:
            yaml.dump(default_content, f, sort_keys=False)
        return True
    except Exception as e:
        logger.error(f"Failed to forge skill {skill_id}: {e}")
        return False
