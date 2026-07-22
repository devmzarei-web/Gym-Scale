"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"

export async function createExerciseDictionaryItem(formData: FormData) {
  const name = formData.get("name") as string
  const muscleGroup = formData.get("muscleGroup") as string
  const description = (formData.get("description") as string) || null
  const videoUrl = (formData.get("videoUrl") as string) || null

  if (!name || !muscleGroup) {
    throw new Error("نام حرکت و گروه عضله الزامی هستند.")
  }

  await prisma.exerciseDictionary.create({
    data: {
      name,
      muscleGroup,
      description,
      videoUrl,
    },
  })

  revalidatePath("/exercises")
  return { success: true }
}

export async function updateExerciseDictionaryItem(id: string, formData: FormData) {
  const name = formData.get("name") as string
  const muscleGroup = formData.get("muscleGroup") as string
  const description = (formData.get("description") as string) || null
  const videoUrl = (formData.get("videoUrl") as string) || null

  await prisma.exerciseDictionary.update({
    where: { id },
    data: {
      name,
      muscleGroup,
      description,
      videoUrl,
    },
  })

  revalidatePath("/exercises")
  return { success: true }
}

export async function deleteExerciseDictionaryItem(id: string) {
  await prisma.exerciseDictionary.delete({
    where: { id },
  })

  revalidatePath("/exercises")
  return { success: true }
}
