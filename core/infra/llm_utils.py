"""
GSS Orion V3 — LLM Utilities.
Helpers for configuration loading, model resolution, and provider detection.
"""

import json
import logging
import os

import httpx

from core.paths import ROOT

logger = logging.getLogger(__name__)
CONFIG_PATH = ROOT / "brain" / "llm_config.json"


def load_llm_config() -> dict:
    """Load LLM config from brain/llm_config.json."""
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def detect_ollama() -> bool:
    """Check if Ollama is running locally."""
    try:
        config = load_llm_config()
        base_url = config.get("providers", {}).get("ollama", {}).get("base_url", "http://localhost:11434")
        resp = httpx.get(f"{base_url}/api/tags", timeout=0.5)
        return resp.status_code == 200
    except Exception:
        return False


def has_cloud_keys() -> bool:
    """Check if any cloud LLM API key is available."""
    env_keys = ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "MISTRAL_API_KEY", "XAI_API_KEY"]
    if any(os.environ.get(k) for k in env_keys):
        return True
    config = load_llm_config()
    return any(prov.get("enabled") and prov.get("api_key") for prov in config.get("providers", {}).values())


def resolve_model(role: str, explicit_model: str | None) -> str:
    """Resolve model from explicit arg → config → env → default."""
    if explicit_model:
        return explicit_model
    config = load_llm_config()
    role_config = config.get(role, config.get("chat", {}))
    provider = role_config.get("provider", "ollama")
    model = role_config.get("model", "llama3.2")

    mapping = {
        "ollama": f"ollama/{model}",
        "gemini": f"gemini/{model}",
        "openai": model,
        "anthropic": model,
        "mistral": f"mistral/{model}",
        "xai": f"openai/{model}",
    }
    return mapping.get(provider, model)


def inject_api_keys() -> None:
    """Inject API keys from config into env."""
    config = load_llm_config()
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
