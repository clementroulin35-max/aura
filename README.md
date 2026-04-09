# GSS ORION V3 — Adaptive IA Orchestration Engine

> Multi-agent AI orchestrator powered by LangGraph, designed for local sovereign operation.
> **v3.0.8** — 100 tests · 3-branch sovereignty cycle (flash / high / main)

## The Two LLM Systems

Orion operates **two completely independent** LLM governance contexts. Do not mix them.

| System | Who/What it governs | Key Files |
|:-------|:--------------------|:----------|
| **Architect Agent** | The external LLM (Flash/Claude) writing code & managing git branches | `brain/llm_config.json#sovereignty`, `ops/identity_seal.py`, `ops/sovereign_guard.py`, `ops/promote.py` |
| **Orion Engine** | Internal supervisor, teams, agents running LangGraph missions | `brain/llm_config.json#chat,supervisor`, `core/llm.py`, `experts/*.yaml`, `.agents/skills/*.md` |

`make llm-align` governs the **Architect**. `make graph TASK="..."` governs **Orion**. These are orthogonal.

## Architecture

```
orion_v3/
├── core/                    # Engine — imported by everything
│   ├── paths.py             # ROOT constant (single path anchor)
│   ├── version.py           # VERSION file reader
│   ├── config.py            # YAML+JSON config pipeline with deep merge
│   ├── llm.py               # Universal LLM: Ollama → Cloud → SIM  [Orion Engine]
│   ├── ui.py                # Aeronautical CLI (only print() allowed here)
│   ├── graph/               # LangGraph brain
│   │   ├── state.py         # GSSState TypedDict with reducer annotations
│   │   ├── router.py        # Regex word-boundary routing
│   │   ├── skills.py        # Expert skill definitions
│   │   ├── compiler.py      # StateGraph build + execute + scoring hook
│   │   └── teams/           # 5 specialized team pipelines
│   │       ├── integrity.py # governance → core (no LLM)
│   │       ├── quality.py   # critik → corrector → qualifier (2 LLM)
│   │       ├── strategy.py  # captain → task → brainstorming (2 LLM)
│   │       ├── dev.py       # single node + LLM (1 LLM)
│   │       └── maintenance.py # coverage + memory health (no LLM)
│   ├── infra/               # Infrastructure
│   │   ├── logging.py       # structlog with rotation
│   │   ├── telemetry.py     # Thread-safe metrics aggregator
│   │   └── event_bus.py     # JSONL writer, bounded queue (1000), 5MB rotation
│   ├── sentinels/           # Monitoring & self-healing
│   │   ├── watchdog.py      # PID singleton + PulseServer TCP (port 21230)
│   │   ├── health.py        # Atomic JSON read/write
│   │   ├── atlas.py         # System snapshot collector (60s)
│   │   ├── resources.py     # CPU/RAM monitor + ghost purge (15s)
│   │   ├── git_drift.py     # Git status entropy (60s)
│   │   ├── log_rotator.py   # TTL-based log archival (3600s)
│   │   ├── knowledge.py     # Memory ingestion threshold alerting (120s)
│   │   ├── self_healing.py  # Watchdog recovery (max 3 attempts)
│   │   └── utils.py         # is_orion_alive() liveness probe
│   └── sync/                # Synchronization pipeline
│       ├── brain_layer.py   # Validate brain/*.json
│       ├── rules_layer.py   # Validate experts/rules/*.yaml
│       ├── srp_layer.py     # Scan for >200 line files
│       ├── manifest.py      # SHA-256 change detection
│       └── orchestrator.py  # Sequential sync runner (with .sync.lock)
├── brain/                   # Data only — NO Python (R07)
│   ├── principles.json      # 10 verifiable rules                     [TRUTH]
│   ├── personality.json     # Orion persona                           [TRUTH]
│   ├── llm_config.json      # LLM config: Architect sovereignty + Orion inference [TRUTH]
│   ├── bridge.json          # Session persistence                     [DERIVED]
│   ├── memory.json          # Adaptive memory entries                 [TRUTH]
│   └── manifest.json        # File hash manifest                      [DERIVED]
├── experts/                 # Agent configuration  [Orion Engine]
│   ├── registry.yaml        # 12 expert skills + score/weight
│   ├── rules/               # Routing, governance, roadmap, core
│   └── templates/           # Jinja2 system prompt template
├── .agents/                 # Architect context  [Architect Agent]
│   ├── rules/system.md      # THIS FILE — architect working context
│   └── skills/*.md          # 8 agent SKILL files (Orion internal)
├── ops/                     # Operations — can import core/
│   ├── governance.py        # R01-R11 compliance checker
│   ├── version_bump.py      # Patch version incrementer
│   ├── crystallize.py       # 5-step session sealer
│   ├── launcher.py          # Backend + Frontend + Sentinels
│   ├── adaptive_memory.py   # CRUD on brain/memory.json
│   ├── cognitive_flag.py    # Auto-inject findings → roadmap
│   ├── integrity_check.py   # SHA-256 on 7 protected files
│   ├── sentinel_manager.py  # Startup/stop/verify/lock
│   ├── dynamic_orchestrator.py # Score/weight agent promotion
│   ├── memory_rag.py        # Zero-dep TF-IDF semantic search
│   ├── identity_seal.py     # Agent identity certification  [Architect]
│   ├── sovereign_guard.py   # 3-way push validation         [Architect]
│   ├── promote.py           # high → main promotion         [Architect]
│   ├── llm_tool.py          # LLM sovereignty management    [Architect]
│   └── tests/               # 100 tests across 10 files
├── portal/
│   ├── backend/             # FastAPI (CORS restricted to localhost)
│   └── frontend/            # React 19 + Vite 8 + Framer Motion
└── logs/                    # Runtime output (gitignored)
```

