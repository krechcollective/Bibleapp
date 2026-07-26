import { useMemo, useState } from 'react'
import { BOOKS } from '../data/books'

interface JumpToProps {
  onJump: (book: string, chapter: number) => void
  onClose: () => void
}

export function JumpTo({ onJump, onClose }: JumpToProps) {
  const [query, setQuery] = useState('')
  const [selectedBook, setSelectedBook] = useState<string | null>(null)

  const filteredBooks = useMemo(
    () => BOOKS.filter((b) => b.name.toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  const activeBook = BOOKS.find((b) => b.name === selectedBook)

  return (
    <div className="jump-to-overlay" onClick={onClose}>
      <div className="jump-to-panel" onClick={(e) => e.stopPropagation()}>
        {!activeBook ? (
          <>
            <input
              autoFocus
              className="jump-to-search"
              placeholder="Search books…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="jump-to-book-list">
              {filteredBooks.map((b) => (
                <button key={b.name} className="jump-to-book" onClick={() => setSelectedBook(b.name)}>
                  {b.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="jump-to-header">
              <button className="jump-to-back" onClick={() => setSelectedBook(null)}>
                ← Books
              </button>
              <span>{activeBook.name}</span>
            </div>
            <div className="jump-to-chapter-grid">
              {Array.from({ length: activeBook.chapters }, (_, i) => i + 1).map((ch) => (
                <button
                  key={ch}
                  className="jump-to-chapter"
                  onClick={() => {
                    onJump(activeBook.name, ch)
                    onClose()
                  }}
                >
                  {ch}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
