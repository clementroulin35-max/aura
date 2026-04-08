"""
GSS Orion V3 — Memory RAG (Zero-dependency).
Inverted JSON index for semantic search over brain/ and .agents/ files.
No embeddings, no external deps — pure TF-IDF-like scoring.
Ported from V1's tools/memory_rag.py.
"""
import json
import logging
import re
import sys
from datetime import UTC, datetime

from core.paths import ROOT

logger = logging.getLogger(__name__)

INDEX_PATH = ROOT / "logs" / "memory_index.json"

SEARCH_DIRS = [
    ROOT / "brain",
    ROOT / ".agents" / "skills",
    ROOT / ".agents" / "rules",
]
EXTENSIONS = {".md", ".json", ".yaml", ".yml", ".txt"}
STOPWORDS = {"the", "and", "for", "with", "that", "this", "from", "les", "des", "pour", "dans", "une", "est"}


def _tokenize(text: str) -> list[str]:
    """Simple tokenization: lowercase, alphanumeric, filter short/stopwords."""
    words = re.findall(r"\w+", text.lower())
    return [w for w in words if len(w) > 2 and w not in STOPWORDS]


def build_index() -> dict:
    """Scan knowledge directories and build inverted index."""
    docs = {}
    words = {}
    doc_id = 0

    for search_dir in SEARCH_DIRS:
        if not search_dir.exists():
            continue
        is_sovereign = ".agents" in str(search_dir)

        for path in search_dir.rglob("*"):
            if not path.is_file() or path.suffix not in EXTENSIONS:
                continue
            try:
                content = path.read_text(encoding="utf-8", errors="ignore")
                rel_path = str(path.relative_to(ROOT))
                did = str(doc_id)
                doc_id += 1

                tokens = _tokenize(content)
                # Boost: title tokens count 3x
                tokens.extend(_tokenize(path.stem) * 3)

                docs[did] = {"path": rel_path, "title": path.name, "sovereign": is_sovereign}

                for token in set(tokens):
                    freq = tokens.count(token)
                    words.setdefault(token, []).append([did, freq])
            except Exception as e:
                logger.warning("Index error on %s: %s", path, e)

    index = {
        "metadata": {"last_index": datetime.now(UTC).isoformat(), "doc_count": len(docs)},
        "docs": docs,
        "words": words,
    }

    INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    INDEX_PATH.write_text(json.dumps(index, indent=2), encoding="utf-8")
    logger.info("Indexed %d documents.", len(docs))
    return index


def _load_index() -> dict:
    """Load existing index or build if missing."""
    if INDEX_PATH.exists():
        try:
            return json.loads(INDEX_PATH.read_text(encoding="utf-8"))
        except Exception:
            pass
    return build_index()


def query(text: str, limit: int = 5) -> list[dict]:
    """Search the index with sovereign boost (2x for .agents/ docs)."""
    index = _load_index()
    tokens = _tokenize(text)
    if not tokens:
        return []

    scores: dict[str, float] = {}
    for token in tokens:
        if token in index.get("words", {}):
            for doc_id, freq in index["words"][token]:
                doc_info = index["docs"].get(doc_id, {})
                multiplier = 2.0 if doc_info.get("sovereign") else 1.0
                scores[doc_id] = scores.get(doc_id, 0) + (freq * multiplier)

    sorted_results = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    results = []
    for doc_id, score in sorted_results[:limit]:
        doc = index["docs"].get(doc_id, {})
        results.append({
            "path": doc.get("path", ""),
            "title": doc.get("title", ""),
            "score": round(score, 2),
            "sovereign": doc.get("sovereign", False),
        })
    return results


if __name__ == "__main__":
    from core.ui import print_step

    if "--index" in sys.argv:
        idx = build_index()
        print_step("RAG", f"Indexed {idx['metadata']['doc_count']} documents", "OK")
    elif "--query" in sys.argv:
        qi = sys.argv.index("--query") + 1
        if qi < len(sys.argv):
            q = " ".join(sys.argv[qi:])
            results = query(q)
            if results:
                print(f"\n  RAG results for '{q}':")
                for r in results:
                    sov = " [SOV]" if r["sovereign"] else ""
                    print(f"    [{r['score']:5.1f}] {r['title']}{sov}  ({r['path']})")
            else:
                print(f"  No results for '{q}'.")
    else:
        print("Usage: memory_rag.py [--index | --query \"your question\"]")
