-- SQLite can't ALTER a CHECK constraint in place, so rebuild the table to
-- allow the new 'highlight' note type (verse highlighting in the margin).
ALTER TABLE notes RENAME TO notes_old;

CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'drawing', 'highlight')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO notes (id, user_id, book, chapter, verse_start, verse_end, type, content, created_at, updated_at)
SELECT id, user_id, book, chapter, verse_start, verse_end, type, content, created_at, updated_at FROM notes_old;

DROP TABLE notes_old;

CREATE INDEX IF NOT EXISTS idx_notes_book_chapter ON notes(user_id, book, chapter);
