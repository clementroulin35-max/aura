"""
GSS Orion V3 — Self-Healing Sentinel.
Monitors watchdog liveness (port 21230). Restarts if dead.
Max 3 restart attempts to prevent recursion.
"""
import logging
import subprocess
import sys
import time

from core.paths import ROOT
from core.sentinels.health import set_flag
from core.sentinels.utils import is_orion_alive

logger = logging.getLogger(__name__)

MAX_ATTEMPTS = 3
CHECK_INTERVAL = 20


def restart_watchdog() -> bool:
    """Attempt to restart the watchdog subprocess."""
    try:
        kwargs = {}
        if sys.platform == "win32":
            kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW
        subprocess.Popen(
            [sys.executable, "-m", "core.sentinels.watchdog"],
            cwd=str(ROOT),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            **kwargs,
        )
        time.sleep(5)
        return is_orion_alive()
    except Exception as e:
        logger.error("Watchdog restart failed: %s", e)
        return False


def self_healing_loop() -> None:
    """Monitor watchdog and restart if dead. Max 3 attempts."""
    logger.info("Self-Healing sentinel active. Monitoring port 21230.")
    attempts = 0

    while True:
        if is_orion_alive():
            attempts = 0  # Reset on success
        else:
            attempts += 1
            logger.warning("Watchdog dead. Restart attempt %d/%d", attempts, MAX_ATTEMPTS)
            set_flag("watchdog_status", f"DEAD (attempt {attempts}/{MAX_ATTEMPTS})")

            if attempts <= MAX_ATTEMPTS:
                if restart_watchdog():
                    logger.info("Watchdog resurrected. Pulse NOMINAL.")
                    set_flag("watchdog_status", "ALIVE (resurrected)")
                    attempts = 0
                else:
                    logger.error("Restart attempt %d FAILED.", attempts)
            else:
                logger.critical("Max restart attempts reached. ORION_RESCUE_REQUIRED.")
                set_flag("watchdog_status", "RESCUE_REQUIRED")
                attempts = 0  # Reset counter, keep trying

        time.sleep(CHECK_INTERVAL)


if __name__ == "__main__":
    self_healing_loop()
