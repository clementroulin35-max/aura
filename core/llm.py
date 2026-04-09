"""
GSS Orion V3 — LLM Client.
Universal gateway: Ollama (local) → Cloud (Gemini/OpenAI/Claude) → SIM (offline).
Reads dynamic config from brain/llm_config.json.
"""

import json
import logging
import os

import httpx

from core.infra.telemetry import telemetry
from core.paths import ROOT

logger = logging.getLogger(__name__)

CONFIG_PATH = ROOT / "brain" / "llm_config.json"
DEFAULT_MODEL = "ollama/llama3.2"


def _load_llm_config() -> dict:
    """Load LLM config from brain/llm_config.json."""
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _detect_ollama() -> bool:
    """Check if Ollama is running locally."""
    try:
        config = _load_llm_config()
        base_url = config.get("providers", {}).get("ollama", {}).get("base_url", "http://localhost:11434")
        resp = httpx.get(f"{base_url}/api/tags", timeout=0.5)
        return resp.status_code == 200
    except Exception:
        return False


def _has_cloud_keys() -> bool:
    """Check if any cloud LLM API key is available (env or config)."""
    env_keys = ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "MISTRAL_API_KEY", "XAI_API_KEY"]
    if any(os.environ.get(k) for k in env_keys):
        return True

    config = _load_llm_config()
    return any(prov.get("enabled") and prov.get("api_key") for prov in config.get("providers", {}).values())


def _resolve_model(role: str, explicit_model: str | None) -> str:
    """Resolve model from explicit arg → config → env → default."""
    if explicit_model:
        return explicit_model

    config = _load_llm_config()
    role_config = config.get(role, config.get("chat", {}))
    provider = role_config.get("provider", "ollama")
    model = role_config.get("model", "llama3.2")

    if provider == "ollama":
        return f"ollama/{model}"
    if provider == "gemini":
        return f"gemini/{model}"
    if provider == "openai":
        return model
    if provider == "anthropic":
        return model
    if provider == "mistral":
        return f"mistral/{model}"
    if provider == "xai":
        return f"openai/{model}"
    return model


def _inject_api_keys() -> None:
    """Inject API keys from config into env if not already set."""
    config = _load_llm_config()
    key_map = {
        "gemini": "GEMINI_API_KEY",
        "openai": "OPENAI_API_KEY",
        "anthropic": "ANTHROPIC_API_KEY",
        "mistral": "MISTRAL_API_KEY",
        "xai": "XAI_API_KEY",
    }
    for pid, env_var in key_map.items():
        prov = config.get("providers", {}).get(pid, {})
        key = prov.get("api_key", "")
        if key and prov.get("enabled") and not os.environ.get(env_var):
            os.environ[env_var] = key


def call_llm(
    system_prompt: str,
    user_message: str,
    model: str | None = None,
    max_tokens: int = 1024,
    temperature: float = 0.3,
    role: str = "chat",
) -> dict:
    """
    Call LLM with automatic provider resolution.
    role: "chat" or "supervisor" — determines which config to use.
    Returns: {"content": str, "model": str, "source": "local"|"remote"|"simulation"}
    """
    config = _load_llm_config()
    role_config = config.get(role, {})
    temp = role_config.get("temperature", temperature)
    tokens = role_config.get("max_tokens", max_tokens)
    resolved = _resolve_model(role, model)

    _inject_api_keys()

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
        logger.error("LLM call failed: %s", e)
        telemetry.track_error("llm")
        telemetry.track_intelligence("simulation")
        return {
            "content": f"[SIM] LLM error: {str(e)[:80]}",
            "model": "error",
            "source": "simulation",
        }