### Dependency Direction (Strict)

```
portal/ → core/  ✅     ops/    → core/  ✅
core/   → core/  ✅     core/   → ops/   ❌ FORBIDDEN
                        core/   → portal/ ❌ FORBIDDEN
```

## 3-Branch Sovereignty Cycle

```
main  ←────────────── promotes on successful HIGH build
 ↑                              │
high  ← audits + refines flash  │
 ↑                              │
flash ← FAST dev (synced from main at session start via flash-sync)
```

| Branch | Tier | Session Start | make shadow-sync | make build |
|:-------|:-----|:--------------|:-----------------|:-----------|
| `flash` | FAST | `make flash-sync` (rebase from main) | push → `origin/flash` | push → `origin/flash` |
| `high`  | HIGH | `git checkout high` | push → `origin/high` | push → `origin/high` + promote `high→main` |

## Quick Start

```bash
# 1. Setup
make install                               # venv + deps + git config

# 2. Session boot
make llm-align MODE=fast MODEL=gemini-2.5-flash  # or MODE=high MODEL=claude-sonnet-4-6
make flash-sync                            # (FAST only) rebase flash from main
make boot                                  # identity-seal + sentinels + sync + status

# 3. Work cycle
make test                                  # 100 tests, 2 workers
make shadow-sync                           # commit + push to origin/<branch>

# 4. Build + push
make build                                 # Full cycle — FAST pushes flash, HIGH pushes high + main

# 5. Run a LangGraph mission
make graph TASK="Audit the system architecture"

# 6. Launch the Atlantis Dashboard
make portal
# → Backend: http://localhost:8000  │  Frontend: http://localhost:5173
```

## 11 Rules (Constitution)

| ID | Rule | Enforcement |
|:---|:-----|:------------|
| R01 | SRP — max 200 lines per `.py` file | `ruff` + SRP sync layer |
| R02 | Single version source: `VERSION` file | `core/version.py` reader |
| R03 | No bare `except:` — always `except Exception as e:` | `ruff` E722 |
| R04 | No hardcoded secrets — env vars only | No `.env` committed |
| R05 | Single `ROOT` in `core/paths.py` | Import check |
| R06 | Makefile = sole CLI interface | Every action via `make` |
| R07 | `brain/` = JSON data only — no Python | Sync layer check |
| R08 | Structured logging (`structlog`) — no `print()` except `ui.py` | R10 grep |
| R09 | No singletons (`__new__`) — module-level instances | Pattern check |
| R10 | `print()` only in `core/ui.py` | Governance audit |
| R11 | Sovereignty — Model+Branch alignment + Identity Seal | `sovereign_guard` 3-way check |

## Stack

- **Python** 3.14 · **LangGraph** · **LiteLLM** · **FastAPI** · **structlog** · **psutil**
- **React** 19 · **Vite** 8 · **Framer Motion** · **Vanilla CSS**
- **Local LLM**: Ollama (auto-detected) | **Cloud**: Gemini, OpenAI, Claude

## All Commands (40+)

### Session Protocol

