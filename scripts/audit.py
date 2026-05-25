#!/usr/bin/env python3
"""Verbatim audit (mupdf edition): confirm each question's text + correct
option match the ČTÚ PDF for all three subjects (predpisy, provoz,
elektrotechnika), modulo the two allowed presentational tweaks
(capitalize first letter, append trailing colon).

Items where the PDF formatting is non-standard (no "- answer" pattern)
are listed in SKIP_VERBATIM — these are spot-checked by humans, not by
the regex parser. Currently this covers the 9 phonetic alphabet items
in provoz (45-53), whose "answer" is a multi-line table of letters.
"""

import json
import os
import re
import subprocess
import sys
import tempfile

PDF = "docs/2018_05_zkousky_otazky_v5_fin.pdf"
BANK = "src/data/questions.json"

# Items whose PDF formatting doesn't fit the regex-based extractor (multi-line
# tables, etc.). Authored manually, verified by spot-check, not by audit.
SKIP_VERBATIM = {
    ("provoz", 45), ("provoz", 46), ("provoz", 47), ("provoz", 48),
    ("provoz", 49), ("provoz", 50), ("provoz", 51), ("provoz", 52),
    ("provoz", 53),
    # Item 71's PDF has no "- " marker before the answer; the answer is just
    # the next paragraph. We accept this on faith too.
    ("provoz", 71),
}

# Extract with mutool
with tempfile.NamedTemporaryFile(suffix=".txt", delete=False) as f:
    out_path = f.name
try:
    subprocess.run(
        ["mutool", "convert", "-F", "txt", "-o", out_path, PDF],
        capture_output=True, check=True,
    )
    with open(out_path) as f:
        raw = f.read()
finally:
    os.unlink(out_path)

# Strip page footer artifacts
raw = re.sub(r"^\s*2018_05\s*$", "", raw, flags=re.MULTILINE)
raw = re.sub(r"^\s*\d+/\d+\s*$", "", raw, flags=re.MULTILINE)
raw = re.sub(r"^\s*V5\s*$", "", raw, flags=re.MULTILINE)

# Locate the three VFL sections (first occurrences of each marker)
m_a = re.search(r"a\)\s+radiokomunikační předpisy:", raw)
m_b = re.search(r"b\)\s+radiokomunikační provoz:", raw[m_a.end():])
m_c = re.search(r"c\)\s+elektrotechnika a radiotechnika:", raw[m_a.end() + m_b.end():])

# Absolute positions of each header (start) and content (end of header)
a_header_start = m_a.start()
a_content_start = m_a.end()
b_header_start = a_content_start + m_b.start()
b_content_start = a_content_start + m_b.end()
c_header_start = b_content_start + m_c.start()
c_content_start = b_content_start + m_c.end()

# end of c section: "Vyhodnocení", "(2)", or end of doc
m_end = re.search(r"Vyhodnocení|\(2\)|^\s*B\.", raw[c_content_start:], flags=re.MULTILINE)
c_end = c_content_start + (m_end.start() if m_end else len(raw[c_content_start:]))

predpisy_section = raw[a_content_start: b_header_start]
provoz_section   = raw[b_content_start: c_header_start]
elektro_section  = raw[c_content_start: c_end]

HYPHEN_WRAP = re.compile(r"(\w)-\s+(\w)", re.UNICODE)

def norm(s):
    s = HYPHEN_WRAP.sub(r"\1-\2", s)
    return re.sub(r"\s+", " ", s).strip()

def parse_section(section):
    flat = re.sub(r"\s+", " ", section).strip()
    flat = HYPHEN_WRAP.sub(r"\1-\2", flat)
    item_re = re.compile(r"(?:^|(?<=\s))(\d{1,3})\.\s+(.+?)(?=\s\d{1,3}\.\s+|\Z)")
    items = {}
    for m in item_re.finditer(flat):
        n = int(m.group(1))
        body = m.group(2).strip()
        parts = re.split(r"\s-\s+", body, maxsplit=1)
        if len(parts) != 2:
            continue
        items[n] = (parts[0].strip(), parts[1].strip())
    return items

pdf_items = {
    "predpisy": parse_section(predpisy_section),
    "provoz":   parse_section(provoz_section),
    "elektrotechnika": parse_section(elektro_section),
}

with open(BANK) as f:
    bank = json.load(f)

def eq_first_letter_insensitive(a, b):
    a, b = norm(a), norm(b)
    if not a or not b:
        return a == b
    return a[0].lower() == b[0].lower() and a[1:] == b[1:]

errors = []
audited = {"predpisy": 0, "provoz": 0, "elektrotechnika": 0}
skipped = 0

for q in bank:
    subj = q["subject"]
    src_num = int(q["source"].split(".")[-1])

    if (subj, src_num) in SKIP_VERBATIM:
        skipped += 1
        continue

    items = pdf_items[subj]
    if src_num not in items:
        errors.append(f"{q['id']}: PDF item {subj}.{src_num} not parsed")
        continue
    pdf_q, pdf_a = items[src_num]

    bank_q = q["question"]
    if bank_q.endswith(":"):
        bank_q = bank_q[:-1]
    # Strip PDF's own trailing colon too — some PDF items already end in ":".
    pdf_q_cmp = pdf_q[:-1] if pdf_q.endswith(":") else pdf_q

    bank_a = q["options"][q["correct"]]

    if not eq_first_letter_insensitive(bank_q, pdf_q_cmp):
        errors.append(
            f"{q['id']} ({subj}.{src_num}) QUESTION mismatch:\n"
            f"  PDF:  {pdf_q_cmp!r}\n"
            f"  bank: {norm(bank_q)!r}"
        )
        continue

    if norm(bank_a) != pdf_a:
        errors.append(
            f"{q['id']} ({subj}.{src_num}) ANSWER mismatch:\n"
            f"  PDF:  {pdf_a!r}\n"
            f"  bank: {norm(bank_a)!r}"
        )
        continue

    audited[subj] += 1

if errors:
    print(f"{len(errors)} mismatch(es), {sum(audited.values())} OK, {skipped} skipped:\n")
    for e in errors:
        print(e)
        print()
    sys.exit(1)

print(f"OK — {sum(audited.values())} questions match ČTÚ PDF verbatim "
      f"(predpisy={audited['predpisy']}, provoz={audited['provoz']}, "
      f"elektrotechnika={audited['elektrotechnika']}; {skipped} skipped: phonetic/non-standard)")
