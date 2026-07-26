import { useEffect, useRef, useState } from 'react'
import { api, type Note, type Passage } from '../lib/api'
import { useAppStore } from '../store/appStore'

interface ChapterViewProps {
  book: string
  chapter: number
  /** Optional day-divider label rendered above this chapter, e.g. "Day 12 — Jan 12". */
  dayDivider?: string
  onDayComplete?: () => void
}

const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink'] as const
type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]

interface PopoverState {
  verse: number
  top: number
  editingText: boolean
  draft: string
}

export function ChapterView({ book, chapter, dayDivider, onDayComplete }: ChapterViewProps) {
  const translation = useAppStore((s) => s.translation)
  const [passage, setPassage] = useState<Passage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [popover, setPopover] = useState<PopoverState | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    setPassage(null)
    setError(null)
    api
      .getPassage(book, chapter, translation)
      .then((p) => {
        if (!cancelled) setPassage(p)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [book, chapter, translation])

  useEffect(() => {
    let cancelled = false
    api
      .listNotes(book, chapter)
      .then((n) => {
        if (!cancelled) setNotes(n)
      })
      .catch(() => {
        if (!cancelled) setNotes([])
      })
    return () => {
      cancelled = true
    }
  }, [book, chapter])

  function highlightFor(verse: number): Note | undefined {
    return notes.find((n) => n.type === 'highlight' && n.verseStart <= verse && verse <= n.verseEnd)
  }

  function textNotesFor(): Note[] {
    return notes.filter((n) => n.type === 'text').sort((a, b) => a.verseStart - b.verseStart)
  }

  function onVerseClick(e: React.MouseEvent<HTMLSpanElement>, verse: number) {
    if (popover?.verse === verse) {
      setPopover(null)
      return
    }
    const container = containerRef.current?.getBoundingClientRect()
    const rect = e.currentTarget.getBoundingClientRect()
    setPopover({
      verse,
      top: container ? rect.bottom - container.top + 4 : 0,
      editingText: false,
      draft: '',
    })
  }

  async function toggleHighlight(color: HighlightColor) {
    if (!popover) return
    const existing = highlightFor(popover.verse)
    if (existing && existing.content === color) {
      await api.deleteNote(existing.id)
      setNotes((prev) => prev.filter((n) => n.id !== existing.id))
    } else if (existing) {
      const updated = await api.saveNote({ ...existing, content: color })
      setNotes((prev) => prev.map((n) => (n.id === existing.id ? updated : n)))
    } else {
      const created = await api.saveNote({
        book,
        chapter,
        verseStart: popover.verse,
        verseEnd: popover.verse,
        type: 'highlight',
        content: color,
      })
      setNotes((prev) => [...prev, created])
    }
  }

  function openNoteEditor() {
    if (!popover) return
    const existing = notes.find((n) => n.type === 'text' && n.verseStart === popover.verse)
    setPopover({ ...popover, editingText: true, draft: existing?.content ?? '' })
  }

  async function saveNoteDraft() {
    if (!popover) return
    const existing = notes.find((n) => n.type === 'text' && n.verseStart === popover.verse)
    const text = popover.draft.trim()
    if (!text) {
      if (existing) {
        await api.deleteNote(existing.id)
        setNotes((prev) => prev.filter((n) => n.id !== existing.id))
      }
      setPopover(null)
      return
    }
    if (existing) {
      const updated = await api.saveNote({ ...existing, content: text })
      setNotes((prev) => prev.map((n) => (n.id === existing.id ? updated : n)))
    } else {
      const created = await api.saveNote({
        book,
        chapter,
        verseStart: popover.verse,
        verseEnd: popover.verse,
        type: 'text',
        content: text,
      })
      setNotes((prev) => [...prev, created])
    }
    setPopover(null)
  }

  function startEditMarginNote(note: Note) {
    setEditingNoteId(note.id)
    setEditingDraft(note.content)
  }

  async function saveMarginEdit(note: Note) {
    const text = editingDraft.trim()
    if (!text) {
      await api.deleteNote(note.id)
      setNotes((prev) => prev.filter((n) => n.id !== note.id))
    } else {
      const updated = await api.saveNote({ ...note, content: text })
      setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)))
    }
    setEditingNoteId(null)
  }

  async function deleteMarginNote(note: Note) {
    await api.deleteNote(note.id)
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    setEditingNoteId(null)
  }

  return (
    <div className="chapter" data-book={book} data-chapter={chapter}>
      {dayDivider && (
        <div className="day-divider">
          <span className="day-divider-line" />
          <span className="day-divider-label" onClick={onDayComplete}>
            {dayDivider}
          </span>
          <span className="day-divider-line" />
        </div>
      )}

      <div className="chapter-grid" ref={containerRef}>
        <div className="chapter-column">
          <h2 className="chapter-heading">
            {book} {chapter}
          </h2>
          {error && <p className="chapter-error">Couldn't load this chapter: {error}</p>}
          {!passage && !error && <p className="chapter-loading">Loading…</p>}
          {passage && (
            <p className="chapter-text">
              {passage.verses.map((v) => {
                const hl = highlightFor(v.verse)
                return (
                  <span
                    key={v.verse}
                    className={`verse ${hl ? `verse-hl-${hl.content}` : ''} ${
                      popover?.verse === v.verse ? 'verse-selected' : ''
                    }`}
                    onClick={(e) => onVerseClick(e, v.verse)}
                  >
                    <sup className="verse-num">{v.verse}</sup>
                    {v.text}{' '}
                  </span>
                )
              })}
            </p>
          )}
        </div>

        <div className="chapter-margin">
          {textNotesFor().map((note) =>
            editingNoteId === note.id ? (
              <div key={note.id} className="margin-note margin-note-editing">
                <span className="margin-note-verse">v{note.verseStart}</span>
                <textarea
                  autoFocus
                  className="margin-note-input"
                  value={editingDraft}
                  onChange={(e) => setEditingDraft(e.target.value)}
                />
                <div className="margin-note-actions">
                  <button onClick={() => saveMarginEdit(note)}>Save</button>
                  <button className="margin-note-delete" onClick={() => deleteMarginNote(note)}>
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div key={note.id} className="margin-note" onClick={() => startEditMarginNote(note)}>
                <span className="margin-note-verse">v{note.verseStart}</span>
                <span className="margin-note-text">{note.content}</span>
              </div>
            ),
          )}
        </div>

        {popover && (
          <>
            <div className="verse-popover-scrim" onClick={() => setPopover(null)} />
            <div className="verse-popover" style={{ top: popover.top }}>
              {!popover.editingText ? (
                <>
                  <div className="verse-popover-swatches">
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c}
                        className={`swatch swatch-${c} ${highlightFor(popover.verse)?.content === c ? 'swatch-active' : ''}`}
                        onClick={() => toggleHighlight(c)}
                        aria-label={`Highlight ${c}`}
                      />
                    ))}
                    <button className="verse-popover-note-btn" onClick={openNoteEditor}>
                      ✎ Note
                    </button>
                  </div>
                </>
              ) : (
                <div className="verse-popover-editor">
                  <textarea
                    autoFocus
                    placeholder={`Note on verse ${popover.verse}…`}
                    value={popover.draft}
                    onChange={(e) => setPopover({ ...popover, draft: e.target.value })}
                  />
                  <div className="verse-popover-editor-actions">
                    <button onClick={saveNoteDraft}>Save</button>
                    <button className="verse-popover-cancel" onClick={() => setPopover(null)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
