import { useEffect, useState } from 'react'
import { api, type PlanDay } from '../lib/api'
import { useAppStore } from '../store/appStore'

export function PlanView() {
  const [days, setDays] = useState<PlanDay[]>([])
  const [error, setError] = useState<string | null>(null)
  const setPosition = useAppStore((s) => s.setPosition)

  useEffect(() => {
    api
      .getPlan()
      .then(setDays)
      .catch((e) => setError(e.message))
  }, [])

  async function toggle(day: PlanDay) {
    const completed = !day.completed
    setDays((prev) => prev.map((d) => (d.day === day.day ? { ...d, completed } : d)))
    try {
      await api.markDayComplete(day.day, completed)
    } catch {
      setDays((prev) => prev.map((d) => (d.day === day.day ? { ...d, completed: !completed } : d)))
    }
  }

  const completedCount = days.filter((d) => d.completed).length

  return (
    <div className="plan-view">
      <h1>Reading Plan</h1>
      {error && <p className="chapter-error">{error}</p>}
      {days.length > 0 && (
        <div className="plan-progress">
          <div className="plan-progress-bar">
            <div
              className="plan-progress-fill"
              style={{ width: `${(completedCount / days.length) * 100}%` }}
            />
          </div>
          <span>
            {completedCount} / {days.length} days
          </span>
        </div>
      )}
      <ul className="plan-day-list">
        {days.map((d) => (
          <li key={d.day} className={`plan-day ${d.completed ? 'completed' : ''}`}>
            <label>
              <input type="checkbox" checked={d.completed} onChange={() => toggle(d)} />
              <span className="plan-day-num">Day {d.day}</span>
              <span className="plan-day-date">{d.date}</span>
            </label>
            <div className="plan-day-passages">
              {d.passages.map((p, i) => (
                <button
                  key={i}
                  className="plan-passage-link"
                  onClick={() => setPosition(p.book, p.chapter)}
                >
                  {p.book} {p.chapter}
                  {p.verseStart ? `:${p.verseStart}-${p.verseEnd ?? p.verseStart}` : ''}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
