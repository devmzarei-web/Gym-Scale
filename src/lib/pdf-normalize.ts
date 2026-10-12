/**
 * Defensive Normalization Utilities for PDF Generation & Program Export
 * Prevents runtime null pointer exceptions, JSON parsing errors, and malformed database fields.
 */

export const toPersianDigits = (num: string | number | undefined | null): string => {
  if (num === undefined || num === null) return ""
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
  return String(num).replace(/\d/g, (x) => persianDigits[parseInt(x, 10)] || x)
}

export interface NormalizedSportContext {
  primarySport?: string
  description?: string
  coachNotes?: string
  targetMuscleGroups?: string[]
}

export function normalizeSportContext(
  rawSportContext: any,
  fallbackDescription?: string | null
): NormalizedSportContext | null {
  let parsed: any = null

  if (typeof rawSportContext === "string") {
    try {
      parsed = JSON.parse(rawSportContext)
    } catch {
      parsed = { description: rawSportContext }
    }
  } else if (typeof rawSportContext === "object" && rawSportContext !== null) {
    parsed = rawSportContext
  } else if (fallbackDescription) {
    parsed = { description: fallbackDescription }
  }

  if (!parsed) return null

  let coachNotes = ""
  if (parsed.coachNotes) {
    coachNotes = String(parsed.coachNotes)
      .replace(/^(دستورالعمل اجرایی مربی|دستورالعمل اجرایی|دستورالعمل اجرا|توصیه مربی)\s*[:：]\s*/gi, "")
      .replace(/^(توصیه مربی|دستورالعمل اجرایی|دستورالعمل اجرا)\s*[:：]\s*/gi, "")
      .trim()
  }

  return {
    primarySport: parsed.primarySport ? String(parsed.primarySport).trim() : undefined,
    description: parsed.description ? String(parsed.description).trim() : undefined,
    coachNotes: coachNotes || undefined,
    targetMuscleGroups: Array.isArray(parsed.targetMuscleGroups)
      ? parsed.targetMuscleGroups.map((g: any) => String(g).trim()).filter(Boolean)
      : undefined,
  }
}

export interface NormalizedExercise {
  id: string
  name: string
  muscleGroup: string | null
  sets: number
  repetitions: string
  restTime: string
  weight: string | null
  customDescription: string | null
  groupType: string
  groupId: string | null
}

export function normalizeExercise(raw: any, index: number): NormalizedExercise {
  const rawRest = String(raw?.restTime || "").trim()
  const cleanedRest = rawRest
    .replace(/بلافاصله\s*\(بدون استراحت\)/g, "بلافاصله")
    .replace(/بدون استراحت/g, "بلافاصله")

  let parsedSets = 3
  if (raw?.sets !== undefined && raw?.sets !== null) {
    const num = Number(raw.sets)
    if (!isNaN(num) && num > 0) parsedSets = num
  }

  return {
    id: raw?.id || `ex-${index}`,
    name: String(raw?.name || "حرکت تمرینی").trim(),
    muscleGroup: raw?.muscleGroup ? String(raw.muscleGroup).trim() : null,
    sets: parsedSets,
    repetitions: String(raw?.repetitions || "10-12").trim(),
    restTime: cleanedRest || "۶۰ ثانیه",
    weight: raw?.weight ? String(raw.weight).trim() : null,
    customDescription: raw?.customDescription ? String(raw.customDescription).trim() : null,
    groupType: String(raw?.groupType || "NORMAL").trim(),
    groupId: raw?.groupId ? String(raw.groupId).trim() : null,
  }
}

export interface NormalizedWorkoutDay {
  id: string
  label: string
  order: number
  exercises: NormalizedExercise[]
}

export function normalizeWorkoutDays(rawDays: any[] | undefined | null): NormalizedWorkoutDay[] {
  if (!Array.isArray(rawDays)) return []

  return rawDays.map((day, idx) => ({
    id: day?.id || `day-${idx}`,
    label: day?.label ? String(day.label).trim() : `روز ${idx + 1}`,
    order: typeof day?.order === "number" ? day.order : idx,
    exercises: Array.isArray(day?.exercises)
      ? day.exercises.map((ex: any, exIdx: number) => normalizeExercise(ex, exIdx))
      : [],
  }))
}

export interface NormalizedTrainerBranding {
  name: string
  bio: string
  logoUrl: string | null
}

export function normalizeTrainerBranding(rawTrainer: any): NormalizedTrainerBranding {
  return {
    name: rawTrainer?.name ? String(rawTrainer.name).trim() : "مربی تخصصی NutriTrain",
    bio: rawTrainer?.bio ? String(rawTrainer.bio).trim() : "مربی رسمی فدراسیون بدنسازی و پرورش اندام",
    logoUrl: rawTrainer?.logoUrl ? String(rawTrainer.logoUrl).trim() : null,
  }
}
