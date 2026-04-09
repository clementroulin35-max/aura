"""
GSS Orion V3 — LLM Registry.
Static catalog of known providers, models, and pricing.
Pricing estimates as of April 2025 (per 1M tokens).
"""
import logging
import urllib.request
import json

from core.paths import ROOT

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
#  Provider definitions
# ──────────────────────────────────────────────

PROVIDERS = {
    "ollama": {
        "name": "Ollama (Local)",
        "type": "local",
        "needs_key": False,
        "base_url": "http://localhost:11434",
    },
    "gemini": {
        "name": "Google Gemini",
        "type": "cloud",
        "needs_key": True,
        "env_var": "GEMINI_API_KEY",
        "key_prefix": "AIza",
    },
    "openai": {
        "name": "OpenAI",
        "type": "cloud",
        "needs_key": True,
        "env_var": "OPENAI_API_KEY",
        "key_prefix": "sk-",
    },
    "anthropic": {
        "name": "Anthropic (Claude)",
        "type": "cloud",
        "needs_key": True,
        "env_var": "ANTHROPIC_API_KEY",
        "key_prefix": "sk-ant-",
    },
    "mistral": {
        "name": "Mistral AI",
        "type": "cloud",
        "needs_key": True,
        "env_var": "MISTRAL_API_KEY",
        "key_prefix": "",
    },
    "xai": {
        "name": "xAI (Grok)",
        "type": "cloud",
        "needs_key": True,
        "env_var": "XAI_API_KEY",
        "key_prefix": "xai-",
    },
}

# ──────────────────────────────────────────────
#  Model catalog with pricing (April 2025 est.)
# ──────────────────────────────────────────────

MODELS = {
    "ollama": [
        {"id": "llama3.2:1b", "name": "Llama 3.2 1B", "params": "1B", "ctx": "128K", "type": "chat", "input": 0, "output": 0, "date": "2024-09"},
        {"id": "llama3.2", "name": "Llama 3.2 3B", "params": "3.2B", "ctx": "128K", "type": "chat", "input": 0, "output": 0, "date": "2024-09"},
        {"id": "llama3.1:8b", "name": "Llama 3.1 8B", "params": "8B", "ctx": "128K", "type": "chat", "input": 0, "output": 0, "date": "2024-07"},
        {"id": "qwen2.5:0.5b", "name": "Qwen 2.5 0.5B", "params": "0.5B", "ctx": "32K", "type": "chat", "input": 0, "output": 0, "date": "2024-09"},
        {"id": "qwen2.5:3b", "name": "Qwen 2.5 3B", "params": "3B", "ctx": "32K", "type": "chat", "input": 0, "output": 0, "date": "2024-09"},
        {"id": "codellama:7b", "name": "Code Llama 7B", "params": "7B", "ctx": "16K", "type": "code", "input": 0, "output": 0, "date": "2024-01"},
        {"id": "deepseek-coder:6.7b", "name": "DeepSeek Coder 6.7B", "params": "6.7B", "ctx": "16K", "type": "code", "input": 0, "output": 0, "date": "2024-01"},
    ],
    "gemini": [
        {"id": "gemini-2.5-flash", "name": "Gemini 2.5 Flash", "params": "—", "ctx": "1M", "type": "chat", "input": 0.15, "output": 0.60, "date": "2025-04"},
        {"id": "gemini-2.5-pro", "name": "Gemini 2.5 Pro", "params": "—", "ctx": "1M", "type": "chat", "input": 1.25, "output": 10.00, "date": "2025-03"},
        {"id": "gemini-2.0-flash", "name": "Gemini 2.0 Flash", "params": "—", "ctx": "1M", "type": "chat", "input": 0.10, "output": 0.40, "date": "2025-02"},
    ],
    "openai": [
        {"id": "gpt-4o", "name": "GPT-4o", "params": "—", "ctx": "128K", "type": "chat", "input": 2.50, "output": 10.00, "date": "2024-05"},
        {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "params": "—", "ctx": "128K", "type": "chat", "input": 0.15, "output": 0.60, "date": "2024-07"},
        {"id": "gpt-4.1", "name": "GPT-4.1", "params": "—", "ctx": "1M", "type": "chat", "input": 2.00, "output": 8.00, "date": "2025-04"},
        {"id": "gpt-4.1-mini", "name": "GPT-4.1 Mini", "params": "—", "ctx": "1M", "type": "chat", "input": 0.40, "output": 1.60, "date": "2025-04"},
        {"id": "o4-mini", "name": "o4-mini", "params": "—", "ctx": "200K", "type": "reasoning", "input": 1.10, "output": 4.40, "date": "2025-04"},
    ],
    "anthropic": [
        {"id": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4", "params": "—", "ctx": "200K", "type": "chat", "input": 3.00, "output": 15.00, "date": "2025-05"},
        {"id": "claude-3-5-haiku-20241022", "name": "Claude 3.5 Haiku", "params": "—", "ctx": "200K", "type": "chat", "input": 0.80, "output": 4.00, "date": "2024-10"},
    ],
    "mistral": [
        {"id": "mistral-large-latest", "name": "Mistral Large", "params": "—", "ctx": "128K", "type": "chat", "input": 2.00, "output": 6.00, "date": "2024-11"},
        {"id": "mistral-small-latest", "name": "Mistral Small", "params": "—", "ctx": "128K", "type": "chat", "input": 0.10, "output": 0.30, "date": "2024-09"},
        {"id": "codestral-latest", "name": "Codestral", "params": "—", "ctx": "256K", "type": "code", "input": 0.30, "output": 0.90, "date": "2024-05"},
    ],
    "xai": [
        {"id": "grok-3", "name": "Grok 3", "params": "—", "ctx": "128K", "type": "chat", "input": 3.00, "output": 15.00, "date": "2025-02"},
        {"id": "grok-3-mini", "name": "Grok 3 Mini", "params": "—", "ctx": "128K", "type": "chat", "input": 0.30, "output": 0.50, "date": "2025-02"},
    ],
}


def detect_ollama_models(base_url: str = "http://localhost:11434") -> list[dict]:
    """Detect locally installed Ollama models."""
    try:
        req = urllib.request.Request(f"{base_url}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=2) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            installed = []
            for m in data.get("models", []):
                name = m.get("name", "")
                size_gb = round(m.get("size", 0) / 1e9, 1)
                installed.append({
                    "id": name,
                    "name": name,
                    "params": f"{size_gb}GB",
                    "installed": True,
                })
            return installed
    except Exception as e:
        logger.debug("Ollama detection failed: %s", e)
        return []


def check_ollama_status(base_url: str = "http://localhost:11434") -> dict:
    """Check if Ollama server is running."""
    try:
        req = urllib.request.Request(base_url, method="GET")
        with urllib.request.urlopen(req, timeout=2):
            return {"status": "online", "url": base_url}
    except Exception:
        return {"status": "offline", "url": base_url}


def get_provider_info() -> list[dict]:
    """Return provider catalog with metadata."""
    return [
        {"id": pid, **pdata, "model_count": len(MODELS.get(pid, []))}
        for pid, pdata in PROVIDERS.items()
    ]
