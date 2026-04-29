# VFL Trainer — AI Handoff Document

**Read this entire document before doing any work on the project.** It captures every architectural decision, constraint, and rationale agreed upon during the planning phase. Future you (or any AI assistant inheriting this project) will save hours by understanding *why* the codebase looks the way it does, not just *what* it contains.

---

## 0. TL;DR

This is a study tool for a specific Czech aviation radio operator license, built as a static React app on GitHub Pages, paired with copy-paste prompts for ChatGPT-style AI chats to handle the oral portion of the exam. Zero infrastructure, zero API keys, zero recurring cost. The user is preparing this primarily as a personal/community tool, not a commercial product.

**Repo:** `Vaek/vfl-trainer`
**Live:** https://vaek.github.io/vfl-trainer/
**Stack:** Vite + React 18 + TypeScript (strict) + Tailwind 3
**Owner's GitHub:** `Vaek`

---

## 1. The exam being studied for

The Czech Telecommunication Office (Český telekomunikační úřad, ČTÚ) issues the license **"Všeobecný průkaz radiotelefonisty letecké pohyblivé služby"** — the General Radiotelephone Operator Certificate for Aeronautical Mobile Service.

- **Legal basis:** § 2 písm. a) vyhlášky č. 157/2005 Sb.
- **Standard short name:** **VFL** (this is the official ČTÚ abbreviation)
- **Validity:** 5 years
- **Holder is allowed to:** operate aeronautical radiotelephony equipment in international and domestic aviation contexts.

### The exam has two parts

1. **Written test (písemná zkouška)** — multiple choice, 3 options per question, drawn from three subjects:
   - **a) radiokomunikační předpisy** (regulations) — ~31 questions in the official bank
   - **b) radiokomunikační provoz** (radio operation, phraseology) — ~96 questions
   - **c) elektrotechnika a radiotechnika** (electronics) — ~34 questions
   - **Total in the official bank: ~161 questions**

2. **Oral exam (ústní zkouška)** — examiner-led, covers:
   - English↔Czech translation of aeronautical text
   - ICAO spelling alphabet
   - Number and frequency pronunciation (incl. 8.33 kHz spacing)
   - ATIS comprehension and dictation
   - Standard phrases and their meanings
   - Message priority order
   - Distress/urgency message composition
   - CTR-entry roleplay
   - Transition altitude vs transition level

### THE PASS RULES (DO NOT GET THESE WRONG)

**Written test:** ≥ **90 %** correct **in EACH** of the three subjects. This is **per-subject**, not an average. A candidate with 100/100/85 fails. A candidate with 90/90/90 passes. The app must enforce this exactly.

**Oral exam:** for each topic, examiner records pass/fail. Topics flagged as "nezbytná znalost" (essential knowledge) in the official syllabus are critical. **Failing more than ONE essential item = overall fail.** The non-essential "doplňující" item (transition altitude vs level) doesn't count toward this rule.

The essential oral topics for VFL are:
- ATIS message comprehension
- ICAO spelling alphabet
- Radio check / readability scale
- Numbers (spelling, exceptions, frequency formatting)
- Standard phrases (EN/CZ/meaning)
- Composing a distress/urgency message
- Understanding ATC transmissions and reacting (CTR-entry communication)

Reading/translation, speech technique, and message priority are tested but not flagged "essential."

### Source documents (authoritative)

Both are public ČTÚ materials, referenced throughout the codebase:

1. `2018_05_zkousky_otazky_v5_fin.pdf` — čj. ČTÚ-79 329/2017-613, vydání 2018_05 V5
   - Contains all written-test questions and their correct answers for ALL ČTÚ radio licenses (VFL, OFL, GOC, ROC, VFN, OFN, LRC, SRC, pozemní telegrafista). The VFL section is **A.(1)** with subsections **a)** (předpisy), **b)** (provoz), **c)** (elektrotechnika).
   - **Important:** other licenses are explicitly out of scope. Do not pull questions from the OFL, GOC, etc. sections, even if they overlap with VFL — they're different exams.

2. `ustni_zkousky_prukazy_radiova_zarizeni_01-2018.pdf` — osnovy ústních zkoušek
   - Defines the oral exam structure and pass criteria. The VFL section is **B.(1)(a)**.

