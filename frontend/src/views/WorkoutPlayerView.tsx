import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useWorkoutStore } from '../store/workoutStore'
import { buildSegments, type Segment } from '../lib/workoutEngine'
import { announcer } from '../lib/speech'

const COUNT_SPOKEN_AT_OR_BELOW = 5

function phaseClass(phase: Segment['phase']): string {
  switch (phase) {
    case 'work':
      return 'phase-work'
    case 'rest':
    case 'setRest':
      return 'phase-rest'
    default:
      return 'phase-prepare'
  }
}

function phaseHeading(phase: Segment['phase']): string {
  switch (phase) {
    case 'work':
      return 'Work'
    case 'rest':
      return 'Rest'
    case 'setRest':
      return 'Rest between sets'
    default:
      return 'Prepare'
  }
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function WorkoutPlayerView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const workout = useWorkoutStore((s) => s.workouts.find((w) => w.id === id))

  const segments = useMemo(() => (workout ? buildSegments(workout) : []), [workout])

  const [started, setStarted] = useState(false)
  const [segmentIndex, setSegmentIndex] = useState(0)
  const [remaining, setRemaining] = useState(segments[0]?.seconds ?? 0)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  const lastAnnouncedSegment = useRef<number>(-1)
  const lastAnnouncedCount = useRef<number | null>(null)

  useEffect(() => {
    if (segments.length === 0) return
    setRemaining(segments[0].seconds)
  }, [segments])

  useEffect(() => {
    if (!running || finished || segments.length === 0) return
    const interval = setInterval(() => {
      setRemaining((r) => r - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [running, finished, segments.length])

  useEffect(() => {
    if (!started || segments.length === 0) return
    const segment = segments[segmentIndex]

    if (lastAnnouncedSegment.current !== segmentIndex) {
      lastAnnouncedSegment.current = segmentIndex
      lastAnnouncedCount.current = null
      if (running) announcer.speak(segment.announceOnStart)
    }

    if (remaining <= 0) {
      const nextIndex = segmentIndex + 1
      if (nextIndex >= segments.length) {
        setFinished(true)
        setRunning(false)
        announcer.speak('Workout complete. Great work.')
        return
      }
      setSegmentIndex(nextIndex)
      setRemaining(segments[nextIndex].seconds)
      return
    }

    if (
      running &&
      remaining <= COUNT_SPOKEN_AT_OR_BELOW &&
      remaining > 0 &&
      lastAnnouncedCount.current !== remaining
    ) {
      lastAnnouncedCount.current = remaining
      announcer.speak(String(remaining))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, segmentIndex, segments, running, started])

  useEffect(() => {
    return () => announcer.cancel()
  }, [])

  if (!workout) {
    return (
      <div className="workouts-view">
        <p>Workout not found.</p>
        <button className="header-btn" onClick={() => navigate('/workouts')}>
          Back to workouts
        </button>
      </div>
    )
  }

  if (segments.length === 0) {
    return (
      <div className="workouts-view">
        <p>This workout has no exercises.</p>
        <button className="header-btn" onClick={() => navigate('/workouts')}>
          Back to workouts
        </button>
      </div>
    )
  }

  const segment = segments[segmentIndex]
  const nextSegment = segments[segmentIndex + 1]

  function begin() {
    setStarted(true)
    setRunning(true)
  }

  function togglePause() {
    setRunning((r) => {
      const next = !r
      if (!next) announcer.cancel()
      return next
    })
  }

  function stop() {
    announcer.cancel()
    setStarted(false)
    setRunning(false)
    setFinished(false)
    setSegmentIndex(0)
    setRemaining(segments[0].seconds)
    lastAnnouncedSegment.current = -1
    lastAnnouncedCount.current = null
  }

  // ---------- Pre-start: pick-workout confirmation screen ----------
  if (!started) {
    return (
      <div className="tabata-shell">
        <div className="tabata-topbar">
          <button className="tabata-icon-btn" onClick={() => navigate('/workouts')} aria-label="Back">
            ✕
          </button>
          <div className="tabata-title">{workout.name.toUpperCase()}</div>
          <div className="tabata-icon-btn-spacer" />
        </div>

        <div className="tabata-summary">
          <div className="tabata-summary-row">
            <span className="tabata-summary-value">{workout.exercises.length}</span>
            <span className="tabata-summary-label">EXERCISES</span>
          </div>
          <div className="tabata-summary-row">
            <span className="tabata-summary-value">{workout.rounds}</span>
            <span className="tabata-summary-label">ROUNDS</span>
          </div>
          <div className="tabata-summary-row">
            <span className="tabata-summary-value">{formatClock(segments.reduce((t, s) => t + s.seconds, 0))}</span>
            <span className="tabata-summary-label">TOTAL TIME</span>
          </div>
        </div>

        <div className="tabata-exercise-preview">
          {workout.exercises.map((ex, i) => (
            <div className="tabata-preview-row" key={ex.id}>
              <span className="tabata-preview-index">{i + 1}</span>
              <span className="tabata-preview-name">{ex.name}</span>
              <span className="tabata-preview-times">
                {ex.workSeconds}s work / {ex.restSeconds}s rest
              </span>
            </div>
          ))}
        </div>

        <button className="tabata-start-btn" onClick={begin}>
          START
        </button>
      </div>
    )
  }

  return (
    <div className={`tabata-shell tabata-phase-${phaseClass(segment.phase)}`}>
      <div className="tabata-topbar">
        <button className="tabata-icon-btn" onClick={stop} aria-label="Stop">
          ✕
        </button>
        <div className="tabata-title">{workout.name.toUpperCase()}</div>
        <div className="tabata-icon-btn-spacer" />
      </div>

      {finished ? (
        <div className="tabata-finished">
          <div className="tabata-finished-heading">WORKOUT COMPLETE</div>
          <button className="tabata-start-btn" onClick={stop}>
            DONE
          </button>
        </div>
      ) : (
        <>
          <div className={`tabata-phase-band ${phaseClass(segment.phase)}`}>
            <div className="tabata-phase-label">{phaseHeading(segment.phase).toUpperCase()}</div>
            <div className="tabata-clock">{formatClock(remaining)}</div>
            {segment.phase !== 'prepare' && <div className="tabata-exercise-name">{segment.label}</div>}
            {nextSegment && (
              <div className="tabata-next">
                UP NEXT: {nextSegment.phase === 'work' ? nextSegment.label.toUpperCase() : phaseHeading(nextSegment.phase).toUpperCase()}
              </div>
            )}
          </div>

          <div className="tabata-stats">
            <div className="tabata-stat">
              <div className="tabata-stat-value tabata-stat-round">{segment.round}</div>
              <div className="tabata-stat-label">ROUND OF {segment.totalRounds}</div>
            </div>
            <button className="tabata-play-btn" onClick={togglePause} aria-label={running ? 'Pause' : 'Resume'}>
              {running ? '❚❚' : '▶'}
            </button>
            <div className="tabata-stat">
              <div className="tabata-stat-value tabata-stat-exercise">{segment.exerciseNumber}</div>
              <div className="tabata-stat-label">EXERCISE OF {segment.totalExercises}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
