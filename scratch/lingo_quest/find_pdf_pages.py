"""
find_pdf_pages.py
Scans each lecture PDF for keywords extracted from each question in QuestionBank.csv,
then writes out a CSV showing the best-matching page number per question.
"""
import csv, re, sys
from pathlib import Path
import pdfplumber

PDF_DIR  = Path(__file__).parent / "pdfs"
CSV_IN   = Path(__file__).parent / "questions" / "QuestionBank.csv"
CSV_OUT  = Path(__file__).parent / "questions" / "QuestionBank_paged.csv"


def extract_keywords(text: str) -> list[str]:
    """Return 2-5 meaningful words from a question string."""
    # Strip trailing colon / question punctuation
    text = re.sub(r"[?:]\s*$", "", text.strip())
    # Remove common filler words
    STOP = {
        "is","are","has","have","a","an","the","of","in","on","at","to","for",
        "and","or","by","with","that","this","which","what","how","when","where",
        "why","who","can","will","was","were","does","do","it","its","if","be",
        "been","not","no","yes","two","three","four","five","same","based","used",
        "called","defined","equal","give","find","state","implies","represents",
        "occurs","consists","contains","shows","means","relates","measured",
        "provides","obtained","expressed","given","becomes","acts","known","seen",
    }
    words = [w for w in re.split(r"[\s\(\)/,]+", text)
             if w and w.lower() not in STOP and len(w) > 2]
    return words[:5]


# ---- Cache: read every PDF once, store list of (page_number, lower_text) ----
pdf_pages: dict[str, list[tuple[int, str]]] = {}

def load_pdf(filename: str):
    if filename in pdf_pages:
        return
    path = PDF_DIR / filename
    if not path.exists():
        pdf_pages[filename] = []
        return
    pages = []
    try:
        with pdfplumber.open(path) as pdf:
            for i, page in enumerate(pdf.pages, start=1):
                t = page.extract_text() or ""
                pages.append((i, t.lower()))
    except Exception as e:
        print(f"  [WARN] Could not read {filename}: {e}", file=sys.stderr)
    pdf_pages[filename] = pages


def find_best_page(pdf_filename: str, keywords: list[str]) -> int:
    """Return the 1-indexed page number with the most keyword hits."""
    if not keywords or not pdf_filename:
        return 1
    load_pdf(pdf_filename)
    pages = pdf_pages.get(pdf_filename, [])
    if not pages:
        return 1

    best_page, best_score = 1, 0
    for page_num, text in pages:
        score = sum(1 for kw in keywords if kw.lower() in text)
        if score > best_score:
            best_score = score
            best_page = page_num

    return best_page


# ---- Main ----
rows = []
with open(CSV_IN, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        rows.append(row)

print(f"Processing {len(rows)} questions across PDFs …")
for i, row in enumerate(rows):
    pdf_file = (row.get("pdfFile") or "").strip()
    question = (row.get("question") or "").strip()
    if not pdf_file or not question:
        continue
    kws = extract_keywords(question)
    page = find_best_page(pdf_file, kws)
    row["pdfPage"] = str(page)
    if (i + 1) % 50 == 0:
        print(f"  … {i+1}/{len(rows)}")

with open(CSV_OUT, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"\nDone! Updated CSV written to:\n  {CSV_OUT}")
