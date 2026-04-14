# ═══════════════════════════════════════════════════
# GSS ORION V3 — Makefile (Source de Vérité CLI)
# Target OS: Windows (CMD syntax for set/type)
# v3.4 — All debts resolved
# ═══════════════════════════════════════════════════

PYTHON = set PYTHONUTF8=1&& .\venv\Scripts\python.exe
VERSION := $(shell type VERSION 2>NUL || echo v0.0.0)

.PHONY: test lint sync audit
.PHONY: boot build exit crystallize shadow-sync flash-sync identity-seal
.PHONY: promote llm-align
.PHONY: portal graph status clean validate
.PHONY: sentinels-start sentinels-stop sentinels-verify
.PHONY: memory-status memory-log memory-compact memory-approve
.PHONY: integrity check-flags llm-switch llm-status

# ══════════════════════════════════════════════════
# 📋  HELP
# ══════════════════════════════════════════════════

help: ## Show available commands
	@echo ""
	@echo   GSS ORION V3 [$(VERSION)]
	@echo   ════════════════════════════════════════
	@echo ""
	@echo   [SESSION]  boot / build / exit / flash-sync / identity-seal / promote
	@echo   [CORE]     install / test / lint / sync / audit
	@echo   [PORTAL]   portal / graph TASK=...
	@echo   [SENTINEL] sentinels-start / sentinels-stop / sentinels-verify
	@echo   [MEMORY]   memory-status / memory-log / memory-compact / memory-approve
	@echo   [RAG]      rag-index / rag-query Q=...
	@echo   [INTEL]    leaderboard / knowledge
	@echo   [MAINT]    crystallize / shadow-sync / integrity / check-flags
	@echo   [STATUS]   status / clean / validate / help
	@echo   [LLM]      llm-align MODE=.. MODEL=.. / llm-switch / llm-status
	@echo ""

# ══════════════════════════════════════════════════
# 🚀  SESSION PROTOCOL (Boot → Cycle → Build → Exit)
# ══════════════════════════════════════════════════

boot: identity-seal sentinels-start sync status ## 🚀 BOOT: Identity → Sentinels → Sync → Status
	@echo ""
	@echo   == BOOT COMPLETE — $(VERSION) ==
	@echo ""

build: ## 🛡️ BUILD: guard → lint → test → sync → audit → crystallize → commit → push → promote
	$(PYTHON) -m ops.sovereign_guard
	$(MAKE) lint
	$(MAKE) test
	$(MAKE) sync
	$(PYTHON) -m ops.governance
	$(PYTHON) -m ops.version_bump
	$(PYTHON) -m ops.crystallize
	git add -A
	git commit -m "build(v3): Orion $(VERSION) [SOVEREIGN]" || echo Nothing to commit
	git push origin $(shell git branch --show-current)
	$(PYTHON) -m ops.promote
	@echo ""
	@echo   == BUILD COMPLETE — $(VERSION) ==
	@echo ""

promote: ## 🚀 PROMOTE: push high → main (HIGH mode only)
	$(PYTHON) -m ops.promote

flash-sync: ## 🔄 FLASH-SYNC: Rebase flash sur main (safe: stash → rebase → stash pop)
	-git stash
	git checkout flash
	git rebase origin/main
	-git stash pop
	@echo   Flash branch rebased from origin/main.


exit: crystallize sentinels-stop ## 🚪 EXIT: Crystallize → Shutdown
	@echo ""
	@echo   == SESSION CLOSED — $(VERSION) ==
	@echo ""

shadow-sync: ## 📸 SHADOW-SYNC: commit + push to origin/<branch>
	$(PYTHON) -m ops.integrity_check
	git add -A
	-git commit -m "chore(shadow): GSS snapshot $(VERSION)" || echo Nothing to commit
	git push origin $(shell git branch --show-current)
	@echo   Shadow sync OK + pushed.

# ══════════════════════════════════════════════════
# 🔧  CORE OPERATIONS
# ══════════════════════════════════════════════════

install: ## Install all dependencies
	@if not exist venv python -m venv venv
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -e ".[dev]"
	@echo   Installing frontend dependencies...
	@cd portal/frontend && npm install --legacy-peer-deps
	git config merge.ours.driver true
	@echo   merge.ours.driver configured (flash-sync auto-resolution active).
	@echo   == INSTALL COMPLETE ==

test: ## Run pytest suite with coverage
	$(PYTHON) -m pytest ops/tests/ -v --tb=short --cov=core --cov-report=term-missing -q -n 2

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

llm-align: ## 🎯 Aligner mode ET modèle (MODE=flash|high MODEL=nom-exact)
	$(PYTHON) -m ops.llm_tool --align "$(MODE)" "$(MODEL)"

llm-switch: ## Toggle sovereignty mode flash ↔ high (legacy: préférer llm-align)
	$(PYTHON) -m ops.llm_tool --toggle

llm-status: ## Afficher le mode, modèle et diagnostic de cohérence
	$(PYTHON) -m ops.llm_tool --status

identity-seal: ## 🔏 Sceau d'identité auto depuis brain/llm_config.json
	$(PYTHON) -m ops.identity_seal --auto

# ══════════════════════════════════════════════════
# ⚙️  MAINTENANCE
# ══════════════════════════════════════════════════

status: ## Show system status
	@echo ""
	@$(PYTHON) -c "from core.version import get_version; print(f'  Version: {get_version()}')"
	@$(PYTHON) -c "import json, pathlib; d=json.loads(pathlib.Path('brain/bridge.json').read_text(encoding='utf-8')); print(f'  Pulse:   {d.get(\"pulse\", \"UNKNOWN\")}'); print(f'  Last:    {d.get(\"last_session\", \"never\")}')"
	@$(PYTHON) -m ops.adaptive_memory --status
	@echo ""

validate: ## 🔬 Full validation protocol (10 steps, hot sentinels)
	$(PYTHON) -m ops.validate

clean: ## Purge logs and Python caches
	@if exist logs\*.log del /q logs\*.log

install-frontend: ## 📦 INSTALL: install frontend dependencies
	cd portal/frontend && npm install
	@if exist logs\*.jsonl del /q logs\*.jsonl
	@if exist logs\*.json del /q logs\*.json
	@if exist logs\*.pid del /q logs\*.pid
	@if exist .sync.lock del /q .sync.lock
	@for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
	@echo   Cleaned.
