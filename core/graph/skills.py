"""
GSS Orion V3 — Skill Loader.
Loads SKILL.md prompts from .agents/skills/{name}/.
Shared utility for all team nodes.
"""

from core.paths import ROOT

SKILLS_DIR = ROOT / ".agents" / "skills"


def load_skill(skill_name: str) -> str:
    """Load a SKILL.md file as agent system prompt."""
    skill_path = SKILLS_DIR / skill_name / "SKILL.md"
    if skill_path.exists():
        return skill_path.read_text(encoding="utf-8")[:2000]
    return f"You are the {skill_name} agent."
