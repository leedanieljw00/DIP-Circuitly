"""
patch_questionbankdata.py
Reads QuestionBank_paged.csv (which has correct pdfPage values) and
patches the pdfPage column in QuestionBankData.js to match.
"""
import csv, re
from pathlib import Path

CSV_IN  = Path(__file__).parent / "questions" / "QuestionBank_paged.csv"
JS_FILE = Path(__file__).parent / "js" / "services" / "QuestionBankData.js"

# Build id -> page map from the paged CSV
id_to_page = {}
with open(CSV_IN, newline='', encoding='utf-8') as f:
    for row in csv.DictReader(f):
        id_to_page[row['id'].strip()] = row['pdfPage'].strip()

print(f"Loaded {len(id_to_page)} page mappings from CSV.")

js_text = JS_FILE.read_text(encoding='utf-8')

# The JS file rows look like:
#   101,1,"Kirchhoff's...",... ,EE2101_....pdf,1
# We need to replace the final ,<number> at the end of each data line.
# Strategy: match lines that start with a question id and update the last field.

def patch_line(m):
    qid = m.group(1)
    page = id_to_page.get(qid)
    if page:
        return m.group(0)[:-len(m.group(2))] + page
    return m.group(0)

# Pattern: line starting with digits (the id), ending with ,<number>
patched = re.sub(
    r'^(\d+),.*?,(\d+)\s*$',
    patch_line,
    js_text,
    flags=re.MULTILINE
)

JS_FILE.write_text(patched, encoding='utf-8')
print(f"Patched {JS_FILE.name} successfully.")

# Quick sanity check - how many lines were changed?
orig_lines = js_text.splitlines()
new_lines  = patched.splitlines()
changed = sum(1 for a, b in zip(orig_lines, new_lines) if a != b)
print(f"Changed {changed} lines.")
