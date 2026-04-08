"""
GSS Orion V3 — Portal Launcher.
Orchestrates Backend (FastAPI) + Frontend (Vite) in parallel.
Includes sentinel lifecycle management.
"""
import logging
import os
import signal
import subprocess
import sys

from core.paths import ROOT
from core.ui import print_banner, print_step

logger = logging.getLogger(__name__)

BACKEND_PORT = 8000
FRONTEND_PORT = 5173


def _kill_port(port: int) -> None:
    """Kill process on a given port (Windows)."""
    try:
        result = subprocess.run(
            ["netstat", "-ano"], capture_output=True, text=True, timeout=5
        )
        for line in result.stdout.splitlines():
            if f":{port}" in line and "LISTENING" in line:
                pid = line.strip().split()[-1]
                subprocess.run(["taskkill", "/F", "/PID", pid], capture_output=True, timeout=5)
    except Exception:
        pass


def start_sentinels() -> subprocess.Popen | None:
    """Start watchdog sentinel as subprocess."""
    python = sys.executable
    try:
        return subprocess.Popen(
            [python, "-m", "core.sentinels.watchdog"],
            cwd=str(ROOT),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception as e:
        logger.warning("Sentinel start failed: %s", e)
        return None


def stop_sentinels() -> None:
    """Stop watchdog by killing the PID."""
    pid_file = ROOT / "logs" / "watchdog.pid"
    if pid_file.exists():
        try:
            pid = int(pid_file.read_text(encoding="utf-8").strip())
            os.kill(pid, signal.SIGTERM)
            pid_file.unlink()
            print_step("SENTINELS", f"Watchdog PID {pid} terminated", "OK")
        except Exception as e:
            logger.warning("Sentinel stop error: %s", e)


def launch_portal() -> None:
    """Launch Backend + Frontend in parallel."""
    print_banner("GSS ORION V3 — ATLANTIS PORTAL", "Launching Dashboard...")

    _kill_port(BACKEND_PORT)
    _kill_port(FRONTEND_PORT)

    python = sys.executable
    backend = subprocess.Popen(
        [python, "-m", "uvicorn", "portal.backend.app:app", "--host", "0.0.0.0", "--port", str(BACKEND_PORT), "--reload"],
        cwd=str(ROOT),
    )

    frontend_dir = ROOT / "portal" / "frontend"
    frontend = None
    if (frontend_dir / "package.json").exists():
        npm = "npm.cmd" if sys.platform == "win32" else "npm"
        frontend = subprocess.Popen(
            [npm, "run", "dev"],
            cwd=str(frontend_dir),
        )

    # Start sentinels
    sentinel = start_sentinels()

    print_step("BACKEND", f"http://localhost:{BACKEND_PORT}", "PULSE")
    if frontend:
        print_step("FRONTEND", f"http://localhost:{FRONTEND_PORT}", "PULSE")
    if sentinel:
        print_step("SENTINELS", "Watchdog active", "PULSE")

    try:
        backend.wait()
    except KeyboardInterrupt:
        print_step("SHUTDOWN", "Terminating...", "WARN")
        backend.terminate()
        if frontend:
            frontend.terminate()
        if sentinel:
            sentinel.terminate()


if __name__ == "__main__":
    launch_portal()
