"""
GSS Orion V3 — Sentinel Manager.
Lifecycle management: startup, stop, verify, purge.
Ported from V1's tools/sentinel_manager.py with V3 clean architecture.
"""

import contextlib
import logging
import os
import subprocess
import sys
import time

import psutil

from core.paths import ROOT
from core.sentinels.utils import is_orion_alive

logger = logging.getLogger(__name__)

LOGS_DIR = ROOT / "logs"
LOCK_FILE = LOGS_DIR / "gss_build.lock"

PID_FILES = ["watchdog.pid", "atlas.pid", "resources.pid", "git_drift.pid", "log_rotator.pid"]


def startup() -> bool:
    """Start the watchdog (which starts all other sentinels)."""
    if is_orion_alive():
        logger.info("Sentinel stack already active (Pulse OK).")
        return True

    logger.info("Launching watchdog...")
    try:
        kwargs = {}
        if sys.platform == "win32":
            kwargs["creationflags"] = subprocess.CREATE_NEW_PROCESS_GROUP
        subprocess.Popen(
            [sys.executable, "-m", "core.sentinels.watchdog"],
            cwd=str(ROOT),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            **kwargs,
        )
        time.sleep(3)
        return verify(timeout=10)
    except Exception as e:
        logger.error("Watchdog startup failed: %s", e)
        return False


def stop() -> None:
    """Graceful shutdown: kill all sentinel processes by PID file."""
    for pid_file in PID_FILES:
        path = LOGS_DIR / pid_file
        if path.exists():
            try:
                pid = int(path.read_text().strip())
                if psutil.pid_exists(pid) and pid != os.getpid():
                    proc = psutil.Process(pid)
                    proc.terminate()
                    proc.wait(timeout=5)
                    logger.info("Terminated %s (PID %d)", pid_file, pid)
            except Exception as e:
                logger.warning("Stop failed for %s: %s", pid_file, e)
            with contextlib.suppress(Exception):
                path.unlink()

    # Also kill by port (watchdog holds 21230)
    for conn in psutil.net_connections():
        if conn.laddr.port == 21230 and conn.status == "LISTEN":
            try:
                proc = psutil.Process(conn.pid)
                proc.terminate()
            except Exception:
                pass

    logger.info("All sentinels stopped.")


def verify(timeout: int = 15) -> bool:
    """Verify sentinel stack is alive within timeout."""
    start = time.time()
    while time.time() - start < timeout:
        if is_orion_alive():
            logger.info("Sentinel stack NOMINAL (Pulse OK).")
            return True
        time.sleep(1)
    logger.warning("Sentinel stack not stabilized within %ds.", timeout)
    return False


def lock() -> None:
    """Acquire exclusive build lock."""
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    if LOCK_FILE.exists():
        try:
            pid = int(LOCK_FILE.read_text().strip())
            if psutil.pid_exists(pid) and pid != os.getpid():
                logger.error("Another GSS operation running (PID %d).", pid)
                sys.exit(1)
        except Exception:
            pass
    LOCK_FILE.write_text(str(os.getpid()))


def unlock() -> None:
    """Release exclusive build lock."""
    if LOCK_FILE.exists():
        try:
            pid = int(LOCK_FILE.read_text().strip())
            if pid == os.getpid():
                LOCK_FILE.unlink()
        except Exception:
            pass


if __name__ == "__main__":
    from core.ui import print_step

    if len(sys.argv) < 2:
        print_step("USAGE", "sentinel_manager.py [startup|stop|verify|lock|unlock]", "INFO")
        sys.exit(1)

    cmd = sys.argv[1].lower()
    if cmd == "startup":
        ok = startup()
        print_step("SENTINELS", "Stack ACTIVE" if ok else "Stack FAILED", "OK" if ok else "FAIL")
    elif cmd == "stop":
        stop()
        print_step("SENTINELS", "Stack stopped.", "OK")
    elif cmd == "verify":
        ok = verify()
        print_step("SENTINELS", "NOMINAL" if ok else "NOT READY", "OK" if ok else "WARN")
    elif cmd == "lock":
        lock()
    elif cmd == "unlock":
        unlock()
