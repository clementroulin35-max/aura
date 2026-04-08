"""
GSS Orion V3 — Resources Sentinel.
CPU/RAM monitoring with configurable thresholds.
"""
import logging
import time

import psutil

from core.sentinels.health import set_flag

logger = logging.getLogger(__name__)

CPU_THRESHOLD = 85.0
RAM_THRESHOLD = 85.0


def check_resources() -> dict:
    """Check CPU and RAM usage. Set health flags if thresholds exceeded."""
    cpu = psutil.cpu_percent(interval=0.5)
    ram = psutil.virtual_memory().percent

    result = {"cpu": cpu, "ram": ram, "status": "OK"}

    if cpu > CPU_THRESHOLD:
        result["status"] = "HIGH_CPU"
        set_flag("cpu_alert", f"CPU at {cpu}%")
        logger.warning("High CPU: %.1f%%", cpu)

    if ram > RAM_THRESHOLD:
        result["status"] = "HIGH_RAM"
        set_flag("ram_alert", f"RAM at {ram}%")
        logger.warning("High RAM: %.1f%%", ram)

    return result


def resources_loop(interval: int = 15) -> None:
    """Sentinel loop: check resources every interval seconds."""
    logger.info("Resources sentinel started (interval=%ds)", interval)
    while True:
        try:
            check_resources()
        except Exception as e:
            logger.error("Resources check error: %s", e)
        time.sleep(interval)


if __name__ == "__main__":
    resources_loop()
