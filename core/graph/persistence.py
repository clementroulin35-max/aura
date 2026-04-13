"""
GSS Orion V4 — Persistence & Inventory Manager.
Handles skill loading, forging, and mission result persistence.
"""

import json
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


def persist_mission_results(project_id: str, teams_visited: list[str]):
    """Update projects.json with the teams and agents that participated in the mission."""
    if not project_id:
        return

    projects_file = ROOT / "brain" / "projects.json"
    if not projects_file.exists():
        return

    try:
        data = json.loads(projects_file.read_text(encoding="utf-8"))
        projects = data.get("projects", [])

        updated = False
        for p in projects:
            if p.get("id") == project_id:
                if "teams" not in p:
                    p["teams"] = []

                mission_team_id = f"team-mission-{project_id[-2:]}"
                existing_team = next((t for t in p["teams"] if t["id"] == mission_team_id), None)
                if not existing_team:
                    p["teams"].append({"id": mission_team_id, "name": "Mission Squad", "agents": teams_visited})
                else:
                    existing_team["agents"] = list(set(existing_team["agents"] + teams_visited))

                updated = True
                break

        if updated:
            projects_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
            event_bus.emit("PERSISTENCE", "ProjectUpdate", "OK", f"Updated teams for {project_id}")

    except Exception as e:
        logger.error(f"Failed to persist mission results: {e}")


def initialize_mission_environment(mission_data: dict):
    """
    Setup the mission environment immediately upon dispatch:
    1. Create directory structure.
    2. Update projects.json with the squad and its project-specific specs.
    """
    mission_id = mission_data.get("id")
    project_id = mission_data.get("project_id")
    if not mission_id or not project_id:
        return

    # 1. Directory Setup
    deliverables_dir = ROOT / "brain" / "missions" / mission_id / "deliverables"
    deliverables_dir.mkdir(parents=True, exist_ok=True)
    event_bus.emit("PERSISTENCE", "DirectorySetup", "OK", f"Ready: {mission_id}")

    # 2. projects.json Setup
    projects_file = ROOT / "brain" / "projects.json"
    if not projects_file.exists():
        return

    try:
        data = json.loads(projects_file.read_text(encoding="utf-8"))
        projects = data.get("projects", [])

        updated = False
        for p in projects:
            if p.get("id") == project_id:
                if "teams" not in p:
                    p["teams"] = []

                mission_team_id = f"team-mission-{project_id[-2:]}"
                existing_team = next((t for t in p["teams"] if t["id"] == mission_team_id), None)

                selected_agents = mission_data.get("selected_skills", [])
                # Shared specs from mission JSON
                specs = {
                    "title": mission_data.get("title"),
                    "context": mission_data.get("context"),
                    "objectives": mission_data.get("objectives"),
                    "constraints": mission_data.get("constraints"),
                    "expected_deliverables": mission_data.get("expected_deliverables"),
                }

                if not existing_team:
                    p["teams"].append(
                        {
                            "id": mission_team_id,
                            "name": "Mission Squad",
                            "agents": selected_agents,
                            "specs": {agent: specs for agent in selected_agents},
                        }
                    )
                else:
                    # Don't overwrite constitution (agents list) if it exists,
                    # but ensure new agents are added and ALL specs are updated.
                    existing_team["agents"] = list(set(existing_team["agents"] + selected_agents))
                    if "specs" not in existing_team:
                        existing_team["specs"] = {}

                    for agent in selected_agents:
                        existing_team["specs"][agent] = specs

                updated = True
                break

        if updated:
            projects_file.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
            event_bus.emit("PERSISTENCE", "EnvironmentReady", "OK", f"Project {project_id} updated with mission specs.")

    except Exception as e:
        logger.error(f"Failed to initialize mission environment: {e}")
