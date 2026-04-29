import { useState } from 'react'
import QuestionCard from '../components/QuestionCard'
import { Subject, SUBJECT_LABELS } from '../lib/types'
import { getQuestionsBySubject } from '../lib/questions'

const SUBJECTS: Subject[] = ['predpisy', 'provoz', 'elektrotechnika']

export default function Study() {
  const [subject, setSubject] = useState<Subject>('predpisy')
  const [index, setIndex] = useState(0)

  const questions = getQuestionsBySubject(subject)
  const question = questions[index]

  function changeSubject(s: Subject) {
    setSubject(s)
    setIndex(0)
  }

  return (
    <div>
      <div className="mb-6">
        <div className="font-mono text-xs tracking-[0.25em] text-muted uppercase mb-2">
          / studium /
        </div>
        <h1 className="h-display text-4xl mb-1">Procházení banky</h1>
        <p className="text-muted">Odpovězte si pro sebe a podívejte se na vysvětlení.</p>
      </div>

      {/* Subject selector */}
      <div className="flex flex-wrap gap-2 mb-8">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            onClick={() => changeSubject(s)}
            className={
              s === subject
                ? 'btn-primary'
                : 'btn-ghost'
            }
          >
            {SUBJECT_LABELS[s]}
          </button>
        ))}
      </div>

      {questions.length === 0 ? (
        <div className="card text-center text-muted">
          V tomto předmětu zatím nejsou otázky.
        </div>
      ) : (
        <>
          <QuestionCard
            key={question.id}
            question={question}
            questionNumber={index + 1}
            totalQuestions={questions.length}
            revealed={false}
            onAnswer={() => { /* no-op in study */ }}
            immediateFeedback={true}
            showSource={true}
          />

          <div className="flex justify-between items-center mt-6">
            <button
              className="btn-ghost"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              ← Předchozí
            </button>
            <div className="font-mono text-xs text-muted">
              {index + 1} / {questions.length}
            </div>
            <button
              className="btn-ghost"
              onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}
              disabled={index >= questions.length - 1}
            >
              Další →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
