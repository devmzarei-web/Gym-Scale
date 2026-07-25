"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import type { ExerciseGroupType } from "@prisma/client"

async function ensureExercisesInDictionary(exercises: Array<{ name: string; muscleGroup?: string; gifUrl?: string | null }>) {
  for (const ex of exercises) {
    if (ex.name && ex.name.trim()) {
      const existing = await prisma.exerciseDictionary.findFirst({
        where: { name: ex.name.trim() },
      })
      if (!existing) {
        await prisma.exerciseDictionary.create({
          data: {
            name: ex.name.trim(),
            muscleGroup: ex.muscleGroup || "سایر",
            gifUrl: ex.gifUrl || null,
          },
        })
      } else if (ex.gifUrl && !existing.gifUrl) {
        await prisma.exerciseDictionary.update({
          where: { id: existing.id },
          data: { gifUrl: ex.gifUrl },
        })
      }
    }
  }
}

type ExerciseInput = {
  name: string
  muscleGroup?: string
  sets: number
  repetitions: string
  restTime?: string
  weight?: string
  customDescription?: string
  gifUrl?: string | null
  groupType?: ExerciseGroupType
  groupId?: string | null
}

type WorkoutDayInput = {
  day: "SATURDAY" | "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY"
  label?: string
  exercises: ExerciseInput[]
}

export async function createRoutine(data: {
  title: string
  description?: string
  clientId?: string
  isTemplate: boolean
  workoutDays: WorkoutDayInput[]
}) {
  if (!data.title || data.title.trim() === "") {
    throw new Error("عنوان برنامه تمرینی الزامی است.")
  }

  const trainer = await prisma.trainer.findFirst({
    where: { role: "TRAINER" },
  })

  // Ensure all custom exercises get added to dictionary
  const allExercises = data.workoutDays.flatMap((wd) => wd.exercises)
  await ensureExercisesInDictionary(allExercises)

  const routine = await prisma.routine.create({
    data: {
      title: data.title,
      description: data.description,
      isTemplate: data.isTemplate,
      trainerId: trainer?.id || null,
      workoutDays: {
        create: data.workoutDays.map((wd, dayIdx) => ({
          day: wd.day,
          label: wd.label || `روز ${dayIdx + 1}`,
          order: dayIdx,
          exercises: {
            create: wd.exercises.map((ex, exIdx) => ({
              name: ex.name,
              muscleGroup: ex.muscleGroup,
              sets: ex.sets,
              repetitions: ex.repetitions,
              restTime: ex.restTime,
              weight: ex.weight,
              customDescription: ex.customDescription,
              gifUrl: ex.gifUrl || null,
              order: exIdx,
              groupType: (ex.groupType || "NORMAL") as any,
              groupId: ex.groupId || null,
            })),
          },
        })),
      },
      history: data.clientId
        ? {
            create: {
              clientId: data.clientId,
            },
          }
        : undefined,
    },
  })

  revalidatePath("/routines")
  revalidatePath("/exercises")
  revalidatePath("/")
  if (data.clientId) {
    revalidatePath(`/clients/${data.clientId}`)
  }

  return { success: true, routineId: routine.id }
}

export async function updateRoutine(
  routineId: string,
  data: {
    title: string
    description?: string
    clientId?: string
    isTemplate: boolean
    workoutDays: WorkoutDayInput[]
  }
) {
  const allExercises = data.workoutDays.flatMap((wd) => wd.exercises)
  await ensureExercisesInDictionary(allExercises)

  await prisma.exercise.deleteMany({
    where: { workoutDay: { routineId } },
  })
  await prisma.workoutDay.deleteMany({
    where: { routineId },
  })

  const routine = await prisma.routine.update({
    where: { id: routineId },
    data: {
      title: data.title,
      description: data.description,
      isTemplate: data.isTemplate,
      workoutDays: {
        create: data.workoutDays.map((wd, dayIdx) => ({
          day: wd.day,
          label: wd.label || `روز ${dayIdx + 1}`,
          order: dayIdx,
          exercises: {
            create: wd.exercises.map((ex, exIdx) => ({
              name: ex.name,
              muscleGroup: ex.muscleGroup,
              sets: ex.sets,
              repetitions: ex.repetitions,
              restTime: ex.restTime,
              weight: ex.weight,
              customDescription: ex.customDescription,
              gifUrl: ex.gifUrl || null,
              order: exIdx,
              groupType: (ex.groupType || "NORMAL") as any,
              groupId: ex.groupId || null,
            })),
          },
        })),
      },
    },
  })

  if (data.clientId) {
    await prisma.clientRoutineHistory.create({
      data: {
        routineId,
        clientId: data.clientId,
      },
    })
    revalidatePath(`/clients/${data.clientId}`)
  }

  revalidatePath(`/routines/${routineId}`)
  revalidatePath("/routines")
  revalidatePath("/exercises")
  return { success: true }
}

export async function assignExistingRoutineToClient(routineId: string, clientId: string) {
  const existing = await prisma.clientRoutineHistory.findFirst({
    where: { routineId, clientId },
  })

  if (!existing) {
    await prisma.clientRoutineHistory.create({
      data: {
        routineId,
        clientId,
      },
    })
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath("/routines")
  revalidatePath("/client")
  return { success: true }
}

export async function deleteRoutine(routineId: string) {
  await prisma.routine.delete({
    where: { id: routineId },
  })

  revalidatePath("/routines")
  revalidatePath("/")
  return { success: true }
}

export async function unassignRoutineFromClient(historyId: string, clientId: string) {
  await prisma.clientRoutineHistory.delete({
    where: { id: historyId },
  })
  revalidatePath(`/clients/${clientId}`)
  revalidatePath("/client")
  return { success: true }
}
