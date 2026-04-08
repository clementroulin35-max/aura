"""
GSS Orion V3 — Watchdog Sentinel.
PID-based singleton + PulseServer TCP + sentinel subprocess management.
Fixes V2: actually binds the singleton port, no sys.exit() in __init__.
V3.1: PulseServer responds "PULSE_OK" for liveness probes.
"""
import logging
import os
import socket
import subprocess
import sys
import threading
import time

from core.paths import ROOT

logger = logging.getLogger(__name__)

PID_FILE = ROOT / "logs" / "watchdog.pid"
SINGLETON_PORT = 21230

SENTINEL_MODULES = [
    "core.sentinels.atlas",
    "core.sentinels.resources",
    "core.sentinels.git_drift",
    "core.sentinels.log_rotator",
]


class WatchdogAlreadyRunningError(RuntimeError):
    """Raised when another watchdog instance is detected."""


def _is_singleton_port_taken() -> bool:
    """Check if the singleton port is already in use."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.bind(("127.0.0.1", SINGLETON_PORT))
            return False
    except OSError:
        return True


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


def _pulse_handler(conn: socket.socket) -> None:
    """Handle a pulse probe: respond PULSE_OK and close."""
    try:
        conn.sendall(b"PULSE_OK\n")
    except Exception:
        pass
    finally:
        conn.close()


def _run_pulse_server(server_socket: socket.socket) -> None:
    """Background thread: accept pulse connections."""
    while True:
        try:
            conn, _ = server_socket.accept()
            threading.Thread(target=_pulse_handler, args=(conn,), daemon=True).start()
        except OSError:
            break
        except Exception as e:
            logger.warning("Pulse server error: %s", e)


def watchdog_loop(interval: int = 15) -> None:
    """
    Main watchdog loop:
    1. Enforce singleton via port binding
    2. Start PulseServer (responds PULSE_OK to liveness probes)
    3. Start sentinel subprocesses
    4. Monitor and restart dead sentinels
    """
    if _is_singleton_port_taken():
        raise WatchdogAlreadyRunningError("Another watchdog is on port 21230")

    # Bind singleton port + PulseServer
    server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server_socket.bind(("127.0.0.1", SINGLETON_PORT))
    server_socket.listen(5)

    pulse_thread = threading.Thread(target=_run_pulse_server, args=(server_socket,), daemon=True)
    pulse_thread.start()

    _write_pid()
    logger.info("Watchdog started (PID %d, port %d, PulseServer ON)", os.getpid(), SINGLETON_PORT)

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
        server_socket.close()
        if PID_FILE.exists():
            PID_FILE.unlink()


if __name__ == "__main__":
    watchdog_loop()
