"""
GSS Orion V3 — Resources Sentinel.
CPU/RAM monitoring + ghost process detection + alert injection.
Merges V1's ghost purge with V3's clean architecture.
"""

import logging
import os
import subprocess
import sys
import time

import psutil

from core.sentinels.health import set_flag

logger = logging.getLogger(__name__)

CPU_THRESHOLD = 85.0
RAM_THRESHOLD = 85.0
PURGE_CPU = 99.0
PURGE_RAM = 99.0
MAX_VIOLATIONS = 10


def get_ghost_processes() -> list[dict]:
    """Detect orphaned node.exe/python.exe processes."""
    ghosts = []
    for proc in psutil.process_iter(["pid", "name", "cmdline"]):
        try:
            cmdline = " ".join(proc.info.get("cmdline") or []).lower()
            name = (proc.info.get("name") or "").lower()
            # Orphaned node dev servers
            if "node" in name and "dev" in cmdline:
                parent = proc.parent()
                if not parent:
                    ghosts.append({"pid": proc.pid, "type": "node_orphan"})
            # Orphaned python watchdogs
            if "python" in name and "watchdog" in cmdline and proc.pid != os.getpid():
                parent = proc.parent()
                if not parent:
                    ghosts.append({"pid": proc.pid, "type": "python_orphan"})
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return ghosts


def purge_ghost(pid: int) -> bool:
    """Kill a ghost process by PID."""
    try:
        proc = psutil.Process(pid)
        proc.terminate()
        proc.wait(timeout=5)
        logger.info("Purged ghost PID %d", pid)
        return True
    except Exception as e:
        logger.warning("Ghost purge failed for PID %d: %s", pid, e)
        return False


def check_resources() -> dict:
    """Check CPU/RAM + ghost detection. Set health flags if thresholds exceeded."""
    cpu = psutil.cpu_percent(interval=0.5)
    ram = psutil.virtual_memory().percent
    ghosts = get_ghost_processes()

    result = {"cpu": cpu, "ram": ram, "ghosts": len(ghosts), "status": "OK"}

    if cpu > CPU_THRESHOLD:
        result["status"] = "HIGH_CPU"
        set_flag("cpu_alert", f"CPU at {cpu}%")
        logger.warning("High CPU: %.1f%%", cpu)

    if ram > RAM_THRESHOLD:
        result["status"] = "HIGH_RAM"
        set_flag("ram_alert", f"RAM at {ram}%")
        logger.warning("High RAM: %.1f%%", ram)

    if ghosts:
        set_flag("ghost_processes", f"{len(ghosts)} ghosts detected")
        for g in ghosts[:3]:
            purge_ghost(g["pid"])

    return result


def _emergency_purge() -> None:
    """Last resort: kill all node.exe processes to stabilize system."""
    logger.critical("EMERGENCY PURGE: Killing node.exe to save system.")
    try:
        if sys.platform == "win32":
            subprocess.run(["taskkill", "/F", "/IM", "node.exe", "/T"], capture_output=True, timeout=10)
    except Exception as e:
        logger.error("Emergency purge failed: %s", e)


def resources_loop(interval: int = 15) -> None:
    """Sentinel loop: check resources every interval seconds."""
    logger.info("Resources sentinel started (interval=%ds)", interval)
    violations = 0

    while True:
        try:
            result = check_resources()
            if result["cpu"] > PURGE_CPU or result["ram"] > PURGE_RAM:
                violations += 1
                logger.warning("Violation %d/%d", violations, MAX_VIOLATIONS)
                if violations >= MAX_VIOLATIONS:
                    _emergency_purge()
                    violations = 0
            else:
                violations = 0
        except Exception as e:
            logger.error("Resources check error: %s", e)
        time.sleep(interval)


if __name__ == "__main__":
    resources_loop()
