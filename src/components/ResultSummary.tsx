import { AttemptResult, Question, Subject, SUBJECT_LABELS } from '../lib/types'
import { shuffleOptions } from '../lib/questions'
import { useMemo, useState } from 'react'

interface Props {
  attempt: AttemptResult
  questions: Question[]
  onRestart: () => void
}

const SUBJECTS: Subject[] = ['predpisy', 'provoz', 'elektrotechnika']

export default function ResultSummary({ attempt, questions, onRestart }: Props) {
  const [showReview, setShowReview] = useState(false)

  const totalCorrect = attempt.answers.filter((a) => a.correct).length
  const totalAnswered = attempt.answers.length
  const totalQuestions = questions.length
  const overallPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  const durationSec = Math.round((attempt.finishedAt - attempt.startedAt) / 1000)
  const durationFmt = `${Math.floor(durationSec / 60)}:${(durationSec % 60).toString().padStart(2, '0')}`

  return (
    <div>
      <div className="mb-8">
        <div className="font-mono text-xs tracking-[0.25em] text-muted uppercase mb-2">
          / vyhodnocení /
        </div>
        <h1 className="h-display text-5xl mb-2">
          {attempt.passed ? (
            <span className="text-emerald-700">Prospěl(a)</span>
          ) : (
            <span className="text-signal">Neprospěl(a)</span>
          )}
        </h1>
        <p className="text-muted">
          {attempt.type === 'mock'
            ? 'Pravidlo: prospěl pouze pokud každý ze tří předmětů ≥ 90 %.'
            : 'Procvičování: prospěl při ≥ 90 % v daném předmětu.'}
        </p>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Stat label="Celkem" value={`${overallPercent}%`} />
        <Stat label="Správně" value={`${totalCorrect} / ${totalQuestions}`} />
        <Stat label="Zodpovězeno" value={`${totalAnswered} / ${totalQuestions}`} />
        <Stat label="Čas" value={durationFmt} />
      </div>

      {/* Per-subject breakdown */}
      {attempt.type === 'mock' && (
        <div className="card mb-8">
          <h2 className="h-display text-xl mb-4">Po předmětech</h2>
          <div className="space-y-3">
            {SUBJECTS.map((s) => {
              const score = attempt.perSubjectScore[s]
              if (score.total === 0) return null
              const passed = score.percent >= 90
              return (
                <div key={s} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{SUBJECT_LABELS[s]}</div>
                    <div className="text-xs text-muted font-mono">
                      {score.correct} / {score.total}
                    </div>
                  </div>
                  <div className="w-40 sm:w-64 h-2 bg-ink/10 rounded-full overflow-hidden">
                    <div
                      className={passed ? 'h-full bg-emerald-600' : 'h-full bg-signal'}
                      style={{ width: `${score.percent}%` }}
                    />
                  </div>
                  <div
                    className={
                      'font-mono text-sm tabular-nums w-12 text-right ' +
                      (passed ? 'text-emerald-700' : 'text-signal')
                    }
                  >
                    {score.percent}%
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 text-xs text-muted border-t border-ink/10 pt-3">
            Hraniční hodnota: 90 % v každém předmětu.
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8">
        <button className="btn-primary" onClick={onRestart}>
          Spustit znovu
        </button>
        <button className="btn-ghost" onClick={() => setShowReview((v) => !v)}>
          {showReview ? 'Skrýt rozbor' : 'Rozbor odpovědí'}
        </button>
      </div>

      {showReview && (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <ReviewItem key={q.id} question={q} attempt={attempt} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card !p-4">
      <div className="font-mono text-[10px] tracking-wider uppercase text-muted mb-1">
        {label}
      </div>
      <div className="h-display text-2xl">{value}</div>
    </div>
  )
}

function ReviewItem({
  question,
  attempt,
  index,
}: {
  question: Question
  attempt: AttemptResult
  index: number
}) {
  // Re-derive shuffled options consistently using question id
  const { options, correctIndex } = useMemo(() => shuffleOptions(question), [question.id])
  const ans = attempt.answers.find((a) => a.questionId === question.id)
  const userIdx = ans?.selected
  const correct = ans?.correct ?? false

  return (
    <div className="card">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">{index}</span>
          {correct ? (
            <span className="chip bg-emerald-100 text-emerald-800">Správně</span>
          ) : (
            <span className="chip bg-signal/15 text-signal">Špatně</span>
          )}
        </div>
        <span className="font-mono text-[10px] text-muted">{question.source}</span>
      </div>
      <h3 className="font-medium mb-3">{question.question}</h3>
      <div className="space-y-1.5 mb-3">
        {options.map((opt, i) => {
          let cls = 'text-sm px-3 py-2 rounded-lg border border-transparent'
          if (i === correctIndex) cls += ' bg-emerald-50 border-emerald-300 text-emerald-900'
          else if (i === userIdx) cls += ' bg-signal/5 border-signal/30 text-signal'
          else cls += ' text-muted'
          return (
            <div key={i} className={cls}>
              <span className="font-mono text-xs mr-2">{String.fromCharCode(65 + i)}</span>
              {opt}
            </div>
          )
        })}
      </div>
      {question.explanation && (
        <p className="text-sm text-ink/80 border-t border-ink/10 pt-3 mt-3 leading-relaxed">
          {question.explanation}
        </p>
      )}
    </div>
  )
}