| Command | Description |
|:--------|:------------|
| `make llm-align MODE=X MODEL=Y` | 🎯 Align architect mode AND model atomically (session start) |
| `make boot` | 🚀 Identity-seal → sentinels → sync → status |
| `make flash-sync` | 🔄 Rebase flash on main (FAST agents, session start) |
| `make build` | 🛡️ Full cycle: guard → lint → test → sync → audit → commit → push → promote |
| `make shadow-sync` | 📸 Commit + push to `origin/<branch>` (mid-session snapshot) |
| `make exit` | 🚪 Crystallize → shutdown sentinels |
| `make promote` | 🚀 Manual high → main promotion (HIGH mode only) |

### LLM — Architect Sovereignty

| Command | Description |
|:--------|:------------|
| `make llm-align MODE=... MODEL=...` | Set mode AND model in one call (preferred) |
| `make llm-status` | Show mode, model, consistency check |
| `make identity-seal` | Auto-seal from `brain/llm_config.json` |
| `make llm-switch` | Toggle mode only (legacy) |

### Core Operations

| Command | Description |
|:--------|:------------|
| `make install` | Install Python venv + all dependencies + git config |
| `make test` | Run pytest with coverage (`ops/tests/`, 100 tests) |
| `make lint` | Run ruff linter + formatter (`core/` + `ops/`) |
| `make sync` | Sync pipeline: brain → rules → SRP → manifest |
| `make audit` | Governance compliance check (R01-R11) |

### Portal & Graph

| Command | Description |
|:--------|:------------|
| `make portal` | Launch Atlantis Dashboard (Backend + Frontend) |
| `make graph TASK="..."` | Run LangGraph orchestrator with a task |

### Sentinels

| Command | Description |
|:--------|:------------|
| `make sentinels-start` | Launch sentinel stack (watchdog → 5 sentinels) |
| `make sentinels-stop` | Graceful shutdown (PID + port cleanup) |
| `make sentinels-verify` | Verify sentinel stack health |

### Memory & Cognitive

| Command | Description |
|:--------|:------------|
| `make memory-status` | Show adaptive memory health |
| `make memory-log CAT="..." MSG="..."` | Log a learning entry |
| `make memory-compact` | Compact old memory entries |
| `make memory-approve ID="..."` | Approve a pending entry |
| `make crystallize` | 💎 Seal session (bridge → atlas → memory → flags → integrity) |
| `make integrity` | SHA-256 hash check of protected files |
| `make check-flags` | Inject cognitive flags into roadmap |

### Intelligence

| Command | Description |
|:--------|:------------|
| `make rag-index` | Build knowledge index (brain + .agents) |
| `make rag-query Q="..."` | Semantic search (TF-IDF + sovereign boost) |
| `make leaderboard` | Agent score/weight rankings |
| `make knowledge` | Knowledge sentinel one-shot check |

### Maintenance

| Command | Description |
|:--------|:------------|
| `make status` | Show version, pulse, memory status |
| `make clean` | Purge logs, caches, .sync.lock |
| `make validate` | 🔬 Full 10-step validation protocol (hot sentinels) |
| `make help` | Show all available commands |

## Intelligence Subsystem

### Adaptive Scoring

After each LangGraph mission, the compiler calls `record_activity()` which:
1. Increments each agent's score
2. Auto-promotes weight if score exceeds threshold
3. Writes to `brain/scores.json`

### Memory RAG

Zero-dependency semantic search over `brain/` and `.agents/` files:
- TF-IDF-like inverted index stored in `logs/memory_index.json`
- Sovereign boost: `.agents/` documents scored 2× higher
- Query via `make rag-query Q="governance"`

### Knowledge Sentinel

Monitors `brain/memory.json` for pending entries:
- Threshold: ≥5 pending entries → `INGESTION_REQUIRED` alert
- Classifies targets: `model`, `rules`, `roadmap`
- Alerts written to `logs/sentinel_alerts.jsonl`

## Sentinel Architecture

```
Watchdog (port 21230, PulseServer TCP)
├── atlas          — system snapshot (60s interval)
├── resources      — CPU/RAM + ghost purge (15s)
├── git_drift      — git status entropy (60s)
├── log_rotator    — TTL-based archival (3600s)
└── knowledge      — memory ingestion threshold (120s)

Self-Healing (independent process)
└── monitors port 21230, restarts watchdog if dead (max 3 attempts)
```

## License

Proprietary — GSS 2026
