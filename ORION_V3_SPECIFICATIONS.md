# ◈ GSS ORION V3 — CAHIER DES CHARGES COMPLET ◈
## Spécification d'Architecture, de Conception et de Développement
### Document Unique — Exécutable par un LLM sans autre contexte

**Version** : 1.0.0
**Date** : 2026-04-08
**Auteur** : Architecte Système (Audit V2 → Conception V3)
**Cible** : LLM Flash-tier (Gemini 2.0 Flash ou inférieur)
**Mode d'emploi** : Ce document est la SEULE source de vérité. Exécuter les Waves séquentiellement (§15). Chaque fichier est spécifié avec son contenu attendu. Ne pas inventer de patterns — suivre ce document.

---

## TABLE DES MATIÈRES

1. [Vision & Objectifs](#1-vision--objectifs)
2. [Principes Fondamentaux (10 Règles)](#2-principes-fondamentaux-10-règles)
3. [Stack Technique](#3-stack-technique)
4. [Arborescence Complète](#4-arborescence-complète)
5. [Module `core/` — Moteur](#5-module-core--moteur)
6. [Module `brain/` — Données Cognitives](#6-module-brain--données-cognitives)
7. [Module `experts/` — Configuration & Agents](#7-module-experts--configuration--agents)
8. [Module `ops/` — Opérations](#8-module-ops--opérations)
9. [Module `portal/` — Interface Web](#9-module-portal--interface-web)
10. [Modèle de Sécurité](#10-modèle-de-sécurité)
11. [Contrats API (Backend)](#11-contrats-api-backend)
12. [Design System Atlantis (Frontend)](#12-design-system-atlantis-frontend)
13. [Stratégie de Tests](#13-stratégie-de-tests)
14. [Pipeline CI/CD & Makefile](#14-pipeline-cicd--makefile)
15. [Waves d'Implémentation](#15-waves-dimplémentation)
16. [Anti-Patterns & Pièges à Éviter](#16-anti-patterns--pièges-à-éviter)

---

## 1. Vision & Objectifs

### 1.1 Qu'est-ce qu'Orion V3

Orion V3 est un **orchestrateur IA multi-agents local** qui coordonne des experts spécialisés via un graphe d'état LangGraph. Il tourne sur une machine Windows, utilise des LLMs locaux (Ollama) ou distants (Gemini, OpenAI, Claude), et expose un dashboard web pour piloter les missions.

### 1.2 Objectifs concrets

| # | Objectif | Critère de succès |
|:--|:---------|:------------------|
| O1 | Orchestration multi-agents fonctionnelle | `make graph TASK="..."` route vers le bon team et retourne un résultat |
| O2 | Mode SIM opérationnel sans clé API | 100% des fonctionnalités marchent en mode simulation |
| O3 | Dashboard web local | `make portal` lance backend+frontend, affiche les events en temps réel |
| O4 | Zéro secret en clair dans Git | Aucun mot de passe, token ou clé lisible dans le code source |
| O5 | Tests automatisés passent à 100% | `make test` → 0 failures |
| O6 | Documentation à jour | Architecture dans README.md correspond au code réel |

### 1.3 Ce que V3 n'est PAS

- Pas un chatbot général
- Pas un framework réutilisable
- Pas un système distribué (mono-machine)
- Pas un produit de production cloud (usage local/dev uniquement)

---

## 2. Principes Fondamentaux (10 Règles)

> [!IMPORTANT]
> Ces règles remplacent les "12 Dogmes" du V2. Elles sont concrètes et vérifiables.

| ID | Règle | Vérification |
|:---|:------|:-------------|
| **R01** | **SRP < 200 lignes** par fichier Python. Max 5 fonctions/méthodes publiques. | `ruff` + test automatique |
| **R02** | **Une seule source de version** : le fichier `VERSION`. Tout le reste le lit. | grep des versions dans le code |
| **R03** | **Zéro `except:` nu** — Toujours `except Exception as e:` + logging. | `ruff` rule E722 |
| **R04** | **Zéro secret hardcodé** — Secrets via env vars uniquement. Mock via `.env.example`. | `grep -r "password\|secret\|token" --include="*.py"` |
| **R05** | **Un seul `ROOT` centralisé** — `core/paths.py` exporte `ROOT`. Tous les modules l'importent. | grep des `Path(__file__)` |
| **R06** | **Makefile = interface CLI unique** — Compatible CMD Windows. Toute action passe par `make`. | test de chaque target |
| **R07** | **Tests obligatoires** — Chaque module `core/` a un test `ops/tests/test_<nom>.py`. | coverage > 70% |
| **R08** | **Pas de singletons** — Utiliser l'injection de dépendances ou des modules-level instances. | grep de `_instance` |
| **R09** | **Types stricts** — Type hints sur toutes les fonctions publiques. | `mypy --strict` (progressif) |
| **R10** | **Logs structurés** — `structlog` pour tout logging. Zéro `print()` en production. | grep de `print(` hors `ui.py` |

---

## 3. Stack Technique

### 3.1 Backend (Python)

| Composant | Package | Version | Justification |
|:----------|:--------|:--------|:-------------|
| Runtime | Python | ≥ 3.11 | f-strings, TypedDict, match statements |
| Orchestration | `langgraph` | ≥ 0.2 | Graphe d'état multi-agents |
| LLM Messages | `langchain-core` | ≥ 0.3 | `SystemMessage`, `HumanMessage`, `add_messages` |
| LLM Gateway | `litellm` | ≥ 1.40 | Interface universelle aux LLMs |
| YAML | `pyyaml` | ≥ 6.0 | Configs structurées |
| System Monitor | `psutil` | ≥ 5.9 | CPU/RAM monitoring |
| Templates | `jinja2` | ≥ 3.1 | Render du system prompt |
| HTTP Client | `httpx` | ≥ 0.27 | Ollama health check |
| Logging | `structlog` | ≥ 24.1 | Logs structurés JSON/console |
| API Server | `fastapi` | ≥ 0.110 | REST API + WebSocket |
| ASGI | `uvicorn` | ≥ 0.29 | Serveur ASGI |
| Linter | `ruff` | ≥ 0.4 | Lint + format (remplace flake8+black+isort) |
| Tests | `pytest` | ≥ 8.0 | Suite de tests |
| Tests async | `pytest-asyncio` | ≥ 0.23 | Tests fonctions async |
| Coverage | `pytest-cov` | ≥ 5.0 | Mesure de couverture |

### 3.2 Frontend (JavaScript)

| Composant | Package | Version |
|:----------|:--------|:--------|
| Framework | React | ^19.x |
| Bundler | Vite | ^8.x |
| Animation | framer-motion | ^12.x (**en dependencies, PAS devDependencies**) |
| CSS | Vanilla CSS (variables CSS custom) | — |
| Icons | lucide-react | ^1.x |

### 3.3 Outils NON utilisés

> [!CAUTION]
> Ne PAS installer ces outils. Ils ne font pas partie du projet :
> - **Tailwind CSS** — on utilise du CSS vanilla
> - **Redis** — pas de cache distribué en V3
> - **pybreaker** — pas de circuit breaker nécessaire en local
> - **sse-starlette** — on utilise WebSocket natif de FastAPI
> - **Docker** — pas de containerisation en V3

---

## 4. Arborescence Complète

```
orion_v3/
├── .env.example              # Variables d'environnement template (sans valeurs)
├── .gitignore                # Standard Python + Node + logs
├── Makefile                  # Interface CLI unique (§14)
├── README.md                 # Documentation synchronisée (§4.1)
├── VERSION                   # "v3.0.0\n" — SEULE source de version
├── pyproject.toml            # Dépendances Python (§3.1)
│
├── core/                     # 🧠 Moteur d'orchestration
│   ├── __init__.py           # Empty: """GSS Orion V3 — Core Engine"""
│   ├── paths.py              # ROOT unique (§5.1) ★ NOUVEAU
│   ├── version.py            # Lecture VERSION (§5.2)
│   ├── config.py             # Chargement YAML/JSON pipeliné (§5.3)
│   ├── llm.py                # Client LLM universel (§5.4)
│   ├── ui.py                 # Console CLI aéronautique (§5.5)
│   │
│   ├── graph/                # LangGraph — Cerveau
│   │   ├── __init__.py       # """LangGraph Orchestration"""
│   │   ├── state.py          # GSSState V3 TypedDict (§5.6)
│   │   ├── router.py         # Routing pondéré par regex (§5.7) ★ Renommé
│   │   ├── compiler.py       # Build + execute du StateGraph (§5.8)
│   │   └── teams/            # Team Nodes
│   │       ├── __init__.py
│   │       ├── integrity.py  # Preflight structurel (§5.9)
│   │       ├── quality.py    # SRP audit + LLM critique (§5.10)
│   │       ├── strategy.py   # Roadmap analysis (§5.11)
│   │       ├── dev.py        # Module analysis + guidance (§5.12)
│   │       └── maintenance.py# Coverage + version + memory (§5.13)
│   │
│   ├── sentinels/            # Monitoring autonome
│   │   ├── __init__.py
│   │   ├── watchdog.py       # PID singleton + sentinel monitor (§5.14)
│   │   ├── health.py         # system_health.json manager (§5.15)
│   │   ├── atlas.py          # System atlas aggregator (§5.16)
│   │   └── resources.py      # CPU/RAM monitor (§5.17)
│   │
│   ├── sync/                 # Pipeline de synchronisation
│   │   ├── __init__.py
│   │   ├── orchestrator.py   # Chef d'orchestre (§5.18)
│   │   ├── brain_layer.py    # Validation brain/*.json (§5.19)
│   │   ├── rules_layer.py    # Validation YAML (§5.20)
│   │   ├── srp_layer.py      # Scan SRP < 200L (§5.21)
│   │   └── manifest.py       # Hash-based diffing (§5.22)
│   │
│   └── infra/                # Infrastructure (ex-Nexus) ★ Renommé
│       ├── __init__.py
│       ├── event_bus.py      # Pub/Sub async + file persist (§5.23)
│       ├── telemetry.py      # Métriques in-memory (§5.24)
│       └── logging.py        # structlog configuré (§5.25)
│
├── brain/                    # 🧬 Données cognitives (JSON UNIQUEMENT)
│   ├── principles.json       # 10 règles fondamentales (§6.1)
│   ├── personality.json      # Identité Orion (§6.2)
│   ├── bridge.json           # État inter-sessions (§6.3)
│   ├── memory.json           # Apprentissages adaptatifs (§6.4)
│   └── manifest.json         # Sync hashes (§6.5)
│
├── experts/                  # 🎯 Configuration des agents
│   ├── registry.yaml         # Registre des skills (§7.1)
│   ├── rules/                # Source de vérité YAML
│   │   ├── core.yaml         # Règles fondamentales (§7.2)
│   │   ├── governance.yaml   # Audit & conformité (§7.3)
│   │   ├── routing.yaml      # Keywords de routing pondérés (§7.4) ★ NOUVEAU
│   │   └── roadmap.yaml      # Master plan (§7.5)
│   └── templates/
│       └── system_prompt.j2  # Template prompt système (§7.6)
│
├── ops/                      # ⚙️ Opérations
│   ├── __init__.py
│   ├── launcher.py           # Lanceur Backend + Frontend (§8.1)
│   ├── governance.py         # Checker de conformité (§8.2)
│   ├── crystallize.py        # Persistence de session (§8.3)
│   ├── version_bump.py       # Auto-increment patch (§8.4)
│   └── tests/                # Suite de tests
│       ├── __init__.py
│       ├── conftest.py       # Fixtures globales (§13.1)
│       ├── test_core.py      # Tests paths, version, config (§13.2)
│       ├── test_graph.py     # Tests state, router, compiler (§13.3)
│       ├── test_teams.py     # Tests des 5 team nodes (§13.4)
│       ├── test_sentinels.py # Tests watchdog, health, atlas (§13.5)
│       ├── test_sync.py      # Tests orchestrator, layers (§13.6)
│       ├── test_infra.py     # Tests event_bus, telemetry (§13.7)
│       └── test_api.py       # Tests FastAPI endpoints (§13.8)
│
├── portal/                   # 🌐 Interface Web
│   ├── backend/
│   │   ├── __init__.py
│   │   ├── app.py            # FastAPI app factory (§9.1)
│   │   ├── deps.py           # Dépendances injectées (§9.2)
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── graph.py      # POST /v1/graph/run (§11.1)
│   │       ├── atlas.py      # GET /v1/atlas/pulse (§11.2)
│   │       └── events.py     # WebSocket /ws/events (§11.3)
│   │
│   └── frontend/
│       ├── .gitignore
│       ├── package.json      # Dépendances JS (§3.2)
│       ├── vite.config.js
│       ├── index.html
│       ├── public/
│       │   ├── favicon.svg
│       │   └── assets/       # Images PNG/WebP du cockpit
│       └── src/
│           ├── main.jsx      # Point d'entrée React
│           ├── index.css     # Design system tokens (§12.1)
│           ├── App.jsx        # Layout principal (§12.2)
│           ├── App.css        # Styles du layout
│           └── components/
│               ├── Header.jsx          # Barre de navigation (§12.3)
│               ├── Header.css
│               ├── Terminal.jsx        # Console holographique (§12.4)
│               ├── Terminal.css
│               ├── PulseIndicator.jsx  # LED de santé (§12.5)
│               └── PulseIndicator.css
│
└── logs/                     # Logs (gitignored)
    ├── .gitkeep
    └── (runtime generated files)
```

### 4.1 Fichiers absents volontairement

Ces fichiers du V2 sont **supprimés** en V3 avec justification :

| Fichier V2 | Raison de suppression |
|:-----------|:---------------------|
| `core/conscience.py` | Fusionné dans `core/config.py` (get_context_snippet) |
| `core/score_manager.py` | Complexité non justifiée. Les scores sont statiques dans `registry.yaml` |
| `core/rex_manager.py` | REX simplifié : une entrée dans `brain/memory.json` suffit |
| `core/render.py` | Rendu J2 intégré dans `core/sync/orchestrator.py` |
| `core/skill_loader.py` | Le chargement est une simple lecture YAML, pas besoin d'un singleton |
| `core/nexus/vault.py` | Pas de Vault en V3 local. Secrets via env vars |
| `core/nexus/redis.py` | Pas de Redis en V3 local |
| `core/nexus/security.py` | HMAC supprimé. Pas de signature d'événements en local |
| `core/nexus/error_manager.py` | Gestion d'erreur dans chaque module via logging |
| `core/brain/expert_optimizer.py` | Score auto-promotion supprimé (complexité injustifiée) |
| `brain/adaptive_memory.py` | Code Python INTERDIT dans `brain/` (données uniquement) |
| `core/sentinels/self_healing.py` | Port-checking fragile. Le watchdog suffit |
| `core/sentinels/log_tailer.py` | Surveillait des fichiers inexistants |
| `core/sentinels/utils.py` | Logger custom remplacé par `structlog` |

---

## 5. Module `core/` — Moteur

### 5.1 `core/paths.py` — ROOT Centralisé ★

```python
"""GSS Orion V3 — Path Constants. Single source of ROOT."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
```

**Règle absolue** : AUCUN autre fichier ne doit calculer ROOT. Tous importent `from core.paths import ROOT`.

### 5.2 `core/version.py` — Lecture de version

```python
"""GSS Orion V3 — Version Reader. Reads from VERSION file only."""
from core.paths import ROOT

def get_version() -> str:
    """Read version from VERSION file. Returns 'v0.0.0' if missing."""
    version_file = ROOT / "VERSION"
    if version_file.exists():
        return version_file.read_text(encoding="utf-8").strip()
    return "v0.0.0"

def get_version_tuple() -> tuple[int, int, int]:
    """Return version as (major, minor, patch) tuple."""
    clean = get_version().lstrip("v")
    parts = clean.split(".")
    return tuple(int(p) for p in parts[:3])
```

**Max** : 20 lignes.

### 5.3 `core/config.py` — Chargement de configuration

**Responsabilité** : Charger toutes les sources de données (YAML + JSON) en un dict unifié.

```python
"""GSS Orion V3 — Configuration Loader. Sequential YAML/JSON pipeline."""
import json
import logging
import yaml
from pathlib import Path
from core.paths import ROOT

logger = logging.getLogger(__name__)

def load_yaml_dir(directory: Path) -> dict:
    """Load and deep-merge all YAML files from a directory."""
    combined: dict = {}
    if not directory.exists():
        return combined
    for yaml_file in sorted(directory.glob("*.yaml")):
        try:
            data = yaml.safe_load(yaml_file.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                combined = _deep_merge(combined, data)
        except Exception as e:
            logger.warning("Config load error %s: %s", yaml_file.name, e)
    return combined

def load_json_safe(filepath: Path) -> dict:
    """Safe JSON loader. Returns {} on error."""
    if not filepath.exists():
        return {}
    try:
        return json.loads(filepath.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning("JSON load error %s: %s", filepath.name, e)
        return {}

def load_full_config() -> dict:
    """Load complete system config: rules + brain + personality."""
    config: dict = {}
    # 1. Expert rules (YAML)
    config.update(load_yaml_dir(ROOT / "experts" / "rules"))
    # 2. Brain data
    config["principles"] = load_json_safe(ROOT / "brain" / "principles.json")
    config["personality"] = load_json_safe(ROOT / "brain" / "personality.json")
    config["bridge"] = load_json_safe(ROOT / "brain" / "bridge.json")
    # 3. Memory (last 5 active entries)
    memory = load_json_safe(ROOT / "brain" / "memory.json")
    entries = memory.get("entries", [])
    config["memory"] = {
        "active": [e for e in entries if e.get("status") == "active"][-5:],
        "total": len(entries),
    }
    return config

def _deep_merge(base: dict, overlay: dict) -> dict:
    """Recursive dict merge. Overlay wins on conflict."""
    result = base.copy()
    for key, value in overlay.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = value
    return result
```

**Max** : 65 lignes.

### 5.4 `core/llm.py` — Client LLM

**Responsabilité** : Interface unique vers les LLMs. Détection automatique d'Ollama. Fallback SIM si aucun provider.

```python
"""GSS Orion V3 — LLM Client. Universal gateway: Ollama → Cloud → SIM."""
import os
import logging
import httpx
from core.infra.telemetry import telemetry

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "ollama/llama3.2"

def _detect_ollama() -> bool:
    try:
        resp = httpx.get("http://localhost:11434/api/tags", timeout=0.5)
        return resp.status_code == 200
    except Exception:
        return False

def _is_available() -> bool:
    keys = ["GEMINI_API_KEY", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]
    return any(os.environ.get(k) for k in keys) or _detect_ollama()

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

    if not _is_available():
        return {
            "content": f"[SIM] Offline. Context: {user_message[:120]}",
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
        # Track usage
        usage = getattr(response, "usage", None)
        if usage:
            telemetry.track_tokens(
                getattr(usage, "prompt_tokens", 0),
                getattr(usage, "completion_tokens", 0),
            )
        return {"content": content, "model": resolved, "source": source}

    except Exception as e:
        logger.error("LLM call failed: %s", e)
        return {
            "content": f"[SIM] LLM error: {str(e)[:80]}",
            "model": "error",
            "source": "simulation",
        }
```

**Max** : 75 lignes. **Points critiques** :
- Pas de bare `except:`
- Import `litellm` tardif (lazy) car c'est lourd
- `telemetry` importé depuis `core.infra.telemetry`

### 5.5 `core/ui.py` — Console CLI

Identique au V2 en logique mais avec ces corrections :
- Remplacer les `except:` nus par `except Exception:`
- Max 95 lignes
- Garder les box-drawing chars aéronautiques (┌─┐│└─┘)
- Garder les ANSI colors (CYAN, GREEN, YELLOW, RED)
- `print()` autorisé UNIQUEMENT dans ce module

### 5.6 `core/graph/state.py` — GSSState V3

```python
"""GSS Orion V3 — Shared Graph State (TypedDict)."""
import operator
from typing import Annotated, Literal, TypedDict
from langgraph.graph.message import add_messages

TEAM_NAMES = Literal[
    "INTEGRITY", "QUALITY", "STRATEGY", "DEV", "MAINTENANCE", "FINISH"
]

class GSSState(TypedDict):
    """Shared state across all LangGraph nodes."""
    messages: Annotated[list, add_messages]
    task: str
    next_team: TEAM_NAMES
    current_team: str
    team_history: Annotated[list[str], operator.add]
    context: dict
    results: Annotated[list[dict], operator.add]
    iteration: int
```

**Points critiques V3 vs V2** :
- `TEAM_NAMES` extrait comme constante réutilisable
- **Pas de `expert_scores`** — supprimé (le consensus gate est supprimé aussi)
- **Pas de `consensus_score`** — la complexité n'était pas justifiée
- `results` et `team_history` utilisent `operator.add` (reducer : accumulation)
- `iteration` est un simple `int` (pas de reducer, dernier écrit gagne)

### 5.7 `core/graph/router.py` — Routing Intelligent ★ Renommé

**CHANGEMENT MAJEUR V3** : Routing par **word boundaries** au lieu de substring match.

```python
"""GSS Orion V3 — Task Router. Weighted keyword routing with word boundaries."""
import re
import logging
import yaml
from core.paths import ROOT

logger = logging.getLogger(__name__)

def _load_routing_rules() -> dict[str, dict]:
    """Load routing keywords from experts/rules/routing.yaml."""
    path = ROOT / "experts" / "rules" / "routing.yaml"
    if not path.exists():
        return _fallback_rules()
    try:
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        return data.get("teams", _fallback_rules())
    except Exception as e:
        logger.warning("Routing rules load error: %s", e)
        return _fallback_rules()

def _fallback_rules() -> dict:
    """Hardcoded fallback if YAML is missing."""
    return {
        "INTEGRITY": {"keywords": {"governance": 3, "integrity": 3, "srp": 3, "dogme": 3, "security": 3}},
        "QUALITY": {"keywords": {"audit": 3, "review": 3, "bug": 3, "fix": 2, "lint": 2, "refactor": 2}},
        "STRATEGY": {"keywords": {"plan": 3, "roadmap": 3, "milestone": 2, "strategy": 3, "phase": 2}},
        "DEV": {"keywords": {"implement": 3, "code": 2, "create": 3, "api": 3, "frontend": 3, "feature": 2}},
        "MAINTENANCE": {"keywords": {"coverage": 3, "test": 2, "document": 2, "version": 2, "deploy": 2}},
    }

# Load once at import
_RULES: dict = _load_routing_rules()

def route_task(task: str, history: list[str] | None = None) -> str:
    """
    Route a task to a team using weighted keyword matching.
    Uses word boundaries to avoid false positives (e.g. "test" won't match "latest").
    """
    task_lower = task.lower()
    visited = history or []
    scores: dict[str, int] = {}

    for team, config in _RULES.items():
        score = 0
        for keyword, weight in config.get("keywords", {}).items():
            # Word boundary matching: \b ensures whole-word match
            if re.search(rf"\b{re.escape(keyword)}\b", task_lower):
                score += weight
        # Penalize already-visited teams
        visit_count = visited.count(team)
        if visit_count > 0:
            score = max(0, score - visit_count * 8)
        if score > 0:
            scores[team] = score

    if not scores:
        return "STRATEGY"  # Default fallback

    return max(scores, key=scores.get)
```

**Max** : 65 lignes. **Changements vs V2** :
- `re.search(r"\b{kw}\b", ...)` au lieu de `kw in task_lower`
- Fichier renommé `router.py` (pas `supervisor.py` — le supervisor est le node, le routing est la logique)
- Routing rules dans `experts/rules/routing.yaml` (source de vérité externe)
- Pas de Consensus Gate (supprimé : trop fragile)

### 5.8 `core/graph/compiler.py` — Build & Execute

**Responsabilité** : Construire le StateGraph et exécuter une tâche.

Structure attendue (max 120 lignes) :

1. `build_graph() -> CompiledStateGraph` — Construit le graphe (START → supervisor → teams → supervisor → FINISH)
2. `execute_graph(task: str, verbose: bool = False) -> dict` — Exécute la tâche et retourne l'état final
3. `if __name__ == "__main__":` — CLI avec `--task` et `--test`

**Le nœud Supervisor** est défini DANS `compiler.py` ou dans un fichier séparé `supervisor.py` mais avec une logique simple :

```python
def supervisor_node(state: dict) -> dict:
    """Supervisor: route task to appropriate team."""
    iteration = state.get("iteration", 0)
    history = state.get("team_history", [])
    task = state.get("task", "")
    max_iterations = 5

    if iteration >= max_iterations:
        return {"next_team": "FINISH", "iteration": iteration + 1,
                "messages": [SystemMessage(content="[SUPERVISOR] Max iterations reached.")]}

    # First pass: always INTEGRITY
    if iteration == 0:
        team = "INTEGRITY"
    else:
        team = route_task(task, history)
        # If already visited and no more to visit, finish
        if team in history and iteration > 2:
            return {"next_team": "FINISH", "iteration": iteration + 1,
                    "messages": [SystemMessage(content="[SUPERVISOR] Mission complete.")]}

    return {
        "next_team": team,
        "current_team": team,
        "iteration": iteration + 1,
        "team_history": [team],  # Uses operator.add reducer
        "messages": [SystemMessage(content=f"[SUPERVISOR] → {team} (iter {iteration})")],
    }
```

### 5.9-5.13 Teams — Spécifications par team

Chaque team node suit ce pattern :

```python
def <team>_node(state: dict) -> dict:
    """<TEAM> team — <description>."""
    task = state.get("task", "")
    # ... logique réelle (scan fichiers / appel LLM) ...
    result = {"team": "<TEAM>", "stages": [...], "verdict": "..."}
    return {
        "results": [result],  # List car operator.add
        "messages": [SystemMessage(content=f"[<TEAM>] <résumé>")],
    }
```

| Team | Fichier | Logique réelle | Appel LLM | Max lignes |
|:-----|:--------|:--------------|:-----------|:-----------|
| INTEGRITY | `integrity.py` | Vérifie: VERSION exists, principles.json valid (10 rules), YAML parsable | Non | 80 |
| QUALITY | `quality.py` | Scan SRP (fichiers > 200L), compte violations | Oui (critique + suggestions) | 90 |
| STRATEGY | `strategy.py` | Lit `roadmap.yaml`, calcule % avancement | Oui (planning) | 100 |
| DEV | `dev.py` | Compte modules par package, analyse structure | Oui (guidance) | 75 |
| MAINTENANCE | `maintenance.py` | Coverage analyse (test files vs core modules), version check, memory health | Non | 85 |

**Règle critique** : Chaque team retourne `"results": [<un_dict>]` (liste avec UN élément). Jamais l'accumulateur entier.

### 5.14-5.17 Sentinelles

| Sentinelle | Rôle | Boucle | Intervalle |
|:-----------|:-----|:-------|:-----------|
| `watchdog.py` | PID singleton + relance atlas/resources s'ils meurent | `asyncio.run(loop)` | 15s |
| `health.py` | R/W `logs/system_health.json` | Pas de boucle (appelé par d'autres) | — |
| `atlas.py` | Agrège l'état système dans `logs/system_atlas.json` | `while True` + `time.sleep()` | 30s |
| `resources.py` | Monitor CPU/RAM, lève des flags dans health | `while True` + `time.sleep()` | 15s |

**Correction V3 du watchdog** :
- Le watchdog BIND réellement le port 21230 (TCP listener) pour le singleton check
- Pas de `sys.exit(0)` dans le constructeur — lever une exception `WatchdogAlreadyRunning` à la place

### 5.18-5.22 Sync Pipeline

| Fichier | Responsabilité | Max lignes |
|:--------|:---------------|:-----------|
| `orchestrator.py` | Séquence: brain_layer → rules_layer → srp_layer. Affiche dashboard | 65 |
| `brain_layer.py` | Valide que chaque `brain/*.json` est parsable | 35 |
| `rules_layer.py` | Valide que chaque `experts/rules/*.yaml` est parsable | 35 |
| `srp_layer.py` | Scan tous les `.py` hors venv/__pycache__, vérifie < 200 lignes | 40 |
| `manifest.py` | Read/write `brain/manifest.json` avec SHA-256 partial hashes | 30 |

### 5.23-5.25 Infrastructure

#### `core/infra/event_bus.py`

```python
"""GSS Orion V3 — Event Bus. Thread-safe JSONL writer + WebSocket broadcast."""
import json
import logging
import queue
import threading
from datetime import datetime
from pathlib import Path
from core.paths import ROOT

logger = logging.getLogger(__name__)

class EventBus:
    """Singleton-free event bus. Instantiate once in app startup."""

    def __init__(self, log_path: Path | None = None, max_queue_size: int = 1000):
        self.log_path = log_path or (ROOT / "logs" / "events.jsonl")
        self.log_path.parent.mkdir(parents=True, exist_ok=True)
        self._queue: queue.Queue = queue.Queue(maxsize=max_queue_size)
        self._ws_connections: set = set()
        self._start_writer()

    def _start_writer(self):
        def writer():
            while True:
                item = self._queue.get()
                if item is None:
                    break
                try:
                    with open(self.log_path, "a", encoding="utf-8") as f:
                        f.write(json.dumps(item, ensure_ascii=False) + "\n")
                    # Rotation: keep file under 5MB
                    if self.log_path.stat().st_size > 5 * 1024 * 1024:
                        self._rotate()
                except Exception as e:
                    logger.error("EventBus write error: %s", e)
                self._queue.task_done()
        t = threading.Thread(target=writer, daemon=True, name="eventbus-writer")
        t.start()

    def emit(self, actor: str, event: str, status: str = "OK", context: str = "") -> dict:
        payload = {
            "timestamp": datetime.now().isoformat(),
            "actor": actor,
            "event": event,
            "status": status,
            "context": context,
        }
        try:
            self._queue.put_nowait(payload)
        except queue.Full:
            logger.warning("EventBus queue full. Dropping event.")
        return payload

    def shutdown(self):
        self._queue.put(None)

    def _rotate(self):
        """Keep last 2000 lines when file exceeds size limit."""
        try:
            lines = self.log_path.read_text(encoding="utf-8").strip().split("\n")
            self.log_path.write_text("\n".join(lines[-2000:]) + "\n", encoding="utf-8")
        except Exception as e:
            logger.error("EventBus rotation error: %s", e)

# Module-level instance (not a singleton pattern, just a module global)
event_bus = EventBus()
```

**Points V3** :
- `maxsize=1000` sur la queue (pas de croissance infinie)
- `_rotate()` automatique quand le fichier dépasse 5 MB
- Méthode `shutdown()` pour envoyer le sentinel None
- Pas de Redis (supprimé)
- Pas de HMAC signature (supprimé)

#### `core/infra/telemetry.py`

Simple compteur in-memory (max 60 lignes). Tracks : tokens (prompt/completion), errors par actor, intelligence source (local/remote/sim).

#### `core/infra/logging.py`

Configure `structlog` avec :
- Console renderer (coloré si TTY)
- File handler avec `RotatingFileHandler` (10 MB max, 3 backups)
- Pillar mapping: fichier de log basé sur le nom du module

Max 70 lignes. Le root logger est configuré UNE SEULE FOIS au démarrage de l'app, pas à chaque import.

---

## 6. Module `brain/` — Données Cognitives

> [!CAUTION]
> `brain/` contient UNIQUEMENT des fichiers JSON. ZÉRO fichier Python. C'est un répertoire de données.

### 6.1 `brain/principles.json`

```json
{
  "meta": {"version": "3.0.0", "origin": "GSS Orion V3"},
  "rules": [
    {"id": "R01", "name": "SRP_200", "rule": "Max 200 lignes par fichier, 5 fonctions publiques max."},
    {"id": "R02", "name": "SINGLE_VERSION", "rule": "VERSION file est la seule source de version."},
    {"id": "R03", "name": "NO_BARE_EXCEPT", "rule": "Toujours except Exception as e: + logging."},
    {"id": "R04", "name": "NO_HARDCODED_SECRETS", "rule": "Secrets via env vars uniquement."},
    {"id": "R05", "name": "SINGLE_ROOT", "rule": "core/paths.py exporte ROOT. Tous l'importent."},
    {"id": "R06", "name": "MAKEFILE_CLI", "rule": "Makefile est l'interface CLI unique."},
    {"id": "R07", "name": "TESTS_MANDATORY", "rule": "Chaque module core/ a un test correspondant."},
    {"id": "R08", "name": "NO_SINGLETONS", "rule": "Module-level instances, pas de pattern __new__ singleton."},
    {"id": "R09", "name": "TYPE_HINTS", "rule": "Type hints sur toutes les fonctions publiques."},
    {"id": "R10", "name": "STRUCTURED_LOGS", "rule": "structlog pour tout. Zéro print() hors ui.py."}
  ]
}
```

### 6.2 `brain/personality.json`

```json
{
  "persona": "Orion",
  "species": "Cyber-Félin",
  "tone": "concis, technique, chirurgical",
  "traits": ["analytique", "kaizen-driven", "zero-bullshit"],
  "directives": ["No-Filler", "Tables-Over-Prose", "Act-Dont-Explain"]
}
```

### 6.3 `brain/bridge.json`

```json
{
  "version": "v3.0.0",
  "last_session": "2026-04-08T22:00:00",
  "pulse": "NOMINAL",
  "health": {"build": "SUCCESS", "sentinels": "ACTIVE"},
  "last_task": "",
  "active_rex": []
}
```

### 6.4 `brain/memory.json`

```json
{
  "stats": {"total_entries": 0, "compactions": 0},
  "entries": []
}
```

Schema d'une entry :
```json
{
  "id": "REX-001",
  "timestamp": "ISO-8601",
  "category": "pattern|error|insight",
  "learning": "Description courte",
  "status": "active|archived"
}
```

### 6.5 `brain/manifest.json`

```json
{
  "hashes": {},
  "last_sync": 0
}
```

---

## 7. Module `experts/` — Configuration

### 7.1 `experts/registry.yaml`

```yaml
skills:
  core:
    type: static
    weight: 30
    description: "Constitution, triangle de gouvernance."
  governance:
    type: static
    weight: 30
    description: "Audit de conformité, REX."
  critik:
    type: dynamic
    weight: 40
    description: "Évaluation d'impact architecture."
  corrector:
    type: dynamic
    weight: 40
    description: "Implémentation corrective."
  qualifier:
    type: dynamic
    weight: 40
    description: "Validation post-correction."
  captain:
    type: static
    weight: 60
    description: "Supervision stratégique, roadmap."
  brainstorming:
    type: dynamic
    weight: 40
    description: "Analyse exploratoire."
  tester:
    type: dynamic
    weight: 40
    description: "TDD, couverture."
  task:
    type: dynamic
    weight: 40
    description: "Synchronisation roadmap."
  design:
    type: static
    weight: 30
    description: "Design system Atlantis."
  backend_dev:
    type: static
    weight: 30
    description: "FastAPI, Python, API."
  frontend_dev:
    type: static
    weight: 30
    description: "React, Vite, CSS."
```

**Changement V3** : Champ unique `weight` (pas `weight_init`/`weight_set`). Pas de `score`, `usage_count`, `impact_class` — complexité supprimée.

### 7.4 `experts/rules/routing.yaml` ★ NOUVEAU

```yaml
# Routing keywords for the Supervisor. Source of truth for task→team mapping.
# Each keyword uses word-boundary matching (regex \b).
teams:
  INTEGRITY:
    keywords:
      governance: 3
      integrity: 3
      constitution: 3
      srp: 3
      dogme: 3
      security: 3
      vault: 2
      compliance: 2
  QUALITY:
    keywords:
      audit: 3
      review: 3
      quality: 3
      bug: 3
      fix: 2
      lint: 2
      refactor: 2
      rex: 2
  STRATEGY:
    keywords:
      plan: 3
      roadmap: 3
      blueprint: 3
      milestone: 2
      strategy: 3
      phase: 2
      captain: 3
  DEV:
    keywords:
      implement: 3
      code: 2
      create: 3
      api: 3
      frontend: 3
      backend: 3
      component: 2
      feature: 2
  MAINTENANCE:
    keywords:
      coverage: 3
      test: 2
      document: 2
      maintenance: 3
      version: 2
      release: 2
      deploy: 2
```

### 7.5 `experts/rules/roadmap.yaml`

```yaml
roadmap:
  mission: "Orion V3 — Clean architecture, real intelligence."
  milestones:
    - id: W1
      name: FOUNDATION
      goal: "Arborescence, config, brain, registry."
      status: TODO
    - id: W2
      name: LANGGRAPH
      goal: "State, Router, Compiler, 5 Teams."
      status: TODO
    - id: W3
      name: SENTINELS
      goal: "Watchdog, Health, Atlas, Resources."
      status: TODO
    - id: W4
      name: SYNC
      goal: "Sync pipeline avec layers SRP."
      status: TODO
    - id: W5
      name: PORTAL
      goal: "Backend FastAPI + Frontend React Atlantis."
      status: TODO
    - id: W6
      name: POLISH
      goal: "Tests 100%, CI, documentation finale."
      status: TODO
  last_validation: "2026-04-08"
```

### 7.6 `experts/templates/system_prompt.j2`

```jinja2
[ORION V3][v:{{ version }}][PULSE:{{ bridge.pulse }}]
ROLE: Orchestrateur IA multi-agents. Routing: INTEGRITY→QUALITY→STRATEGY→DEV→MAINTENANCE.
{% for r in principles.rules -%}
[{{ r.id }}] {{ r.name }}: {{ r.rule }}
{% endfor -%}
PERSONALITY: {{ personality.tone }}. Traits: {{ personality.traits | join(', ') }}.
{% if memory.active -%}
MEMORY (last {{ memory.active | length }}):
{% for e in memory.active -%}
- [{{ e.category }}] {{ e.learning }}
{% endfor -%}
{% endif -%}
SKILLS: {% for id, s in skills.items() %}{{ id }}(w:{{ s.weight }}) {% endfor %}
```

**Changements V3** : 
- Variables correspondent aux clés réelles du config dict
- Pas de compression "Nitro" (elle ne faisait rien)
- Pas de HMAC/signatures
- Lisible par un humain

---

## 8. Module `ops/` — Opérations

### 8.1 `ops/launcher.py`

Lance Backend (uvicorn port 8000) et Frontend (vite port 5173) en parallèle.
- Max 110 lignes
- Tue les process sur les ports avant de démarrer
- Démarre les sentinelles via subprocess
- Boucle d'attente puis affiche les URLs

### 8.2 `ops/governance.py`

Vérifie les règles R01-R10 automatiquement :
- R01: Scan SRP < 200 lignes
- R02: Un seul fichier VERSION
- R04: grep de patterns de secrets hardcodés
- R06: Makefile existe
- Retourne `True` si tout passe

Max 70 lignes.

### 8.3 `ops/crystallize.py`

- Rafraîchit `brain/bridge.json` (version, timestamp, pulse)
- Écrit `logs/system_atlas.json` via AtlasSentinel.collect()
- Max 50 lignes

### 8.4 `ops/version_bump.py`

- Lit `VERSION`, incrémente le patch, écrit
- Max 20 lignes
- NE touche PAS `pyproject.toml` ni `__init__.py`

---

## 9. Module `portal/` — Interface Web

### 9.1 `portal/backend/app.py`

```python
"""GSS Orion V3 — FastAPI Application Factory."""
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Path injection
ROOT = Path(__file__).resolve().parent.parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from portal.backend.routers import graph, atlas, events

def create_app() -> FastAPI:
    app = FastAPI(
        title="GSS Orion V3 — Atlantis API",
        version="3.0.0",
    )
    # CORS: localhost only for dev
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(graph.router)
    app.include_router(atlas.router)
    app.include_router(events.router)

    @app.get("/")
    async def root():
        return {"status": "ONLINE", "system": "GSS Orion V3"}

    return app

app = create_app()
```

**Changement V3** : CORS restreint à localhost (pas `*`).

### 9.2 `portal/backend/deps.py`

```python
"""Shared dependencies for FastAPI routes."""
from core.paths import ROOT
from core.infra.event_bus import event_bus
# Re-export pour injection
```

---

## 10. Modèle de Sécurité

| Vecteur | V2 (Problème) | V3 (Correction) |
|:--------|:--------------|:-----------------|
| Secrets | Hardcodé dans `security.py` | **Env vars uniquement**. `.env.example` sans valeurs |
| Mock secrets | Fichier YAML tracké dans Git | **Supprimé**. Utiliser `.env.example` |
| CORS | `allow_origins=["*"]` | `allow_origins=["http://localhost:5173"]` |
| Exceptions | 15+ bare `except:` | **Zéro**. Toujours `except Exception as e:` |
| Git push | `--force-with-lease` sur master | `make build` commit sur `main` sans force push |
| HMAC | Secret statique en clair | **Supprimé** (pas nécessaire en local) |
| Signatures | EventBus avec signature optionnelle | **Supprimé** (complexité sans valeur en local) |

### `.env.example`

```env
# GSS Orion V3 — Environment Variables
# Copy to .env and fill in your values

# LLM Provider (optional — system works in SIM mode without keys)
# GEMINI_API_KEY=
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=

# Model override (default: ollama/llama3.2)
# GSS_LLM_MODEL=gemini/gemini-2.0-flash

# Ollama (detected automatically if running on localhost:11434)
# OLLAMA_HOST=http://localhost:11434
```

---

## 11. Contrats API (Backend)

### 11.1 `POST /v1/graph/run`

**Request:**
```json
{"task": "Audit the system architecture"}
```

**Response:**
```json
{
  "task": "Audit the system architecture",
  "status": "COMPLETED",
  "teams_visited": ["INTEGRITY", "QUALITY"],
  "iterations": 3,
  "results": [{...}, {...}]
}
```

### 11.2 `GET /v1/atlas/pulse`

**Response:**
```json
{
  "status": "NOMINAL",
  "version": "v3.0.0",
  "health": {"status": "OK", "pulse": "NOMINAL"},
  "atlas": {"modules": {"core": 15, "brain": 0, "experts": 0, "ops": 5}}
}
```

### 11.3 `WebSocket /ws/events`

Connection → server sends JSON events as they come from EventBus:
```json
{"timestamp": "...", "actor": "QUALITY", "event": "MissionStarted", "status": "OK", "context": "..."}
```

Server sends heartbeat every 15s:
```json
{"actor": "GATEWAY", "event": "HEARTBEAT", "status": "NOMINAL"}
```

---

## 12. Design System Atlantis (Frontend)

### 12.1 Tokens CSS (`index.css`)

```css
:root {
  --bg-pure: #000000;
  --bg-panel: #0a0a0a;
  --bg-glass: rgba(10, 10, 15, 0.7);
  --accent-yellow: #FFFB00;
  --accent-red: #FF3333;
  --text-primary: #FFFFFF;
  --text-dim: rgba(255, 255, 255, 0.4);
  --text-ghost: rgba(255, 255, 255, 0.15);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-active: rgba(255, 255, 255, 0.2);
  --font-display: 'Cinzel', serif;
  --font-body: 'Outfit', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --radius-sm: 4px;
  --radius-md: 8px;
  --shadow-deep: 0 20px 60px rgba(0, 0, 0, 0.9);
  --transition-smooth: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 12.2 Layout `App.jsx`

Structure en 3 couches Z-index :
1. **Z0** : Background landscape image (`/assets/landscape.png`)
2. **Z100** : Cockpit shell avec mask radial-gradient (hublot elliptique)
3. **Z200** : Terminal + Props interactifs (mascot, brain, button)

### 12.3 Composants

| Composant | Rôle | Props |
|:----------|:-----|:------|
| `Header` | Barre top fixe 48px. Logo ATLANTIS NEXUS + nav + pulse LED | `pulse: {status: string}` |
| `Terminal` | Console holographique avec tabs LOGS/CHAT + input | `events, history, loading, onSubmit` |
| `PulseIndicator` | Dot LED 10px. Jaune si NOMINAL, rouge sinon, glow animé | `status: string` |

### 12.4 Règles d'assets (images)

- Format : PNG (fond noir pour mix-blend-mode: screen)
- Stockage : `portal/frontend/public/assets/`
- **Pas de CDN externe** — Le SVG de bruit atmosphérique doit être local (inline SVG ou fichier local)
- Les images V2 sont réutilisables si copiées depuis l'archive `orion_v2/portal/frontend/public/assets/`

---

## 13. Stratégie de Tests

### 13.1 `conftest.py`

```python
"""Pytest global config for GSS Orion V3."""
import sys
from pathlib import Path
from unittest.mock import patch
import pytest

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT))

@pytest.fixture(autouse=True)
def mock_llm():
    """Prevent real LLM calls in tests."""
    with patch("core.llm.call_llm") as mock:
        mock.return_value = {
            "content": "[TEST] Mock response.",
            "model": "test-mock",
            "source": "simulation",
        }
        yield mock

@pytest.fixture
def tmp_project(tmp_path):
    """Create a minimal project structure for testing."""
    (tmp_path / "VERSION").write_text("v3.0.0\n")
    (tmp_path / "brain").mkdir()
    (tmp_path / "brain" / "principles.json").write_text('{"rules": []}')
    (tmp_path / "brain" / "bridge.json").write_text('{"version": "v3.0.0", "pulse": "NOMINAL"}')
    (tmp_path / "brain" / "memory.json").write_text('{"entries": [], "stats": {}}')
    (tmp_path / "experts").mkdir()
    (tmp_path / "experts" / "rules").mkdir()
    (tmp_path / "experts" / "registry.yaml").write_text("skills: {}")
    (tmp_path / "logs").mkdir()
    return tmp_path
```

### 13.2-13.8 Tests par module

| Fichier test | Module testé | Tests minimum |
|:-------------|:-------------|:-------------|
| `test_core.py` | `paths.py`, `version.py`, `config.py` | ROOT exists, get_version reads file, config loads YAML+JSON |
| `test_graph.py` | `state.py`, `router.py`, `compiler.py` | GSSState has all keys, router matches keywords with word boundary, compiler builds graph |
| `test_teams.py` | `integrity.py`, `quality.py`, etc. | Each team returns {"results": [<one_dict>], "messages": [...]} |
| `test_sentinels.py` | `health.py`, `atlas.py` | Health writes/reads JSON, Atlas collects snapshot |
| `test_sync.py` | `orchestrator.py`, layers | Sync returns list of results, each with status OK/FAIL |
| `test_infra.py` | `event_bus.py`, `telemetry.py` | EventBus writes JSONL, Telemetry tracks tokens |
| `test_api.py` | FastAPI endpoints | GET / returns 200, POST /v1/graph/run returns valid response |

---

## 14. Pipeline CI/CD & Makefile

### 14.1 Makefile V3

```makefile
# ═══════════════════════════════════════════════════
# GSS ORION V3 — Makefile
# ═══════════════════════════════════════════════════

PYTHON = set PYTHONUTF8=1&& .\venv\Scripts\python.exe
VERSION := $(shell type VERSION 2>NUL || echo v0.0.0)

.PHONY: help install test lint sync audit boot build portal graph sentinels-start sentinels-stop status

help: ## Show available commands
	@echo.
	@echo   GSS ORION V3 — Commands
	@echo   ════════════════════════
	@echo   make install         — Install dependencies (pip + npm)
	@echo   make test            — Run test suite
	@echo   make lint            — Run ruff linter
	@echo   make sync            — Run sync pipeline
	@echo   make audit           — Governance compliance check
	@echo   make boot            — Preflight: tests + audit + sentinels
	@echo   make build           — Atomic: test + sync + bump + commit
	@echo   make portal          — Launch Atlantis Dashboard
	@echo   make graph TASK=...  — Run LangGraph orchestrator
	@echo.

install: ## Install all dependencies
	@if not exist venv python -m venv venv
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -e ".[dev]"
	cd portal\frontend && npm install

test: ## Run pytest suite
	$(PYTHON) -m pytest ops/tests/ -v --tb=short --cov=core --cov-report=term-missing

lint: ## Run ruff linter
	$(PYTHON) -m ruff check core/ ops/ portal/backend/ --fix
	$(PYTHON) -m ruff format core/ ops/ portal/backend/

sync: ## Run synchronization pipeline
	$(PYTHON) -m core.sync.orchestrator

audit: ## Governance compliance check
	$(PYTHON) -m ops.governance

boot: test audit sentinels-start ## Preflight sequence
	@echo   BOOT COMPLETE — $(VERSION)

build: test sync ## Atomic build pipeline
	$(PYTHON) -m ops.governance
	$(PYTHON) -m ops.version_bump
	$(PYTHON) -m ops.crystallize
	git add .
	git commit -m "build: Orion V3 $(VERSION)" || echo Nothing to commit
	@echo   BUILD COMPLETE — $(VERSION)

portal: ## Launch Atlantis Dashboard
	$(PYTHON) ops/launcher.py

graph: ## Run LangGraph orchestrator
	$(PYTHON) -m core.graph.compiler --task "$(TASK)"

sentinels-start: ## Start sentinel processes
	$(PYTHON) -c "from ops.launcher import start_sentinels; start_sentinels()"

sentinels-stop: ## Stop sentinel processes
	$(PYTHON) -c "from ops.launcher import stop_sentinels; stop_sentinels()"

status: ## Show system status
	$(PYTHON) -c "from core.version import get_version; print(f'  Version: {get_version()}')"
	$(PYTHON) -c "import json; d=json.load(open('brain/bridge.json')); print(f'  Pulse: {d.get(\"pulse\", \"?\")}')"
```

### 14.2 `pyproject.toml`

```toml
[build-system]
requires = ["setuptools>=68.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "orion-v3"
dynamic = ["version"]
description = "GSS Orion V3 — Adaptive IA Orchestration Engine"
requires-python = ">=3.11"
license = {text = "Proprietary"}

dependencies = [
    "langgraph>=0.2.0",
    "langchain-core>=0.3.0",
    "pyyaml>=6.0",
    "psutil>=5.9",
    "litellm>=1.40.0",
    "jinja2>=3.1",
    "httpx>=0.27.0",
    "structlog>=24.1.0",
    "fastapi>=0.110.0",
    "uvicorn>=0.29.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "pytest-asyncio>=0.23",
    "ruff>=0.4",
]

[tool.setuptools.dynamic]
version = {file = "VERSION"}

[tool.pytest.ini_options]
testpaths = ["ops/tests"]
python_files = "test_*.py"
addopts = "-v --tb=short"

[tool.ruff]
line-length = 120
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "W", "I", "N", "UP", "B", "SIM"]
# E722 = bare except — auto-flagged

[tool.setuptools.packages.find]
include = ["core*", "brain*", "experts*", "ops*", "portal*"]
```

**Changement V3** : 
- Version lue dynamiquement depuis `VERSION` (line `dynamic = ["version"]`)
- `ruff` dans les dev deps
- `portal*` inclus dans packages.find
- Pas de `redis`, `pybreaker`, `sse-starlette`

---

## 15. Waves d'Implémentation

> [!IMPORTANT]
> Exécuter dans l'ordre. Chaque Wave se termine par des tests verts.

### Wave 1 — Foundation (Fichiers de base)

**Objectif** : `python -m pytest ops/tests/test_core.py` passe.

| # | Action | Fichier |
|:--|:-------|:--------|
| 1 | Créer `VERSION` avec contenu `v3.0.0\n` | `VERSION` |
| 2 | Créer `.gitignore` (std Python + Node + logs + .env) | `.gitignore` |
| 3 | Créer `.env.example` (tous les champs commentés) | `.env.example` |
| 4 | Créer `pyproject.toml` (exactement §14.2) | `pyproject.toml` |
| 5 | Créer `Makefile` (exactement §14.1) | `Makefile` |
| 6 | Créer `core/__init__.py` | `"""GSS Orion V3 — Core"""` |
| 7 | **Créer `core/paths.py`** (§5.1) | Le ROOT unique |
| 8 | Créer `core/version.py` (§5.2) | get_version() |
| 9 | Créer `core/config.py` (§5.3) | load_full_config() |
| 10 | Créer `core/ui.py` (§5.5) | Console aéronautique |
| 11 | Créer tous les JSON de `brain/` (§6.1-6.5) | Données initiales |
| 12 | Créer `experts/registry.yaml` (§7.1) | Registre des skills |
| 13 | Créer `experts/rules/core.yaml` (règles basiques) | Core rules |
| 14 | Créer `experts/rules/governance.yaml` | Governance rules |
| 15 | Créer `experts/rules/routing.yaml` (§7.4) | Routing keywords |
| 16 | Créer `experts/rules/roadmap.yaml` (§7.5) | Master plan |
| 17 | Créer `ops/__init__.py` + `ops/tests/__init__.py` | Packages |
| 18 | Créer `ops/tests/conftest.py` (§13.1) | Fixtures |
| 19 | Créer `ops/tests/test_core.py` (§13.2) | Tests fondation |
| 20 | Créer `README.md` | Documentation V3 synchronisée |
| 21 | **`make install && make test`** → devrait passer | Validation |

### Wave 2 — LangGraph Intelligence

**Objectif** : `python -m pytest ops/tests/test_graph.py ops/tests/test_teams.py` passe.

| # | Action | Fichier |
|:--|:-------|:--------|
| 1 | Créer `core/graph/__init__.py` | Package |
| 2 | Créer `core/graph/state.py` (§5.6) | GSSState TypedDict |
| 3 | Créer `core/graph/router.py` (§5.7) | Routing par regex word boundaries |
| 4 | Créer `core/infra/__init__.py` | Package |
| 5 | Créer `core/infra/logging.py` (§5.25) | structlog config |
| 6 | Créer `core/infra/telemetry.py` (§5.24) | Métriques |
| 7 | Créer `core/infra/event_bus.py` (§5.23) | Event Bus |
| 8 | Créer `core/llm.py` (§5.4) | Client LLM |
| 9 | Créer `core/graph/teams/__init__.py` | Package |
| 10 | Créer `core/graph/teams/integrity.py` (§5.9) | Team INTEGRITY |
| 11 | Créer `core/graph/teams/quality.py` (§5.10) | Team QUALITY |
| 12 | Créer `core/graph/teams/strategy.py` (§5.11) | Team STRATEGY |
| 13 | Créer `core/graph/teams/dev.py` (§5.12) | Team DEV |
| 14 | Créer `core/graph/teams/maintenance.py` (§5.13) | Team MAINTENANCE |
| 15 | Créer `core/graph/compiler.py` (§5.8) | Build + execute |
| 16 | Créer `ops/tests/test_graph.py` + `test_teams.py` | Tests |
| 17 | **`make test`** → tout passe | Validation |
| 18 | **`make graph TASK="Audit the system"`** → exécute sans erreur | Test E2E |

### Wave 3 — Sentinelles

**Objectif** : `make boot` fonctionne.

| # | Action |
|:--|:-------|
| 1 | Créer `core/sentinels/__init__.py` |
| 2 | Créer `core/sentinels/health.py` (§5.15) |
| 3 | Créer `core/sentinels/atlas.py` (§5.16) |
| 4 | Créer `core/sentinels/resources.py` (§5.17) |
| 5 | Créer `core/sentinels/watchdog.py` (§5.14) |
| 6 | Créer `ops/tests/test_sentinels.py` |
| 7 | **`make test && make boot`** |

### Wave 4 — Sync Pipeline + Ops

**Objectif** : `make sync && make build` fonctionnent.

| # | Action |
|:--|:-------|
| 1 | Créer `core/sync/__init__.py` |
| 2-5 | Créer les 4 layers + manifest (§5.18-5.22) |
| 6 | Créer `core/sync/orchestrator.py` |
| 7 | Créer `experts/templates/system_prompt.j2` (§7.6) |
| 8 | Créer `ops/governance.py` (§8.2) |
| 9 | Créer `ops/crystallize.py` (§8.3) |
| 10 | Créer `ops/version_bump.py` (§8.4) |
| 11 | Créer `ops/tests/test_sync.py` + `test_infra.py` |
| 12 | **`make test && make sync && make build`** |

### Wave 5 — Portal (Backend + Frontend)

**Objectif** : `make portal` lance le dashboard.

| # | Action |
|:--|:-------|
| 1 | Créer `portal/backend/__init__.py` + `app.py` (§9.1) |
| 2 | Créer `portal/backend/deps.py` (§9.2) |
| 3 | Créer `portal/backend/routers/__init__.py` |
| 4-6 | Créer les 3 routers: `graph.py`, `atlas.py`, `events.py` (§11) |
| 7 | Créer `ops/launcher.py` (§8.1) |
| 8 | Initialiser le frontend: `cd portal/frontend && npx -y create-vite@latest ./ --template react` |
| 9 | Configurer `package.json` (ajouter framer-motion, lucide-react en dependencies) |
| 10 | Créer `src/index.css` (§12.1 Design Tokens) |
| 11 | Créer les composants `Header`, `Terminal`, `PulseIndicator` (§12.3-12.5) |
| 12 | Créer `App.jsx` + `App.css` (§12.2) |
| 13 | Copier les assets PNG depuis l'archive V2 |
| 14 | Créer `ops/tests/test_api.py` |
| 15 | **`make test && make portal`** → Dashboard visible sur localhost:5173 |

### Wave 6 — Polish

**Objectif** : Score d'audit ≥ 85/100.

| # | Action |
|:--|:-------|
| 1 | `make lint` → 0 erreurs ruff |
| 2 | `make test` → 100% pass, coverage > 70% |
| 3 | Mettre à jour `README.md` avec l'architecture EXACTE du code |
| 4 | Mettre à jour `roadmap.yaml` : toutes les waves en DONE |
| 5 | `make build` → commit clean |

---

## 16. Anti-Patterns & Pièges à Éviter

> [!CAUTION]
> Ces erreurs du V2 ne doivent JAMAIS être reproduites.

### ❌ NE PAS FAIRE

| # | Anti-Pattern | Pourquoi c'est un problème |
|:--|:-------------|:--------------------------|
| 1 | `except:` (bare except) | Avale KeyboardInterrupt, SystemExit, MemoryError |
| 2 | `ROOT = Path(__file__).resolve().parent.parent...` dans chaque fichier | Fragile, non-DRY, casse si un fichier est déplacé |
| 3 | `cls._instance = None; def __new__(cls):` | Singletons impossibles à tester et réinitialiser |
| 4 | `import re` au milieu d'une fonction | Import au top du fichier toujours |
| 5 | `print()` pour le logging | Utiliser `logging.getLogger(__name__)` |
| 6 | Stocker des `.py` dans `brain/` | `brain/` = données JSON uniquement |
| 7 | Dupliquer les sources de version | `VERSION` file est la seule source |
| 8 | `sys.exit()` dans un constructeur | Lever une exception à la place |
| 9 | Retourner l'accumulateur entier au lieu de `[result]` | Le reducer `operator.add` concatène, donc retourner une liste d'un élément |
| 10 | Hardcoder des secrets dans le code | Variables d'environnement + `.env.example` |
| 11 | CORS `allow_origins=["*"]` | Restreindre à localhost en dev |
| 12 | Charger des configs au module-level sans fallback | Si le fichier n'existe pas, le module crashe à l'import |
| 13 | Substring matching pour le routing (`"fix" in "prefix"`) | Utiliser `re.search(r"\bfix\b", text)` |
| 14 | Dépendances réseau pour des assets décoratifs | SVG de bruit intégré localement |
| 15 | `framer-motion` en devDependencies | C'est une dep runtime → dependencies |
| 16 | Compression de prompt qui ne matche rien | Tester que la compression a un effet réel, sinon la supprimer |
| 17 | Permettre au LLM de réécrire les fichiers YAML sources | Le LLM peut PROPOSER des changements, pas les persister automatiquement |
| 18 | Documenter des features qui n'existent pas | La doc reflète le code, pas l'inverse |

### ✅ TOUJOURS FAIRE

| # | Bonne pratique |
|:--|:---------------|
| 1 | `from core.paths import ROOT` pour tout chemin projet |
| 2 | `except Exception as e:` + `logger.error(...)` |
| 3 | Type hints sur les fonctions publiques |
| 4 | Retourner `{"results": [result_dict]}` dans les teams |
| 5 | Tester chaque module avec un `tmp_path` fixture pytest |
| 6 | Vérifier que `make test` passe à chaque fin de Wave |
| 7 | Maximum 200 lignes par fichier Python |
| 8 | Utiliser `structlog` pour tous les logs (sauf `ui.py`) |

---

## ANNEXE A — Glossaire

| Terme | Définition |
|:------|:-----------|
| **Team** | Nœud du graphe LangGraph spécialisé (ex: INTEGRITY scan la structure) |
| **Supervisor** | Nœud qui décide quel team exécuter ensuite |
| **Bridge** | `brain/bridge.json` — état de la dernière session |
| **REX** | Retour d'Expérience — une leçon apprise stockée dans `memory.json` |
| **SRP** | Single Responsibility Principle — 1 fichier = 1 responsabilité |
| **Atlantis** | Nom du design system du dashboard (stealth aéronautique) |
| **Sync** | Pipeline qui vérifie la cohérence brain/rules/code |
| **Sentinel** | Processus de monitoring autonome (watchdog, atlas, resources) |
| **Crystallize** | Persister l'état de session dans bridge.json + atlas |

---

## ANNEXE B — Arborescence V2 → V3 Mapping

| V2 Path | V3 Path | Changement |
|:--------|:--------|:-----------|
| `core/config_loader.py` | `core/config.py` | Renommé |
| `core/llm_client.py` | `core/llm.py` | Renommé |
| `core/version_utils.py` | `core/version.py` | Renommé |
| `core/graph/supervisor.py` | `core/graph/router.py` + node dans `compiler.py` | Séparé en routing pur + node |
| `core/nexus/*` | `core/infra/*` | Renommé (nexus → infra) |
| `core/nexus/vault.py` | *(supprimé)* | Pas de Vault en local |
| `core/nexus/redis.py` | *(supprimé)* | Pas de Redis en local |
| `core/nexus/security.py` | *(supprimé)* | Pas de HMAC en local |
| `core/sentinels/utils.py` | *(supprimé)* | Remplacé par structlog |
| `core/sentinels/self_healing.py` | *(supprimé)* | Le watchdog suffit |
| `core/sentinels/log_tailer.py` | *(supprimé)* | Surveillait des fichiers fantômes |
| `brain/adaptive_memory.py` | *(supprimé)* | Pas de Python dans brain/ |
| `core/conscience.py` | Intégré dans `core/config.py` | Fusionné |
| `core/score_manager.py` | *(supprimé)* | Complexité non justifiée |
| `core/rex_manager.py` | *(supprimé)* | REX = simple entry dans memory.json |
| `core/render.py` | Intégré dans `core/sync/orchestrator.py` | Simplifié |
| `ops/governance/commandments_checker.py` | `ops/governance.py` | Aplati (pas de sous-dossier) |
| `ops/tools/crystallize.py` | `ops/crystallize.py` | Aplati |
| `ops/tools/version_bump.py` | `ops/version_bump.py` | Aplati |
| `ops/tools/adaptive_memory.py` | *(supprimé)* | Pas de CLI mémoire en V3 |
| `ops/tools/sentinel_manager.py` | Intégré dans `ops/launcher.py` | Fusionné |

---

*Ce document est la source de vérité pour le développement de GSS Orion V3. Aucune dérogation sans mise à jour de ce document.*

*Architecte — Audit V2 → V3 Blueprint — 2026-04-08*
