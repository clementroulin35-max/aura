"""
GSS Orion V3 — Log Rotator Sentinel.
TTL-based log archival: rotates logs older than max_age_hours.
"""

import logging
import shutil
import time
from datetime import datetime, timedelta

from core.paths import ROOT

logger = logging.getLogger(__name__)

LOGS_DIR = ROOT / "logs"
ARCHIVE_DIR = LOGS_DIR / "archive"
MAX_AGE_HOURS = 24
MAX_SIZE_MB = 10


def rotate_logs(max_age_hours: int = MAX_AGE_HOURS, max_size_mb: int = MAX_SIZE_MB) -> dict:
    """Rotate log files exceeding age or size limits."""
    ARCHIVE_DIR.mkdir(parents=True, exist_ok=True)
    cutoff = datetime.now() - timedelta(hours=max_age_hours)
    rotated = []
    skipped = []

    for log_file in LOGS_DIR.glob("*.log"):
        try:
            stat = log_file.stat()
            mtime = datetime.fromtimestamp(stat.st_mtime)
            size_mb = stat.st_size / (1024 * 1024)

            should_rotate = mtime < cutoff or size_mb > max_size_mb
            if should_rotate:
                ts = mtime.strftime("%Y%m%d_%H%M%S")
                archive_name = f"{log_file.stem}_{ts}{log_file.suffix}"
                shutil.move(str(log_file), str(ARCHIVE_DIR / archive_name))
                rotated.append(log_file.name)
            else:
                skipped.append(log_file.name)
        except Exception as e:
            logger.warning("Log rotation failed for %s: %s", log_file.name, e)

    # Purge old archives (keep last 10)
    archives = sorted(ARCHIVE_DIR.glob("*.log"), key=lambda p: p.stat().st_mtime)
    while len(archives) > 10:
        old = archives.pop(0)
        old.unlink()
        logger.info("Purged old archive: %s", old.name)

    return {"rotated": rotated, "skipped": skipped, "archive_count": len(list(ARCHIVE_DIR.glob("*.log")))}


def log_rotator_loop(interval: int = 3600) -> None:
    """Sentinel loop: rotate logs every interval (default: 1 hour)."""
    logger.info("Log rotator sentinel started (interval=%ds)", interval)
    while True:
        try:
            result = rotate_logs()
            if result["rotated"]:
                logger.info("Rotated %d logs: %s", len(result["rotated"]), result["rotated"])
        except Exception as e:
            logger.error("Log rotation error: %s", e)
        time.sleep(interval)


if __name__ == "__main__":
    log_rotator_loop()
