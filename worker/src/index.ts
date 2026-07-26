import type { Env } from './env'
import { handlePassage } from './routes/passage'
import { handleListNotes, handleCreateNote, handleUpdateNote, handleDeleteNote } from './routes/notes'
import { handleGetPlan, handleSetProgress } from './routes/plan'
import { handleGetSettings, handleSaveSetting } from './routes/settings'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function withCors(res: Response): Response {
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v)
  return new Response(res.body, { status: res.status, headers })
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS })
    }

    const url = new URL(req.url)
    const path = url.pathname
    const noteIdMatch = path.match(/^\/api\/notes\/([^/]+)$/)
    const progressMatch = path.match(/^\/api\/plan\/([^/]+)\/progress$/)

    try {
      if (path === '/api/passage' && req.method === 'GET') {
        return withCors(await handlePassage(req, env))
      }
      if (path === '/api/notes' && req.method === 'GET') {
        return withCors(await handleListNotes(req, env))
      }
      if (path === '/api/notes' && req.method === 'POST') {
        return withCors(await handleCreateNote(req, env))
      }
      if (noteIdMatch && req.method === 'PUT') {
        return withCors(await handleUpdateNote(req, env, noteIdMatch[1]))
      }
      if (noteIdMatch && req.method === 'DELETE') {
        return withCors(await handleDeleteNote(req, env, noteIdMatch[1]))
      }
      if (path === '/api/plan' && req.method === 'GET') {
        return withCors(await handleGetPlan(req, env))
      }
      if (progressMatch && req.method === 'POST') {
        return withCors(await handleSetProgress(req, env, progressMatch[1]))
      }
      if (path === '/api/settings' && req.method === 'GET') {
        return withCors(await handleGetSettings(req, env))
      }
      if (path === '/api/settings' && req.method === 'PUT') {
        return withCors(await handleSaveSetting(req, env))
      }

      return withCors(Response.json({ error: 'Not found' }, { status: 404 }))
    } catch (err) {
      return withCors(
        Response.json(
          { error: err instanceof Error ? err.message : 'Internal error' },
          { status: 500 },
        ),
      )
    }
  },
} satisfies ExportedHandler<Env>