**These PDFs should ideally live in the repo at `docs/` so an AI assistant can read them directly.** If they're not committed, the user should provide them on demand. Without them, you cannot author new questions reliably.

---

## 2. Architectural decisions and the reasoning behind each

The user spent several rounds with me weighing options before committing. Documenting the *why* here so the next AI doesn't try to "improve" something that was deliberately chosen.

### Why GitHub Pages and not a real backend?

The user has no infrastructure available. GitHub Pages is free, requires zero ops, and is sufficient for a static site. Anything else (Vercel, Cloudflare, a VPS) was rejected because it would introduce ongoing cost, account management, or both.

**Implication:** No server-side anything. No API key in the bundle (it would be world-readable). No database. No auth. Everything is static files.

### Why is the oral exam delegated to the user's own AI chat instead of being part of the app?

We considered three patterns for the oral part:

- **Option A (BYO API key):** user pastes their OpenAI/Anthropic/Gemini API key into the app, calls go from browser direct to provider. Rejected as the primary path because (a) most non-technical users don't have an API key — they have a free *ChatGPT* account, which is a different product, and (b) the friction of getting a key is enough to block adoption.
- **Option B (we host the LLM proxy):** small Cloudflare Worker holds the key, app calls it. Rejected because the user explicitly didn't want any infrastructure, even free-tier.
- **Option C (deterministic scripted simulator):** build the oral mode without an LLM, using browser TTS/STT and pattern matching. Rejected because it's too rigid for the conversational nature of an oral exam and pronunciation evaluation.
- **Option D (CHOSEN): the user copies a carefully-crafted prompt into whatever AI they already use** — ChatGPT free tier, Claude free, Gemini, Copilot, Mistral. ChatGPT voice mode (especially Advanced Voice on the mobile app) is recommended because it can evaluate spoken pronunciation, run ATIS dictation aloud, and roleplay as ATC. Free users have a daily voice quota that's enough for a meaningful practice session; Plus users have effectively unlimited.

**This is the single most important architectural choice in the project.** The app does **NOT** integrate any LLM. The oral mode is purely a UI for selecting one of three Czech-language prompts and copying it to the clipboard. Do not "improve" this by adding an in-app chat interface. That's the opposite direction.

### Why three oral prompts instead of one?

Three modes serve different study needs:

1. **Strict** — full simulated exam. No hints, no mid-session feedback. Verdict at the end. For final prep before the real exam.
2. **Practice** — tutor mode with immediate feedback after each item. For learning and weak-spot work.
3. **Drills** — fast, intensive practice on one chosen sub-topic (alphabet, numbers, phrases, etc.). For short daily sessions.

Each prompt is a **complete, self-contained Czech-language briefing** for the AI, including embedded reference material (ICAO alphabet table, number pronunciation rules, standard phrases with meanings, Q-codes, key abbreviations, an example ATIS) so the AI doesn't need web access. Prompts run roughly 3,000–6,000 words each — fits comfortably in any modern free chat's context.

The three prompts live in **two synced locations**:
- `src/lib/oralPrompts.ts` — the actual TS module the app imports (this is what gets shipped)
- `oral-prompts/*.md` — Markdown reference copies for code review and version-control diffing

If you change one, change the other. (Could be unified later by reading the `.md` files at build time, but for v1 the duplication is acceptable.)

### Why HashRouter instead of BrowserRouter?

GitHub Pages serves static files only — it can't rewrite arbitrary URLs to `/index.html`. With `BrowserRouter`, navigating directly to `/vfl-trainer/study` returns a 404. `HashRouter` puts the route after a `#` (e.g., `/vfl-trainer/#/study`) which the browser handles client-side. Slightly uglier URL, but it works without any server config. If someone tries to "fix" this to BrowserRouter, the deep links will break.

### Why deterministic option shuffling?

`shuffleOptions(question)` uses a seeded PRNG keyed on `question.id`. This means option A/B/C order is consistent across `QuestionCard` (during the exam) and `ResultSummary` (the review screen). Without this, the user clicks position B, the answer record stores "selected: 1", and the review screen re-shuffles independently — highlighting a *different* option as their pick. The seeded shuffle fixes that.

Question *selection* (which 20 questions out of 161 to put in this mock exam) uses unseeded `Math.random` — that's deliberate, every attempt should pick a different sample.

