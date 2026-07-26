import { useEffect, useState } from 'react'
import { api, type Note } from '../lib/api'
import { useAppStore } from '../store/appStore'

export function NotesPanel() {
  const activeVerse = useAppStore((s) => s.activeVerse)
  const notesPanelOpen = useAppStore((s) => s.notesPanelOpen)
  const setNotesPanelOpen = useAppStore((s) => s.setNotesPanelOpen)
  const currentBook = useAppStore((s) => s.currentBook)
  const currentChapter = useAppStore((s) => s.currentChapter)

  const book = activeVerse?.book ?? currentBook
  const chapter = activeVerse?.chapter ?? currentChapter

  const [notes, setNotes] = useState<Note[]>([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    api
      .listNotes(book, chapter)
      .then(setNotes)
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [book, chapter])

  async function addNote() {
    if (!draft.trim()) return
    const verse = activeVerse?.verse ?? 1
    const saved = await api.saveNote({
      book,
      chapter,
      verseStart: verse,
      verseEnd: verse,
      type: 'text',
      content: draft.trim(),
    })
    setNotes((prev) => [...prev, saved])
    setDraft('')
  }

  async function removeNote(id: string) {
    await api.deleteNote(id)
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <aside className={`notes-panel ${notesPanelOpen ? 'open' : ''}`}>
      <div className="notes-panel-header">
        <span>
          Notes — {book} {chapter}
          {activeVerse ? `:${activeVerse.verse}` : ''}
        </span>
        <button className="notes-panel-close" onClick={() => setNotesPanelOpen(false)}>
          ✕
        </button>
      </div>

      <div className="dot-grid">
        {loading && <p className="notes-loading">Loading notes…</p>}
        {!loading && notes.length === 0 && <p className="notes-empty">No notes on this chapter yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className="note-item">
            <div className="note-ref">
              v{n.verseStart}
              {n.verseEnd !== n.verseStart ? `-${n.verseEnd}` : ''}
            </div>
            <div className="note-content">{n.content}</div>
            <button className="note-delete" onClick={() => removeNote(n.id)}>
              delete
            </button>
          </div>
        ))}
      </div>

      <div className="note-composer">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={activeVerse ? `Note on verse ${activeVerse.verse}…` : 'Note on this chapter…'}
          rows={3}
        />
        <button onClick={addNote} disabled={!draft.trim()}>
          Add note
        </button>
      </div>
    </aside>
  )
}
