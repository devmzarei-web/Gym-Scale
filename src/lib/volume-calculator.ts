export interface SetData {
  weight: number
  reps: number
}

export interface ExerciseSessionLog {
  date: string
  exerciseName: string
  sets: SetData[]
}

/**
  * Calculate Estimated 1RM (Epley Formula)
  * E1RM = weight * (1 + reps / 30)
  */
export function calculateE1RM(weight: number, reps: number): number {
  if (!weight || weight <= 0 || !reps || reps <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

/**
  * Calculate Total Volume Load for a set or session (Sets * Reps * Weight)
  */
export function calculateTotalVolume(sets: SetData[]): number {
  if (!sets || !Array.isArray(sets)) return 0
  return sets.reduce((acc, s) => {
    const w = parseFloat(String(s.weight || 0)) || 0
    const r = parseFloat(String(s.reps || 0)) || 0
    return acc + w * r
  }, 0)
}

/**
  * Extract best 1RM from a session's completed sets
  */
export function calculateMaxE1RM(sets: SetData[]): number {
  if (!sets || !Array.isArray(sets) || sets.length === 0) return 0
  let max1RM = 0
  for (const s of sets) {
    const e1rm = calculateE1RM(s.weight, s.reps)
    if (e1rm > max1RM) {
      max1RM = e1rm
    }
  }
  return max1RM
}
