export type Translation = 'ESV' | 'MSG'

export interface PassageVerse {
  verse: number
  text: string
}

export interface Passage {
  book: string
  chapter: number
  translation: Translation
  verses: PassageVerse[]
}

export interface Note {
  id: string
  book: string
  chapter: number
  verseStart: number
  verseEnd: number
  type: 'text' | 'drawing'
  content: string
  createdAt: string
  updatedAt: string
}

export interface PlanDay {
  day: number
  date: string
  passages: { book: string; chapter: number; verseStart?: number; verseEnd?: number }[]
  completed: boolean
}

const API_BASE = '/api'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }
  return res.json() as Promise<T>
}

export const api = {
  async getPassage(book: string, chapter: number, translation: Translation): Promise<Passage> {
    const params = new URLSearchParams({ book, chapter: String(chapter), translation })
    const res = await fetch(`${API_BASE}/passage?${params}`)
    return json<Passage>(res)
  },

  async listNotes(book?: string, chapter?: number): Promise<Note[]> {
    const params = new URLSearchParams()
    if (book) params.set('book', book)
    if (chapter != null) params.set('chapter', String(chapter))
    const res = await fetch(`${API_BASE}/notes?${params}`)
    return json<Note[]>(res)
  },

  async saveNote(note: Partial<Note> & { book: string; chapter: number; verseStart: number; verseEnd: number; type: 'text' | 'drawing'; content: string }): Promise<Note> {
    const res = await fetch(`${API_BASE}/notes${note.id ? `/${note.id}` : ''}`, {
      method: note.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    })
    return json<Note>(res)
  },

  async deleteNote(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(`API ${res.status}`)
  },

  async getPlan(): Promise<PlanDay[]> {
    const res = await fetch(`${API_BASE}/plan`)
    return json<PlanDay[]>(res)
  },

  async markDayComplete(day: number, completed: boolean): Promise<void> {
    const res = await fetch(`${API_BASE}/plan/${day}/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
  },

  async getSettings(): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/settings`)
    return json<Record<string, string>>(res)
  },

  async saveSetting(key: string, value: string): Promise<void> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    if (!res.ok) throw new Error(`API ${res.status}`)
  },
}
