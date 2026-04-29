# VFL Trainer

> Tréninková aplikace pro **Všeobecný průkaz radiotelefonisty letecké pohyblivé služby** (VFL) — § 2 písm. a) vyhlášky č. 157/2005 Sb.

🌐 **Live:** [vaek.github.io/vfl-trainer](https://vaek.github.io/vfl-trainer/)

## Co to je

- Cvičná **písemná zkouška** podle pravidel ČTÚ (3 odpovědi na otázku, hraniční hodnota 90 % v každém ze tří předmětů).
- **Studijní režim** s vysvětlením a odkazem na zdroj u každé otázky.
- **Procvičování** krátkými testy z jednoho předmětu.
- **Statistiky** vašich pokusů (uložené v localStorage prohlížeče).
- **Ústní zkouška** přes ChatGPT / Claude / Gemini — tři předpřipravené scénáře (striktní, trénink, drily).

Aplikace je čistě statická, běží zdarma na GitHub Pages, nepotřebuje žádnou infrastrukturu.

## Stack

- **Vite + React + TypeScript + Tailwind**
- **HashRouter** pro správnou funkci na GitHub Pages bez serveru
- **Otázky** v `src/data/questions.json` (verzované, lidsky čitelné)
- **Ústní scénáře** v `src/lib/oralPrompts.ts` + duplicitní reference v `oral-prompts/*.md`

## Lokální vývoj

```bash
git clone git@github.com:Vaek/vfl-trainer.git
cd vfl-trainer
npm install
npm run dev
```

Otevře `http://localhost:5173/vfl-trainer/`.

```bash
npm run build      # produkční build do dist/
npm run preview    # ověření buildu lokálně
```

## Deploy

Push na `main` → GitHub Actions automaticky spustí build a publikuje na GitHub Pages. První spuštění vyžaduje:

1. V repu: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Push změn na `main`. Workflow `.github/workflows/deploy.yml` zajistí build i deploy.
3. Po dokončení workflow je stránka dostupná na `https://vaek.github.io/vfl-trainer/`.

## Struktura

```
vfl-trainer/
├─ src/
│  ├─ main.tsx                 # React entry
│  ├─ App.tsx                  # Routing + layout
│  ├─ modes/
│  │  ├─ Home.tsx              # Landing
│  │  ├─ Study.tsx             # Procházení banky
│  │  ├─ Practice.tsx          # Krátký test (10 ot.)
│  │  ├─ Mock.tsx              # Cvičná zkouška (20 ot., 20 min)
│  │  ├─ Oral.tsx              # Tři scénáře pro AI
│  │  └─ Dashboard.tsx         # Historie pokusů
│  ├─ components/
│  │  ├─ QuestionCard.tsx      # Sdílená UI pro otázku
│  │  └─ ResultSummary.tsx     # Vyhodnocení
│  ├─ lib/
│  │  ├─ types.ts              # TypeScript typy
│  │  ├─ questions.ts          # Logika výběru a skórování
│  │  ├─ storage.ts            # localStorage
│  │  └─ oralPrompts.ts        # Tři textové scénáře pro AI
│  ├─ data/
│  │  └─ questions.json        # Banka otázek (rozšiřitelná)
│  └─ styles/
│     └─ index.css             # Tailwind + vlastní třídy
├─ oral-prompts/               # Markdown verze scénářů
├─ .github/workflows/deploy.yml
├─ index.html
├─ vite.config.ts
├─ tailwind.config.js
├─ postcss.config.js
├─ tsconfig.json
└─ package.json
```

## Banka otázek — schéma

`src/data/questions.json` je pole objektů:

```json
{
  "id": "vfl-provoz-001",
  "subject": "predpisy" | "provoz" | "elektrotechnika",
  "question": "Text otázky.",
  "options": ["Distractor 1", "Správná odpověď", "Distractor 2"],
  "correct": 1,
  "explanation": "Krátké vysvětlení (volitelné).",
  "source": "2018_05 V5, A.(1).b.32"
}
```

**Pravidla:**
- `id` ve formátu `vfl-{predmět}-{číslo}` (jedinečné).
- Vždy přesně 3 položky v `options`.
- `correct` = index 0–2 do `options` v původním pořadí (aplikace pořadí promíchá při zobrazení).
- `source` = odkaz na zdrojovou pasáž v ČTÚ dokumentu (čj. ČTÚ‑79 329/2017‑613, vydání 2018_05 V5).

## Stav banky

V0.1 obsahuje **~30 starter otázek** rovnoměrně rozložených napříč třemi předměty. Plná banka má cca 161 otázek a doplňujeme ji v dávkách. Aplikace si nové otázky načte automaticky po editaci `questions.json`.

## Zdrojové dokumenty

Banka vychází výhradně z těchto veřejných materiálů ČTÚ:

- `2018_05_zkousky_otazky_v5_fin.pdf` (čj. ČTÚ‑79 329/2017‑613, vydání 2018_05 V5) — písemné otázky.
- `ustni_zkousky_prukazy_radiova_zarizeni_01-2018.pdf` — osnovy ústních zkoušek.

## Disclaimer

Tento nástroj **není oficiálním produktem ČTÚ**. Je to studijní pomůcka. Závazné znění a aktuální verzi otázek vždy ověřujte na webu ČTÚ.

## Licence

MIT (kód). Otázky jsou veřejné materiály ČTÚ.
