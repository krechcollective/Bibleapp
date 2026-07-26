import { create } from 'zustand'
import type { Translation } from '../lib/api'

interface AppState {
  translation: Translation
  setTranslation: (t: Translation) => void

  currentBook: string
  currentChapter: number
  setPosition: (book: string, chapter: number) => void

  notesPanelOpen: boolean
  toggleNotesPanel: () => void
  setNotesPanelOpen: (open: boolean) => void

  activeVerse: { book: string; chapter: number; verse: number } | null
  setActiveVerse: (v: { book: string; chapter: number; verse: number } | null) => void
}

const STORAGE_KEY = 'bible-reader-position'

function loadInitialPosition(): { book: string; chapter: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore malformed storage
  }
  return { book: 'Genesis', chapter: 1 }
}

export const useAppStore = create<AppState>((set) => ({
  translation: 'ESV',
  setTranslation: (t) => set({ translation: t }),

  ...loadInitialPosition(),
  currentBook: loadInitialPosition().book,
  currentChapter: loadInitialPosition().chapter,
  setPosition: (book, chapter) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ book, chapter }))
    } catch {
      // storage unavailable; position just won't persist
    }
    set({ currentBook: book, currentChapter: chapter })
  },

  notesPanelOpen: false,
  toggleNotesPanel: () => set((s) => ({ notesPanelOpen: !s.notesPanelOpen })),
  setNotesPanelOpen: (open) => set({ notesPanelOpen: open }),

  activeVerse: null,
  setActiveVerse: (v) => set({ activeVerse: v }),
}))
