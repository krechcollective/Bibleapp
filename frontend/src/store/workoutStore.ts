import { create } from 'zustand'

export interface WorkoutExercise {
  id: string
  name: string
  workSeconds: number
  restSeconds: number
}

export interface Workout {
  id: string
  name: string
  rounds: number
  restBetweenSetsSeconds: number
  exercises: WorkoutExercise[]
}

interface WorkoutState {
  workouts: Workout[]
  addWorkout: (w: Workout) => void
  updateWorkout: (w: Workout) => void
  deleteWorkout: (id: string) => void
}

const STORAGE_KEY = 'workout-timer-workouts'

function loadInitialWorkouts(): Workout[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore malformed storage
  }
  return []
}

function persist(workouts: Workout[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
  } catch {
    // storage unavailable; changes just won't persist
  }
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workouts: loadInitialWorkouts(),

  addWorkout: (w) => {
    const workouts = [...get().workouts, w]
    persist(workouts)
    set({ workouts })
  },

  updateWorkout: (w) => {
    const workouts = get().workouts.map((existing) => (existing.id === w.id ? w : existing))
    persist(workouts)
    set({ workouts })
  },

  deleteWorkout: (id) => {
    const workouts = get().workouts.filter((w) => w.id !== id)
    persist(workouts)
    set({ workouts })
  },
}))

export function newExerciseId() {
  return `ex-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function newWorkoutId() {
  return `wk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