### Why localStorage and not IndexedDB or a sync service?

Simple. The app stores at most ~100 attempt records (capped). localStorage handles that easily. No sync between devices is fine for v1 — this is a personal study tool. The user explicitly chose "localStorage only" over "localStorage + export/import" for v1; export/import was deferred to v1.1 if anyone asks.

### Why Czech-only UI?

The target audience is Czech aviation students. The actual radio phraseology stays in English (because that's how aviation works internationally), but UI chrome (buttons, headers, instructions, error messages) is Czech. No i18n framework is installed. Strings live inline in the `.tsx` files. If the project ever expands to other countries, this would need rethinking — but that's not v1.

### Why "ship full 3-option MCQ from v1" instead of flashcards?

The real ČTÚ exam is multiple choice. A flashcard-style "type the answer" mode would test recall but wouldn't simulate the actual exam experience. The user explicitly chose MCQ to keep the trainer faithful to the real test format, accepting the tradeoff of having to author distractors.

### Why are distractors authored, not in the source PDF?

The ČTÚ PDF only lists the correct answer for each question. The actual exam paper has 3 options. So either the wrong options come from each candidate's exam paper (we don't have access to those) or they have to be written. We're writing them.

**This is the highest-risk content work in the project.** Bad distractors either give away the answer (too implausible) or teach incorrect facts (if a distractor is plausible *and* technically true in some context, candidates will absorb the wrong association). Spend more time on distractors than feels necessary.

---

## 3. The question bank — schema, conventions, authoring rules

### Schema (`src/data/questions.json`)

Array of objects, each:

```ts
{
  id: string             // "vfl-{predpisy|provoz|elektrotechnika}-NNN"
  subject: "predpisy" | "provoz" | "elektrotechnika"
  question: string       // Czech question text
  options: [string, string, string]   // exactly 3, in original (unshuffled) order
  correct: 0 | 1 | 2     // index into options
  explanation?: string   // optional, 1-3 sentences in Czech
  source: string         // ČTÚ citation, e.g. "2018_05 V5, A.(1).b.32"
}
```

### Authoring rules

1. **Every question must come from the ČTÚ document.** Do not invent questions even if they seem like good aviation knowledge. The bank's authority depends on faithful sourcing.

2. **The `source` field is the ČTÚ document section reference.** Format: `2018_05 V5, A.(1).{a|b|c}.NN` where `{a|b|c}` is the subsection (předpisy / provoz / elektrotechnika) and `NN` is the question number within that subsection in the source PDF.

3. **Options must be exactly 3.** The PDF lists only the correct answer; the two distractors are authored.

4. **Distractor philosophy:**
   - Plausible enough that a candidate who half-remembers the topic could pick them.
   - Sourced from neighboring real values when possible:
     - For frequencies: other real frequencies in adjacent services. E.g., distractors for the aviation distress 121.5 MHz could be 243.0 MHz (military UHF distress) and 156.8 MHz (marine VHF Ch 16).
     - For Q-codes: sibling Q-codes (QNH ↔ QFE ↔ QNE; QDM ↔ QDR ↔ QTE).
     - For phraseology: phrases that sound similar or have related but different meanings (STAND BY vs HOLD POSITION; ROGER vs WILCO).
     - For abbreviations: other real aviation abbreviations.
   - For numerical answers (battery voltages, time limits, fines), use values that are real in some context but wrong here. Avoid round numbers that look made up.
   - **Avoid joke distractors.** "Pražský magistrát" as a distractor for "ČTÚ" is the kind of thing to never do.
   - **Avoid distractors that are technically also correct under a different interpretation.** If a question asks about VHF aviation distress, don't put 121.5 MHz as a distractor; it must be unambiguously correct.

5. **Explanations should be educational, not just confirmatory.** "QNH = výška nad mořem na výškoměru. QFE = výška nad letištěm (na zemi ukazuje 0). QNE = standardní 1013,25 hPa." teaches the candidate. "QNH je správně" doesn't.

6. **Do not change the original `options` order or `correct` index after publishing.** The seeded shuffle uses `question.id` as the seed, so the displayed order is stable per id. If you re-arrange `options` post-hoc, all existing localStorage attempt records pointing to that question by id become invalid.

### Adding a new batch — workflow

