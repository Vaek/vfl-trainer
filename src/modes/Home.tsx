import { Link } from 'react-router-dom'
import { ALL_QUESTIONS } from '../lib/questions'
import { Subject, SUBJECT_LABELS } from '../lib/types'

const SUBJECTS: Subject[] = ['predpisy', 'provoz', 'elektrotechnika']

export default function Home() {
  const counts = SUBJECTS.reduce(
    (acc, s) => {
      acc[s] = ALL_QUESTIONS.filter((q) => q.subject === s).length
      return acc
    },
    {} as Record<Subject, number>,
  )
  const total = ALL_QUESTIONS.length

  return (
    <div>
      {/* Hero */}
      <section className="mb-16 max-w-3xl">
        <div className="font-mono text-xs tracking-[0.25em] text-muted uppercase mb-4">
          / Všeobecný průkaz radiotelefonisty letecké pohyblivé služby /
        </div>
        <h1 className="h-display text-5xl sm:text-6xl leading-[0.95] mb-6">
          Připravte se<br />
          <span className="text-signal italic">na zkoušku VFL.</span>
        </h1>
        <p className="text-lg text-muted leading-relaxed mb-8 max-w-2xl">
          Tréninková aplikace s otázkami z písemné části zkoušky a strukturovaným scénářem
          pro nácvik ústní části přes ChatGPT (nebo jiný AI nástroj). Zdarma, bez registrace,
          vše běží ve vašem prohlížeči.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/mock" className="btn-primary">
            Spustit cvičnou zkoušku →
          </Link>
          <Link to="/study" className="btn-ghost">
            Procházet otázky
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
        {SUBJECTS.map((s) => (
          <div key={s} className="card card-hover">
            <div className="font-mono text-xs tracking-wider text-muted uppercase mb-2">
              {SUBJECT_LABELS[s]}
            </div>
            <div className="h-display text-4xl">{counts[s]}</div>
            <div className="text-sm text-muted mt-1">otázek v bance</div>
          </div>
        ))}
      </section>

      {/* What's inside */}
      <section className="mb-16">
        <h2 className="h-display text-3xl mb-6 aviation-rule pb-2 inline-block text-ink/40">
          <span className="text-ink">Obsah</span>
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link to="/study" className="card card-hover">
            <div className="font-mono text-[10px] tracking-wider uppercase text-muted">01</div>
            <h3 className="font-display text-xl font-medium mt-1 mb-2">Studium</h3>
            <p className="text-sm text-muted">
              Procházejte celou banku otázek po předmětech. Každá otázka má vysvětlení a odkaz na zdroj.
            </p>
          </Link>
          <Link to="/practice" className="card card-hover">
            <div className="font-mono text-[10px] tracking-wider uppercase text-muted">02</div>
            <h3 className="font-display text-xl font-medium mt-1 mb-2">Procvičování</h3>
            <p className="text-sm text-muted">
              Krátké testy z jednoho předmětu. Okamžitá zpětná vazba po každé otázce.
            </p>
          </Link>
          <Link to="/mock" className="card card-hover">
            <div className="font-mono text-[10px] tracking-wider uppercase text-muted">03</div>
            <h3 className="font-display text-xl font-medium mt-1 mb-2">Cvičná zkouška</h3>
            <p className="text-sm text-muted">
              20 otázek, 20 minut. Vyhodnocení podle pravidla ČTÚ — uspěl pouze, kdo má ≥ 90 % v
              <em> každém</em> ze tří předmětů.
            </p>
          </Link>
          <Link to="/oral" className="card card-hover">
            <div className="font-mono text-[10px] tracking-wider uppercase text-muted">04</div>
            <h3 className="font-display text-xl font-medium mt-1 mb-2">Ústní zkouška</h3>
            <p className="text-sm text-muted">
              Tři varianty scénáře pro ChatGPT a další AI nástroje — striktní zkouška, praktický
              režim a tematické drily.
            </p>
          </Link>
        </div>
      </section>

      {/* Bank size note */}
      <section className="border-t border-ink/10 pt-6">
        <p className="text-sm text-muted">
          Banka otázek je verze 0.1 a obsahuje {total} otázek. Plná banka (~161 otázek) bude
          doplňována postupně.
        </p>
      </section>
    </div>
  )
}
