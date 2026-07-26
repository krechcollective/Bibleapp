import { useEffect, useState } from 'react'
import { api, type Passage } from '../lib/api'
import { useAppStore } from '../store/appStore'

interface ChapterViewProps {
  book: string
  chapter: number
  /** Optional day-divider label rendered above this chapter, e.g. "Day 12 — Jan 12". */
  dayDivider?: string
  onDayComplete?: () => void
}

export function ChapterView({ book, chapter, dayDivider, onDayComplete }: ChapterViewProps) {
  const translation = useAppStore((s) => s.translation)
  const setActiveVerse = useAppStore((s) => s.setActiveVerse)
  const [passage, setPassage] = useState<Passage | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      <h2 className="chapter-heading">
        {book} {chapter}
      </h2>
      {error && <p className="chapter-error">Couldn't load this chapter: {error}</p>}
      {!passage && !error && <p className="chapter-loading">Loading…</p>}
      {passage && (
        <p className="chapter-text">
          {passage.verses.map((v) => (
            <span
              key={v.verse}
              className="verse"
              onClick={() => setActiveVerse({ book, chapter, verse: v.verse })}
            >
              <sup className="verse-num">{v.verse}</sup>
              {v.text}{' '}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