1. Pick a subject, ideally the one with the most missing questions.
2. Open the source PDF at the relevant subsection.
3. Draft 20–30 questions. For each, write the correct answer (verbatim or near-verbatim from the PDF), then author 2 distractors per the rules above.
4. **Show the user the first ~5 for spot-check before drafting the rest.** This is how the user calibrates style and catches problems early.
5. After approval, write the full batch to `questions.json`.
6. Run `npm run build` to verify nothing breaks.
7. Commit with a message like `Add 25 provoz questions (batch 2)`.

### Current bank state (as of v0.1)

35 questions total: 10 předpisy, 17 provoz, 8 elektrotechnika. Targets to reach the full official bank:

- Předpisy: ~31 total → **~21 more to draft**
- Provoz: ~96 total → **~79 more to draft**
- Elektrotechnika: ~34 total → **~26 more to draft**

Work in batches of 20–25. Provoz is the largest and most exam-relevant — prioritize it.

---

## 4. The oral prompts — what they contain and how they work

Each prompt is a structured Czech-language briefing for an LLM. Common features:

- **Role assignment.** "Jsi zkušební komisař ČTÚ" / "Jsi přátelský trenér" / "Jsi cvičitel".
- **Language switching rule.** Czech for meta-conversation, English for radiotelephony content. If the candidate answers radio content in Czech, mark as error.
- **Voice mode awareness.** Instructs the AI to evaluate ICAO pronunciation specifically (TREE/FOWER/FIFE/NINER, DECIMAL not "point", full digit count for 8.33 kHz frequencies).
- **Topic checklist.** Numbered list of items to cover, in order.
- **Stay-in-role guardrails.** "Nedáváš nápovědy. Neoslazuješ hodnocení."
- **Embedded reference material.** ICAO alphabet, number rules, phrase list, Q-codes, abbreviations, sample ATIS — so the AI doesn't need outside knowledge.
- **Output format at the end.** For strict: rubric + verdict. For practice: progress summary + recommendations. For drills: error tally.

### Why include the reference material inline?

Free AI chats often don't have web access. Even those that do (ChatGPT free with browse) won't reliably fetch L Frazeologie or ČTÚ syllabi. Embedding the reference inline:
- Removes any dependency on external lookups.
- Locks in the specific ICAO conventions used by Czech ČTÚ (e.g., Czech vs English number exceptions).
- Lets the AI cite the rules rather than guess them.

### Known limitations of the oral approach (acknowledged in the app UI)

- Pronunciation judgment by an LLM is approximate; a real examiner is stricter.
- LLMs occasionally drop role over long sessions — the app's UI advises users to remind the AI if that happens.
- ATIS pacing in TTS isn't perfectly authentic. The app suggests calling real ATIS phone lines (LKPR: +420 220 378 300) for genuine listening practice.
- The tool is positioned as **practice and self-assessment, not certification rehearsal**. The disclaimer in the footer reinforces this.

---

## 5. UI/UX decisions

### Visual identity

Editorial-aviation aesthetic:
- **Display font:** Fraunces (serif with optical sizing) for headings — feels like aviation chart legends and instrument labels
- **Body font:** Inter Tight for general text
- **Mono:** JetBrains Mono for technical content (callsigns, source citations, timer)
- **Color palette:**
  - `#0a1628` (ink) — dark navy, primary text and emphasis
  - `#fbf7f0` (paper) — warm off-white background
  - `#d64545` (signal) — red accent, used sparingly for danger/timer/important actions
  - `#3a6fb0` (sky) — blue accent for the předpisy subject chip
  - `#e8dcc4` (sand) — warm beige for warnings/notes
- **Subtle background gradients** (radial blobs in corners) to add atmosphere without distraction
- **Dashed aviation-style rules** (`aviation-rule` class) under section headings

The user did NOT request anything specific about visuals beyond "light only theme" — the editorial-aviation direction was a deliberate creative choice. It's appropriate to refine but don't replace it without good reason.

### Interaction patterns

- **Mock exam:** locked navigation. Once you pick an option, the answer is recorded and you must click "Další otázka" to proceed. No going back. Mirrors the real exam.
- **Practice:** immediate feedback after each answer (color-coded options + explanation panel).
- **Study:** browse mode with answer reveal on click; arrow buttons to walk through the bank.
- **Timer:** counts down, shows red and pulses below 60 seconds, auto-submits at 0:00.
- **Result screen:** big verdict (Prospěl/Neprospěl), per-subject score bars with the 90% threshold visualized, expandable per-question review.

