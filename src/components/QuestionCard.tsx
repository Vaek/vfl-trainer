import { useEffect, useMemo, useState } from 'react'
import { Question, SUBJECT_LABELS_SHORT, Subject } from '../lib/types'
import { shuffleOptions } from '../lib/questions'

interface Props {
  question: Question
  questionNumber: number
  totalQuestions: number
  /** When true, show correct/incorrect colors and explanation */
  revealed: boolean
  /** Called when user picks an option */
  onAnswer: (selectedIndex: number, correctIndex: number, timeMs: number) => void
  /** Called when user clicks next */
  onNext?: () => void
  /** When true, immediate feedback after each answer (study/practice). When false, no feedback until end (mock). */
  immediateFeedback: boolean
  /** Show source citation (study mode only) */
  showSource?: boolean
}

const subjectChip: Record<Subject, string> = {
  predpisy: 'chip-predpisy',
  provoz: 'chip-provoz',
  elektrotechnika: 'chip-elektro',
}

export default function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  revealed,
  onAnswer,
  onNext,
  immediateFeedback,
  showSource = false,
}: Props) {
  // Shuffle option order per question render. Memoize per question id.
  const { options, correctIndex } = useMemo(() => shuffleOptions(question), [question.id])
  const [selected, setSelected] = useState<number | null>(null)
  const [startedAt] = useState<number>(() => Date.now())
  const [showExplanation, setShowExplanation] = useState(false)

  // Reset on new question
  useEffect(() => {
    setSelected(null)
    setShowExplanation(false)
  }, [question.id])

  const locked = revealed || (immediateFeedback && selected !== null)

  function handlePick(i: number) {
    if (locked) return
    setSelected(i)
    setShowExplanation(true)
    onAnswer(i, correctIndex, Date.now() - startedAt)
  }

  function classForOption(i: number): string {
    const base = 'option-btn'
    if (!locked) {
      return selected === i ? `${base} option-btn-selected` : base
    }
    // Locked: show feedback if immediateFeedback or revealed
    const showFeedback = immediateFeedback || revealed
    if (!showFeedback) {
      return selected === i ? `${base} option-btn-selected option-btn-disabled` : `${base} option-btn-disabled`
    }
    if (i === correctIndex) return `${base} option-btn-correct option-btn-disabled`
    if (i === selected && i !== correctIndex) return `${base} option-btn-incorrect option-btn-disabled`
    return `${base} option-btn-disabled opacity-60`
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <span className={subjectChip[question.subject]}>
            {SUBJECT_LABELS_SHORT[question.subject]}
          </span>
          <span className="font-mono text-xs text-muted">
            {questionNumber} / {totalQuestions}
          </span>
        </div>
        {showSource && (
          <span className="font-mono text-[10px] text-muted">{question.source}</span>
        )}
      </div>

      <h2 className="text-lg sm:text-xl font-medium leading-snug mb-6">
        {question.question}
      </h2>

      <div className="space-y-2.5">
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className={classForOption(i)}
            onClick={() => handlePick(i)}
            disabled={locked}
          >
            <div className="flex items-start gap-3">
              <span className="font-mono text-sm text-muted shrink-0 mt-0.5">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
            </div>
          </button>
        ))}
      </div>

      {(immediateFeedback || revealed) && showExplanation && question.explanation && (
        <div className="mt-5 p-4 rounded-xl bg-ink/[0.03] border border-ink/10">
          <div className="font-mono text-[10px] tracking-wider uppercase text-muted mb-1.5">
            Vysvětlení
          </div>
          <p className="text-sm leading-relaxed">{question.explanation}</p>
        </div>
      )}

      {onNext && (selected !== null || revealed) && (
        <div className="mt-6 flex justify-end">
          <button className="btn-primary" onClick={onNext}>
            {questionNumber < totalQuestions ? 'Další otázka →' : 'Vyhodnotit'}
          </button>
        </div>
      )}
    </div>
  )
}
