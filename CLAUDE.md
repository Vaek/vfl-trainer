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
- **Sources of truth (official ČTÚ documents):**
  - **Written-test bank**: `docs/2025_09_VFL_otazky.pdf` (ČTÚ `2025_09 VFL_4`, September 2025, 7 pages, 164 items). Questions and correct answers must come from this PDF verbatim. Distractors are authored. Always include the `source` citation field.
  - **Oral-exam syllabus**: `docs/osnovyvfl_2019-07.pdf` (ČTÚ `07_2019 VFL-Radiotelefonní frazeologie`, July 2019, 2 pages). Defines what the examiner asks and the "nezbytná znalost" scoring rule.
  - **Historical references** (kept in `docs/` but not authoritative): `2018_05_zkousky_otazky_v5_fin.pdf`, `ustni_zkousky_prukazy_radiova_zarizeni_01-2018.pdf`.
- **Where to check for newer ČTÚ versions**: <https://ctu.gov.cz/druhy-prukazu> — the catalog of all radio operator certificate types. Lists current versions of "Zkušební otázky" and "Osnovy ústní zkoušky" for VFL and other licenses. Before starting any source-update session, fetch this page and compare the linked filenames against `docs/` to see if ČTÚ has shipped a newer revision.
- **Real exam pass rule: ≥ 90 % in EACH of the three subjects** (předpisy / provoz / elektrotechnika). Not an average. Implement this faithfully.
- **VFL only.** Other licenses (OFL, GOC, ROC, VFN, OFN, LRC, SRC, pozemní telegrafista, amatérské) are explicitly out of scope for v1.

## Agent operating rules

The agent operates autonomously **within the project boundary**. Anything whose effect reaches **outside** that boundary requires explicit human approval.

**Inside the boundary (autonomous):**
- Files under the project directory (this repo).
- The `Vaek/vfl-trainer` GitHub repo: create feature branches, push to them, rebase, force-push your own feature branch. **Prefer feature branch → merge/rebase into `main`** over direct commits to `main`. Direct commits to `main` are allowed only when the user explicitly asks.
- Project-local package operations: `npm install` (restore), `npm install <pkg>` / `npm uninstall <pkg>` (modifies *this* `package.json` and lockfile only).
- Scratch in `/tmp/*` for ephemeral verification scripts. Nothing persistent lives there.

**Outside the boundary (needs approval):**
- Any directory outside the project folder.
- Global toolchain: `npm install -g`, `brew install`, `pip install` outside a venv, `cargo install`, anything landing in `/usr/local`, `~/.local/bin`, system Python, etc.
- Global config: `~/.zshrc`, system/global `~/.gitconfig`, `~/.ssh/`, `~/.claude/settings.json`.
- Shared git history: force-push to `main`, history rewrites on `main`, deleting `main` or any shared branch.
- External systems via MCP / network: Slack messages, Jira/Confluence writes, Figma writes, posts to third-party APIs. Reads are fine; writes need approval.
- Other GitHub repos / orgs — only `Vaek/vfl-trainer` is in scope.
- Destructive ops on existing project state: `rm -rf` of tracked content, `git reset --hard` that drops uncommitted work, deleting files the user authored.
- Secrets: `.env*`, credentials, tokens — never read, write, or commit.

**Versioning:**
- Every **commit** explains *why*, not just *what* — the diff already shows what changed.
- Mid-session edits don't each need a commit; only the final state ships.

**Verification before claiming "done":**
- Code changes that affect runtime: `npm run build` must pass.
- Question bank changes: the ČTÚ verbatim audit must pass.
- UI changes the agent can't visually verify: say so explicitly, don't claim success.

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
- The **question text** and the **correct option text** must match the ČTÚ PDF exactly in semantic content. Do not paraphrase, expand abbreviations the PDF uses verbatim (e.g., "OKABC", not "OK-ABC"), drop or add parentheticals, or substitute synonyms ("kde" vs "když"). Run `python3 scripts/audit.py` to verify the bank against the PDF — uses `mutool` (mupdf-tools) for extraction; the script must pass before merging bank changes.
- One **presentational** tweak is allowed and uniformly applied across the bank: **append a trailing colon** to the question (PDF omits terminal punctuation because each question is a numbered list item). The 2025_09 VFL_4 PDF capitalizes questions natively, so no first-letter tweak is needed.
- If the PDF correct answer ends with a stray comma (list-formatting artifact, e.g. "three hundred,"), preserve it verbatim. To avoid the comma visually telegraphing the answer, **add the same trailing comma to the authored distractors**. Same logic for unit formatting: if the PDF writes "2V" / "6W" without a space, distractors should match that style.
- Distractor text and explanations are authored, not from the PDF — author them however reads best, but keep formatting consistent with the correct option.

## Current state

- Full app infrastructure works end-to-end.
- Question bank is **complete** at **164 questions** (35 předpisy, 98 provoz, 31 elektrotechnika) — covers all VFL items in ČTÚ 2025_09 VFL_4 section A.(1). IDs are sequential matching the PDF item number (e.g. `vfl-predpisy-005` is item 5).
- 9 phonetic-alphabet items (provoz 47–55) and provoz item 73 (UTC abbreviation, answer inline without dash) are skipped by the verbatim audit because their PDF format isn't `- answer` — listed in `SKIP_VERBATIM` in `scripts/audit.py` and verified manually.
- Three oral prompts complete (strict, practice, drills).
- Deployed and verified on GitHub Pages.

## Known PDF quirks (verbatim preserved)

- Provoz items 82 and 83 both have the question text "Volací znak INFORMATION je přiřazen" with different correct answers (AFIS for 82, FIC Praha for 83). Item 82 is almost certainly a typo where the question should read "INFO" — but per verbatim rule we preserve it. Spot the rule before reporting users that "82 and 83 look identical".
- Provoz item 40 question has the PDF typo "hodnutu" (should be "hodnotu") — verbatim preserved.

## Next priorities

1. **Quality pass on distractors** — review for any that feel too easy, telegraph the answer, or use absurd values. Especially the 9 phonetic items (47–55) and the 20 newly authored 2025-PDF items, which haven't had a human spot-check yet.

2. **Optional v1.1 features (only if user asks):**
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
