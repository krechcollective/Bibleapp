import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useWorkoutStore,
  newExerciseId,
  newWorkoutId,
  type Workout,
  type WorkoutExercise,
} from '../store/workoutStore'
import { totalDuration } from '../lib/workoutEngine'

function emptyExercise(): WorkoutExercise {
  return { id: newExerciseId(), name: '', workSeconds: 30, restSeconds: 15 }
}

function emptyWorkout(): Workout {
  return {
    id: newWorkoutId(),
    name: '',
    rounds: 1,
    restBetweenSetsSeconds: 60,
    exercises: [emptyExercise()],
  }
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function WorkoutEditor({
  initial,
  onSave,
  onCancel,
}: {
  initial: Workout
  onSave: (w: Workout) => void
  onCancel: () => void
}) {
  const [workout, setWorkout] = useState<Workout>(initial)

  function updateExercise(id: string, patch: Partial<WorkoutExercise>) {
    setWorkout((w) => ({
      ...w,
      exercises: w.exercises.map((ex) => (ex.id === id ? { ...ex, ...patch } : ex)),
    }))
  }

  function addExercise() {
    setWorkout((w) => ({ ...w, exercises: [...w.exercises, emptyExercise()] }))
  }

  function removeExercise(id: string) {
    setWorkout((w) => ({ ...w, exercises: w.exercises.filter((ex) => ex.id !== id) }))
  }

  const canSave = workout.name.trim().length > 0 && workout.exercises.every((ex) => ex.name.trim().length > 0)

  return (
    <div className="workout-editor">
      <label className="workout-field">
        <span>Workout name</span>
        <input
          value={workout.name}
          onChange={(e) => setWorkout((w) => ({ ...w, name: e.target.value }))}
          placeholder="Leg day"
        />
      </label>

      <div className="workout-field-row">
        <label className="workout-field">
          <span>Rounds (sets)</span>
          <input
            type="number"
            min={1}
            value={workout.rounds}
            onChange={(e) => setWorkout((w) => ({ ...w, rounds: Math.max(1, Number(e.target.value) || 1) }))}
          />
        </label>
        <label className="workout-field">
          <span>Rest between sets (sec)</span>
          <input
            type="number"
            min={0}
            value={workout.restBetweenSetsSeconds}
            onChange={(e) =>
              setWorkout((w) => ({ ...w, restBetweenSetsSeconds: Math.max(0, Number(e.target.value) || 0) }))
            }
          />
        </label>
      </div>

      <h3 className="workout-subheading">Exercises</h3>
      <div className="exercise-list">
        {workout.exercises.map((ex, i) => (
          <div className="exercise-row" key={ex.id}>
            <span className="exercise-index">{i + 1}</span>
            <input
              className="exercise-name-input"
              value={ex.name}
              placeholder="Exercise name"
              onChange={(e) => updateExercise(ex.id, { name: e.target.value })}
            />
            <label className="exercise-num-field">
              <span>Work</span>
              <input
                type="number"
                min={1}
                value={ex.workSeconds}
                onChange={(e) => updateExercise(ex.id, { workSeconds: Math.max(1, Number(e.target.value) || 1) })}
              />
              <span className="unit">sec</span>
            </label>
            <label className="exercise-num-field">
              <span>Rest</span>
              <input
                type="number"
                min={0}
                value={ex.restSeconds}
                onChange={(e) => updateExercise(ex.id, { restSeconds: Math.max(0, Number(e.target.value) || 0) })}
              />
              <span className="unit">sec</span>
            </label>
            <button
              className="icon-btn"
              onClick={() => removeExercise(ex.id)}
              disabled={workout.exercises.length === 1}
              title="Remove exercise"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <button className="add-exercise-btn" onClick={addExercise}>
        + Add exercise
      </button>

      <div className="workout-editor-footer">
        <span className="workout-total">Total time: {formatDuration(totalDuration(workout))}</span>
        <div className="workout-editor-actions">
          <button className="header-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="header-btn primary-btn" disabled={!canSave} onClick={() => onSave(workout)}>
            Save workout
          </button>
        </div>
      </div>
    </div>
  )
}

export function WorkoutsView() {
  const workouts = useWorkoutStore((s) => s.workouts)
  const addWorkout = useWorkoutStore((s) => s.addWorkout)
  const updateWorkout = useWorkoutStore((s) => s.updateWorkout)
  const deleteWorkout = useWorkoutStore((s) => s.deleteWorkout)
  const navigate = useNavigate()

  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [isNew, setIsNew] = useState(false)

  function startNew() {
    setEditingWorkout(emptyWorkout())
    setIsNew(true)
  }

  function startEdit(w: Workout) {
    setEditingWorkout(w)
    setIsNew(false)
  }

  function handleSave(w: Workout) {
    if (isNew) addWorkout(w)
    else updateWorkout(w)
    setEditingWorkout(null)
  }

  if (editingWorkout) {
    return (
      <div className="workouts-view">
        <h2 className="workouts-heading">{isNew ? 'New workout' : 'Edit workout'}</h2>
        <WorkoutEditor initial={editingWorkout} onSave={handleSave} onCancel={() => setEditingWorkout(null)} />
      </div>
    )
  }

  return (
    <div className="workouts-view">
      <div className="workouts-header-row">
        <h2 className="workouts-heading">Workouts</h2>
        <button className="header-btn primary-btn" onClick={startNew}>
          + New workout
        </button>
      </div>

      {workouts.length === 0 && (
        <p className="workouts-empty">
          No workouts yet. Build one with your own exercises, each with its own work and rest time.
        </p>
      )}

      <div className="workout-list">
        {workouts.map((w) => (
          <div className="workout-card" key={w.id}>
            <div className="workout-card-main" onClick={() => navigate(`/workouts/${w.id}/run`)}>
              <div className="workout-card-title">{w.name}</div>
              <div className="workout-card-meta">
                {w.exercises.length} exercise{w.exercises.length === 1 ? '' : 's'} · {w.rounds} round
                {w.rounds === 1 ? '' : 's'} · {formatDuration(totalDuration(w))}
              </div>
            </div>
            <div className="workout-card-actions">
              <button className="icon-btn" onClick={() => startEdit(w)} title="Edit">
                ✎
              </button>
              <button className="icon-btn" onClick={() => deleteWorkout(w.id)} title="Delete">
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
