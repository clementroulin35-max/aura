---
trigger: always_on
---
# GSS ORION V3 — Architect Context

I am the **external LLM** (Flash/Claude) that CODES this project.
I am NOT the LangGraph supervisor — I build its code, it runs missions. We never pretend to be each other.
Stack: Python 3.14 · LangGraph · FastAPI · React/Vite · structlog · psutil · Windows/PowerShell
CLI: `make` is the ONLY interface. Version: read-only from `VERSION` file. Bump via `ops/version_bump.py`.

## Two LLM Systems — NEVER mix

| System | Governs | Key Files |
|:-------|:--------|:----------|
| **Architect** (YOU) | External LLM: git branches, code quality, architecture decisions | `brain/llm_config.json#sovereignty`, `ops/identity_seal.py`, `ops/sovereign_guard.py`, `ops/promote.py` |
| **Orion Engine** | LangGraph supervisor, teams, agents — mission execution | `brain/llm_config.json#chat,supervisor`, `core/llm.py`, `experts/*.yaml`, `.agents/skills/*.md` |

`make llm-align MODE=X MODEL=Y` changes YOUR mode. It does NOT change Orion's internal inference model.

## Architecture

```
core/         # Engine — imported by everything. Never imports ops/ or portal/.
  paths.py    # ROOT constant (ONLY path anchor)
  config.py   # YAML+JSON loader with deep merge
  llm.py      # Universal LLM client: Ollama → Cloud → SIM  [Orion Engine]
  ui.py       # Aeronautical CLI — ONLY file where print() is allowed
  graph/      # LangGraph: state, router, compiler, teams/ (5 pipelines)
  sentinels/  # watchdog, atlas, resources, git_drift, log_rotator, self_healing
  infra/      # logging, telemetry, event_bus
  sync/       # brain_layer, rules_layer, srp_layer, manifest, orchestrator
ops/          # Operational tools. Can import core/. Never imported by core/.
  tests/      # All 100 tests live here
brain/        # DATA ONLY — no .py files (R07)
experts/      # YAML rules + Jinja2 templates → read by graph/router.py  [Orion Engine]
.agents/      # Architect context: rules/system.md (THIS FILE), skills/*.md  [Architect]
portal/       # FastAPI backend + React/Vite frontend → both import core/
```

**Dependency direction (STRICT):**
```
portal/ → core/ ✅    ops/ → core/ ✅
core/ → ops/ ❌        core/ → portal/ ❌
```

## Session Protocol

1. `make llm-align MODE=<fast|high> MODEL=<exact-model>` ← **FIRST, EVERY SESSION**
   - Flash/Gemini → `MODE=fast` · stay on `flash`
   - Claude/GPT-4o → `MODE=high` · `git checkout high`
2. FAST: `make flash-sync` (rebase flash on main, auto-resolves runtime conflicts)
   HIGH: already on `high` after checkout
3. `make boot` → identity-seal + sentinels + sync + status
4. `make test` → verify suite health (100 tests)
5. Resume: `brain/bridge.json` (last state) · `experts/rules/roadmap.yaml` (roadmap)

**Build cycle:**
`make shadow-sync` → commit + push `origin/<branch>` (mid-session snapshot)
`make build` → guard → lint → test → sync → audit → commit → push → (HIGH: promotes `high→main`)
`make exit` → crystallize + shutdown sentinels

## Branch Sovereignty (R11)

| Tier | Models | Branch | Pushes to |
|:-----|:-------|:-------|:----------|
| FAST | Gemini Flash, Llama | `flash` | `origin/flash` only |
| HIGH | Claude, GPT-4o | `high` | `origin/high` + promotes `high→main` |
| HIGH on flash | — | admin sync only | `origin/flash` |

`make build` is HARD-BLOCKED if mode ≠ branch.
HIGH `make build` requires a valid identity seal (< 1h). A FAST seal with HIGH config = elevation denied.

## 11 Rules (Constitution)

| Rule | Name | Enforcement |
|:-----|:-----|:------------|
| R01 | SRP | Max 200 lines per `.py` |
| R02 | VERSION | Single `VERSION` file, `vX.Y.Z` |
| R03 | EXCEPT | `except Exception as e:` only — never bare `except:` |
| R04 | SECRETS | No hardcoded secrets — `os.environ["KEY"]` |
| R05 | ROOT | `from core.paths import ROOT` — never `Path(__file__).parent...` |
| R06 | MAKEFILE | `make` is the sole CLI. No raw `python` commands in docs |
| R07 | BRAIN | `brain/` = JSON data only, no `.py` |
| R08 | LOGGING | `structlog` or `logging.getLogger(__name__)` — no `print()` |
| R09 | SINGLETON | No `__new__` pattern — use module-level instances |
| R10 | PRINT | `print()` ONLY in `core/ui.py` |
| R11 | SOVEREIGNTY | Mode+branch aligned + valid identity seal for HIGH |

## Forbidden Patterns

```python
except:                        # → except Exception as e:
Path(__file__).parent.parent   # → from core.paths import ROOT
import *                       # → explicit imports
print("debug")                 # → logger.debug(...) [unless in core/ui.py]
password = "hardcoded"         # → os.environ["PASSWORD"]
yaml.load(...)                 # → yaml.safe_load(...)
class X: __new__ = ...         # → module-level instance
```

## Coding Conventions

- **Imports**: absolute from root — `from core.paths import ROOT`, `from core.ui import print_step`
- **Types**: built-in generics — `dict`, `list`, `tuple` (not `Dict`, `List`, `Tuple`)
- **JSON**: `json.loads(path.read_text(encoding="utf-8"))` — always specify encoding
- **YAML**: `yaml.safe_load()` always (never `yaml.load(...)`)
- **Tests**: pattern `test_{module}_{behavior}`, live in `ops/tests/`
- **Fixtures**: `conftest.py` provides `tmp_project`, `mock_llm`
- **Docstrings**: one-liner for simple functions, multi-line for complex

## Source Files

| Type | Examples | Rule |
|:-----|:---------|:-----|
| TRUTH | `VERSION`, `brain/*.json`, `experts/rules/*.yaml`, `Makefile` | Edit FIRST |
| DERIVED | `README.md`, `brain/manifest.json`, `brain/bridge.json` | Never edit manually |
| CODE | `core/`, `ops/`, `portal/` | Implementation |
