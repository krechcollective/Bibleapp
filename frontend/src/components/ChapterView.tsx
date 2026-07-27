import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { api, type Note, type Passage } from '../lib/api'
import { useAppStore } from '../store/appStore'
import { MarginCanvas } from './MarginCanvas'
import { PEN_COLORS, parseDrawing, type StrokePoint, type DrawingData } from '../lib/strokes'

interface ChapterViewProps {
  book: string
  chapter: number
  /** Optional day-divider label rendered above this chapter, e.g. "Day 12 — Jan 12". */
  dayDivider?: string
  onDayComplete?: () => void
}

const HIGHLIGHT_COLORS = ['yellow', 'green', 'blue', 'pink'] as const
type HighlightColor = (typeof HIGHLIGHT_COLORS)[number]

/** Nominal vertical slot each margin item (drawing or note) reserves, before collision-avoidance shifts it. */
const SLOT_HEIGHT = 92
const SLOT_GAP = 8

interface PopoverState {
  verse: number
  top: number
  mode: 'menu' | 'note'
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
  const [penColor, setPenColor] = useState<string>(PEN_COLORS[0])
  const [verseTops, setVerseTops] = useState<Map<number, number>>(new Map())
  const [marginSize, setMarginSize] = useState({ width: 190, height: 200 })
  const [composeVerse, setComposeVerse] = useState<number | null>(null)
  const [composeDraft, setComposeDraft] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const textColumnRef = useRef<HTMLDivElement>(null)
  const marginRef = useRef<HTMLDivElement>(null)

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

  // Track where each verse actually renders (it can move: text loads late, wraps
  // differently at different widths) so drawings/notes can auto-attach to it.
  useLayoutEffect(() => {
    const textEl = textColumnRef.current
    const marginEl = marginRef.current
    const gridEl = containerRef.current
    if (!textEl || !gridEl) return

    function measureVerseTops() {
      const gridRect = gridEl!.getBoundingClientRect()
      const map = new Map<number, number>()
      textEl!.querySelectorAll('[data-verse]').forEach((el) => {
        const verse = Number((el as HTMLElement).dataset.verse)
        const r = (el as HTMLElement).getBoundingClientRect()
        map.set(verse, r.top - gridRect.top + r.height / 2)
      })
      setVerseTops(map)
    }

    measureVerseTops()
    const ro = new ResizeObserver(() => {
      measureVerseTops()
      if (marginEl) setMarginSize({ width: marginEl.clientWidth, height: marginEl.clientHeight })
    })
    ro.observe(textEl)
    if (marginEl) ro.observe(marginEl)
    return () => ro.disconnect()
  }, [passage])

  function highlightFor(verse: number): Note | undefined {
    return notes.find((n) => n.type === 'highlight' && n.verseStart <= verse && verse <= n.verseEnd)
  }

  // Positions every drawing/text note (plus the in-progress compose box, if any)
  // near its verse, pushing later items down just enough to avoid overlapping.
  const positionedItems = useMemo(() => {
    const items = notes.filter((n) => n.type === 'text' || n.type === 'drawing')
    if (composeVerse != null) {
      items.push({
        id: '__compose__',
        book,
        chapter,
        verseStart: composeVerse,
        verseEnd: composeVerse,
        type: 'text',
        content: '',
        createdAt: '~',
        updatedAt: '~',
      })
    }
    const sorted = [...items].sort((a, b) => a.verseStart - b.verseStart || a.createdAt.localeCompare(b.createdAt))
    let cursor = -Infinity
    return sorted.map((note) => {
      const verseY = verseTops.get(note.verseStart) ?? 0
      const desired = verseY - SLOT_HEIGHT / 2
      const top = Math.max(desired, cursor)
      cursor = top + SLOT_HEIGHT + SLOT_GAP
      return { note, top }
    })
  }, [notes, verseTops, composeVerse, book, chapter])

  const canvasDrawings = useMemo(
    () =>
      positionedItems
        .filter((p) => p.note.type === 'drawing')
        .map((p) => {
          const data = parseDrawing(p.note.content)
          return { id: p.note.id, top: p.top, strokes: data?.strokes ?? [] }
        }),
    [positionedItems],
  )

  function nearestVerseFor(y: number): number | null {
    let best: number | null = null
    let bestDist = Infinity
    for (const [verse, top] of verseTops) {
      const dist = Math.abs(top - y)
      if (dist < bestDist) {
        bestDist = dist
        best = verse
      }
    }
    return best
  }

