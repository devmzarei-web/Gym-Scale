"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"

export async function createDietPlan(data: {
  title: string
  description?: string
  content: string
  clientId?: string
  isTemplate: boolean
}) {
  if (!data.title || !data.content) {
    throw new Error("عنوان و محتوای برنامه تغذیه الزامی هستند.")
  }

  const trainer = await prisma.trainer.findFirst({
    where: { role: "TRAINER" },
  })

  const dietPlan = await prisma.dietPlan.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      isTemplate: data.isTemplate,
      trainerId: trainer?.id || null,
    },
  })

  if (data.clientId) {
    await prisma.clientDietHistory.create({
      data: {
        clientId: data.clientId,
        dietPlanId: dietPlan.id,
      },
    })
  }

  revalidatePath("/diets")
  if (data.clientId) {
    revalidatePath(`/clients/${data.clientId}`)
  }
  return { success: true, dietPlanId: dietPlan.id }
}

export async function updateDietPlan(
  dietPlanId: string,
  data: {
    title: string
    description?: string
    content: string
    isTemplate: boolean
  }
) {
  if (!data.title || !data.content) {
    throw new Error("عنوان و محتوای برنامه تغذیه الزامی هستند.")
  }

  await prisma.dietPlan.update({
    where: { id: dietPlanId },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      isTemplate: data.isTemplate,
    },
  })

  revalidatePath(`/diets/${dietPlanId}`)
  revalidatePath("/diets")
  return { success: true }
}

export async function assignExistingDietToClient(dietPlanId: string, clientId: string) {
  await prisma.clientDietHistory.create({
    data: {
      dietPlanId,
      clientId,
    },
  })

  revalidatePath(`/clients/${clientId}`)
  revalidatePath("/diets")
  revalidatePath("/")
  return { success: true }
}

export async function deleteDietPlan(dietPlanId: string) {
  await prisma.dietPlan.delete({
    where: { id: dietPlanId },
  })

  revalidatePath("/diets")
  revalidatePath("/")
  return { success: true }
}
