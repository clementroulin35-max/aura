"""
GSS Orion V3 — LLM Configuration Router.
CRUD endpoints for LLM provider/model management.
Config persisted in brain/llm_config.json.
"""
import json
import logging

from fastapi import APIRouter
from pydantic import BaseModel

from core.paths import ROOT
from portal.backend.llm_registry import (
    MODELS,
    check_ollama_status,
    detect_ollama_models,
    get_provider_info,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/v1/llm", tags=["llm"])

CONFIG_PATH = ROOT / "brain" / "llm_config.json"


def _load_config() -> dict:
    """Load LLM config from disk."""
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save_config(config: dict) -> None:
    """Save LLM config to disk."""
    CONFIG_PATH.write_text(
        json.dumps(config, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


class ConfigUpdate(BaseModel):
    config: dict


class TestRequest(BaseModel):
    provider: str
    api_key: str = ""
    model: str = ""


@router.get("/config")
async def get_config():
    """Return current LLM configuration."""
    config = _load_config()
    # Mask API keys for security
    safe = json.loads(json.dumps(config))
    for prov in safe.get("providers", {}).values():
        key = prov.get("api_key", "")
        if key:
            prov["api_key"] = key[:4] + "●" * max(0, len(key) - 8) + key[-4:]
    return safe


@router.put("/config")
async def save_config(body: ConfigUpdate):
    """Save LLM configuration."""
    existing = _load_config()
    new_config = body.config

    # Preserve existing API keys if masked ones are sent back
    for pid, prov in new_config.get("providers", {}).items():
        key = prov.get("api_key", "")
        if "●" in key and pid in existing.get("providers", {}):
            prov["api_key"] = existing["providers"][pid].get("api_key", "")

    _save_config(new_config)
    return {"status": "saved"}


@router.get("/providers")
async def list_providers():
    """List all known providers with status."""
    providers = get_provider_info()
    config = _load_config()

    for p in providers:
        pid = p["id"]
        cfg = config.get("providers", {}).get(pid, {})
        p["enabled"] = cfg.get("enabled", False)
        p["has_key"] = bool(cfg.get("api_key", ""))
    return providers


@router.get("/models/{provider}")
async def list_models(provider: str):
    """List available models for a provider."""
    catalog = MODELS.get(provider, [])

    if provider == "ollama":
        cfg = _load_config().get("providers", {}).get("ollama", {})
        base_url = cfg.get("base_url", "http://localhost:11434")
        installed = detect_ollama_models(base_url)
        installed_ids = {m["id"] for m in installed}
        for m in catalog:
            m["installed"] = m["id"] in installed_ids
        for m in installed:
            if m["id"] not in {c["id"] for c in catalog}:
                catalog.append({**m, "type": "chat", "ctx": "—",
                                "input": 0, "output": 0, "date": "—"})
    return catalog


@router.get("/ollama/status")
async def ollama_status():
    """Check Ollama server status."""
    cfg = _load_config().get("providers", {}).get("ollama", {})
    base_url = cfg.get("base_url", "http://localhost:11434")
    status = check_ollama_status(base_url)
    models = detect_ollama_models(base_url) if status["status"] == "online" else []
    return {**status, "models": models}


@router.post("/test")
async def test_provider(body: TestRequest):
    """Test connectivity to a provider."""
    if body.provider == "ollama":
        status = check_ollama_status()
        return {"success": status["status"] == "online", "message": status["status"]}

    # For cloud providers, do a minimal API validation
    if not body.api_key:
        return {"success": False, "message": "Clé API requise"}

    # Basic key format validation
    from portal.backend.llm_registry import PROVIDERS
    prov = PROVIDERS.get(body.provider, {})
    prefix = prov.get("key_prefix", "")
    if prefix and not body.api_key.startswith(prefix):
        return {
            "success": False,
            "message": f"Format invalide — attendu: {prefix}...",
        }

    return {"success": True, "message": "Format de clé valide"}


@router.get("/pricing")
async def get_pricing():
    """Return pricing estimates for all models."""
    pricing = {}
    for provider, models in MODELS.items():
        pricing[provider] = [
            {
                "model": m["id"],
                "name": m["name"],
                "input_per_1m": m["input"],
                "output_per_1m": m["output"],
                "context": m["ctx"],
                "type": m["type"],
                "date": m["date"],
            }
            for m in models
        ]
    return {"pricing": pricing, "disclaimer": "Estimations avril 2025 — tarifs susceptibles de changer."}
