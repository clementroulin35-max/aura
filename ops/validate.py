"""
GSS Orion V3 — Full Validation Protocol.
Exercises every subsystem in 10 sequential steps.
Hot sentinel testing included (real port binding).
"""

import json
import socket
import subprocess
import sys
import time

from core.paths import ROOT
from core.ui import print_banner, print_detail, print_step

PYTHON = str(ROOT / "venv" / "Scripts" / "python.exe")
RESULTS: list[tuple[str, bool, str]] = []


def _run(label: str, args: list[str], timeout: int = 120) -> tuple[bool, str]:
    """Run a subprocess and return (success, output_tail)."""
    try:
        r = subprocess.run(args, capture_output=True, text=True, timeout=timeout, cwd=str(ROOT))
        ok = r.returncode == 0
        out = (r.stdout + r.stderr)[-500:]
        RESULTS.append((label, ok, out.strip()))
        return ok, out
    except subprocess.TimeoutExpired:
        RESULTS.append((label, False, "TIMEOUT"))
        return False, "TIMEOUT"
    except Exception as e:
        RESULTS.append((label, False, str(e)))
        return False, str(e)


def step_tests():
    """STEP 1: Unit tests (84+ tests)."""
    ok, out = _run("TESTS", [PYTHON, "-m", "pytest", "ops/tests/", "-q", "-n", "2", "--tb=line"])
    print_step("STEP 1", f"TESTS — {'PASS' if ok else 'FAIL'}", "OK" if ok else "FAIL")
    return ok


def step_lint():
    """STEP 2: Ruff linter."""
    ok, _ = _run("LINT", [PYTHON, "-m", "ruff", "check", "core/", "ops/"])
    print_step("STEP 2", f"LINT — {'PASS' if ok else 'FAIL'}", "OK" if ok else "FAIL")
    return ok


def step_governance():
    """STEP 3: Governance audit (R01-R10)."""
    ok, _ = _run("GOVERNANCE", [PYTHON, "-m", "ops.governance"])
    print_step("STEP 3", f"GOVERNANCE — {'PASS' if ok else 'FAIL'}", "OK" if ok else "FAIL")
    return ok


def step_sync():
    """STEP 4: Sync pipeline."""
    ok, _ = _run("SYNC", [PYTHON, "-m", "core.sync.orchestrator"])
    print_step("STEP 4", f"SYNC — {'PASS' if ok else 'FAIL'}", "OK" if ok else "FAIL")
    return ok


def step_memory():
    """STEP 5: Memory CRUD cycle."""
    ok1, _ = _run("MEM-LOG", [PYTHON, "-m", "ops.adaptive_memory", "--log", "validation", "Test entry from validate"])
    ok2, _ = _run("MEM-STATUS", [PYTHON, "-m", "ops.adaptive_memory", "--status"])
    ok3, _ = _run("MEM-COMPACT", [PYTHON, "-m", "ops.adaptive_memory", "--compact"])
    ok = ok1 and ok2 and ok3
    print_step("STEP 5", f"MEMORY CRUD — {'PASS' if ok else 'FAIL'}", "OK" if ok else "FAIL")
    return ok


def step_rag():
    """STEP 6: RAG index + query."""
    ok1, _ = _run("RAG-INDEX", [PYTHON, "-m", "ops.memory_rag", "--index"])
    ok2, _ = _run("RAG-QUERY", [PYTHON, "-m", "ops.memory_rag", "--query", "governance architecture"])
    ok = ok1 and ok2
    print_step("STEP 6", f"RAG — {'PASS' if ok else 'FAIL'}", "OK" if ok else "FAIL")
    return ok


def step_graph():
    """STEP 7: Graph mission execution."""
    ok, _ = _run("GRAPH", [PYTHON, "-m", "core.graph.compiler", "--task", "Validate codebase integrity"])
    # Verify scores.json was updated
    scores_path = ROOT / "brain" / "scores.json"
    scores_ok = scores_path.exists()
    if scores_ok:
        data = json.loads(scores_path.read_text(encoding="utf-8"))
        scores_ok = len(data.get("scores", {})) > 0
    ok = ok and scores_ok
    print_step("STEP 7", f"GRAPH + SCORING — {'PASS' if ok else 'FAIL'}", "OK" if ok else "FAIL")
    return ok


def step_intelligence():
    """STEP 8: Knowledge sentinel + leaderboard."""
    ok1, _ = _run("KNOWLEDGE", [PYTHON, "-m", "core.sentinels.knowledge"])
    ok2, _ = _run("LEADERBOARD", [PYTHON, "-m", "ops.dynamic_orchestrator", "--leaderboard"])
    ok = ok1 and ok2
    print_step("STEP 8", f"INTELLIGENCE — {'PASS' if ok else 'FAIL'}", "OK" if ok else "FAIL")
    return ok


def step_sentinels_hot():
    """STEP 9: Hot sentinel lifecycle (start → verify port → stop)."""
    port = 21230
    # Start
    ok1, _ = _run("SENT-START", [PYTHON, "-m", "ops.sentinel_manager", "startup"], timeout=15)
    time.sleep(3)  # Let watchdog bind port
    # Verify port is listening
    port_ok = False
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(2)
            port_ok = s.connect_ex(("127.0.0.1", port)) == 0
    except Exception:
        pass
    RESULTS.append(("SENT-PORT", port_ok, f"Port {port} {'OPEN' if port_ok else 'CLOSED'}"))
    # Stop
    ok3, _ = _run("SENT-STOP", [PYTHON, "-m", "ops.sentinel_manager", "stop"], timeout=15)
    time.sleep(1)
    ok = ok1 and port_ok and ok3
    print_step("STEP 9", f"SENTINELS HOT — {'PASS' if ok else 'FAIL'}", "OK" if ok else "FAIL")
    return ok


def step_crystallize():
    """STEP 10: Full crystallize + integrity."""
    ok1, _ = _run("CRYSTALLIZE", [PYTHON, "-m", "ops.crystallize"])
    ok2, _ = _run("INTEGRITY", [PYTHON, "-m", "ops.integrity_check"])
    # Verify bridge.json was updated
    bridge = json.loads((ROOT / "brain" / "bridge.json").read_text(encoding="utf-8"))
    bridge_ok = bridge.get("last_session") is not None
    ok = ok1 and ok2 and bridge_ok
    print_step("STEP 10", f"CRYSTALLIZE — {'PASS' if ok else 'FAIL'}", "OK" if ok else "FAIL")
    return ok


def validate() -> bool:
    """Run the full 10-step validation protocol."""
    print_banner("GSS ORION V3", "FULL VALIDATION PROTOCOL")

    steps = [
        step_tests,
        step_lint,
        step_governance,
        step_sync,
        step_memory,
        step_rag,
        step_graph,
        step_intelligence,
        step_sentinels_hot,
        step_crystallize,
    ]

    passed = 0
    for step_fn in steps:
        try:
            if step_fn():
                passed += 1
        except Exception as e:
            print_step(step_fn.__doc__ or "?", f"EXCEPTION: {e}", "FAIL")

    print_step("RESULT", f"{passed}/{len(steps)} steps passed", "OK" if passed == len(steps) else "FAIL")

    # Dump detailed report
    for label, ok, detail in RESULTS:
        status = "OK" if ok else "FAIL"
        print_detail(f"[{status:4s}] {label}: {detail[:120]}", status)

    return passed == len(steps)


if __name__ == "__main__":
    success = validate()
    sys.exit(0 if success else 1)
