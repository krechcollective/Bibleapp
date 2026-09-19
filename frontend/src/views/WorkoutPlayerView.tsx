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
      return 'Get ready'
  }
}

export function WorkoutPlayerView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const workout = useWorkoutStore((s) => s.workouts.find((w) => w.id === id))

  const segments = useMemo(() => (workout ? buildSegments(workout) : []), [workout])

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
    if (segments.length === 0) return
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
  }, [remaining, segmentIndex, segments, running])

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

  function togglePause() {
    setRunning((r) => {
      const next = !r
      if (!next) announcer.cancel()
      return next
    })
  }

  function restart() {
    announcer.cancel()
    setSegmentIndex(0)
    setRemaining(segments[0].seconds)
    lastAnnouncedSegment.current = -1
    lastAnnouncedCount.current = null
    setFinished(false)
    setRunning(false)
  }

  return (
    <div className="player-view">
      <button className="header-btn player-back" onClick={() => navigate('/workouts')}>
        ← {workout.name}
      </button>

      {finished ? (
        <div className="player-finished">
          <h2>Workout complete</h2>
          <button className="header-btn primary-btn" onClick={restart}>
            Do it again
          </button>
        </div>
      ) : (
        <>
          <div className={`player-phase ${phaseClass(segment.phase)}`}>
            <div className="player-phase-label">{phaseHeading(segment.phase)}</div>
            <div className="player-exercise-name">{segment.phase === 'work' ? segment.label : segment.label}</div>
            <div className="player-countdown">{remaining}</div>
          </div>

          <div className="player-progress">
            Segment {segmentIndex + 1} of {segments.length}
          </div>

          <div className="player-controls">
            <button className="header-btn" onClick={restart}>
              Restart
            </button>
            <button className="header-btn primary-btn player-play-btn" onClick={togglePause}>
              {running ? 'Pause' : remaining === segment.seconds && segmentIndex === 0 ? 'Start' : 'Resume'}
            </button>
          </div>

          <p className="player-hint">
            Announcements duck any audio/video playing in this tab. Music from another app (Spotify, etc.) can't be
            controlled by the browser — lower it manually if needed.
          </p>
        </>
      )}
    </div>
  )
}
