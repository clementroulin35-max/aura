import logging
import yaml
import json
import shutil
from pathlib import Path
from fastapi import APIRouter, Request, HTTPException, UploadFile, File

from core.paths import ROOT

logger = logging.getLogger(__name__)

# No prefix here, specify full paths in decorators to ensure perfect routing
router = APIRouter(tags=["resources"])

# --- Paths ---
EXPERTS_DIR = ROOT / "experts"
REGISTRY_PATH = EXPERTS_DIR / "registry.yaml"
SKILLS_DIR = EXPERTS_DIR / "skills"
PROJECTS_FILE = ROOT / "brain" / "projects.json"
MISSIONS_DIR = ROOT / "brain" / "missions"
PUBLIC_BGS_DIR = ROOT / "portal" / "frontend" / "public" / "backgrounds"

print("[!!!] RESOURCE ROUTER INITIALIZING - POWER USER RESTORATION ACTIVE")

# --- MISSION PERSISTENCE (WORKS DO NOT TOUCH) ---

@router.post("/v1/resources/save_mission")
async def save_mission(request: Request):
    """Save mission JSON for a specific project."""
    try:
        payload = await request.json()
        project_id = payload.get("project_id")
        mission_content = payload.get("mission")
        
        if not project_id:
            raise HTTPException(status_code=400, detail="Missing project_id")
            
        MISSIONS_DIR.mkdir(parents=True, exist_ok=True)
        mission_file = MISSIONS_DIR / f"{project_id}.json"
        
        with open(mission_file, "w", encoding="utf-8") as f:
            json.dump(mission_content, f, indent=2, ensure_ascii=False)
            
        return {"success": True, "message": "Mission saved", "project_id": project_id}
    except Exception as e:
        logger.error(f"Mission save error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/v1/resources/missions/{project_id}")
async def get_mission(project_id: str):
    """Load mission JSON."""
    mission_file = MISSIONS_DIR / f"{project_id}.json"
    if not mission_file.exists():
        return {"mission": None}
    try:
        return {"mission": json.loads(mission_file.read_text(encoding="utf-8"))}
    except Exception:
        return {"mission": None}

# --- AGENTS HUB (RESTORATION) ---

@router.get("/v1/resources/agents")
async def get_agents():
    """Retrieve all agents with full metadata for HUD Directory."""
    agents = []
    if not REGISTRY_PATH.exists():
        return {"agents": []}
        
    try:
        registry = yaml.safe_load(REGISTRY_PATH.read_text(encoding="utf-8")) or {}
        skills_meta = registry.get("skills", {})
        
        for agent_id, meta in skills_meta.items():
            agent_data = {
                "id": agent_id,
                "type": meta.get("type", "unknown"),
                "weight": meta.get("weight", 0),
                "description": meta.get("description", ""),
                "role": "Non spécifié",
                "responsibilities": [],
                "output_format": ""
            }
            # Enrich with skill-specific YAML if available
            skill_path = SKILLS_DIR / f"{agent_id}.yaml"
            if skill_path.exists():
                skill_spec = yaml.safe_load(skill_path.read_text(encoding="utf-8")) or {}
                agent_data["role"] = skill_spec.get("role", agent_data["role"])
                agent_data["responsibilities"] = skill_spec.get("responsibilities", agent_data.get("responsibilities", []))
                agent_data["output_format"] = skill_spec.get("output_format", "")
            
            agents.append(agent_data)
    except Exception as e:
        logger.error(f"Failed to load agents: {e}")
        
    return {"agents": agents}

# --- PROJECTS & ASSETS ---

@router.get("/v1/resources/projects")
async def get_projects():
    """Load projects list."""
    if not PROJECTS_FILE.exists():
        return {"projects": []}
    try:
        data = json.loads(PROJECTS_FILE.read_text(encoding="utf-8"))
        # Ensure it matches the frontend expectation (object with 'projects' key)
        if isinstance(data, list):
            return {"projects": data}
        return data
    except Exception:
        return {"projects": []}

@router.put("/v1/resources/projects")
async def update_projects(request: Request):
    """Save projects list."""
    try:
        payload = await request.json()
        PROJECTS_FILE.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
        return {"success": True}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to write projects.json")

@router.post("/v1/resources/upload-bg")
async def upload_background(file: UploadFile = File(...)):
    """Upload mission background."""
    try:
        PUBLIC_BGS_DIR.mkdir(parents=True, exist_ok=True)
        content = await file.read()
        target_path = PUBLIC_BGS_DIR / file.filename
        with open(target_path, "wb") as f:
            f.write(content)
        return {"success": True, "url": f"/backgrounds/{file.filename}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW: DELIVERABLE DISCOVERY & READING ---

@router.get("/v1/resources/project_deliverables/{project_id}")
async def get_project_deliverables(project_id: str):
    """Scan the project directory and return a grouped list of Markdown files."""
    # Robust folder resolution
    prj_id_clean = project_id.upper()
    if prj_id_clean.startswith("PRJ-"):
        prj_folder_name = prj_id_clean.replace("PRJ-", "")
    else:
        prj_folder_name = prj_id_clean

    project_root = ROOT / "projects" / prj_folder_name
    
    if not project_root.exists():
        return {"deliverables": {}}
        
    deliverables = {}
    try:
        # 1. Mission Subdirectories Discovery
        for mission_dir in project_root.iterdir():
            if mission_dir.is_dir():
                mission_id = mission_dir.name
                files = [f.name for f in mission_dir.glob("*.md")]
                if files:
                    deliverables[mission_id] = files
        
        # 2. Root Project Deliverables Discovery (Unbound documents)
        root_files = [f.name for f in project_root.glob("*.md")]
        if root_files:
            deliverables["ROOT"] = root_files
    except Exception as e:
        logger.error(f"Error scanning deliverables for {project_id}: {e}")
        
    return {"deliverables": deliverables}

@router.get("/v1/resources/read_project_file")
async def read_project_file(filename: str, project_id: str = None, mission_id: str = None):
    """Read content of a mission deliverable or a technical document in root."""
    try:
        if project_id and mission_id:
            # Deliverable case
            prj_folder_name = project_id.upper().replace("PRJ-", "")
            if mission_id == "ROOT":
                file_path = ROOT / "projects" / prj_folder_name / filename
            else:
                file_path = ROOT / "projects" / prj_folder_name / mission_id / filename
        else:
            # Technical doc case (root or docs folder)
            file_path = ROOT / filename
            if not file_path.exists():
                file_path = ROOT / "docs" / filename
                
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"File {filename} not found")
            
        return {"content": file_path.read_text(encoding="utf-8"), "filename": filename}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reading file {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
