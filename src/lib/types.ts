export type Subject = 'predpisy' | 'provoz' | 'elektrotechnika'

export const SUBJECT_LABELS: Record<Subject, string> = {
  predpisy: 'Radiokomunikační předpisy',
  provoz: 'Radiokomunikační provoz',
  elektrotechnika: 'Elektrotechnika a radiotechnika',
}

export const SUBJECT_LABELS_SHORT: Record<Subject, string> = {
  predpisy: 'Předpisy',
  provoz: 'Provoz',
  elektrotechnika: 'Elektrotechnika',
}

export interface Question {
  id: string
  subject: Subject
  question: string
  options: string[] // exactly 3 options
  correct: number // index 0-2
  explanation?: string
  source: string // e.g., "2018_05 V5, A.(1).a.1"
}

export interface AnswerRecord {
  questionId: string
  selected: number | null
  correct: boolean
  timeMs: number
}

export interface AttemptResult {
  id: string
  type: 'practice' | 'mock'
  startedAt: number
  finishedAt: number
  subject?: Subject // present for practice
  answers: AnswerRecord[]
  perSubjectScore: Record<Subject, { correct: number; total: number; percent: number }>
  passed: boolean
}
