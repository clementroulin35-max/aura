---
trigger: always_on
---
# GSS ORION V3 — Architect Context

I am the **external LLM** (Flash/Claude) that CODES this project.
I am NOT the LangGraph supervisor — I build its code. It runs missions. We never pretend to be each other.
Stack: Python 3.14 · LangGraph · FastAPI · React/Vite · Windows/PowerShell
CLI: `make` is the ONLY interface. No raw `python` commands.

## Two LLM Systems — NEVER mix

| System | Governs | Config |
|:-------|:--------|:-------|
| **Architect** (YOU) | Git branches, code quality, architecture | `llm_config.json#sovereignty` |
| **Orion Engine** | LangGraph supervisor, teams, agents | `llm_config.json#chat,supervisor` |

`make llm-align` changes YOUR tier. It does NOT affect Orion's inference model.

## Session Boot (exact order)

1. `make llm-align MODE=<fast|high> MODEL=<exact-model>` ← **ALWAYS FIRST**
   - Flash/Gemini → `MODE=fast` · branch `flash`
   - Claude/GPT-4o → `MODE=high` · branch `high`
2. FAST: `make flash-sync` · HIGH: `git checkout high`
3. `make boot` → identity-seal + sentinels + sync + status
4. `make test`
5. Resume: `brain/bridge.json` · `experts/rules/roadmap.yaml`

## Build Cycle

`make shadow-sync` → commit + push `origin/<branch>`
`make build` → guard → lint → test → sync → audit → commit → push → (HIGH: promotes `high→main`)
`make exit` → crystallize + shutdown

## Branch Rules (R11 — HARD)

| Tier | Branch | Push target |
|:-----|:-------|:------------|
| FAST | `flash` | `origin/flash` only |
| HIGH | `high` | `origin/high` + `origin/main` (auto-promote) |
| HIGH on flash | allowed (admin sync) | `origin/flash` |

`make build` is HARD-BLOCKED if mode ≠ branch.

## 11 Rules

R01 SRP — max 200 lines/`.py`
R02 VERSION — single `VERSION` file
R03 EXCEPT — `except Exception as e:` only
R04 SECRETS — no hardcoded secrets, always `os.environ`
R05 ROOT — `from core.paths import ROOT` only
R06 MAKEFILE — `make` is the sole CLI
R07 BRAIN — `brain/` = JSON data only, no `.py`
R08 LOGGING — `logging.getLogger(__name__)` or structlog — no `print()`
R09 SINGLETON — no `__new__`, module-level instances
R10 PRINT — `print()` ONLY in `core/ui.py`
R11 SOVEREIGNTY — mode+branch aligned, identity seal required for HIGH

## Dependency Direction

```
ops/ → core/ ✅    portal/ → core/ ✅
core/ → ops/ ❌    core/ → portal/ ❌
```

## Forbidden Patterns

```python
except:                        # → except Exception as e:
Path(__file__).parent.parent   # → from core.paths import ROOT
import *                       # → explicit imports
print("debug")                 # → logger.debug() [except core/ui.py]
password = "hardcoded"         # → os.environ["KEY"]
yaml.load(...)                 # → yaml.safe_load(...)
```

## Code Conventions

- JSON: `json.loads(path.read_text(encoding="utf-8"))`
- YAML: `yaml.safe_load()`
- Types: `dict`, `list` (not `Dict`, `List`)
- Tests: `ops/tests/` · pattern `test_{module}_{behavior}`
- Fixtures: `conftest.py` → `tmp_project`, `mock_llm`
