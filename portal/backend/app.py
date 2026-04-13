"""
GSS Orion V3 — FastAPI Application Factory.
CORS restricted to localhost only (fixes V2 wildcard vulnerability).
"""
import sys
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Bootstrap: inject project root for module resolution
_ROOT = Path(__file__).resolve().parent.parent.parent
if str(_ROOT) not in sys.path:
    sys.path.insert(0, str(_ROOT))

from core.version import get_version  # noqa: E402
from portal.backend.routers import atlas, events, graph, llm_config, orion, resources  # noqa: E402


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    application = FastAPI(
        title="GSS Orion V3 — Atlantis API",
        version=get_version(),
        description="Multi-agent orchestration API",
    )

    # CORS: localhost only (Rule R04 spirit)
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.middleware("http")
    async def log_requests(request, call_next):
        print(f"DEBUG: {request.method} {request.url.path}")
        return await call_next(request)

    application.include_router(graph.router)
    application.include_router(atlas.router)
    application.include_router(events.router)
    application.include_router(orion.router)
    application.include_router(llm_config.router)
    application.include_router(resources.router)

    @application.get("/", tags=["health"])
    async def root():
        return {"status": "ONLINE", "system": "GSS Orion V3"}

    return application


app = create_app()
