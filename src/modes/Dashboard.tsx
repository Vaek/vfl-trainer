import { useState } from 'react'
import { getAttempts, clearAttempts } from '../lib/storage'
import { AttemptResult, SUBJECT_LABELS } from '../lib/types'

function fmtDate(ts: number) {
  const d = new Date(ts)
  return d.toLocaleString('cs-CZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtDuration(start: number, end: number) {
  const sec = Math.round((end - start) / 1000)
  return `${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`
}

export default function Dashboard() {
  const [attempts, setAttempts] = useState<AttemptResult[]>(() => getAttempts())

  function handleClear() {
    if (confirm('Opravdu smazat veškerou historii pokusů?')) {
      clearAttempts()
      setAttempts([])
    }
  }

  // Aggregate stats
  const mockAttempts = attempts.filter((a) => a.type === 'mock')
  const mockPassed = mockAttempts.filter((a) => a.passed).length
  const totalCorrect = attempts.reduce(
    (acc, a) => acc + a.answers.filter((x) => x.correct).length,
    0,
  )
  const totalAnswered = attempts.reduce((acc, a) => acc + a.answers.length, 0)
  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

  return (
    <div>
      <div className="mb-8">
        <div className="font-mono text-xs tracking-[0.25em] text-muted uppercase mb-2">
          / statistiky /
        </div>
        <h1 className="h-display text-4xl mb-2">Vaše pokusy</h1>
        <p className="text-muted">
          Vše se ukládá pouze ve vašem prohlížeči (localStorage). Vymazáním cookies/dat dojde ke
          ztrátě historie.
        </p>
      </div>

      {attempts.length === 0 ? (
        <div className="card text-center text-muted py-12">
          Zatím žádné pokusy. Spusťte si <strong>cvičnou zkoušku</strong> nebo <strong>procvičování</strong>.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="card !p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
                Celkem pokusů
              </div>
              <div className="h-display text-3xl">{attempts.length}</div>
            </div>
            <div className="card !p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
                Cvičné zkoušky
              </div>
              <div className="h-display text-3xl">
                {mockPassed}<span className="text-muted text-xl"> / {mockAttempts.length}</span>
              </div>
              <div className="text-xs text-muted">úspěšných</div>
            </div>
            <div className="card !p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
                Přesnost celkem
              </div>
              <div className="h-display text-3xl">{overallAccuracy}%</div>
            </div>
            <div className="card !p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">
                Odpovědí
              </div>
              <div className="h-display text-3xl">{totalAnswered}</div>
            </div>
          </div>

          <div className="space-y-3">
            {attempts.map((a) => (
              <div key={a.id} className="card !p-4 flex items-center gap-4 flex-wrap">
                <div className="font-mono text-xs text-muted w-32 shrink-0">
                  {fmtDate(a.startedAt)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">
                    {a.type === 'mock' ? 'Cvičná zkouška' : 'Procvičování'}
                    {a.subject && (
                      <span className="text-muted font-normal"> — {SUBJECT_LABELS[a.subject]}</span>
                    )}
                  </div>
                  <div className="text-xs text-muted font-mono">
                    {a.answers.filter((x) => x.correct).length} / {a.answers.length} správně •
                    {' '}{fmtDuration(a.startedAt, a.finishedAt)}
                  </div>
                </div>
                <div className="shrink-0">
                  {a.passed ? (
                    <span className="chip bg-emerald-100 text-emerald-800">Prospěl(a)</span>
                  ) : (
                    <span className="chip bg-signal/15 text-signal">Neprospěl(a)</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-ink/10">
            <button
              className="text-sm text-signal hover:underline"
              onClick={handleClear}
            >
              Smazat historii
            </button>
          </div>
        </>
      )}
    </div>
  )
}
