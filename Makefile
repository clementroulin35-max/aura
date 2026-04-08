# ═══════════════════════════════════════════════════
# GSS ORION V3 — Makefile (Source de Vérité CLI)
# Target OS: Windows (CMD syntax for set/type)
# ═══════════════════════════════════════════════════

PYTHON = set PYTHONUTF8=1&& .\venv\Scripts\python.exe
VERSION := $(shell type VERSION 2>NUL || echo v0.0.0)

.PHONY: help install test lint sync audit boot build portal graph sentinels-start sentinels-stop status clean

help: ## Show available commands
	@echo.
	@echo   GSS ORION V3 — Commands [$(VERSION)]
	@echo   ════════════════════════════════════════
	@echo   make install         — Install dependencies
	@echo   make test            — Run test suite
	@echo   make lint            — Ruff linter + formatter
	@echo   make sync            — Sync pipeline
	@echo   make audit           — Governance compliance
	@echo   make boot            — Preflight sequence
	@echo   make build           — Atomic build pipeline
	@echo   make portal          — Launch Atlantis Dashboard
	@echo   make graph TASK=...  — Run LangGraph orchestrator
	@echo   make status          — System status
	@echo   make clean           — Purge logs and caches
	@echo.

install: ## Install all dependencies
	@if not exist venv python -m venv venv
	$(PYTHON) -m pip install --upgrade pip
	$(PYTHON) -m pip install -e ".[dev]"

test: ## Run pytest suite with coverage
	$(PYTHON) -m pytest ops/tests/ -v --tb=short --cov=core --cov-report=term-missing -q

lint: ## Run ruff linter + formatter
	$(PYTHON) -m ruff check core/ ops/ --fix
	$(PYTHON) -m ruff format core/ ops/

sync: ## Run synchronization pipeline
	$(PYTHON) -m core.sync.orchestrator

audit: ## Governance compliance check
	$(PYTHON) -m ops.governance

boot: test audit ## Preflight: tests + audit
	@echo.
	@echo   ══ BOOT COMPLETE — $(VERSION) ══
	@echo.

build: test sync ## Atomic build pipeline
	$(PYTHON) -m ops.governance
	$(PYTHON) -m ops.version_bump
	$(PYTHON) -m ops.crystallize
	git add -A
	git commit -m "build(v3): Orion $(VERSION) [SOVEREIGN]" || echo Nothing to commit
	@echo.
	@echo   ══ BUILD COMPLETE — $(VERSION) ══
	@echo.

portal: ## Launch Atlantis Dashboard (Backend + Frontend)
	$(PYTHON) -m ops.launcher

graph: ## Run LangGraph orchestrator with a task
	$(PYTHON) -m core.graph.compiler --task "$(TASK)"

status: ## Show system status
	@echo.
	@$(PYTHON) -c "from core.version import get_version; print(f'  Version: {get_version()}')"
	@$(PYTHON) -c "import json, pathlib; d=json.loads(pathlib.Path('brain/bridge.json').read_text(encoding='utf-8')); print(f'  Pulse:   {d.get(\"pulse\", \"UNKNOWN\")}'); print(f'  Last:    {d.get(\"last_session\", \"never\")}')"
	@echo.

clean: ## Purge logs and Python caches
	@if exist logs\*.log del /q logs\*.log
	@if exist logs\*.jsonl del /q logs\*.jsonl
	@if exist logs\*.json del /q logs\*.json
	@if exist logs\*.pid del /q logs\*.pid
	@for /d /r . %%d in (__pycache__) do @if exist "%%d" rd /s /q "%%d"
	@echo   Cleaned.
