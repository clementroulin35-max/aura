"""
GSS Orion V3 — Aeronautical CLI Interface.
Box-drawing characters + ANSI colors for structured console output.
Rule R10 exception: print() is ALLOWED only in this module.
"""

import contextlib
import os
import sys

# Force UTF-8 on Windows
if sys.platform == "win32":
    os.environ.setdefault("PYTHONUTF8", "1")
    with contextlib.suppress(Exception):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ANSI Colors
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
DIM = "\033[2m"
BOLD = "\033[1m"
RESET = "\033[0m"


def print_banner(title: str, subtitle: str = "") -> None:
    """Print a bordered banner."""
    width = max(len(title), len(subtitle)) + 6
    print(f"\n{CYAN}{'═' * width}{RESET}")
    print(f"  {BOLD}{title}{RESET}")
    if subtitle:
        print(f"  {DIM}{subtitle}{RESET}")
    print(f"{CYAN}{'═' * width}{RESET}\n")


def print_step(label: str, message: str, status: str = "INFO") -> None:
    """Print a labeled step with status indicator."""
    colors = {"OK": GREEN, "SUCCESS": GREEN, "FAIL": RED, "WARN": YELLOW, "PULSE": CYAN, "INFO": CYAN}
    icons = {"OK": "✓", "SUCCESS": "✓", "FAIL": "✗", "WARN": "⚠", "PULSE": "◉", "INFO": "▸"}
    color = colors.get(status, CYAN)
    icon = icons.get(status, "▸")
    print(f"  {color}{icon}{RESET} [{BOLD}{label}{RESET}] {message}")


def print_substep(label: str, message: str) -> None:
    """Print an indented sub-step."""
    print(f"    {DIM}├─{RESET} [{label}] {message}")


def print_detail(message: str, status: str = "OK") -> None:
    """Print a detail line with status."""
    color = GREEN if status in ("OK", "SUCCESS") else (RED if status == "FAIL" else YELLOW)
    print(f"    {DIM}│{RESET}  {color}{message}{RESET}")


def print_table(headers: list[str], rows: list[list[str]]) -> None:
    """Print a formatted ASCII table."""
    if not rows:
        return
    col_widths = [max(len(str(h)), max((len(str(r[i])) for r in rows), default=0)) for i, h in enumerate(headers)]
    sep = "  ┼".join("─" * (w + 2) for w in col_widths)

    header_line = "  │".join(f" {BOLD}{h:<{col_widths[i]}}{RESET} " for i, h in enumerate(headers))
    print(f"  {header_line}")
    print(f"  {sep}")
    for row in rows:
        line = "  │".join(f" {str(row[i]):<{col_widths[i]}} " for i in range(len(headers)))
        print(f"  {line}")
