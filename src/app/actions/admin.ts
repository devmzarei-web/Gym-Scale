"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

import { TIER_CONFIGS, SubscriptionTierType } from "@/lib/subscription"

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
  
  const rawTier = (formData.get("tier") as string) || "TRIAL"
  const tier: SubscriptionTierType = (["TRIAL", "STARTER", "PRO", "FREE"].includes(rawTier)
    ? rawTier
    : "TRIAL") as SubscriptionTierType
  const tierConfig = TIER_CONFIGS[tier] || TIER_CONFIGS.TRIAL

  const maxClients = formData.get("maxClients")
    ? parseInt(formData.get("maxClients") as string)
    : tierConfig.defaultMaxClients

  const canCreateDiets = formData.get("canCreateDiets") === "on"
  const canCreateRoutines = formData.get("canCreateRoutines") === "on"
  const canAccessRecipes = formData.get("canAccessRecipes") === "on"
  
  const durationDays = formData.get("durationDays")
    ? parseInt(formData.get("durationDays") as string)
    : (isDemo ? tierConfig.defaultValidityDays : null)

  const aiQuota = formData.get("aiQuota")
    ? parseInt(formData.get("aiQuota") as string)
    : tierConfig.defaultAiQuota

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
  if (durationDays && durationDays > 0) {
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
  const maxClients = formData.get("maxClients") ? parseInt(formData.get("maxClients") as string) : undefined
  const canCreateDiets = formData.get("canCreateDiets") === "on"
  const canCreateRoutines = formData.get("canCreateRoutines") === "on"
  const canAccessRecipes = formData.get("canAccessRecipes") === "on"
  const aiQuota = formData.get("aiQuota") ? parseInt(formData.get("aiQuota") as string) : undefined
  const rawTier = (formData.get("tier") as string) || undefined

  const dataToUpdate: any = {
    name,
    phone,
    isDemo,
    canCreateDiets,
    canCreateRoutines,
    canAccessRecipes,
  }

  if (maxClients !== undefined && !isNaN(maxClients)) {
    dataToUpdate.maxClients = maxClients
  }

  if (aiQuota !== undefined && !isNaN(aiQuota)) {
    dataToUpdate.aiQuota = aiQuota
  }

  if (rawTier && ["TRIAL", "STARTER", "PRO", "FREE"].includes(rawTier)) {
    dataToUpdate.tier = rawTier
  }

  // Handle explicit expiration date update or clearing
  const expiresAtStr = formData.get("expiresAt") as string
  if (expiresAtStr !== null && expiresAtStr !== undefined) {
    if (expiresAtStr.trim() === "") {
      dataToUpdate.expiresAt = null
    } else {
      const parsedDate = new Date(expiresAtStr)
      if (!isNaN(parsedDate.getTime())) {
        dataToUpdate.expiresAt = parsedDate
      }
    }
  }

  // Handle extending expiration by N days
  const extendDays = formData.get("extendDays") ? parseInt(formData.get("extendDays") as string) : null
  if (extendDays && !isNaN(extendDays) && extendDays > 0) {
    const existingTrainer = await prisma.trainer.findUnique({
      where: { id: trainerId },
      select: { expiresAt: true },
    })
    const base = existingTrainer?.expiresAt && existingTrainer.expiresAt > new Date()
      ? existingTrainer.expiresAt
      : new Date()
    const newExp = new Date(base)
    newExp.setDate(newExp.getDate() + extendDays)
    dataToUpdate.expiresAt = newExp
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
