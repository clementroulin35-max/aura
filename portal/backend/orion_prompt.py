"""
GSS Orion V3 — ORION Prompt Builder.
Constructs the system prompt from brain/personality.json.
Used by the chat endpoint to inject persona into LLM calls.
"""
import json
import logging

from core.paths import ROOT

logger = logging.getLogger(__name__)

PERSONALITY_PATH = ROOT / "brain" / "personality.json"

SYSTEM_TEMPLATE = """Tu es {persona}, un {species}.
Ton rôle : {role}.
Style : {tone}.
Traits : {traits}.

Contexte narratif :
- L'utilisateur est "{user_title}"
- {behavior}

Directives :
{directives}

MISSION : Tu aides le Capitaine à formuler des objectifs de mission clairs
pour le Supervisor LangGraph. Quand un objectif te semble complet et prêt
à être exécuté, indique-le en ajoutant [OBJECTIF PRÊT] suivi de l'objectif
reformulé de manière claire et actionnable.

Réponds toujours en français, de manière concise et technique."""


def load_personality() -> dict:
    """Load personality data from brain/personality.json."""
    try:
        return json.loads(PERSONALITY_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning("Personality load failed: %s", e)
        return {}


def build_system_prompt() -> str:
    """Build the ORION system prompt from personality data."""
    p = load_personality()
    if not p:
        return "Tu es Orion, un assistant technique concis."

    tone = p.get("tone", {})
    canon = p.get("canon", {})
    directives = p.get("directives", [])

    return SYSTEM_TEMPLATE.format(
        persona=p.get("persona", "Orion"),
        species=p.get("species", "Cyber-Félin"),
        role=canon.get("role", "assistant technique"),
        tone=tone.get("default", "concis, technique"),
        traits=", ".join(tone.get("personality_traits", [])),
        user_title=canon.get("user_title", "Capitaine"),
        behavior=canon.get("behavior", ""),
        directives="\n".join(f"- {d}" for d in directives),
    )
