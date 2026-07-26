import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type PlanDay } from '../lib/api'
import { useAppStore } from '../store/appStore'

export function PlanView() {
  const [days, setDays] = useState<PlanDay[]>([])
  const [error, setError] = useState<string | null>(null)
  const setReadingMode = useAppStore((s) => s.setReadingMode)
  const setPendingPlanDay = useAppStore((s) => s.setPendingPlanDay)
  const navigate = useNavigate()

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

  function readDay(day: PlanDay) {
    setReadingMode('plan')
    setPendingPlanDay(day.day)
    navigate('/')
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
            <div className="plan-day-row">
              <input
                type="checkbox"
                checked={d.completed}
                onChange={() => toggle(d)}
                aria-label={`Mark day ${d.day} complete`}
              />
              <button className="plan-day-num" onClick={() => readDay(d)}>
                Day {d.day}
              </button>
              <span className="plan-day-date">{d.date}</span>
            </div>
            <div className="plan-day-passages">
              {d.passages.map((p, i) => (
                <button key={i} className="plan-passage-link" onClick={() => readDay(d)}>
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
