import { create } from 'zustand'
import type { Translation } from '../lib/api'

export type ReadingMode = 'canonical' | 'plan'

interface AppState {
  translation: Translation
  setTranslation: (t: Translation) => void

  /** 'canonical' = plain Genesis→Revelation scroll, no plan overlay. 'plan' = the reading plan's order. */
  readingMode: ReadingMode
  setReadingMode: (m: ReadingMode) => void

  currentBook: string
  currentChapter: number
  setPosition: (book: string, chapter: number) => void

  /** Scroll index into the flattened plan sequence, so plan-mode reading resumes where it left off. */
  planIndex: number
  setPlanIndex: (i: number) => void

  /** Set by the Plan view to hand off "scroll to this day" to the Reader; cleared once consumed. */
  pendingPlanDay: number | null
  setPendingPlanDay: (day: number | null) => void
}

const POSITION_KEY = 'bible-reader-position'
const MODE_KEY = 'bible-reader-mode'
const PLAN_INDEX_KEY = 'bible-reader-plan-index'

function loadInitialPosition(): { book: string; chapter: number } {
  try {
    const raw = localStorage.getItem(POSITION_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore malformed storage
  }
  return { book: 'Genesis', chapter: 1 }
}

function loadInitialMode(): ReadingMode {
  return localStorage.getItem(MODE_KEY) === 'plan' ? 'plan' : 'canonical'
}

function loadInitialPlanIndex(): number {
  const raw = localStorage.getItem(PLAN_INDEX_KEY)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export const useAppStore = create<AppState>((set) => ({
  translation: 'ESV',
  setTranslation: (t) => set({ translation: t }),

  readingMode: loadInitialMode(),
  setReadingMode: (m) => {
    try {
      localStorage.setItem(MODE_KEY, m)
    } catch {
      // storage unavailable; mode just won't persist
    }
    set({ readingMode: m })
  },

  currentBook: loadInitialPosition().book,
  currentChapter: loadInitialPosition().chapter,
  setPosition: (book, chapter) => {
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify({ book, chapter }))
    } catch {
      // storage unavailable; position just won't persist
    }
    set({ currentBook: book, currentChapter: chapter })
  },

  planIndex: loadInitialPlanIndex(),
  setPlanIndex: (i) => {
    try {
      localStorage.setItem(PLAN_INDEX_KEY, String(i))
    } catch {
      // storage unavailable; plan position just won't persist
    }
    set({ planIndex: i })
  },

  pendingPlanDay: null,
  setPendingPlanDay: (day) => set({ pendingPlanDay: day }),
}))
