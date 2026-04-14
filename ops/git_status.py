"""
GSS Orion V3 — Git Status tool.
Provides a summary of branch offsets relative to origin/main.
"""

import subprocess
import logging

from core.ui import print_banner, print_step

logger = logging.getLogger(__name__)

def count_commits(rev_range: str) -> int:
    """Count commits in a given range."""
    try:
        output = subprocess.check_output(
            ["git", "rev-list", rev_range, "--count"], 
            text=True, 
            stderr=subprocess.DEVNULL
        ).strip()
        return int(output)
    except Exception:
        return 0

def show_status():
    """Display the sync status of development branches."""
    print_banner("GIT BRANCH STATUS")
    
    # Attempt to fetch to get latest remote info
    try:
        subprocess.check_call(["git", "fetch", "origin", "-q"], stderr=subprocess.DEVNULL)
    except Exception:
        print_step("GIT", "Fetch failed — showing local status only.", "WARN")

    branches = ["flash", "high"]
    
    for branch in branches:
        print(f"\n[{branch.upper()}]")
        
        behind = count_commits(f"{branch}..origin/main")
        ahead = count_commits(f"origin/main..{branch}")
        
        status_behind = "OK" if behind == 0 else "WARN"
        status_ahead = "OK" if ahead > 0 else "INFO"
        
        print_step("STATUS", f"Behind origin/main: {behind}", status_behind)
        print_step("STATUS", f"Ahead origin/main:  {ahead}", status_ahead)

    print("")

if __name__ == "__main__":
    show_status()
