#!/usr/bin/env python3
"""Migrate bank from 2018_05 V5 to 2025_09 VFL_4.

Strategy:
1. Parse the new PDF (already extracted to /tmp/2025_vfl.txt).
2. For each old bank entry, find the matching new PDF item by content
   (question + correct answer text). On match, keep distractors and
   explanation, update question/correct option to verbatim new PDF text
   AND update source citation. Reassign sequential ID per subject.
3. For PDF items with no bank match, author a new entry with distractors.
4. Drop bank entries that don't appear in the new PDF.
5. Renumber IDs sequentially per subject for cleanliness.
"""
import json
import re
from pathlib import Path

BANK = Path("src/data/questions.json")
NEW_TXT = Path("/tmp/2025_vfl.txt")

# Re-parse new PDF
raw = NEW_TXT.read_text()
raw = re.sub(r'^\s*2025_09\s*$', '', raw, flags=re.M)
raw = re.sub(r'^\s*\d+/\d+\s*$', '', raw, flags=re.M)
raw = re.sub(r'^\s*VFL_\d+\s*$', '', raw, flags=re.M)

m_a = re.search(r'a\)\s+radiokomunikační předpisy:', raw)
m_b = re.search(r'b\)\s+radiokomunikační provoz:', raw[m_a.end():])
m_c = re.search(r'c\)\s+elektrotechnika a radiotechnika:', raw[m_a.end() + m_b.end():])
a_c = m_a.end()
b_h = a_c + m_b.start();  b_c = a_c + m_b.end()
c_h = b_c + m_c.start();  c_c = b_c + m_c.end()
m_end = re.search(r'Vyhodnocení|\(2\)|^\s*B\.', raw[c_c:], flags=re.M)
c_end = c_c + (m_end.start() if m_end else len(raw[c_c:]))

HYPHEN = re.compile(r'(\w)-\s+(\w)', re.UNICODE)
def parse(section):
    flat = re.sub(r'\s+', ' ', section).strip()
    flat = HYPHEN.sub(r'\1-\2', flat)
    items = {}
    for m in re.finditer(r'(?:^|(?<=\s))(\d{1,3})\.\s+(.+?)(?=\s\d{1,3}\.\s+|\Z)', flat):
        body = m.group(2).strip()
        parts = re.split(r'\s-\s+', body, maxsplit=1)
        n = int(m.group(1))
        items[n] = (parts[0].strip(), parts[1].strip() if len(parts) == 2 else None)
    return items

new_pdf = {
    'predpisy':        parse(raw[a_c:b_h]),
    'provoz':          parse(raw[b_c:c_h]),
    'elektrotechnika': parse(raw[c_c:c_end]),
}

# ─── Phonetic alphabet items (provoz 47-55): special multi-line answers,
# my parser returns None for the answer. Provide verbatim from PDF reading. ───
PHONETIC_ANSWERS = {
    47: "A – Alpha, E – Echo, I – India",
    48: "B – Bravo, F – Foxtrot, J – Juliett",
    49: "C – Charlie, G – Golf, K – Kilo",
    50: "D – Delta, H – Hotel, L – Lima",
    51: "M – Mike, Q – Quebec, U – Uniform",
    52: "N – November, R – Romeo, V – Victor",
    53: "O – Oscar, S – Sierra, W – Whisky",
    54: "P – Papa, T – Tango, X – X-ray",
    55: "Y – Yankee, Z – Zulu",
}
# Rewrite phonetic question text to a normalized "letters X, Y, Z" form
# (preserving the PDF "Hláskovací abeceda (Mezinárodní)" header).
PHONETIC_QUESTIONS = {
    47: "Hláskovací abeceda — písmena A, E, I (Mezinárodní):",
    48: "Hláskovací abeceda — písmena B, F, J (Mezinárodní):",
    49: "Hláskovací abeceda — písmena C, G, K (Mezinárodní):",
    50: "Hláskovací abeceda — písmena D, H, L (Mezinárodní):",
    51: "Hláskovací abeceda — písmena M, Q, U (Mezinárodní):",
    52: "Hláskovací abeceda — písmena N, R, V (Mezinárodní):",
    53: "Hláskovací abeceda — písmena O, S, W (Mezinárodní):",
    54: "Hláskovací abeceda — písmena P, T, X (Mezinárodní):",
    55: "Hláskovací abeceda — písmena Y, Z (Mezinárodní):",
}
# Item 73 ("Zkratka UTC znamená Světový koordinovaný čas") — answer is inline.
SPECIAL_TXT = {
    ("provoz", 73): ("Zkratka UTC znamená", "Světový koordinovaný čas"),
}

