"""
find_pdf_pages_v3.py
Smarter PDF page scanner.

Key improvements over v2:
- Skips first N "intro" pages (cover, agenda, outline) — these aggregate every topic keyword.
- Uses keyword DENSITY (hits / words_on_page) instead of raw count to avoid bias toward
  verbose overview slides that mention everything.
- Breaks ties by preferring the *earliest* high-density page (first explanation slide).
"""
import csv, re, sys
from pathlib import Path
import pdfplumber

PDF_DIR  = Path(__file__).parent / "pdfs"
CSV_IN   = Path(__file__).parent / "questions" / "QuestionBank.csv"
CSV_OUT  = Path(__file__).parent / "questions" / "QuestionBank_paged.csv"

# Pages to skip at the start of every PDF (cover/title only)
SKIP_INTRO_PAGES = 1

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
    text = re.sub(r"[?:()\[\]{}'\"\\]", " ", text.strip())
    words = re.split(r"[\s,/\-]+", text)
    kws = [w.lower() for w in words
           if len(w) > 2 and w.lower() not in STOP and not w.isdigit()]
    return list(dict.fromkeys(kws))[:8]   # deduplicate, max 8


# ---- PDF cache ----
pdf_pages: dict[str, list[tuple[int, str]]] = {}


def load_pdf(filename: str):
    if filename in pdf_pages:
        return
    path = PDF_DIR / filename
    if not path.exists():
        pdf_pages[filename] = []
        print(f"  [MISS] {filename}", file=sys.stderr)
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

    # Only search after the intro pages
    content_pages = [(pnum, text) for pnum, text in pages if pnum > SKIP_INTRO_PAGES]
    if not content_pages:
        content_pages = pages   # fallback: no pages left after skip

    best_density = -1.0
    best_page    = content_pages[0][0]   # default to first content page

    for page_num, text in content_pages:
        words_on_page = max(len(text.split()), 1)

        # Count keyword hits (exact match within the page text)
        hits = sum(1 for kw in keywords if kw in text)

        if hits == 0:
            continue

        # Density = hits per word — rewards focused slides over verbose overview slides
        density = hits / words_on_page

        # Prefer higher density; break ties by choosing earlier page
        if density > best_density:
            best_density = density
            best_page    = page_num

    return best_page if best_density > 0 else 1


# ---- Main ----
rows = []
with open(CSV_IN, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        rows.append(row)

print(f"Processing {len(rows)} questions (skipping first {SKIP_INTRO_PAGES} pages of each PDF) …")
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

print(f"\nDone!  Changed {changed} page numbers.")
print(f"Written to: {CSV_OUT}")
