---
trigger: always_on
---
# GSS ORION V3 — Architect Context

I am the **external LLM** (Flash/Claude) that CODES this project.
I am NOT the LangGraph supervisor — I build its code, it runs missions. We never pretend to be each other.
Stack: Python 3.14 · LangGraph · FastAPI · React/Vite · structlog · Windows/PowerShell
CLI: `make` is the ONLY interface. Version: read-only from `VERSION`. No raw `python` commands.

## Two LLM Systems — NEVER mix

| System | Governs | Config key |
|:-------|:--------|:-----------|
| **Architect** (YOU) | Git branches, code quality, architecture | `llm_config.json#sovereignty` |
| **Orion Engine** | LangGraph supervisor, teams, agents | `llm_config.json#chat,supervisor` |

`make llm-align` changes YOUR tier. It does NOT affect Orion's inference model.

## Architecture

```
core/         # Engine — imported by ops/ and portal/. Never imports them.
  paths.py    # ROOT constant (ONLY path anchor — R05)
  llm.py      # Universal LLM: Ollama → Cloud → SIM  [Orion Engine]
  ui.py       # Only file where print() is allowed (R10)
  graph/      # LangGraph: state, router, compiler, teams/ (5 pipelines)
  sentinels/  # watchdog, atlas, resources, git_drift, log_rotator, self_healing
  sync/       # brain_layer, rules_layer, srp_layer, manifest, orchestrator
ops/          # Operational tools → can import core/. Contains tests/.
brain/        # DATA ONLY — no .py files (R07). TRUTH files: principles, personality, llm_config.
experts/      # YAML rules + Jinja2 → read by graph/router.py  [Orion Engine]
portal/       # FastAPI backend + React/Vite → both import core/
```

**Dependency (STRICT):** `ops/ → core/ ✅` · `portal/ → core/ ✅` · `core/ → ops/ ❌` · `core/ → portal/ ❌`

## Session Protocol

1. `make llm-align MODE=<fast|high> MODEL=<exact-model>` ← **FIRST, EVERY SESSION**
   - Flash/Gemini → `MODE=fast` · branch `flash`
   - Claude/GPT-4o → `MODE=high` · `git checkout high`
2. FAST: `make flash-sync` (rebase flash on main) · HIGH: already on `high`
3. `make boot` → identity-seal + sentinels + sync + status
4. `make test` · Resume: `brain/bridge.json` · `experts/rules/roadmap.yaml`

**Build cycle:**
- `make shadow-sync` → commit + push `origin/<branch>` (mid-session)
- `make build` → guard→lint→test→sync→audit→commit→push → HIGH also promotes `high→main`
- `make exit` → crystallize + shutdown

## Branch Rules (R11 — HARD)

| Tier | Branch | Pushes to |
|:-----|:-------|:----------|
| FAST (Gemini, Llama) | `flash` | `origin/flash` only |
| HIGH (Claude, GPT-4o) | `high` | `origin/high` + auto-promotes `high→main` |

`make build` is HARD-BLOCKED if mode ≠ branch. HIGH build requires valid identity seal (< 1h).

## 11 Rules

| # | Rule | What it means |
|:--|:-----|:--------------|
| R01 | SRP | Max 200 lines per `.py` |
| R02 | VERSION | Single `VERSION` file |
| R03 | EXCEPT | `except Exception as e:` only — never bare `except:` |
| R04 | SECRETS | No hardcoded secrets — `os.environ["KEY"]` |
| R05 | ROOT | `from core.paths import ROOT` — never `Path(__file__).parent...` |
| R06 | MAKEFILE | `make` only — no raw `python` commands |
| R07 | BRAIN | `brain/` = JSON data only, no `.py` |
| R08 | LOGGING | `logging.getLogger(__name__)` or structlog — no `print()` |
| R09 | SINGLETON | No `__new__` — module-level instances |
| R10 | PRINT | `print()` ONLY in `core/ui.py` |
| R11 | SOVEREIGNTY | Mode+branch aligned, identity seal required for HIGH |

## Forbidden Patterns

```python
except:                        # → except Exception as e:
Path(__file__).parent.parent   # → from core.paths import ROOT
import *                       # → explicit imports
print("debug")                 # → logger.debug() [except core/ui.py]
password = "hardcoded"         # → os.environ["PASSWORD"]
yaml.load(...)                 # → yaml.safe_load(...)
```

## Code Conventions

- **Imports**: absolute — `from core.paths import ROOT`, `from core.ui import print_step`
- **Types**: `dict`, `list`, `tuple` (not `Dict`, `List`, `Tuple` from typing)
- **JSON**: `json.loads(path.read_text(encoding="utf-8"))` — always specify encoding
- **YAML**: `yaml.safe_load()` always
- **Tests**: `ops/tests/` · pattern `test_{module}_{behavior}` · fixtures: `tmp_project`, `mock_llm`