### Czech-specific UI strings

- "Cvičná zkouška" = mock exam
- "Procvičování" = practice
- "Studium" = study mode
- "Statistiky" = dashboard/history
- "Prospěl(a)" / "Neprospěl(a)" = passed / failed (with gendered Czech ending parenthetical)
- "Otázka X / Y" = question X of Y
- "Vyhodnotit" = evaluate (submit for grading)
- "Vysvětlení" = explanation
- "Zdroj" / source citations are kept in the original `2018_05 V5, A.(1).b.32` format

### Why no dark mode?

User chose "light only" explicitly. Don't add a toggle without being asked.

---

## 6. Deployment and dev workflow

### Local development

```bash
npm install
npm run dev      # http://localhost:5173/vfl-trainer/
```

Note the `/vfl-trainer/` path — Vite's `base` is set to that in `vite.config.ts`. If you ever fork to a differently-named repo, change this.

### Production build

```bash
npm run build    # outputs to dist/
npm run preview  # serves the production build locally for verification
```

### Deployment

`.github/workflows/deploy.yml` runs on every push to `main`:
1. `actions/checkout@v4`
2. Setup Node 20 with npm cache
3. `npm ci`
4. `npm run build`
5. Upload `dist/` as Pages artifact
6. Deploy to GitHub Pages

**One-time GitHub setting:** repo Settings → Pages → Source must be set to **GitHub Actions** (not "Deploy from a branch"). Without this, the workflow runs but nothing is published.

Live URL after deployment: https://vaek.github.io/vfl-trainer/

### Verifying changes before push

Always run `npm run build` locally before pushing to `main`. TypeScript strict mode catches a lot of issues that `npm run dev` doesn't (unused vars, implicit any, etc.). A failing build means the GitHub Actions deploy will also fail.

---

## 7. What's NOT in v1, by deliberate choice

Don't do these unless the user explicitly asks. They were considered and deferred or rejected.

- **Other licenses (OFL, GOC, ROC, VFN, OFN, LRC, SRC, pozemní telegrafista, amatérské).** Architecturally the question bank schema supports it (just add new `subject` values and a license filter), but v1 is VFL-only by design. Don't pollute the bank.
- **Telegraphy/Morse practical exam.** Out of scope.
- **In-app LLM integration of any kind.** See section 2 — this was rejected for solid reasons. The oral mode delegates to the user's existing AI chat.
- **API keys, BYO-key, or any kind of paid integration.**
- **Auth, accounts, multi-device sync.**
- **A real spaced-repetition algorithm.** The current "practice = 10 random questions" is intentionally simple. SRS could be a v2 feature but adds complexity.
- **Voice features in the app itself.** TTS/STT was considered but rejected — the oral prompts pattern (delegated to ChatGPT voice) handles this better.
- **An admin UI for editing questions.** The question bank is JSON in the repo. Edit it as a file, commit, push. This is fine for the project's scale.
- **Issuing certificates or claiming any official status.** The disclaimer in the footer is non-negotiable.
- **English UI.** Czech-only for v1.
- **Dark mode.** User chose light only.

---

## 8. Working with the user

Some patterns from our conversations that are useful to know.

- **The user thinks carefully before committing.** Multiple rounds of "what if X" before deciding. Match this energy — don't rush to implement; offer the tradeoffs first when there's a meaningful choice.
- **The user values honesty about limitations.** When something won't work or has a real downside, say so plainly. Don't gloss.
- **The user prefers small, reviewable batches over big drops.** When expanding the question bank, propose ~25 at a time, show samples for review, then commit.
- **The user is technical enough to read code but not deep React/TS.** Explanations of *what* changed and *why* are appreciated; line-by-line walkthroughs usually aren't necessary.
- **The user is Czech.** Default to Czech for any user-facing strings and any prompts intended for the candidate. Internal code comments and technical discussion can be English.
- **No emoji unless used by user first.** Standard Claude convention but worth restating.

---

## 9. Quick-reference: file map and key entry points

