"""
find_pdf_pages_v2.py
Improved PDF page scanner.
Uses broader keyword extraction + partial word matching to handle
slide PDFs where full phrases may not be present verbatim.
Falls back to best-match page (even score=1) rather than blindly returning page 1.
"""
import csv, re, sys
from pathlib import Path
import pdfplumber

PDF_DIR  = Path(__file__).parent / "pdfs"
CSV_IN   = Path(__file__).parent / "questions" / "QuestionBank.csv"
CSV_OUT  = Path(__file__).parent / "questions" / "QuestionBank_paged.csv"

STOP = {
    "is","are","has","have","a","an","the","of","in","on","at","to","for",
    "and","or","by","with","that","this","which","what","how","when","where",
    "why","who","can","will","was","were","does","do","it","its","if","be",
    "been","not","no","yes","two","three","four","five","same","based","used",
    "called","defined","equal","give","find","state","implies","represents",
    "occurs","consists","contains","shows","means","relates","measured",
    "provides","obtained","expressed","given","becomes","acts","known",
}

def extract_keywords(text: str) -> list[str]:
    """Return meaningful words from a question string."""
    text = re.sub(r"[?:()\[\]{}'\"\\]", " ", text.strip())
    words = re.split(r"[\s,/\-]+", text)
    # Keep words > 2 chars, not stop words, not pure numbers
    kws = [w.lower() for w in words
           if len(w) > 2 and w.lower() not in STOP and not w.isdigit()]
    return kws[:8]  # up to 8 keywords


# ---- Cache: read every PDF once ----
pdf_pages: dict[str, list[tuple[int, str]]] = {}

def load_pdf(filename: str):
    if filename in pdf_pages:
        return
    path = PDF_DIR / filename
    if not path.exists():
        pdf_pages[filename] = []
        print(f"  [MISS] {filename} not found in pdfs/", file=sys.stderr)
        return
    pages = []
    try:
        with pdfplumber.open(path) as pdf:
            for i, page in enumerate(pdf.pages, start=1):
                t = page.extract_text() or ""
                pages.append((i, t.lower()))
    except Exception as e:
        print(f"  [WARN] {filename}: {e}", file=sys.stderr)
    pdf_pages[filename] = pages


def find_best_page(pdf_filename: str, keywords: list[str]) -> int:
    if not keywords or not pdf_filename:
        return 1
    load_pdf(pdf_filename)
    pages = pdf_pages.get(pdf_filename, [])
    if not pages:
        return 1

    scores = []
    for page_num, text in pages:
        # Exact keyword hits
        exact = sum(1 for kw in keywords if kw in text)
        # Partial hits: keyword appears as substring (catches truncated/hyphenated words)
        partial = sum(0.4 for kw in keywords if any(kw[:4] in w for w in text.split()) and kw not in text)
        scores.append((exact + partial, page_num))

    best_score, best_page = max(scores, key=lambda x: x[0])

    # Only use the match if we got at least 1 real keyword hit
    # Otherwise fall back to page 1 (cover or intro)
    # But prefer ANY non-zero match over a flat page-1 default
    if best_score < 0.4:
        return 1
    return best_page


# ---- Main ----
rows = []
with open(CSV_IN, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        rows.append(row)

print(f"Processing {len(rows)} questions …")
changed = 0
for i, row in enumerate(rows):
    pdf_file = (row.get("pdfFile") or "").strip()
    question = (row.get("question") or "").strip()
    if not pdf_file or not question:
        continue
    kws = extract_keywords(question)
    old_page = row.get("pdfPage", "1")
    new_page = str(find_best_page(pdf_file, kws))
    row["pdfPage"] = new_page
    if new_page != old_page:
        changed += 1
    if (i + 1) % 50 == 0:
        print(f"  {i+1}/{len(rows)}")

with open(CSV_OUT, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"\nDone! Changed {changed} page numbers.")
print(f"Written to: {CSV_OUT}")
