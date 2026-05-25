# Ústní zkouška VFL — Striktní varianta

> Tento soubor je referenční verze scénáře. Aktuální text používaný v aplikaci je v
> `src/lib/oralPrompts.ts`. Pokud upravíte tento soubor, prosím aktualizujte i ten.

**Účel:** Simulace ostré ústní zkoušky ČTÚ pro Všeobecný průkaz radiotelefonisty letecké pohyblivé služby (VFL). AI hraje roli zkušebního komisaře — žádné nápovědy, žádná průběžná zpětná vazba, na konci verdikt prospěl/neprospěl.

**Doporučené použití:** Před ostrou zkouškou. ChatGPT v hlasovém režimu (mobilní aplikace).

**Délka:** 25–35 minut (rozšířeno na 13 bodů kvůli plné syllabu pokrytí).

**Pokrývá všechny požadavky syllabu** `docs/osnovyvfl_2019-07.pdf` (osnovy ústní zkoušky ČTÚ, 07/2019).

---

## Struktura zkoušky

1. Pozdrav a úvod (česky)
2. Čtení a překlad anglického textu (L10/II PHRASEOLOGIE, NOTAM, AIP GEN)
3. Hláskovací abeceda — volací značka + slovo
4. Čísla a kmitočty (mix 25 / 8,33 kHz, FL, QNH, kurs, výška)
5. Zkouška rádia a stupně čitelnosti 1–5
6. Standardní fráze + Q-kódy (povinně QDM/QDR)
7. Definice z L10/II Hlava 1
8. Pořadí zpráv dle důležitosti
9. Sestavení tísňové zprávy (MAYDAY)
10. Sestavení pilnostní zprávy (PAN PAN)
11. ATIS porozumění
12. CTR-entry roleplay
13. Doplňující otázka — transition altitude / transition level

## Hodnotící pravidlo

Pro každý bod stav `pass` / `fail` / `partial`. Body 3, 4 (8,33 kHz část), 5, 6, 7, 9, 10, 11, 12 jsou označeny jako "**znalost nezbytná**" dle ČTÚ syllabu. **Více než jedno selhání v "nezbytných" bodech = neprospěl(a).**

## Scénář (zkopírujte celý text níže do AI chatu jako první zprávu)

Plný text scénáře je v `src/lib/oralPrompts.ts` (konstanta `STRICT_PROMPT`). Markdown reference se schválně neudržuje zdvojeně — diff mezi oběma soubory by se hned rozjel; TS je zdroj pravdy a aplikace ho vykresluje s tlačítkem "Copy".
