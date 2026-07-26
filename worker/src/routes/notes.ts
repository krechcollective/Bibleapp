import type { Env } from '../env'
import { DEFAULT_USER_ID } from '../env'

interface NoteRow {
  id: string
  book: string
  chapter: number
  verse_start: number
  verse_end: number
  type: string
  content: string
  created_at: string
  updated_at: string
}

function toApi(row: NoteRow) {
  return {
    id: row.id,
    book: row.book,
    chapter: row.chapter,
    verseStart: row.verse_start,
    verseEnd: row.verse_end,
    type: row.type,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function handleListNotes(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url)
  const book = url.searchParams.get('book')
  const chapter = url.searchParams.get('chapter')

  let query = 'SELECT * FROM notes WHERE user_id = ?'
  const params: unknown[] = [DEFAULT_USER_ID]
  if (book) {
    query += ' AND book = ?'
    params.push(book)
  }
  if (chapter) {
    query += ' AND chapter = ?'
    params.push(Number(chapter))
  }
  query += ' ORDER BY verse_start ASC, created_at ASC'

  const { results } = await env.DB.prepare(query)
    .bind(...params)
    .all<NoteRow>()

  return Response.json(results.map(toApi))
}

export async function handleCreateNote(req: Request, env: Env): Promise<Response> {
  const body = (await req.json()) as {
    book: string
    chapter: number
    verseStart: number
    verseEnd: number
    type: 'text' | 'drawing'
    content: string
  }

  if (!body.book || !body.chapter || !body.content || !body.type) {
    return Response.json({ error: 'book, chapter, type, and content are required' }, { status: 400 })
  }

  const id = crypto.randomUUID()
  await env.DB.prepare(
    `INSERT INTO notes (id, user_id, book, chapter, verse_start, verse_end, type, content)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      DEFAULT_USER_ID,
      body.book,
      body.chapter,
      body.verseStart ?? 1,
      body.verseEnd ?? body.verseStart ?? 1,
      body.type,
      body.content,
    )
    .run()

  const row = await env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first<NoteRow>()
  return Response.json(toApi(row!), { status: 201 })
}

export async function handleUpdateNote(req: Request, env: Env, id: string): Promise<Response> {
  const body = (await req.json()) as { content?: string; verseStart?: number; verseEnd?: number }

  const existing = await env.DB.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?')
    .bind(id, DEFAULT_USER_ID)
    .first<NoteRow>()
  if (!existing) return Response.json({ error: 'Note not found' }, { status: 404 })

  await env.DB.prepare(
    `UPDATE notes SET content = ?, verse_start = ?, verse_end = ?, updated_at = datetime('now')
     WHERE id = ? AND user_id = ?`,
  )
    .bind(
      body.content ?? existing.content,
      body.verseStart ?? existing.verse_start,
      body.verseEnd ?? existing.verse_end,
      id,
      DEFAULT_USER_ID,
    )
    .run()

  const row = await env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first<NoteRow>()
  return Response.json(toApi(row!))
}

export async function handleDeleteNote(_req: Request, env: Env, id: string): Promise<Response> {
  await env.DB.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?')
    .bind(id, DEFAULT_USER_ID)
    .run()
  return new Response(null, { status: 204 })
}
