"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function createTrainerAccount(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const phone = (formData.get("phone") as string) || null
  const isDemo = formData.get("isDemo") === "on"
  const maxClients = formData.get("maxClients") ? parseInt(formData.get("maxClients") as string) : 10
  const canCreateDiets = formData.get("canCreateDiets") === "on"
  const canCreateRoutines = formData.get("canCreateRoutines") === "on"
  const canAccessRecipes = formData.get("canAccessRecipes") === "on"
  const durationDays = formData.get("durationDays") ? parseInt(formData.get("durationDays") as string) : null

  if (!name || !email || !password) {
    throw new Error("نام، ایمیل و کلمه عبور الزامی هستند.")
  }

  const existing = await prisma.trainer.findUnique({
    where: { email },
  })

  if (existing) {
    throw new Error("مربی دیگری با این ایمیل در سیستم ثبت شده است.")
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  let expiresAt: Date | null = null
  if (isDemo && durationDays) {
    expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + durationDays)
  }

  await prisma.trainer.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone,
      role: "TRAINER",
      isDemo,
      maxClients,
      canCreateDiets,
      canCreateRoutines,
      canAccessRecipes,
      expiresAt,
    },
  })

  revalidatePath("/admin")
  return { success: true }
}

export async function updateTrainerAccount(trainerId: string, formData: FormData) {
  const name = formData.get("name") as string
  const phone = (formData.get("phone") as string) || null
  const password = (formData.get("password") as string) || null
  const isDemo = formData.get("isDemo") === "on"
  const maxClients = formData.get("maxClients") ? parseInt(formData.get("maxClients") as string) : 10
  const canCreateDiets = formData.get("canCreateDiets") === "on"
  const canCreateRoutines = formData.get("canCreateRoutines") === "on"
  const canAccessRecipes = formData.get("canAccessRecipes") === "on"

  const dataToUpdate: any = {
    name,
    phone,
    isDemo,
    maxClients,
    canCreateDiets,
    canCreateRoutines,
    canAccessRecipes,
  }

  if (password && password.trim().length > 0) {
    dataToUpdate.password = await bcrypt.hash(password.trim(), 10)
  }

  await prisma.trainer.update({
    where: { id: trainerId },
    data: dataToUpdate,
  })

  revalidatePath("/admin")
  return { success: true }
}

export async function deleteTrainerAccount(trainerId: string) {
  await prisma.trainer.delete({
    where: { id: trainerId },
  })

  revalidatePath("/admin")
  return { success: true }
}

export async function assignClientToTrainer(clientId: string, trainerId: string | null) {
  await prisma.client.update({
    where: { id: clientId },
    data: {
      trainerId: trainerId || null,
    },
  })

  revalidatePath("/admin")
  revalidatePath("/clients")
  revalidatePath("/")
  return { success: true }
}

export async function toggleTrainerApproval(trainerId: string, isApproved: boolean) {
  await prisma.trainer.update({
    where: { id: trainerId },
    data: { isApproved },
  })

  revalidatePath("/admin")
  return { success: true }
}
