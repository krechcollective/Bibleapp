import type { Env } from '../env'
import { DEFAULT_USER_ID } from '../env'

interface PlanDayRow {
  id: string
  day_number: number
  day_date: string
  passages: string
  completed_at: string | null
}

export async function handleGetPlan(_req: Request, env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT d.id, d.day_number, d.day_date, d.passages, p.completed_at
     FROM reading_plan_days d
     LEFT JOIN reading_progress p
       ON p.plan_day_id = d.id AND p.user_id = ?
     ORDER BY d.day_number ASC`,
  )
    .bind(DEFAULT_USER_ID)
    .all<PlanDayRow>()

  const days = results.map((row) => ({
    day: row.day_number,
    date: row.day_date,
    passages: JSON.parse(row.passages),
    completed: row.completed_at != null,
  }))

  return Response.json(days)
}

export async function handleSetProgress(req: Request, env: Env, dayNumber: string): Promise<Response> {
  const body = (await req.json()) as { completed: boolean }
  const day = Number(dayNumber)

  const actualDayRow = await env.DB.prepare(
    'SELECT id FROM reading_plan_days WHERE day_number = ? LIMIT 1',
  )
    .bind(day)
    .first<{ id: string }>()

  if (!actualDayRow) return Response.json({ error: 'Day not found' }, { status: 404 })

  if (body.completed) {
    await env.DB.prepare(
      `INSERT INTO reading_progress (id, user_id, plan_day_id)
       VALUES (?, ?, ?)
       ON CONFLICT(user_id, plan_day_id) DO UPDATE SET completed_at = datetime('now')`,
    )
      .bind(crypto.randomUUID(), DEFAULT_USER_ID, actualDayRow.id)
      .run()
  } else {
    await env.DB.prepare('DELETE FROM reading_progress WHERE user_id = ? AND plan_day_id = ?')
      .bind(DEFAULT_USER_ID, actualDayRow.id)
      .run()
  }

  return new Response(null, { status: 204 })
}
