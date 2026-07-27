import { useEffect, useRef, useState } from 'react'
import { api, type Note, type Passage } from '../lib/api'
import { useAppStore } from '../store/appStore'
import { DrawingPad } from './DrawingPad'
import { DrawingPreview } from './DrawingPreview'
import { isEmptyDrawing, parseDrawing, type DrawingData } from '../lib/strokes'

interface ChapterViewProps {
  book: string
  chapter: number
  /** Optional day-divider label rendered above this chapter, e.g. "Day 12 — Jan 12". */
  dayDivider?: string
  onDayComplete?: () => void
}

const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink'] as const
type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]

const POPOVER_DRAWING_SIZE = { width: 240, height: 150 }
const MARGIN_DRAWING_SIZE = { width: 200, height: 130 }

type PopoverMode = 'menu' | 'note' | 'drawing'

interface PopoverState {
  verse: number
  top: number
  mode: PopoverMode
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

  function marginNotesFor(): Note[] {
    return notes.filter((n) => n.type === 'text' || n.type === 'drawing').sort((a, b) => a.verseStart - b.verseStart)
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
      mode: 'menu',
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
    setPopover({ ...popover, mode: 'note', draft: existing?.content ?? '' })
  }

  function openDrawingEditor() {
    if (!popover) return
    setPopover({ ...popover, mode: 'drawing' })
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

  async function saveDrawing(verse: number, data: DrawingData, existing: Note | undefined) {
    if (isEmptyDrawing(data)) {
      if (existing) {
        await api.deleteNote(existing.id)
        setNotes((prev) => prev.filter((n) => n.id !== existing.id))
      }
      return
    }
    const content = JSON.stringify(data)
    if (existing) {
      const updated = await api.saveNote({ ...existing, content })
      setNotes((prev) => prev.map((n) => (n.id === existing.id ? updated : n)))
    } else {
      const created = await api.saveNote({
        book,
        chapter,
        verseStart: verse,
        verseEnd: verse,
        type: 'drawing',
        content,
      })
      setNotes((prev) => [...prev, created])
    }
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

  const popoverHighlight = popover ? highlightFor(popover.verse) : undefined
  const popoverDrawing = popover
    ? notes.find((n) => n.type === 'drawing' && n.verseStart === popover.verse)
    : undefined

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
          {marginNotesFor().map((note) => {
            if (editingNoteId === note.id) {
              if (note.type === 'drawing') {
                return (
                  <div key={note.id} className="margin-note margin-note-editing">
                    <span className="margin-note-verse">v{note.verseStart}</span>
                    <DrawingPad
                      width={MARGIN_DRAWING_SIZE.width}
                      height={MARGIN_DRAWING_SIZE.height}
                      initial={parseDrawing(note.content)}
                      onSave={async (data) => {
                        await saveDrawing(note.verseStart, data, note)
                        setEditingNoteId(null)
                      }}
                      onCancel={() => setEditingNoteId(null)}
                    />
                    <button className="margin-note-delete" onClick={() => deleteMarginNote(note)}>
                      Delete
                    </button>
                  </div>
                )
              }
              return (
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
              )
            }

            if (note.type === 'drawing') {
              const data = parseDrawing(note.content)
              return (
                <div key={note.id} className="margin-note margin-drawing" onClick={() => setEditingNoteId(note.id)}>
                  <span className="margin-note-verse">v{note.verseStart}</span>
                  {data && <DrawingPreview data={data} />}
                </div>
              )
            }

            return (
              <div key={note.id} className="margin-note" onClick={() => startEditMarginNote(note)}>
                <span className="margin-note-verse">v{note.verseStart}</span>
                <span className="margin-note-text">{note.content}</span>
              </div>
            )
          })}
        </div>

        {popover && (
          <>
            <div className="verse-popover-scrim" onClick={() => setPopover(null)} />
            <div className={`verse-popover ${popover.mode === 'drawing' ? 'verse-popover-wide' : ''}`} style={{ top: popover.top }}>
              {popover.mode === 'menu' && (
                <div className="verse-popover-swatches">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c}
                      className={`swatch swatch-${c} ${popoverHighlight?.content === c ? 'swatch-active' : ''}`}
                      onClick={() => toggleHighlight(c)}
                      aria-label={`Highlight ${c}`}
                    />
                  ))}
                  <button className="verse-popover-note-btn" onClick={openNoteEditor}>
                    ✎ Note
                  </button>
                  <button className="verse-popover-note-btn" onClick={openDrawingEditor}>
                    ✏️ Draw
                  </button>
                </div>
              )}

              {popover.mode === 'note' && (
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

              {popover.mode === 'drawing' && (
                <DrawingPad
                  width={POPOVER_DRAWING_SIZE.width}
                  height={POPOVER_DRAWING_SIZE.height}
                  initial={popoverDrawing ? parseDrawing(popoverDrawing.content) : null}
                  onSave={async (data) => {
                    await saveDrawing(popover.verse, data, popoverDrawing)
                    setPopover(null)
                  }}
                  onCancel={() => setPopover(null)}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
