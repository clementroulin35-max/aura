"""
GSS Orion V3 — Watchdog Sentinel.
PID-based singleton + monitors other sentinels.
Fixes V2: actually binds the singleton port, no sys.exit() in __init__.
"""
import logging
import os
import socket
import subprocess
import sys
import time
from pathlib import Path

from core.paths import ROOT

logger = logging.getLogger(__name__)

PID_FILE = ROOT / "logs" / "watchdog.pid"
SINGLETON_PORT = 21230

SENTINEL_MODULES = [
    "core.sentinels.atlas",
    "core.sentinels.resources",
]


class WatchdogAlreadyRunning(RuntimeError):
    """Raised when another watchdog instance is detected."""


def _is_singleton_port_taken() -> bool:
    """Check if the singleton port is already in use."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("127.0.0.1", SINGLETON_PORT))
            return False  # Port free = no other instance
    except OSError:
        return True  # Port taken = another instance running


def _write_pid() -> None:
    """Write current PID to file."""
    PID_FILE.parent.mkdir(parents=True, exist_ok=True)
    PID_FILE.write_text(str(os.getpid()), encoding="utf-8")


def _start_sentinel(module: str) -> subprocess.Popen | None:
    """Start a sentinel as a subprocess."""
    python = sys.executable
    try:
        proc = subprocess.Popen(
            [python, "-m", module],
            cwd=str(ROOT),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        logger.info("Started sentinel %s (PID %d)", module, proc.pid)
        return proc
    except Exception as e:
        logger.error("Failed to start sentinel %s: %s", module, e)
        return None


def watchdog_loop(interval: int = 15) -> None:
    """
    Main watchdog loop:
    1. Enforce singleton via port binding
    2. Start sentinel subprocesses
    3. Monitor and restart dead sentinels
    """
    if _is_singleton_port_taken():
        raise WatchdogAlreadyRunning("Another watchdog is already running on port 21230")

    # Bind the singleton port (hold it for lifetime)
    singleton_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    singleton_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    singleton_socket.bind(("127.0.0.1", SINGLETON_PORT))
    singleton_socket.listen(1)

    _write_pid()
    logger.info("Watchdog started (PID %d, port %d)", os.getpid(), SINGLETON_PORT)

    # Start sentinels
    processes: dict[str, subprocess.Popen | None] = {}
    for mod in SENTINEL_MODULES:
        processes[mod] = _start_sentinel(mod)

    try:
        while True:
            for mod, proc in processes.items():
                if proc is None or proc.poll() is not None:
                    logger.warning("Sentinel %s died. Restarting...", mod)
                    processes[mod] = _start_sentinel(mod)
            time.sleep(interval)
    except KeyboardInterrupt:
        logger.info("Watchdog shutting down...")
    finally:
        for proc in processes.values():
            if proc and proc.poll() is None:
                proc.terminate()
        singleton_socket.close()
        if PID_FILE.exists():
            PID_FILE.unlink()


if __name__ == "__main__":
    watchdog_loop()
