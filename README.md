# GSS ORION V3 — Adaptive IA Orchestration Engine

> Multi-agent AI orchestrator powered by LangGraph, designed for local sovereign operation.

## Architecture

```
orion_v3/
├── core/           # Engine: graph, sentinels, sync, infra
├── brain/          # Cognitive data (JSON only — no Python)
├── experts/        # Agent configuration (YAML + templates)
├── ops/            # Operations: launcher, governance, tests
├── portal/         # Web: FastAPI backend + React frontend
└── logs/           # Runtime logs (gitignored)
```

## Quick Start

```bash
# 1. Create virtual environment and install
make install

# 2. Run tests
make test

# 3. Run a LangGraph mission
make graph TASK="Audit the system architecture"

# 4. Launch the Atlantis Dashboard
make portal
```

## 10 Rules (Constitution)

| ID | Rule | Enforcement |
|:---|:-----|:------------|
| R01 | SRP < 200 lines per file | `ruff` + automated test |
| R02 | Single version source: `VERSION` file | grep check |
| R03 | No bare `except:` — always `except Exception as e:` | `ruff` E722 |
| R04 | No hardcoded secrets — env vars only | secret scanner |
| R05 | Single `ROOT` in `core/paths.py` | import check |
| R06 | Makefile = CLI interface | every action via `make` |
| R07 | Mandatory tests for each `core/` module | coverage > 70% |
| R08 | No singletons — module-level instances | grep `_instance` |
| R09 | Type hints on all public functions | `mypy` progressive |
| R10 | Structured logging (`structlog`) — no `print()` except `ui.py` | grep check |

## Stack

- **Python** ≥ 3.11 · **LangGraph** · **LiteLLM** · **FastAPI** · **structlog**
- **React** 19 · **Vite** 8 · **Framer Motion** · **Vanilla CSS**
- **Local LLM**: Ollama (auto-detected) | **Cloud**: Gemini, OpenAI, Claude

## Commands

| Command | Description |
|:--------|:------------|
| `make help` | Show all commands |
| `make install` | Install Python + Node dependencies |
| `make test` | Run pytest with coverage |
| `make lint` | Run ruff linter + formatter |
| `make sync` | Sync pipeline (brain + rules + SRP) |
| `make audit` | Governance compliance check |
| `make boot` | Preflight: test + audit |
| `make build` | Atomic: test + sync + bump + commit |
| `make portal` | Launch Atlantis Dashboard |
| `make graph TASK="..."` | Run LangGraph orchestrator |
| `make status` | Show version and pulse |
| `make clean` | Purge logs and caches |

## License

Proprietary — GSS 2026
