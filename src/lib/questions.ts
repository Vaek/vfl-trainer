import { Question, Subject, AnswerRecord, AttemptResult } from './types'
import questionsData from '../data/questions.json'

export const ALL_QUESTIONS: Question[] = questionsData as Question[]

export function getQuestionsBySubject(subject: Subject): Question[] {
  return ALL_QUESTIONS.filter((q) => q.subject === subject)
}

export function getQuestionById(id: string): Question | undefined {
  return ALL_QUESTIONS.find((q) => q.id === id)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Deterministic PRNG (mulberry32) for stable per-question option order.
function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashString(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]
  const rng = seededRng(seed)
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function pickRandomQuestions(count: number, subject?: Subject): Question[] {
  const pool = subject ? getQuestionsBySubject(subject) : ALL_QUESTIONS
  return shuffle(pool).slice(0, count)
}

/**
 * For a 20-question mock exam, distribute roughly proportionally to bank size:
 * predpisy ~6, provoz ~10, elektrotechnika ~4 (sums to 20).
 * If banks are too small, falls back to taking what's available.
 */
export function pickMockExamQuestions(totalCount = 20): Question[] {
  // Approximate proportions matching the real bank distribution
  // (provoz is the largest subject, predpisy ~half, elektro ~third)
  const targetPredpisy = Math.round(totalCount * 0.3)
  const targetProvoz = Math.round(totalCount * 0.5)
  const targetElektro = totalCount - targetPredpisy - targetProvoz

  const predpisyPool = shuffle(getQuestionsBySubject('predpisy'))
  const provozPool = shuffle(getQuestionsBySubject('provoz'))
  const elektroPool = shuffle(getQuestionsBySubject('elektrotechnika'))

  const picked = [
    ...predpisyPool.slice(0, Math.min(targetPredpisy, predpisyPool.length)),
    ...provozPool.slice(0, Math.min(targetProvoz, provozPool.length)),
    ...elektroPool.slice(0, Math.min(targetElektro, elektroPool.length)),
  ]

  // If any pool was too small, pad with random others
  if (picked.length < totalCount) {
    const used = new Set(picked.map((q) => q.id))
    const rest = shuffle(ALL_QUESTIONS.filter((q) => !used.has(q.id)))
    picked.push(...rest.slice(0, totalCount - picked.length))
  }

  return shuffle(picked)
}

export function shuffleOptions(question: Question): {
  options: string[]
  correctIndex: number
} {
  const seed = hashString(question.id)
  const indexed = question.options.map((opt, i) => ({ opt, i }))
  const shuffled = seededShuffle(indexed, seed)
  const newCorrect = shuffled.findIndex((x) => x.i === question.correct)
  return {
    options: shuffled.map((x) => x.opt),
    correctIndex: newCorrect,
  }
}

export function buildAttempt(
  type: 'practice' | 'mock',
  questions: Question[],
  answers: AnswerRecord[],
  startedAt: number,
  finishedAt: number,
  subject?: Subject,
): AttemptResult {
  const perSubjectScore: AttemptResult['perSubjectScore'] = {
    predpisy: { correct: 0, total: 0, percent: 0 },
    provoz: { correct: 0, total: 0, percent: 0 },
    elektrotechnika: { correct: 0, total: 0, percent: 0 },
  }

  for (const q of questions) {
    perSubjectScore[q.subject].total += 1
    const ans = answers.find((a) => a.questionId === q.id)
    if (ans?.correct) perSubjectScore[q.subject].correct += 1
  }

  for (const subj of Object.keys(perSubjectScore) as Subject[]) {
    const s = perSubjectScore[subj]
    s.percent = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
  }

  // For mock: pass = ALL three subjects ≥90% (when present)
  // For practice (single subject): pass = that subject ≥90%
  let passed: boolean
  if (type === 'mock') {
    const subjects = Object.values(perSubjectScore).filter((s) => s.total > 0)
    passed = subjects.length > 0 && subjects.every((s) => s.percent >= 90)
  } else {
    const s = subject ? perSubjectScore[subject] : null
    passed = !!s && s.total > 0 && s.percent >= 90
  }

  return {
    id: `${type}-${startedAt}`,
    type,
    startedAt,
    finishedAt,
    subject,
    answers,
    perSubjectScore,
    passed,
  }
}
