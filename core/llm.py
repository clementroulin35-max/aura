"""
GSS Orion V3 — LLM Client.
Universal gateway: Ollama (local) → Cloud (Gemini/OpenAI/Claude) → SIM (offline).

Evolutive hooks:
- model_override per task category (e.g. QUALITY uses a stronger model)
- streaming callback via on_token parameter (future)
- Custom provider registration via PROVIDERS dict
"""
import logging
import os

import httpx

from core.infra.telemetry import telemetry

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "ollama/llama3.2"


def _detect_ollama() -> bool:
    """Check if Ollama is running locally."""
    try:
        resp = httpx.get("http://localhost:11434/api/tags", timeout=0.5)
        return resp.status_code == 200
    except Exception:
        return False


def _has_cloud_keys() -> bool:
    """Check if any cloud LLM API key is available."""
    keys = ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]
    return any(os.environ.get(k) for k in keys)


def call_llm(
    system_prompt: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 1024,
    temperature: float = 0.3,
) -> dict:
    """
    Call LLM with automatic provider resolution.
    Returns: {"content": str, "model": str, "source": "local"|"remote"|"simulation"}
    """
    resolved = model or os.environ.get("GSS_LLM_MODEL", DEFAULT_MODEL)

    if not _has_cloud_keys() and not _detect_ollama():
        telemetry.track_intelligence("simulation")
        return {
            "content": f"[SIM] No LLM available. Context: {user_message[:120]}",
            "model": "simulation",
            "source": "simulation",
        }

    try:
        from litellm import completion

        response = completion(
            model=resolved,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        content = response.choices[0].message.content
        source = "local" if "ollama" in resolved else "remote"
        telemetry.track_intelligence(source)

        usage = getattr(response, "usage", None)
        if usage:
            telemetry.track_tokens(
                getattr(usage, "prompt_tokens", 0),
                getattr(usage, "completion_tokens", 0),
            )
        return {"content": content, "model": resolved, "source": source}

    except Exception as e:
        logger.error("LLM call failed: %s", e)
        telemetry.track_error("llm")
        telemetry.track_intelligence("simulation")
        return {
            "content": f"[SIM] LLM error: {str(e)[:80]}",
            "model": "error",
            "source": "simulation",
        }
