import os
from pathlib import Path

ROOT = Path(r"c:\Users\Clement\Gravity\AdaptativeIA\orion_v3")
MARKER = ""

def purge_markers():
    count = 0
    for root, _, files in os.walk(ROOT):
        for file in files:
            if file.endswith((".jsx", ".py", ".js", ".css")):
                p = Path(root) / file
                try:
                    content = p.read_text(encoding="utf-8")
                    if MARKER in content:
                        print(f"Purging {p}")
                        new_content = content.replace(MARKER, "")
                        p.write_text(new_content, encoding="utf-8")
                        count += 1
                except Exception as e:
                    pass
    print(f"Fixed {count} files.")

if __name__ == "__main__":
    purge_markers()
