"""
GSS Orion V3 — Sync Orchestrator.
Sequentially runs brain_layer → rules_layer → srp_layer.
Runnable as `python -m core.sync.orchestrator`.
"""
import logging
import time

from core.sync.brain_layer import sync_brain_layer
from core.sync.manifest import compute_hashes, save_manifest
from core.sync.rules_layer import sync_rules_layer
from core.sync.srp_layer import sync_srp_layer
from core.ui import print_banner, print_detail, print_step

logger = logging.getLogger(__name__)


def run_sync(verbose: bool = True) -> dict:
    """Execute full sync pipeline. Returns summary."""
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
