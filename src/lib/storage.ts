import { AttemptResult } from './types'

const STORAGE_KEY = 'vfl-trainer:v1'

interface StorageShape {
  attempts: AttemptResult[]
}

function read(): StorageShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { attempts: [] }
    const parsed = JSON.parse(raw) as StorageShape
    if (!parsed.attempts) return { attempts: [] }
    return parsed
  } catch {
    return { attempts: [] }
  }
}

function write(data: StorageShape) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota exceeded or disabled */
  }
}

export function saveAttempt(attempt: AttemptResult) {
  const data = read()
  data.attempts.unshift(attempt)
  // Keep last 100 attempts to avoid unbounded growth
  data.attempts = data.attempts.slice(0, 100)
  write(data)
}

export function getAttempts(): AttemptResult[] {
  return read().attempts
}

export function clearAttempts() {
  write({ attempts: [] })
}