# Old bank — refuse to run if the bank has already been migrated (idempotency
# guard: this script is destructive and non-idempotent because it treats
# whatever is at BANK as the "old" source. Running it twice corrupts state.)
old_bank = json.loads(BANK.read_text())
if any("2025_09" in q.get("source", "") for q in old_bank):
    raise SystemExit(
        "REFUSING TO RUN: bank already references 2025_09 — migration appears "
        "to have already been applied. To re-run, first `git checkout src/data/questions.json`."
    )

# Content-key index: per subject, (norm_question, norm_answer) → entry
def normkey(q, a):
    q = re.sub(r'\s+', ' ', q).strip().lower().rstrip(':')
    a = re.sub(r'\s+', ' ', (a or "")).strip().lower()
    return (q, a)

old_by_content = {}
for q in old_bank:
    old_by_content.setdefault(q['subject'], {})
    k = normkey(q['question'], q['options'][q['correct']])
    old_by_content[q['subject']][k] = q

# ─── Author NEW questions (those without a content-match in old bank) ───
# Each entry: (pdf_num, distractor_a, distractor_b, explanation)
# We use the PDF's verbatim Q + correct answer; we author 2 distractors + Czech explanation.
NEW_PREDPISY = {
    5: (
        ["v rozmezí 9 kHz – 3000 GHz",
         "vyšším než 30 MHz"],
        "Definice rádiového spektra dle Radiokomunikačního řádu ITU. Horní hranice 3000 GHz pokrývá i milimetrové a submilimetrové vlny."
    ),
    16: (
        ["pilnostní zprávy, tísňové zprávy, meteorologické zprávy, zprávy o pravidelnosti letů, zprávy pro zajištění bezpečnosti letů",
         "tísňové zprávy, pilnostní zprávy, bezpečnostní zprávy, meteorologické zprávy, ostatní"],
        "Hierarchie priorit dle ICAO Annex 10: tísňové (MAYDAY) → pilnostní (PAN PAN) → o rádiovém zaměřování → pro zajištění bezpečnosti letů → meteorologické → o pravidelnosti."
    ),
    20: (
        ["5 let",
         "3 roky"],
        "Při prvním vydání průkazu odborné způsobilosti platnost 10 let. Při následných prodlouženích se platnost prodlužuje o 5 let (viz item 24)."
    ),
    24: (
        ["10 let",
         "3 roky"],
        "Prodloužení doby platnosti je 5 let — kratší než prvotních 10 let. Žádost se podává písemně nejméně měsíc před koncem platnosti."
    ),
    33: (
        ["jen pracovníků poskytovatele radiokomunikační služby",
         "pouze úředníků Českého telekomunikačního úřadu"],
        "Telekomunikační tajemství se vztahuje na KAŽDOU osobu, která obsah zpráv pozná — náhodným posluchačem na rádiu počínaje, profesionálním operátorem konče."
    ),
    34: (
        ["je oprávněn je sdělit jen orgánům činným v trestním řízení.",
         "smí je sdělit komukoli, pokud nejde o utajované informace."],
        "Mlčenlivost je absolutní vůči všem třetím stranám. Výjimkou jsou jen zákonem stanovené případy (orgány činné v trestním řízení s úředním usnesením)."
    ),
    35: (
        ["pouze záznamy elektronických komunikací uložené operátorem.",
         "obsah datových zpráv mezi soukromými subjekty bez ohledu na médium."],
        "Předmětem tajemství je obsah PŘEPRAVOVANÝCH zpráv nebo zpráv jinak zprostředkovaných telekomunikační infrastrukturou. Veřejně vysílané zprávy (rozhlas, TV) tajemstvím nejsou."
    ),
}

