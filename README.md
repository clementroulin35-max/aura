# GSS ORION V3 — Adaptive IA Orchestration Engine

> Multi-agent AI orchestrator powered by LangGraph, designed for local sovereign operation.

## Architecture

```
orion_v3/
├── core/                    # Engine — imported by everything
│   ├── paths.py             # ROOT constant (single path anchor)
│   ├── version.py           # VERSION file reader
│   ├── config.py            # YAML+JSON config pipeline with deep merge
│   ├── llm.py               # Universal LLM: Ollama → Cloud → SIM
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
│   ├── principles.json      # 10 verifiable rules
│   ├── personality.json     # Orion persona
│   ├── bridge.json          # Session persistence
│   ├── memory.json          # Adaptive memory entries
│   └── manifest.json        # File hash manifest (generated)
├── experts/                 # Agent configuration
│   ├── registry.yaml        # 12 expert skills + score/weight
│   ├── rules/               # Routing, governance, roadmap, core
│   └── templates/           # Jinja2 system prompt template
├── ops/                     # Operations — can import core/
│   ├── governance.py        # R01-R10 compliance checker
│   ├── version_bump.py      # Patch version incrementer
│   ├── crystallize.py       # 5-step session sealer
│   ├── launcher.py          # Backend + Frontend + Sentinels
│   ├── adaptive_memory.py   # CRUD on brain/memory.json
│   ├── cognitive_flag.py    # Auto-inject findings → roadmap
│   ├── integrity_check.py   # SHA-256 on 7 protected files
│   ├── sentinel_manager.py  # Startup/stop/verify/lock
│   ├── dynamic_orchestrator.py # Score/weight agent promotion
│   ├── memory_rag.py        # Zero-dep TF-IDF semantic search
│   └── tests/               # 83 tests across 7 files
├── portal/
│   ├── backend/             # FastAPI (CORS restricted to localhost)
│   │   ├── app.py           # Factory with version from VERSION
│   │   └── routers/         # graph, atlas, events (WebSocket)
│   └── frontend/            # React 19 + Vite 8 + Framer Motion
├── docs/
│   ├── audits/              # Architecture audit reports
│   ├── guides/              # User guides (prompt patterns)
│   ├── archives/v2/         # V2 reference docs
│   └── prototype/           # V3 specifications
└── logs/                    # Runtime output (gitignored)
```

### Dependency Direction (Strict)

```
portal/ → core/  ✅     ops/    → core/  ✅
core/   → core/  ✅     core/   → ops/   ❌ FORBIDDEN
                        core/   → portal/ ❌ FORBIDDEN
```

## Quick Start

```bash
# 1. Create virtual environment and install
make install

# 2. Run tests (83 tests, 61% coverage)
make test

# 3. Run a LangGraph mission
make graph TASK="Audit the system architecture"

# 4. Launch the Atlantis Dashboard
make portal
# → Backend: http://localhost:8000
# → Frontend: http://localhost:5173
```

## 10 Rules (Constitution)

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
| R11 | Sovereignty — Model/Branch alignment | `sovereign_guard` check |

## Stack

- **Python** 3.14 · **LangGraph** · **LiteLLM** · **FastAPI** · **structlog** · **psutil**
- **React** 19 · **Vite** 8 · **Framer Motion** · **Vanilla CSS**
- **Local LLM**: Ollama (auto-detected) | **Cloud**: Gemini, OpenAI, Claude

## All Commands (34)

### Session Protocol

| Command | Description |
|:--------|:------------|
| `make boot` | 🚀 Preflight: sentinels → sync → status |
| `make build` | 🛡️ Atomic: guard → lint → test → sync → audit → bump → crystallize → commit |
| `make exit` | 🚪 Crystallize → shutdown sentinels |
| `make shadow-sync` | 📸 Git snapshot (local commit with integrity check) |

### Core Operations

| Command | Description |
|:--------|:------------|
| `make install` | Install Python venv + all dependencies |
| `make test` | Run pytest with coverage (`ops/tests/`) |
| `make lint` | Run ruff linter + formatter (`core/` + `ops/`) |
| `make sync` | Sync pipeline: brain → rules → SRP → manifest |
| `make audit` | Governance compliance check (R01-R11) |

### LLM Sovereignty

| Command | Description |
|:--------|:------------|
| `make llm-status` | Show current sovereignty mode and identity seal status |
| `make llm-switch` | Toggle between FAST (Gemini) and HIGH (Claude) modes |

### Portal & Graph
... [rest of the tables remains same]

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
3. Writes to `experts/registry.yaml`

This creates a feedback loop: **mission → score → weight → routing**.

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
