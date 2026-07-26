import type { Env } from '../env'
import { DEFAULT_USER_ID } from '../env'

export async function handleGetSettings(_req: Request, env: Env): Promise<Response> {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings WHERE user_id = ?')
    .bind(DEFAULT_USER_ID)
    .all<{ key: string; value: string }>()

  const settings: Record<string, string> = {}
  for (const row of results) settings[row.key] = row.value
  return Response.json(settings)
}

export async function handleSaveSetting(req: Request, env: Env): Promise<Response> {
  const body = (await req.json()) as { key: string; value: string }
  if (!body.key) return Response.json({ error: 'key is required' }, { status: 400 })

  await env.DB.prepare(
    `INSERT INTO settings (user_id, key, value) VALUES (?, ?, ?)
     ON CONFLICT(user_id, key) DO UPDATE SET value = excluded.value`,
  )
    .bind(DEFAULT_USER_ID, body.key, body.value)
    .run()

  return new Response(null, { status: 204 })
}
