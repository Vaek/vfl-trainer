import { useState } from 'react'
import QuestionCard from '../components/QuestionCard'
import { Subject, SUBJECT_LABELS, AnswerRecord } from '../lib/types'
import { pickRandomQuestions, buildAttempt } from '../lib/questions'
import { saveAttempt } from '../lib/storage'
import ResultSummary from '../components/ResultSummary'

const SUBJECTS: Subject[] = ['predpisy', 'provoz', 'elektrotechnika']
const PRACTICE_LENGTH = 10

type Phase = 'setup' | 'running' | 'done'

export default function Practice() {
  const [phase, setPhase] = useState<Phase>('setup')
  const [subject, setSubject] = useState<Subject>('predpisy')
  const [questions, setQuestions] = useState<ReturnType<typeof pickRandomQuestions>>([])
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [index, setIndex] = useState(0)
  const [startedAt, setStartedAt] = useState(0)
  const [attemptResult, setAttemptResult] = useState<ReturnType<typeof buildAttempt> | null>(null)

  function start(s: Subject) {
    const qs = pickRandomQuestions(PRACTICE_LENGTH, s)
    if (qs.length === 0) return
    setSubject(s)
    setQuestions(qs)
    setAnswers([])
    setIndex(0)
    setStartedAt(Date.now())
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
      const result = buildAttempt(
        'practice',
        questions,
        answers,
        startedAt,
        Date.now(),
        subject,
      )
      saveAttempt(result)
      setAttemptResult(result)
      setPhase('done')
    }
  }

  function reset() {
    setPhase('setup')
    setAttemptResult(null)
  }

  if (phase === 'setup') {
    return (
      <div>
        <div className="mb-8">
          <div className="font-mono text-xs tracking-[0.25em] text-muted uppercase mb-2">
            / procvičování /
          </div>
          <h1 className="h-display text-4xl mb-2">Krátký test</h1>
          <p className="text-muted">
            {PRACTICE_LENGTH} náhodných otázek z vybraného předmětu, okamžitá zpětná vazba.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {SUBJECTS.map((s) => (
            <button key={s} onClick={() => start(s)} className="card card-hover text-left">
              <div className="font-mono text-[10px] tracking-wider uppercase text-muted">
                Spustit
              </div>
              <h3 className="h-display text-xl mt-1">{SUBJECT_LABELS[s]}</h3>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (phase === 'running') {
    const q = questions[index]
    return (
      <div>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <div className="font-mono text-xs tracking-wider uppercase text-muted">
              Procvičování — {SUBJECT_LABELS[subject]}
            </div>
            <div className="text-sm text-muted">Otázka {index + 1} z {questions.length}</div>
          </div>
          <button className="btn-ghost text-sm" onClick={reset}>
            Ukončit
          </button>
        </div>
        <QuestionCard
          key={q.id}
          question={q}
          questionNumber={index + 1}
          totalQuestions={questions.length}
          revealed={false}
          onAnswer={handleAnswer}
          onNext={next}
          immediateFeedback={true}
          showSource={false}
        />
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
