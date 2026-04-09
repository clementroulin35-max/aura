"""
GSS Orion V3 — system.md Evaluator
Scores two draft versions of system.md against operational test questions using Gemini API.

Usage: python ops/scratch/eval_system_md.py
"""

import json
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent
CONFIG_PATH = ROOT / "brain" / "llm_config.json"
SCRATCH = ROOT / "ops" / "scratch"

# Load API key from config
config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
_gemini_cfg = config.get("providers", {}).get("gemini", {})
GEMINI_KEY = _gemini_cfg.get("api_key", "")
if not GEMINI_KEY:
    print("ERROR: No Gemini API key found in brain/llm_config.json#providers.gemini.api_key")
    sys.exit(1)

GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_KEY}"
)

EVAL_PROMPT = """You are simulating a FAST LLM (Gemini Flash, limited context, speed-optimized).
The system prompt above is your ONLY context about the project.

Answer these 6 questions as that FAST LLM would, then score your confidence (0-10):

Q1. What is the EXACT first Make command you run at the very start of a new session?
Q2. You are Gemini Flash. Can you push directly to the 'high' branch? Why or why not?
Q3. You wrote ops/my_module.py which is now 250 lines. What rule did you violate? What do you do?
Q4. You need a debug trace. Can you write `print("x =", x)` in `ops/governance.py`? Explain.
Q5. What happens automatically after a successful `make build` in HIGH mode (Claude)?
Q6. You must read a YAML file. Write the exact Python expression.

For EACH answer: one compact sentence, then `[Score: X/10]`.
At the end:
TOTAL: XX/60
CHARS: [count of chars in this system prompt — rough estimate]
VERDICT: [one sentence — what critical info is MISSING or AMBIGUOUS?]
"""

QUALITY_PROMPT = """You are an expert LLM prompt engineer evaluating a system.md file
used as a persistent system prompt for an AI coding assistant.

Rate the following system prompt on these 4 axes (0-10 each):
1. TOKEN_EFFICIENCY — Is it concise? Does it avoid redundant/historical content?
2. OPERATIONAL_COMPLETENESS — Can an LLM operate correctly from this alone?
3. CLARITY — Is the language precise? Could any instruction be misinterpreted?
4. STRUCTURE — Is the layout scannable and logically ordered?

Total: XX/40
One-line synthesis: what is the dominant strength and dominant weakness?
"""


MODELS = [
    "gemini-2.5-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro",
]


def call_gemini(system_content: str, user_message: str) -> str:
    """Call Gemini API with retry across model list."""
    import time

    payload = {
        "system_instruction": {"parts": [{"text": system_content}]},
        "contents": [{"parts": [{"text": user_message}]}],
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024},
    }
    data = json.dumps(payload).encode("utf-8")

    for model in MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_KEY}"
        for attempt in range(3):
            req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    result = json.loads(resp.read().decode("utf-8"))
                    text = result["candidates"][0]["content"]["parts"][0]["text"]
                    return f"[model: {model}]\n{text}"
            except urllib.error.HTTPError as e:
                body = e.read().decode("utf-8", errors="replace")
                if e.code in (429, 503):
                    wait = 2**attempt
                    print(f"    {model} {e.code} — retry in {wait}s...")
                    time.sleep(wait)
                elif e.code == 404:
                    print(f"    {model} deprecated — trying next model...")
                    break
                else:
                    return f"HTTP {e.code}: {body[:200]}"
            except Exception as e:
                return f"ERROR: {e}"

    return "ERROR: all models unavailable"


def evaluate(name: str, draft: str) -> dict:
    """Run both evaluation prompts on a draft and return results."""
    chars = len(draft)
    tokens_approx = chars // 4

    print(f"\n  Evaluating: {name} ({chars} chars / ~{tokens_approx} tokens)")
    print("  → Operational test (6 questions)...")
    operational = call_gemini(draft, EVAL_PROMPT)
    print("  → Quality audit (4 axes)...")
    quality = call_gemini(draft, QUALITY_PROMPT)

    return {
        "name": name,
        "chars": chars,
        "tokens_approx": tokens_approx,
        "operational": operational,
        "quality": quality,
    }


def main() -> None:
    drafts = {
        "VERSION A — Kernel (~minimal)": (SCRATCH / "system_v_a.md").read_text(encoding="utf-8"),
        "VERSION B — Structured Compact": (SCRATCH / "system_v_b.md").read_text(encoding="utf-8"),
    }

    print("═" * 70)
    print("  GSS ORION V3 — system.md Evaluation via Gemini API")
    print("═" * 70)

    results = []
    for name, draft in drafts.items():
        results.append(evaluate(name, draft))

    # Print full report
    report_lines = ["# GSS Orion V3 — system.md Evaluation Report\n"]
    for r in results:
        report_lines.append(f"## {r['name']}")
        report_lines.append(f"**Size**: {r['chars']} chars / ~{r['tokens_approx']} tokens\n")
        report_lines.append("### Operational Test (6 questions)\n")
        report_lines.append(r["operational"])
        report_lines.append("\n### Quality Audit (4 axes)\n")
        report_lines.append(r["quality"])
        report_lines.append("\n---\n")

    report = "\n".join(report_lines)
    report_path = SCRATCH / "eval_report.md"
    report_path.write_text(report, encoding="utf-8")

    print("\n" + "═" * 70)
    print(f"  Report saved: {report_path}")
    print("═" * 70)
    print(report)


if __name__ == "__main__":
    main()
