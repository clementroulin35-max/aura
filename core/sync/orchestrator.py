"""
GSS Orion V3 — Sync Orchestrator.
Sequentially runs brain_layer → rules_layer → srp_layer.
Features: PID-based sync lock (V1 pattern), integrity hashing post-sync.
Runnable as `python -m core.sync.orchestrator`.
"""
import contextlib
import logging
import os
import time

from core.paths import ROOT
from core.sync.brain_layer import sync_brain_layer
from core.sync.manifest import compute_hashes, save_manifest
from core.sync.rules_layer import sync_rules_layer
from core.sync.srp_layer import sync_srp_layer
from core.ui import print_banner, print_detail, print_step

logger = logging.getLogger(__name__)

LOCK_FILE = ROOT / ".sync.lock"


def _acquire_lock() -> bool:
    """PID-based sync lock to prevent concurrent runs."""
    if LOCK_FILE.exists():
        try:
            pid = int(LOCK_FILE.read_text().strip())
            try:
                os.kill(pid, 0)
                logger.warning("Sync already running (PID %d). Aborting.", pid)
                return False
            except OSError:
                pass  # Stale lock — process dead
        except (ValueError, OSError):
            pass
    LOCK_FILE.write_text(str(os.getpid()), encoding="utf-8")
    return True


def _release_lock() -> None:
    """Release sync lock."""
    if LOCK_FILE.exists():
        with contextlib.suppress(Exception):
            LOCK_FILE.unlink()


def run_sync(verbose: bool = True) -> dict:
    """Execute full sync pipeline with lock protection. Returns summary."""
    if not _acquire_lock():
        return {"status": "LOCKED"}

    try:
        return _sync_impl(verbose)
    finally:
        _release_lock()


def _sync_impl(verbose: bool) -> dict:
    """Core sync implementation."""
    results: dict = {"brain": [], "rules": [], "srp": [], "status": "OK"}

    # Layer 1: Brain
    results["brain"] = sync_brain_layer()
    brain_ok = all(r["status"] == "OK" for r in results["brain"])

    # Layer 2: Rules
    results["rules"] = sync_rules_layer()
    rules_ok = all(r["status"] == "OK" for r in results["rules"])

    # Layer 3: SRP
    results["srp"] = sync_srp_layer()
    srp_ok = len(results["srp"]) == 0

    results["status"] = "OK" if (brain_ok and rules_ok and srp_ok) else "ISSUES"

    # Update manifest
    hashes = compute_hashes()
    save_manifest({"hashes": hashes, "last_sync": time.time()})

    if verbose:
        _print_report(results)

    return results


def _print_report(results: dict) -> None:
    """Print sync results to console."""
    print_banner("GSS ORION V3 — SYNC PIPELINE")

    print_step("BRAIN", f"{len(results['brain'])} files", "OK" if all(r['status'] == 'OK' for r in results['brain']) else "WARN")
    for r in results["brain"]:
        print_detail(f"{r['file']}: {r['status']}", r["status"])

    print_step("RULES", f"{len(results['rules'])} files", "OK" if all(r['status'] == 'OK' for r in results['rules']) else "WARN")
    for r in results["rules"]:
        print_detail(f"{r['file']}: {r['status']}", r["status"])

    srp_status = "OK" if not results["srp"] else "FAIL"
    print_step("SRP", f"{len(results['srp'])} violations", srp_status)
    for v in results["srp"]:
        print_detail(f"{v['file']}: {v['lines']}L (+{v['over_by']})", "FAIL")


if __name__ == "__main__":
    run_sync()
