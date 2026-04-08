# ═══════════════════════════════════════════════════
# GSS ORION V3 — Makefile (Source de Vérité CLI)
# Target OS: Windows (CMD syntax for set/type)
# v3.2 — Merged V1 lifecycle patterns
# ═══════════════════════════════════════════════════

PYTHON = set PYTHONUTF8=1&& .\venv\Scripts\python.exe
VERSION := $(shell type VERSION 2>NUL || echo v0.0.0)

.PHONY: help install test lint sync audit
.PHONY: boot build exit crystallize shadow-sync
.PHONY: portal graph status clean
.PHONY: sentinels-start sentinels-stop sentinels-verify
.PHONY: memory-status memory-log memory-compact memory-approve
.PHONY: integrity check-flags

# ══════════════════════════════════════════════════
# 📋  HELP
# ══════════════════════════════════════════════════

help: ## Show available commands
	@echo.
	@echo   GSS ORION V3 — Commands [$(VERSION)]
	@echo   ════════════════════════════════════════
	@echo.
	@echo   [SESSION PROTOCOL]
	@echo   make boot             — Sentinels + Sync + Status
	@echo   make build            — Atomic build pipeline
	@echo   make exit             — Crystallize + Shutdown
	@echo.
	@echo   [CORE]
	@echo   make install          — Install dependencies
	@echo   make test             — Run test suite
	@echo   make lint             — Ruff linter + formatter
	@echo   make sync             — Sync pipeline (brain/rules/srp)
	@echo   make audit            — Governance compliance
	@echo.
	@echo   [PORTAL]
	@echo   make portal           — Launch Atlantis Dashboard
	@echo   make graph TASK=...   — Run LangGraph orchestrator
	@echo.
	@echo   [SENTINELS]
	@echo   make sentinels-start  — Launch sentinel stack
	@echo   make sentinels-stop   — Stop sentinel stack
	@echo   make sentinels-verify — Verify stack health
	@echo.
	@echo   [MEMORY]
	@echo   make memory-status    — Memory health
	@echo   make memory-log CAT=... MSG=...  — Log learning
	@echo   make memory-compact   — Compact old entries
	@echo   make rag-index        — Build knowledge index
	@echo   make rag-query Q=...  — Semantic search
	@echo.
	@echo   [INTELLIGENCE]
	@echo   make leaderboard      — Agent score/weight rankings
	@echo   make knowledge        — Knowledge sentinel check
	@echo.
	@echo   [MAINTENANCE]
	@echo   make crystallize      — Seal session state
	@echo   make shadow-sync      — Git snapshot (local commit)
	@echo   make integrity        — Hash integrity check
	@echo   make check-flags      — Inject cognitive flags
	@echo   make status           — System status
	@echo   make clean            — Purge logs and caches
	@echo.

# ══════════════════════════════════════════════════
# 🚀  SESSION PROTOCOL (Boot → Cycle → Build → Exit)
# ══════════════════════════════════════════════════

boot: sentinels-start sync status ## 🚀 BOOT: Sentinels → Sync → Status
	@echo.
	@echo   ══ BOOT COMPLETE — $(VERSION) ══
	@echo.

build: lint test sync ## 🛡️ BUILD: lint → test → sync → audit → crystallize → commit
	$(PYTHON) -m ops.governance
	$(PYTHON) -m ops.version_bump
	$(PYTHON) -m ops.crystallize
	git add -A
	git commit -m "build(v3): Orion $(VERSION) [SOVEREIGN]" || echo Nothing to commit
	@echo.
	@echo   ══ BUILD COMPLETE — $(VERSION) ══
	@echo.

exit: crystallize sentinels-stop ## 🚪 EXIT: Crystallize → Shutdown
	@echo.
	@echo   ══ SESSION CLOSED — $(VERSION) ══
	@echo.

shadow-sync: ## 📸 SHADOW-SYNC: Git snapshot (local commit)
	$(PYTHON) -m ops.integrity_check
	git add -A
	-git commit -m "chore(shadow): GSS snapshot $(VERSION)" || echo Nothing to commit
	@echo   Shadow sync OK (local commit).

