"""
GSS Orion V4 — ORION Chat Router.
Conversational layer: User ↔ ORION (llama3.2) → objective → Supervisor.
POST /v1/orion/chat      — conversation with ORION (outputs mission_payload)
POST /v1/orion/interpret  — interpret Supervisor results
GET  /v1/orion/status     — LLM availability check
"""
import logging
import re
import json

from fastapi import APIRouter
from pydantic import BaseModel

from core.llm import _detect_ollama, _has_cloud_keys, call_llm
from portal.backend.utils.prompt_builder import build_system_prompt

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1/orion", tags=["orion"])


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    response: str
    mission_payload: dict | None = None
    mood: str | None = None
    bubble: str | None = None
    source: str = "simulation"

class InterpretRequest(BaseModel):
    mission_result: dict
    original_objective: str

class InterpretResponse(BaseModel):
    summary: str
    mood: str | None = "neutral"
    bubble: str | None = None
    source: str = "simulation"


def strip_tags(content: str) -> tuple[str, str, str | None]:
    """Extract MOOD and BUBBLE tags and return (sanitized_content, mood, bubble)."""
    mood = "neutral"
    bubble = None
    
    # Extract MOOD (handle case-insensitive, optional spaces, and dotall)
    mood_match = re.search(r"\[MOOD\]\s*(.*?)\s*\[/MOOD\]", content, re.IGNORECASE | re.DOTALL)
    if mood_match:
        mood = mood_match.group(1).strip().lower()
        content = re.sub(r"\[MOOD\].*?\[/MOOD\]", "", content, flags=re.IGNORECASE | re.DOTALL)
        
    # Extract BUBBLE (handle case-insensitive, optional spaces, and dotall)
    bubble_match = re.search(r"\[BUBBLE\]\s*(.*?)\s*\[/BUBBLE\]", content, re.IGNORECASE | re.DOTALL)
    if bubble_match:
        bubble = bubble_match.group(1).strip()
        content = re.sub(r"\[BUBBLE\].*?\[/BUBBLE\]", "", content, flags=re.IGNORECASE | re.DOTALL)
        
    return content.strip(), mood, bubble

@router.get("/status")
async def orion_status():
    """Check if ORION LLM is available."""
    ollama = _detect_ollama()
    cloud = _has_cloud_keys()
    available = ollama or cloud
    return {
        "available": available,
        "provider": "ollama" if ollama else "cloud" if cloud else "none",
    }

@router.post("/chat", response_model=ChatResponse)
async def chat_with_orion(request: ChatRequest):
    """Conversational exchange with ORION."""
    system_prompt = build_system_prompt()

    history_text = ""
    for msg in request.history[-10:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        prefix = "Capitaine" if role == "user" else "Orion"
        history_text += f"{prefix}: {content}\n"

    user_message = f"{history_text}Capitaine: {request.message}"

    result = call_llm(system_prompt, user_message)
    content = result.get("content", "")

    # 1. Sanitize "Dash Explosion" or repetitive patterns
    content = re.sub(r"-{10,}", "----------------------", content)

    # 2. Extract MOOD and BUBBLE using helper
    content, mood, bubble = strip_tags(content)

    # 3. Extract JSON Mission with robust re.sub
    mission_payload = None
    match = re.search(r"\[MISSION_JSON\]\s*(\{.*?\})\s*\[/MISSION_JSON\]", content, re.DOTALL)
    if match:
        try:
            mission_payload = json.loads(match.group(1).strip())
            content = re.sub(r"\[MISSION_JSON\].*?\[/MISSION_JSON\]", "\n\n🚀 MISSION DRAFTED.", content, flags=re.DOTALL)
        except Exception as e:
            logger.error(f"Failed to parse MISSION_JSON: {e}")

    return ChatResponse(
        response=content,
        mission_payload=mission_payload,
        mood=mood,
        bubble=bubble,
        source=result.get("source", "simulation"),
    )


@router.post("/interpret", response_model=InterpretResponse)
async def interpret_result(request: InterpretRequest):
    """Interpret Supervisor results in natural language."""
    system_prompt = build_system_prompt()

    mission = request.mission_result
    teams = mission.get("teams_visited", [])
    status = mission.get("status", "UNKNOWN")
    results = mission.get("artifacts", [])
    iterations = mission.get("iterations", 0)

    results_summary = ""
    if results:
        for r in results:
            team = r.get("team", "?")
            verdict = r.get("verdict", "N/A")
            results_summary += f"  - {team}: {verdict}\n"
    else:
        results_summary = "  [AVIS] Aucun artefact généré ou aucune équipe mobilisée.\n"

    status_extra = ""
    if not teams:
        status_extra = "\nNote : Aucune équipe n'a été sollicitée pour cette mission."

    user_message = (
        f"L'usine à projets a terminé l'exécution :\n"
        f"Objectif initial : {request.original_objective}\n"
        f"Status : {status}\n"
        f"Agents sollicités : {' → '.join(teams) if teams else 'AUCUN'}\n"
        f"Itérations : {iterations}\n"
        f"Résultats bruts :\n{results_summary}\n"
        f"Fais une synthèse de cette exécution pour le Capitaine. {status_extra}"
    )

    result = call_llm(system_prompt, user_message)
    content = result.get("content", "Pas de résumé disponible.")
    
    # Sanitize tags in interpret summary too
    sanitized_content, mood, bubble = strip_tags(content)

    return InterpretResponse(
        summary=sanitized_content,
        mood=mood,
        bubble=bubble,
        source=result.get("source", "simulation"),
    )
