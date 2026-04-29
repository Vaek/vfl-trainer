import { useEffect, useState } from 'react'
import QuestionCard from '../components/QuestionCard'
import { AnswerRecord } from '../lib/types'
import { pickMockExamQuestions, buildAttempt } from '../lib/questions'
import { saveAttempt } from '../lib/storage'
import ResultSummary from '../components/ResultSummary'

const MOCK_LENGTH = 20
const MOCK_DURATION_MS = 20 * 60 * 1000 // 20 minutes

type Phase = 'setup' | 'running' | 'done'

function fmtTime(ms: number) {
  if (ms < 0) ms = 0
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Mock() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [questions, setQuestions] = useState<ReturnType<typeof pickMockExamQuestions>>([])
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [index, setIndex] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [now, setNow] = useState(Date.now())
  const [attemptResult, setAttemptResult] = useState<ReturnType<typeof buildAttempt> | null>(null)

  // Timer tick
  useEffect(() => {
    if (phase !== 'running') return
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [phase])

  // Auto-finish on timeout
  useEffect(() => {
    if (phase !== 'running') return
    const elapsed = now - startedAt
    if (elapsed >= MOCK_DURATION_MS) {
      finish()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now, phase])

  function start() {
    const qs = pickMockExamQuestions(MOCK_LENGTH)
    if (qs.length === 0) return
    setQuestions(qs)
    setAnswers([])
    setIndex(0)
    const t = Date.now()
    setStartedAt(t)
    setNow(t)
    setPhase('running')
  }

  function handleAnswer(selectedIndex: number, correctIndex: number, timeMs: number) {
    const q = questions[index]
    const rec: AnswerRecord = {
      questionId: q.id,
      selected: selectedIndex,
      correct: selectedIndex === correctIndex,
      timeMs,
    }
    setAnswers((prev) => [...prev.filter((a) => a.questionId !== q.id), rec])
  }

  function next() {
    if (index < questions.length - 1) {
      setIndex(index + 1)
    } else {
      finish()
    }
  }

  function finish() {
    const result = buildAttempt('mock', questions, answers, startedAt, Date.now())
    saveAttempt(result)
    setAttemptResult(result)
    setPhase('done')
  }

  function reset() {
    setPhase('setup')
    setAttemptResult(null)
  }

  if (phase === 'setup') {
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <div className="font-mono text-xs tracking-[0.25em] text-muted uppercase mb-2">
            / cvičná zkouška /
          </div>
          <h1 className="h-display text-4xl mb-2">Cvičná písemná zkouška</h1>
        </div>
        <div className="card mb-6">
          <h2 className="h-display text-2xl mb-4">Pravidla</h2>
          <ul className="space-y-3 text-sm leading-relaxed">
            <li className="flex gap-3">
              <span className="font-mono text-muted shrink-0">01</span>
              <span><strong>{MOCK_LENGTH} otázek</strong> rozdělených napříč třemi předměty
                (předpisy, provoz, elektrotechnika).</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-muted shrink-0">02</span>
              <span><strong>20 minut</strong> celkový čas. Po vypršení se zkouška automaticky
                vyhodnotí.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-muted shrink-0">03</span>
              <span>Žádná zpětná vazba během zkoušky. Jakmile potvrdíte odpověď, pokračujete dál.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-mono text-muted shrink-0">04</span>
              <span><strong>Uspěl</strong> pouze pokud má každý ze tří předmětů ≥ 90 % (pravidlo ČTÚ).
                Jeden slabý předmět = neprospěl, i kdyby ostatní byly perfektní.</span>
            </li>
          </ul>
        </div>
        <button className="btn-primary w-full" onClick={start}>
          Spustit cvičnou zkoušku →
        </button>
      </div>
    )
  }

  if (phase === 'running') {
    const q = questions[index]
    const remaining = MOCK_DURATION_MS - (now - startedAt)
    const lowTime = remaining < 60_000

    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <div className="font-mono text-xs tracking-wider uppercase text-muted">
              Cvičná zkouška
            </div>
            <div className="text-sm text-muted">
              Otázka {index + 1} z {questions.length}
            </div>
          </div>
          <div
            className={
              'font-mono text-2xl tabular-nums ' +
              (lowTime ? 'text-signal animate-pulse' : 'text-ink')
            }
          >
            {fmtTime(remaining)}
          </div>
        </div>
        <QuestionCard
          key={q.id}
          question={q}
          questionNumber={index + 1}
          totalQuestions={questions.length}
          revealed={false}
          onAnswer={handleAnswer}
          onNext={next}
          immediateFeedback={false}
          showSource={false}
        />
        <div className="mt-6 flex justify-end">
          <button className="btn-ghost text-sm" onClick={finish}>
            Ukončit a vyhodnotit
          </button>
        </div>
      </div>
    )
  }

  // done
  return (
    <ResultSummary
      attempt={attemptResult!}
      questions={questions}
      onRestart={reset}
    />
  )
}