# ══════════════════════════════════════════════════
# 🔧  CORE OPERATIONS
# ══════════════════════════════════════════════════

install: ## Install all dependencies
	@if not exist venv python -m venv venv
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -e ".[dev]"

test: ## Run pytest suite with coverage
	$(PYTHON) -m pytest ops/tests/ -v --tb=short --cov=core --cov-report=term-missing -q

lint: ## Run ruff linter + formatter
	$(PYTHON) -m ruff check core/ ops/ --fix
	$(PYTHON) -m ruff format core/ ops/

sync: ## Run synchronization pipeline (locked)
	$(PYTHON) -m core.sync.orchestrator

audit: ## Governance compliance check
	$(PYTHON) -m ops.governance

# ══════════════════════════════════════════════════
# 🌐  PORTAL & GRAPH
# ══════════════════════════════════════════════════

portal: ## Launch Atlantis Dashboard (Backend + Frontend)
	$(PYTHON) -m ops.launcher

graph: ## Run LangGraph orchestrator with a task
	$(PYTHON) -m core.graph.compiler --task "$(TASK)"

# ══════════════════════════════════════════════════
# 🛡️  SENTINELS
# ══════════════════════════════════════════════════

sentinels-start: ## Launch sentinel stack (Watchdog → Atlas/Resources/GitDrift/LogRotator)
	$(PYTHON) -m ops.sentinel_manager startup

sentinels-stop: ## Stop sentinel stack
	$(PYTHON) -m ops.sentinel_manager stop

sentinels-verify: ## Verify sentinel stack health
	$(PYTHON) -m ops.sentinel_manager verify

# ══════════════════════════════════════════════════
# 🧠  MEMORY & COGNITIVE
# ══════════════════════════════════════════════════

memory-status: ## Show adaptive memory health
	$(PYTHON) -m ops.adaptive_memory --status

memory-log: ## Log a learning (CAT="pattern" MSG="description")
	$(PYTHON) -m ops.adaptive_memory --log "$(CAT)" "$(MSG)"

memory-compact: ## Compact old memory entries
	$(PYTHON) -m ops.adaptive_memory --compact

memory-approve: ## Approve a pending entry (ID="REX-MEM-001")
	$(PYTHON) -m ops.adaptive_memory --approve "$(ID)"

crystallize: ## 💎 Seal session state (bridge + atlas + memory + flags + integrity)
	$(PYTHON) -m ops.crystallize

integrity: ## Check hash integrity of protected files
	$(PYTHON) -m ops.integrity_check

check-flags: ## Inject cognitive flags into roadmap
	$(PYTHON) -m ops.cognitive_flag

rag-index: ## Build knowledge index (brain + .agents)
	$(PYTHON) -m ops.memory_rag --index

rag-query: ## Semantic search (Q="your question")
	$(PYTHON) -m ops.memory_rag --query "$(Q)"

leaderboard: ## Agent score/weight rankings
	$(PYTHON) -m ops.dynamic_orchestrator --leaderboard

knowledge: ## Knowledge sentinel one-shot check
	$(PYTHON) -m core.sentinels.knowledge

# ══════════════════════════════════════════════════
# ⚙️  MAINTENANCE
# ══════════════════════════════════════════════════

status: ## Show system status
	@echo.
	@$(PYTHON) -c "from core.version import get_version; print(f'  Version: {get_version()}')"
	@$(PYTHON) -c "import json, pathlib; d=json.loads(pathlib.Path('brain/bridge.json').read_text(encoding='utf-8')); print(f'  Pulse:   {d.get(\"pulse\", \"UNKNOWN\")}'); print(f'  Last:    {d.get(\"last_session\", \"never\")}')"
	@$(PYTHON) -m ops.adaptive_memory --status
	@echo.

clean: ## Purge logs and Python caches
	@if exist logs\*.log del /q logs\*.log
	@if exist logs\*.jsonl del /q logs\*.jsonl
	@if exist logs\*.json del /q logs\*.json
	@if exist logs\*.pid del /q logs\*.pid
	@if exist .sync.lock del /q .sync.lock
	@for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
	@echo   Cleaned.