  async function handleStrokeComplete(points: StrokePoint[]) {
    const mid = points[Math.floor(points.length / 2)]
    const verse = nearestVerseFor(mid.y)
    if (verse == null) return

    const slotTop = (verseTops.get(verse) ?? 0) - SLOT_HEIGHT / 2
    const localPoints = points.map((p) => ({ ...p, y: p.y - slotTop }))
    const existing = notes.find((n) => n.type === 'drawing' && n.verseStart === verse)
    const existingData = existing ? parseDrawing(existing.content) : null
    const data: DrawingData = {
      width: marginSize.width,
      height: SLOT_HEIGHT,
      strokes: [...(existingData?.strokes ?? []), { color: penColor, points: localPoints }],
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

  function handleMarginTap(point: { x: number; y: number }) {
    const verse = nearestVerseFor(point.y)
    if (verse == null) return
    const existingText = notes.find((n) => n.type === 'text' && n.verseStart === verse)
    if (existingText) {
      setComposeVerse(null)
      startEditText(existingText)
    } else {
      setEditingNoteId(null)
      setComposeDraft('')
      setComposeVerse(verse)
    }
  }

  async function saveCompose() {
    if (composeVerse == null) return
    const verse = composeVerse
    const text = composeDraft.trim()
    setComposeVerse(null)
    if (!text) return
    const created = await api.saveNote({
      book,
      chapter,
      verseStart: verse,
      verseEnd: verse,
      type: 'text',
      content: text,
    })
    setNotes((prev) => [...prev, created])
  }

  async function moveItemVerse(note: Note, direction: 1 | -1) {
    const maxVerse = passage?.verses.length ?? note.verseStart
    const newVerse = Math.min(maxVerse, Math.max(1, note.verseStart + direction))
    if (newVerse === note.verseStart) return
    const updated = await api.saveNote({ ...note, verseStart: newVerse, verseEnd: newVerse })
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)))
  }

  async function deleteMarginItem(note: Note) {
    await api.deleteNote(note.id)
    setNotes((prev) => prev.filter((n) => n.id !== note.id))
    setEditingNoteId(null)
  }

  function startEditText(note: Note) {
    setEditingNoteId(note.id)
    setEditingDraft(note.content)
  }

  async function saveTextEdit(note: Note) {
    const text = editingDraft.trim()
    if (!text) {
      await deleteMarginItem(note)
      return
    }
    const updated = await api.saveNote({ ...note, content: text })
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)))
    setEditingNoteId(null)
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

  async function saveNoteDraft() {
    if (!popover) return
    const existing = notes.find((n) => n.type === 'text' && n.verseStart === popover.verse)
    const text = popover.draft.trim()
    if (!text) {
      if (existing) await deleteMarginItem(existing)
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

  const popoverHighlight = popover ? highlightFor(popover.verse) : undefined

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
        <div className="chapter-column" ref={textColumnRef}>
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
                    data-verse={v.verse}
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

        <div className="chapter-margin" ref={marginRef}>
          <div className="margin-pen-colors">
            {PEN_COLORS.map((c) => (
              <button
                key={c}
                className={`pen-swatch ${penColor === c ? 'pen-swatch-active' : ''}`}
                style={{ background: c }}
                onClick={() => setPenColor(c)}
                aria-label={`Pen color ${c}`}
              />
            ))}
          </div>

          <MarginCanvas
            width={marginSize.width}
            height={Math.max(marginSize.height, 60)}
            drawings={canvasDrawings}
            color={penColor}
            onStrokeComplete={handleStrokeComplete}
            onTap={handleMarginTap}
          />

          {positionedItems.map(({ note, top }) => {
            if (note.id === '__compose__') {
              return (
                <div key="compose" className="margin-item" style={{ top }}>
                  <div className="margin-item-tag">
                    <span>v{note.verseStart}</span>
                  </div>
                  <div className="margin-item-edit">
                    <textarea
                      autoFocus
                      className="margin-note-input"
                      placeholder="Type a note…"
                      value={composeDraft}
                      onChange={(e) => setComposeDraft(e.target.value)}
                    />
                    <div className="margin-item-edit-actions">
                      <button onClick={saveCompose}>Save</button>
                      <button className="margin-item-edit-cancel" onClick={() => setComposeVerse(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div key={note.id} className={`margin-item ${note.type === 'drawing' ? 'margin-item-drawing' : ''}`} style={{ top }}>
                <div className="margin-item-tag">
                  <button onClick={() => moveItemVerse(note, -1)} aria-label="Attach to previous verse">
                    ▲
                  </button>
                  <span>v{note.verseStart}</span>
                  <button onClick={() => moveItemVerse(note, 1)} aria-label="Attach to next verse">
                    ▼
                  </button>
                  <button className="margin-item-delete" onClick={() => deleteMarginItem(note)} aria-label="Delete">
                    ×
                  </button>
                </div>

                {note.type === 'text' &&
                  (editingNoteId === note.id ? (
                    <div className="margin-item-edit">
                      <textarea
                        autoFocus
                        className="margin-note-input"
                        value={editingDraft}
                        onChange={(e) => setEditingDraft(e.target.value)}
                      />
                      <button onClick={() => saveTextEdit(note)}>Save</button>
                    </div>
                  ) : (
                    <div className="margin-note-text" onClick={() => startEditText(note)}>
                      {note.content}
                    </div>
                  ))}
              </div>
            )
          })}
        </div>

        {popover && (
          <>
            <div className="verse-popover-scrim" onClick={() => setPopover(null)} />
            <div className="verse-popover" style={{ top: popover.top }}>
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
            </div>
          </>
        )}
      </div>
    </div>
  )
}
