"""
GSS Orion V3 — Structured Logging Service.
Configures structlog with file rotation and console rendering.
Rule R10: all logging goes through structlog. No print() except ui.py.

Evolutive hooks:
- PILLARS dict can be extended for new packages (e.g. "plugins" → "plugins.log")
- External log sinks (e.g. Loki) can be added as additional handlers
"""

import logging
import logging.handlers
import sys
from typing import Any

import structlog

from core.paths import ROOT

LOGS_DIR = ROOT / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Pillar mapping: module prefix → log file
PILLARS: dict[str, str] = {
    "core": "system",
    "brain": "brain",
    "experts": "experts",
    "ops": "ops",
    "portal": "portal",
    # Evolutive: add new pillars here for plugin packages
}

_CONFIGURED = False


def setup_logging(name: str = "system", level: str = "INFO") -> Any:
    """Configure structlog with rotation and console/JSON rendering."""
    global _CONFIGURED

    pillar = next((v for k, v in PILLARS.items() if name.startswith(k)), "system")
    log_file = LOGS_DIR / f"{pillar}.log"

    if not _CONFIGURED:
        processors = [
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
        ]

        structlog.configure(
            processors=processors + [structlog.stdlib.ProcessorFormatter.wrap_for_formatter],
            logger_factory=structlog.stdlib.LoggerFactory(),
            cache_logger_on_first_use=True,
        )

        formatter = structlog.stdlib.ProcessorFormatter(
            processor=(structlog.dev.ConsoleRenderer() if sys.stderr.isatty() else structlog.processors.JSONRenderer()),
            foreign_pre_chain=processors,
        )

        console = logging.StreamHandler()
        console.setFormatter(formatter)

        file_handler = logging.handlers.RotatingFileHandler(
            log_file, maxBytes=10 * 1024 * 1024, backupCount=3, encoding="utf-8", delay=True
        )
        file_handler.setFormatter(formatter)

        root_logger = logging.getLogger()
        root_logger.setLevel(level.upper())
        root_logger.addHandler(console)
        root_logger.addHandler(file_handler)

        _CONFIGURED = True

    return structlog.get_logger(name)


def get_logger(name: str) -> Any:
    """Return a structlog logger (after setup_logging was called)."""
    return structlog.get_logger(name)
