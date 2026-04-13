"""
GSS Orion V3 — LLM Client.
Universal gateway: Ollama (local) → Cloud (Gemini/OpenAI/Claude) → SIM (offline).
"""

import logging

from core.infra.event_bus import event_bus
from core.infra.llm_utils import detect_ollama, has_cloud_keys, inject_api_keys, load_llm_config, resolve_model
from core.infra.telemetry import telemetry

# Re-export for portal compliance
_detect_ollama = detect_ollama
_has_cloud_keys = has_cloud_keys

logger = logging.getLogger(__name__)


def call_llm(
    system_prompt: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 1024,
    temperature: float = 0.3,
    role: str = "chat",
) -> dict:
    """Call LLM with automatic provider resolution."""
    config = load_llm_config()
    role_config = config.get(role, {})
    temp = role_config.get("temperature", temperature)
    tokens = role_config.get("max_tokens", max_tokens)
    resolved = resolve_model(role, model)

    inject_api_keys()

    if not has_cloud_keys() and not detect_ollama():
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
            max_tokens=tokens,
            temperature=temp,
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
        status_code = getattr(e, "status_code", "XXX")
        msg = str(e)[:150]
        logger.error("LLM call failed [%s]: %s", status_code, msg)

        event_bus.emit("LLM", "API_ERROR", "ERROR", f"Code {status_code}: {msg}")

        telemetry.track_error("llm")
        return {
            "content": f"[SIM] LLM error ({status_code}): {msg[:80]}",
            "model": "error",
            "source": "simulation",
        }


async def acall_llm(
    system_prompt: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 1024,
    temperature: float = 0.3,
    role: str = "chat",
) -> dict:
    """Async version of call_llm using litellm.acompletion."""
    config = load_llm_config()
    role_config = config.get(role, {})
    temp = role_config.get("temperature", temperature)
    tokens = role_config.get("max_tokens", max_tokens)
    resolved = resolve_model(role, model)

    inject_api_keys()

    if not has_cloud_keys() and not detect_ollama():
        telemetry.track_intelligence("simulation")
        return {
            "content": f"[SIM] No LLM available. Context: {user_message[:120]}",
            "model": "simulation",
            "source": "simulation",
        }

    try:
        from litellm import acompletion

        response = await acompletion(
            model=resolved,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=tokens,
            temperature=temp,
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
        status_code = getattr(e, "status_code", "XXX")
        msg = str(e)[:150]
        logger.error("Async LLM call failed [%s]: %s", status_code, msg)

        event_bus.emit("LLM", "API_ERROR", "ERROR", f"Code {status_code}: {msg}")

        telemetry.track_error("llm")
        return {
            "content": f"[SIM] Async LLM error ({status_code}): {msg[:80]}",
            "model": "error",
            "source": "simulation",
        }
