# Project context for Claude Code

This file gives Claude Code the context it needs to continue this project. Read it first when starting a new session.

## What this project is

**VFL Trainer** — a static web app + AI prompt set that helps people study for the Czech ČTÚ license **"Všeobecný průkaz radiotelefonisty letecké pohyblivé služby"** (general aeronautical mobile radiotelephone operator certificate, abbreviated **VFL**, defined in § 2 písm. a) of vyhláška č. 157/2005 Sb.).

**Two parts:**
1. **Written test simulator** — runs entirely in the browser, hosted free on GitHub Pages.
2. **Oral exam prompts** — three Czech-language prompts the user copies into ChatGPT (preferably voice mode), Claude, Gemini, etc., to simulate the spoken part of the exam.

**Live URL:** https://vaek.github.io/vfl-trainer/

## Hard constraints (do not change without asking)

- **Hosted on GitHub Pages only.** No backend, no serverless, no API keys in the app, no paid infrastructure. The repo is `Vaek/vfl-trainer` and the Vite `base` is `/vfl-trainer/`.
- **Czech-only UI.** Aeronautical content is bilingual (English for radio phraseology, Czech for everything else) — that's how the real exam works.
- **Question bank source of truth: ČTÚ official PDFs.** Questions and correct answers must come from `2018_05 V5` (čj. ČTÚ‑79 329/2017‑613). Distractors are authored. Always include the `source` citation field.
- **Real exam pass rule: ≥ 90 % in EACH of the three subjects** (předpisy / provoz / elektrotechnika). Not an average. Implement this faithfully.
- **VFL only.** Other licenses (OFL, GOC, ROC, VFN, OFN, LRC, SRC, pozemní telegrafista, amatérské) are explicitly out of scope for v1.

## Stack

- Vite + React 18 + TypeScript (strict) + Tailwind 3
- React Router via `HashRouter` (required for GitHub Pages without server config)
- localStorage for progress (no auth, no backend)
- GitHub Actions deploys on push to `main` via `.github/workflows/deploy.yml`

## File layout

```
src/
  main.tsx                 React entry, HashRouter
  App.tsx                  Top-level layout + routing
  modes/
    Home.tsx               Landing page
    Study.tsx               Browse questions by subject (with source + explanation)
    Practice.tsx            10-question quiz, immediate feedback
    Mock.tsx                20-question, 20-min timed exam, no feedback until end
    Oral.tsx                Shows the three AI prompts with copy-to-clipboard
    Dashboard.tsx           Attempt history from localStorage
  components/
    QuestionCard.tsx        Shared MCQ card with optional immediate feedback
    ResultSummary.tsx       Per-subject scoring + review screen
  lib/
    types.ts                Subject, Question, AnswerRecord, AttemptResult
    questions.ts            Bank loading, picking, scoring, deterministic option shuffle
    storage.ts              localStorage read/write for attempts
    oralPrompts.ts          Three full Czech examiner prompts (strict / practice / drills)
  data/
    questions.json          The bank — extend this; app re-loads automatically
  styles/
    index.css               Tailwind + custom component classes
oral-prompts/               Markdown reference copies of the three prompts
.github/workflows/deploy.yml  Auto-deploy to gh-pages
```

## Question bank schema

`src/data/questions.json` is an array of:

```ts
{
  id: "vfl-{predpisy|provoz|elektrotechnika}-{NNN}",  // unique
  subject: "predpisy" | "provoz" | "elektrotechnika",
  question: "Czech question text.",
  options: [string, string, string],   // exactly 3, original (unshuffled) order
  correct: 0 | 1 | 2,                  // index into options
  explanation: "Optional Czech explanation, 1-3 sentences.",
  source: "2018_05 V5, A.(1).{a|b|c}.NN"  // ČTÚ source citation
}
```

The app shuffles option order **deterministically per question id** (seeded PRNG in `lib/questions.ts`), so the position the user sees during the exam matches the position highlighted in the review screen.

**Distractor authoring guidelines:**
- Each distractor must be plausibly wrong, not absurdly wrong. Test of knowledge, not test of common sense.
- Pull from neighboring real values where possible (e.g., for VHF tísňový kmitočet 121.5 MHz, distractors 243 MHz (military UHF distress) and 156.8 MHz (marine ch. 16)).
- For Q-codes, use sibling Q-codes (QNH ↔ QFE ↔ QNE).
- For phraseology, use phrases that sound similar or are related but mean something different (STAND BY ↔ HOLD POSITION).
- Do not invent fake-looking values that no one would ever pick.

**Verbatim-vs-presentation rule (strict):**
- The **question text** and the **correct option text** must match the ČTÚ PDF exactly in semantic content. Do not paraphrase, expand abbreviations the PDF uses verbatim (e.g., "OKABC", not "OK-ABC"), drop or add parentheticals, or substitute synonyms ("kde" vs "když"). When in doubt, run `python3 /tmp/audit.py` (or rebuild the equivalent) against the PDF.
- Two **presentational** tweaks are allowed and uniformly applied across the bank:
  1. **Capitalize the first letter** of the question (PDF has lowercase because each question is a numbered list item).
  2. **Append a trailing colon** to the question (PDF omits terminal punctuation for the same reason).
- If the PDF correct answer ends with a stray comma (list-formatting artifact, e.g. "three hundred,"), preserve it verbatim. To avoid the comma visually telegraphing the answer, **add the same trailing comma to the authored distractors**. Same logic for unit formatting: if the PDF writes "2V" / "6W" without a space, distractors should match that style.
- Distractor text and explanations are authored, not from the PDF — author them however reads best, but keep formatting consistent with the correct option.

## Current state (as of v0.1)

- Full app infrastructure works end-to-end.
- Question bank has **35 questions** out of a target ~161 (10 předpisy, 17 provoz, 8 elektrotechnika).
- Three oral prompts complete (strict, practice, drills).
- Deployed and verified on GitHub Pages.

## Next priorities

1. **Expand the question bank toward the full ~161.** Targets:
   - Předpisy: 31 total → ~21 more needed
   - Provoz: ~96 total → ~79 more needed
   - Elektrotechnika: 34 total → ~26 more needed

   The authoritative source is ČTÚ document 2018_05 V5, section A.(1) for the VFL license — all questions and correct answers must come from there. **Do not invent questions outside that scope.**

   Recommended approach: do one subject at a time, in batches of ~20–25 questions. After each batch, ask the user to spot-check distractor quality before committing.

2. **Quality pass on existing distractors** — review the 35 starter questions, flag any that feel too easy or whose distractors give away the answer.

3. **Optional v1.1 features (only if user asks):**
   - User-configurable mock exam length
   - Export/import of localStorage history as JSON
   - Per-question timing analytics in dashboard

## Out of scope for v1

- Voice / speech features (delegated to ChatGPT voice mode via the oral prompts)
- Other ČTÚ licenses
- Morse / telegraphy
- Authentication / multi-device sync
- Any paid or hosted infrastructure

## How to verify a change

```bash
npm run dev      # local dev at http://localhost:5173/vfl-trainer/
npm run build    # full production build (must succeed before merging)
```

After pushing to `main`, watch the Actions tab — `deploy.yml` should turn green within ~2 minutes and the live site updates automatically.

## Conventions

- Czech UI strings live inline in the `.tsx` files (no i18n framework — the project is Czech-only).
- Tailwind utility classes preferred over custom CSS. Component classes for repeated patterns are defined in `src/styles/index.css`.
- All new questions must include `source` and ideally `explanation`.
- Keep the app dependency-free of anything that needs API keys or a server.
