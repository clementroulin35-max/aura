"""
GSS Orion V3 — ORION Chat Router.
Conversational layer: User ↔ ORION (llama3.2) → objective → Supervisor.
POST /v1/orion/chat      — conversation with ORION
POST /v1/orion/interpret  — interpret Supervisor results
GET  /v1/orion/status     — LLM availability check
"""
import logging
import re

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
    suggested_objective: str | None = None
    source: str = "simulation"


class InterpretRequest(BaseModel):
    mission_result: dict
    original_objective: str


class InterpretResponse(BaseModel):
    summary: str
    source: str = "simulation"


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

    # Build context from history
    history_text = ""
    for msg in request.history[-10:]:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        prefix = "Capitaine" if role == "user" else "Orion"
        history_text += f"{prefix}: {content}\n"

    user_message = f"{history_text}Capitaine: {request.message}"

    result = call_llm(system_prompt, user_message)
    content = result.get("content", "")

    # Extract suggested objective if [OBJECTIF PRÊT] is present
    objective = None
    match = re.search(r"\[OBJECTIF PRÊT\]\s*(.+?)(?:\n|$)", content, re.DOTALL)
    if match:
        objective = match.group(1).strip()
        content = content[:match.start()].strip()

    return ChatResponse(
        response=content,
        suggested_objective=objective,
        source=result.get("source", "simulation"),
    )


@router.post("/interpret", response_model=InterpretResponse)
async def interpret_result(request: InterpretRequest):
    """Interpret Supervisor results in natural language."""
    system_prompt = build_system_prompt()

    mission = request.mission_result
    teams = mission.get("teams_visited", [])
    status = mission.get("status", "UNKNOWN")
    results = mission.get("results", [])
    iterations = mission.get("iterations", 0)

    results_summary = ""
    for r in results:
        team = r.get("team", "?")
        verdict = r.get("verdict", "N/A")
        results_summary += f"  - {team}: {verdict}\n"

    user_message = (
        f"Le Supervisor a exécuté la mission suivante :\n"
        f"Objectif : {request.original_objective}\n"
        f"Status : {status}\n"
        f"Teams visitées : {' → '.join(teams)}\n"
        f"Itérations : {iterations}\n"
        f"Résultats :\n{results_summary}\n"
        f"Résume cette mission de manière concise pour le Capitaine."
    )

    result = call_llm(system_prompt, user_message)

    return InterpretResponse(
        summary=result.get("content", "Pas de résumé disponible."),
        source=result.get("source", "simulation"),
    )
