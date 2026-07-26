-- Single-user initially, structured so multi-user is trivial to add later.
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reading_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  total_days INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reading_plan_days (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES reading_plans(id),
  day_number INTEGER NOT NULL,
  day_date TEXT NOT NULL,
  -- JSON array of { book, chapter, verseStart?, verseEnd? }
  passages TEXT NOT NULL,
  UNIQUE(plan_id, day_number)
);

CREATE TABLE IF NOT EXISTS reading_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  plan_day_id TEXT NOT NULL REFERENCES reading_plan_days(id),
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, plan_day_id)
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  book TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse_start INTEGER NOT NULL,
  verse_end INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'drawing')),
  -- text content, or serialized vector stroke JSON for drawings
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notes_book_chapter ON notes(user_id, book, chapter);

CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT NOT NULL REFERENCES users(id),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);

-- Bootstrap a single default user for the initial single-user deployment.
INSERT OR IGNORE INTO users (id, email) VALUES ('default', NULL);
