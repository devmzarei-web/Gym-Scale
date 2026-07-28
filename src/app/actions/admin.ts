"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

function generateDefaultTrainerCode() {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `NT-${num}`
}

export async function createTrainerAccount(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const phone = (formData.get("phone") as string) || null
  const customCode = (formData.get("trainerCode") as string) || null
  const isDemo = formData.get("isDemo") === "on"
  const maxClients = formData.get("maxClients") ? parseInt(formData.get("maxClients") as string) : 10
  const canCreateDiets = formData.get("canCreateDiets") === "on"
  const canCreateRoutines = formData.get("canCreateRoutines") === "on"
  const canAccessRecipes = formData.get("canAccessRecipes") === "on"
  const durationDays = formData.get("durationDays") ? parseInt(formData.get("durationDays") as string) : null
  const aiQuota = formData.get("aiQuota") ? parseInt(formData.get("aiQuota") as string) : 3
  const tier = (formData.get("tier") as string) === "PRO" ? "PRO" : "FREE"

  if (!name || !email || !password) {
    throw new Error("نام، ایمیل و کلمه عبور الزامی هستند.")
  }

  const existing = await prisma.trainer.findUnique({
    where: { email },
  })

  if (existing) {
    throw new Error("مربی دیگری با این ایمیل در سیستم ثبت شده است.")
  }

  const trainerCode = customCode && customCode.trim().length > 0
    ? customCode.trim().toUpperCase()
    : generateDefaultTrainerCode()

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
      trainerCode,
      role: "TRAINER",
      isApproved: true,
      isDemo,
      maxClients,
      canCreateDiets,
      canCreateRoutines,
      canAccessRecipes,
      expiresAt,
      tier,
      aiQuota,
    },
  })

  revalidatePath("/admin")
  return { success: true }
}

export async function updateTrainerAccount(trainerId: string, formData: FormData) {
  const name = formData.get("name") as string
  const phone = (formData.get("phone") as string) || null
  const password = (formData.get("password") as string) || null
  const trainerCode = (formData.get("trainerCode") as string) || null
  const isDemo = formData.get("isDemo") === "on"
  const maxClients = formData.get("maxClients") ? parseInt(formData.get("maxClients") as string) : 10
  const canCreateDiets = formData.get("canCreateDiets") === "on"
  const canCreateRoutines = formData.get("canCreateRoutines") === "on"
  const canAccessRecipes = formData.get("canAccessRecipes") === "on"
  const aiQuota = formData.get("aiQuota") ? parseInt(formData.get("aiQuota") as string) : undefined
  const tier = (formData.get("tier") as string) || undefined

  const dataToUpdate: any = {
    name,
    phone,
    isDemo,
    maxClients,
    canCreateDiets,
    canCreateRoutines,
    canAccessRecipes,
  }

  if (aiQuota !== undefined && !isNaN(aiQuota)) {
    dataToUpdate.aiQuota = aiQuota
  }

  if (tier && (tier === "PRO" || tier === "FREE")) {
    dataToUpdate.tier = tier
  }

  if (trainerCode && trainerCode.trim().length > 0) {
    dataToUpdate.trainerCode = trainerCode.trim().toUpperCase()
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
  try {
    await prisma.trainer.update({
      where: { id: trainerId },
      data: { isApproved },
    })

    revalidatePath("/admin")
    return { success: true }
  } catch (err: any) {
    console.error("Toggle trainer approval error:", err)
    throw new Error("خطا در تغییر وضعیت تایید مربی.")
  }
}