NEW_PROVOZ = {
    23: (
        ["jen po vlastním rozhodnutí pilota, je-li to z provozních důvodů nutné",
         "automaticky po přechodu hranice FIR, bez nutnosti potvrzení"],
        "V řízeném prostoru pilot mění kmitočet jen z příkazu ATC nebo podle dříve dohodnutých postupů (např. publikovaných standardních příletových tratí)."
    ),
    35: (
        ["pouze pětimístným číslem desetinnou čárkou",
         "vždy pouze třemi číslicemi"],
        "8,33 kHz rozteč = 6 číslic (jeden „kanál\" reprezentuje konkrétní kmitočet), 25 kHz = 4. Nově 2025 PDF používá terminologii „vysílací kanál\" místo dřívějšího „kmitočet\"."
    ),
    39: (
        ["one zero zero zero",
         "QNH ten hundred,"],
        "Pro nastavení QNH se vždy vysílá zkratka „QNH\" + celé číslo. Trailing comma z PDF zachována."
    ),
    40: (
        ["QNH ONE THOUSAND NINE",
         "QNH ten zero nine"],
        "QNH se vysílá vždy zkratkou + jednotlivými číslicemi: 1009 → ONE ZERO ZERO NINE. Pozor: PDF má překlep v Q (hodnutu = hodnotu)."
    ),
    41: (
        ["Flight Level THREE ZERO ZERO,",
         "FL three hundred,"],
        "Letové hladiny dělitelné stem se vysílají jako „THREE HUNDRED\" (ne THREE ZERO ZERO). Zachována trailing comma z PDF."
    ),
    42: (
        ["Flight Level ONE HUNDRED EIGHTY",
         "Flight Level ONE EIGHTY"],
        "Letové hladiny NEDĚLITELNÉ stem se vysílají po číslicích: 180 → ONE EIGHT ZERO (ne ONE EIGHTY)."
    ),
    57: (
        ["tlaku přepočtenému na střední hladinu moře",
         "standardnímu tlaku 1013,25 hPa použitému nad přechodovou hladinou"],
        "QFE = letištní tlak. Při nastavení QFE na výškoměru ukazuje výška nad prahem dráhy (na stojánce = 0). QNH = na hladinu moře, QNE = standardní 1013."
    ),
    82: (
        ["letovým informačním střediskům (FIC)",
         "stanovištím AFS"],
        "PDF 2025_09 uvádí stejnou otázku jako item 83 s ODLIŠNÝM správným odpovědí — pravděpodobně chybný překlep v PDF (mělo být INFO ne INFORMATION pro AFIS). Zachováno verbatim."
    ),
}

NEW_ELEKTRO = {
    15: (
        ["stejnosměrné do 24 V a střídavé do 12 V",
         "stejnosměrné do 120 V a střídavé do 50 V"],
        "Hraniční napětí pro „bezpečné napětí\" v suchém prostředí dle ČSN: DC 60 V, AC 25 V. Ve vlhkém prostředí hodnoty klesají na DC 25 V / AC 12 V."
    ),
    16: (
        ["okamžitě polijeme postiženého vodou pro odvedení proudu, zavoláme záchrannou službu.",
         "počkáme, až proud pomine, pak teprve přistoupíme k poskytnutí první pomoci."],
        "Pořadí: 1) vyprostit z dosahu, 2) zavolat 155/112, 3) záklon hlavy, kontrola dýchání, 4) při selhání životních funkcí KPR (masáž srdce + umělé dýchání) až do příjezdu záchranářů."
    ),
    29: (
        ["ano, dokud je výkon vysílače nižší než 5 W",
         "ano, ale jen v přijímacím režimu"],
        "Bez antény nemá vysílaný výkon kam odejít a vrací se zpět do koncového stupně — typicky shoří koncový tranzistor. Pravidlo: nikdy nevysílat bez připojené antény nebo zatěžovacího odporu."
    ),
    30: (
        ["mluvit nahlas do mikrofonu",
         "měnit kmitočet stanice"],
        "Při stisknutém PTT je stanice v režimu vysílání — přijímač je vypnutý. Proto nelze zároveň slyšet ostatní stanice; pokud někdo začne odpovídat během držení PTT, jeho zpráva se ztratí."
    ),
    31: (
        ["108–118 MHz",
         "225–400 MHz"],
        "Letadlová VHF aero pohyblivá služba: 118,000–136,975 MHz (s rozteči 8,33 nebo 25 kHz). 108–118 MHz = VOR/ILS navigace. 225–400 MHz = vojenská UHF aero band."
    ),
}

NEW_AUTHORED = {
    'predpisy': NEW_PREDPISY,
    'provoz': NEW_PROVOZ,
    'elektrotechnika': NEW_ELEKTRO,
}

# ─── Build new bank ───
new_bank = []
matched_count = 0
new_count = 0

def src(subj, n):
    section = {'predpisy': 'a', 'provoz': 'b', 'elektrotechnika': 'c'}[subj]
    return f"2025_09 VFL_4, A.(1).{section}.{n}"