```
vfl-trainer/
├─ src/
│  ├─ main.tsx                  HashRouter setup
│  ├─ App.tsx                   Layout, header, footer, routing
│  ├─ modes/
│  │  ├─ Home.tsx               Landing — bank stats, mode tiles
│  │  ├─ Study.tsx              Walk through bank by subject, see source + explanation
│  │  ├─ Practice.tsx           10 random Qs from one subject, immediate feedback
│  │  ├─ Mock.tsx               20 Qs / 20 min timed mock with 90%-per-subject pass rule
│  │  ├─ Oral.tsx               UI for selecting and copying one of 3 oral prompts
│  │  └─ Dashboard.tsx          Aggregate stats + attempt history from localStorage
│  ├─ components/
│  │  ├─ QuestionCard.tsx       MCQ card with optional immediate feedback mode
│  │  └─ ResultSummary.tsx      Verdict + per-subject bars + expandable review
│  ├─ lib/
│  │  ├─ types.ts               Subject, Question, AnswerRecord, AttemptResult
│  │  ├─ questions.ts           Loading, picking, scoring, deterministic shuffle
│  │  ├─ storage.ts             localStorage with 100-attempt cap
│  │  └─ oralPrompts.ts         Three full prompts with embedded reference content
│  ├─ data/
│  │  └─ questions.json         The bank (extend this; auto-loaded)
│  └─ styles/
│     └─ index.css              Tailwind + custom component classes
├─ oral-prompts/
│  ├─ 01-strict.md              Markdown reference of strict prompt
│  ├─ 02-practice.md            Markdown reference of practice prompt
│  └─ 03-drills.md              Markdown reference of drills prompt
├─ .github/workflows/deploy.yml Auto-deploy to GitHub Pages
├─ index.html                   With Google Fonts links
├─ vite.config.ts               base: '/vfl-trainer/'
├─ tailwind.config.js           Custom fonts, colors, shadows
├─ postcss.config.js
├─ tsconfig.json                Strict mode
├─ tsconfig.node.json
├─ package.json
├─ README.md                    Public-facing setup/contribution doc
├─ CLAUDE.md                    Concise standing context for Claude Code
└─ AI_HANDOFF.md                THIS FILE
```

### Where to look first

- **Adding questions:** `src/data/questions.json` + the source PDF section A.(1).{a|b|c}
- **Changing scoring:** `src/lib/questions.ts` → `buildAttempt()`
- **Changing UI text:** inline in the `.tsx` of the relevant mode
- **Changing oral prompt:** `src/lib/oralPrompts.ts` (and update the matching `oral-prompts/*.md`)
- **Adding a route:** `src/App.tsx` (NAV array + Routes block) + new file in `src/modes/`
- **Visual tweaks:** `src/styles/index.css` for component classes; `tailwind.config.js` for tokens

---

## 10. Suggested first session for a new AI assistant

Recommended opener when picking up the project fresh:

```
Read AI_HANDOFF.md, then CLAUDE.md, then README.md. Look at
src/data/questions.json and tell me how many questions exist
per subject. Don't change anything yet. Then ask me what I'd
like to work on next.
```

Likely user responses:

- **"Add a batch of provoz questions."** → Open the source PDF (or ask user to provide it), draft ~20–25 from section A.(1).b that aren't already in the bank, show the user the first 5 for spot-check, then commit the full batch.
- **"Review distractor quality on existing questions."** → Audit each of the 35 starter questions, flag any where a distractor is too easy/too hard/technically also correct, propose replacements.
- **"Something's broken with X."** → Reproduce, read the relevant file from the map above, fix, run `npm run build`, push.
- **"Let's add feature Y."** → First check section 7 (deferred features). If it's there, ask the user to confirm they want to break the v1 scope. If it's not, propose an approach with tradeoffs before coding.

---

## 11. Final notes

- The v0.1 baseline was generated in a single session with a previous AI assistant using these same constraints. The codebase is intentionally restrained — no over-engineering, no premature abstractions. Match that style. If something looks "too simple," it probably is, on purpose.
- The single biggest risk to project quality is **bad distractors**. The single biggest risk to project momentum is **scope creep into other licenses or features that need infrastructure**. Both are easy to accidentally do. Resist.
- When in doubt about anything aviation-specific, the source documents (the two PDFs) are authoritative. When in doubt about UX, ask the user. When in doubt about whether to refactor, don't.

Good luck.
