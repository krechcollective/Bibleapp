import type { Workout } from '../store/workoutStore'

export type SegmentPhase = 'prepare' | 'work' | 'rest' | 'setRest'

export interface Segment {
  phase: SegmentPhase
  label: string
  seconds: number
  /** What to announce when this segment begins. */
  announceOnStart: string
}

const PREPARE_SECONDS = 5

/** Flattens a workout's rounds/exercises into a linear sequence of timed segments. */
export function buildSegments(workout: Workout): Segment[] {
  const segments: Segment[] = []
  if (workout.exercises.length === 0) return segments

  segments.push({
    phase: 'prepare',
    label: 'Get ready',
    seconds: PREPARE_SECONDS,
    announceOnStart: 'Get ready',
  })

  for (let round = 0; round < workout.rounds; round++) {
    workout.exercises.forEach((exercise, exerciseIndex) => {
      segments.push({
        phase: 'work',
        label: exercise.name,
        seconds: exercise.workSeconds,
        announceOnStart: `Begin, ${exercise.name}`,
      })

      const isLastExerciseInRound = exerciseIndex === workout.exercises.length - 1
      const isLastRound = round === workout.rounds - 1

      if (exercise.restSeconds > 0 && !(isLastExerciseInRound && isLastRound)) {
        const nextExercise = workout.exercises[exerciseIndex + 1]
        segments.push({
          phase: 'rest',
          label: 'Rest',
          seconds: exercise.restSeconds,
          announceOnStart: nextExercise ? `Rest. Next up, ${nextExercise.name}` : 'Rest',
        })
      }
    })

    const isLastRound = round === workout.rounds - 1
    if (!isLastRound && workout.restBetweenSetsSeconds > 0) {
      segments.push({
        phase: 'setRest',
        label: 'Rest between sets',
        seconds: workout.restBetweenSetsSeconds,
        announceOnStart: 'Set complete. Rest',
      })
    }
  }

  return segments
}

export function totalDuration(workout: Workout): number {
  return buildSegments(workout).reduce((sum, s) => sum + s.seconds, 0)
}