# Phonetic items: the question wording shifted between PDFs (2018 said
# "Národní/Mezinárodní", 2025 says just "Mezinárodní") but the answers
# are identical canonical ICAO letters. Match these on answer text only.
old_by_answer = {}
for q in old_bank:
    old_by_answer.setdefault(q['subject'], {})
    ans_key = re.sub(r'\s+', ' ', q['options'][q['correct']]).strip().lower()
    old_by_answer[q['subject']][ans_key] = q

for subj, items in new_pdf.items():
    for n, (pdf_q, pdf_a) in items.items():
        is_phonetic = (subj == 'provoz' and n in PHONETIC_ANSWERS)
        if is_phonetic:
            pdf_q = PHONETIC_QUESTIONS[n]
            pdf_a = PHONETIC_ANSWERS[n]
        elif (subj, n) in SPECIAL_TXT:
            pdf_q, pdf_a = SPECIAL_TXT[(subj, n)]
        elif pdf_a is None:
            print(f"WARN: {subj}.{n} has no parsable answer and no override")
            continue

        # Phonetic: match by answer only (question wording differs)
        if is_phonetic:
            ans_key = re.sub(r'\s+', ' ', pdf_a).strip().lower()
            if ans_key in old_by_answer[subj]:
                old = old_by_answer[subj][ans_key]
                distractors = [o for i, o in enumerate(old['options']) if i != old['correct']]
                new_bank.append({
                    "id": "",
                    "subject": subj,
                    "question": pdf_q,
                    "options": [pdf_a, distractors[0], distractors[1]],
                    "correct": 0,
                    "explanation": old.get('explanation', ''),
                    "source": src(subj, n),
                })
                matched_count += 1
                continue

        # All other items: match by content (question + answer)
        k = normkey(pdf_q, pdf_a)
        if k in old_by_content[subj]:
            old = old_by_content[subj][k]
            # Reuse distractors + explanation; verbatim Q+correct from new PDF.
            # Find correct index from old, preserve distractors at other indices.
            old_correct_text = old['options'][old['correct']]
            distractors = [o for i, o in enumerate(old['options']) if i != old['correct']]
            options = [pdf_a, distractors[0], distractors[1]]  # correct at 0
            new_bank.append({
                "id": "",  # filled below
                "subject": subj,
                "question": pdf_q if pdf_q.endswith(':') else pdf_q + ':',
                "options": options,
                "correct": 0,
                "explanation": old.get('explanation', ''),
                "source": src(subj, n),
            })
            matched_count += 1
        elif n in NEW_AUTHORED[subj]:
            distractors, explanation = NEW_AUTHORED[subj][n]
            options = [pdf_a] + distractors
            new_bank.append({
                "id": "",
                "subject": subj,
                "question": pdf_q if pdf_q.endswith(':') else pdf_q + ':',
                "options": options,
                "correct": 0,
                "explanation": explanation,
                "source": src(subj, n),
            })
            new_count += 1
        else:
            print(f"WARN: {subj}.{n} not matched in old bank AND not in NEW_AUTHORED:")
            print(f"  Q: {pdf_q[:80]}")
            print(f"  A: {pdf_a[:80]}")

# Sort by (subject_order, pdf_item_num) and assign sequential IDs
SUBJECT_ORDER = {'predpisy': 0, 'provoz': 1, 'elektrotechnika': 2}
new_bank.sort(key=lambda q: (SUBJECT_ORDER[q['subject']], int(q['source'].rsplit('.', 1)[1])))

# Renumber IDs sequentially per subject (id = pdf item number for clarity)
for q in new_bank:
    pdf_n = int(q['source'].rsplit('.', 1)[1])
    q['id'] = f"vfl-{q['subject']}-{pdf_n:03d}"

# Vary correct option position deterministically (id hash) so it's not always index 0
import hashlib
for q in new_bank:
    if len(q['options']) != 3: continue
    h = int(hashlib.md5(q['id'].encode()).hexdigest(), 16) % 3
    if h != 0:
        opts = q['options']
        # Move correct (at 0) to position h
        opts[0], opts[h] = opts[h], opts[0]
        q['correct'] = h

# Sanity
from collections import Counter
counts = Counter(q['subject'] for q in new_bank)
print(f"\nNew bank: {len(new_bank)} total — {dict(counts)}")
print(f"  Matched (kept distractors): {matched_count}")
print(f"  Newly authored: {new_count}")

ids = [q['id'] for q in new_bank]
assert len(ids) == len(set(ids)), "duplicate IDs"

BANK.write_text(json.dumps(new_bank, ensure_ascii=False, indent=2) + "\n")
print(f"\nWritten to {BANK}")
