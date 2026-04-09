"""
GSS Orion V3 — Knowledge Sentinel.
Monitors adaptive memory for ingestion thresholds.
Signals alerts when pending entries exceed threshold.
Ported from V1's engine/knowledge_sentinel.py.
"""

import json
import logging
import time

from core.paths import ROOT
from core.sentinels.health import set_flag

logger = logging.getLogger(__name__)

MEMORY_PATH = ROOT / "brain" / "memory.json"
ALERTS_PATH = ROOT / "logs" / "sentinel_alerts.jsonl"
INGESTION_THRESHOLD = 5
COMPACTION_THRESHOLD = 100


def check_knowledge() -> dict:
    """Check adaptive memory status and classify pending by target."""
    if not MEMORY_PATH.exists():
        return {"status": "NO_MEMORY", "pending": 0, "total": 0, "targets": {}}

    try:
        data = json.loads(MEMORY_PATH.read_text(encoding="utf-8"))
    except Exception as e:
        logger.warning("Memory parse error: %s", e)
        return {"status": "ERROR", "pending": 0, "total": 0, "targets": {}}

    entries = data.get("entries", [])
    pending = [e for e in entries if e.get("status") == "pending"]
    total = len(entries)

    # Classify pending by target file
    targets: dict[str, list[str]] = {}
    for entry in pending:
        tags = entry.get("tags", [])
        cat = entry.get("category", "")

        if cat == "calibration" and any(t in tags for t in ["personality", "tone"]):
            target = "personality"
        elif cat in ("defect", "error") or any(t in tags for t in ["build", "pipeline", "sentinel"]):
            target = "roadmap"
        elif any(t in tags for t in ["core", "D01", "D02", "D03", "R01", "R02", "R03"]):
            target = "principles"
        elif any(t in tags for t in ["governance", "REX", "pillar"]):
            target = "governance"
        else:
            target = "general"

        targets.setdefault(target, []).append(entry.get("id", "unknown"))

    result = {"status": "OK", "total": total, "pending": len(pending), "targets": targets}

    if len(pending) >= INGESTION_THRESHOLD:
        result["status"] = "INGESTION_REQUIRED"
        set_flag("knowledge", f"INGESTION:{len(pending)} pending")
    elif total >= COMPACTION_THRESHOLD:
        result["status"] = "COMPACTION_NEEDED"
        set_flag("knowledge", f"COMPACT:{total} entries")

    return result


def signal_alert(check_result: dict) -> bool:
    """Write alert to sidecar JSONL if ingestion is required."""
    if check_result["status"] != "INGESTION_REQUIRED":
        return False

    target_summary = ", ".join(f"{k}:{len(v)}" for k, v in check_result["targets"].items() if v)
    alert = {
        "message": f"KNOWLEDGE_INGESTION: {check_result['pending']} pending. Targets: {target_summary}",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "severity": "WARN",
        "source": "knowledge_sentinel",
    }

    try:
        ALERTS_PATH.parent.mkdir(parents=True, exist_ok=True)
        with ALERTS_PATH.open("a", encoding="utf-8") as f:
            f.write(json.dumps(alert) + "\n")
        logger.info("Knowledge alert: %s", alert["message"])
        return True
    except Exception as e:
        logger.warning("Alert write failed: %s", e)
        return False


def knowledge_loop(interval: int = 120) -> None:
    """Sentinel loop: check knowledge health every interval."""
    logger.info("Knowledge sentinel started (interval=%ds)", interval)
    while True:
        try:
            result = check_knowledge()
            if result["status"] in ("INGESTION_REQUIRED", "COMPACTION_NEEDED"):
                signal_alert(result)
                logger.warning("Knowledge status: %s (%d pending)", result["status"], result["pending"])
        except Exception as e:
            logger.error("Knowledge check error: %s", e)
        time.sleep(interval)


if __name__ == "__main__":
    import sys

    from core.ui import print_step

    if "--loop" in sys.argv:
        knowledge_loop()
    else:
        result = check_knowledge()
        signal_alert(result)
        print_step(
            "KNOWLEDGE",
            f"{result['status']} — {result['pending']} pending, {result['total']} total",
            "OK" if result["status"] == "OK" else "WARN",
        )
