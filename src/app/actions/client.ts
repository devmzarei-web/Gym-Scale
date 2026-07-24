"use server"

import { revalidatePath } from "next/cache"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export async function createClient(formData: FormData) {
  const name = formData.get("name") as string
  const phone = (formData.get("phone") as string) || null
  const email = (formData.get("email") as string) || null
  const rawPassword = (formData.get("password") as string) || null
  const age = formData.get("age") ? parseInt(formData.get("age") as string) : null
  const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null
  const height = formData.get("height") ? parseFloat(formData.get("height") as string) : null
  const goals = (formData.get("goals") as string) || null
  const notes = (formData.get("notes") as string) || null

  if (!name || name.trim() === "") {
    throw new Error("نام شاگرد الزامی است.")
  }

  let hashedPassword: string | null = null
  if (rawPassword && rawPassword.trim() !== "") {
    hashedPassword = await bcrypt.hash(rawPassword.trim(), 10)
  }

  const trainer = await prisma.trainer.findFirst({
    where: { role: "TRAINER" },
  })

  const client = await prisma.client.create({
    data: {
      name,
      phone,
      email,
      password: hashedPassword,
      age,
      weight,
      height,
      goals,
      notes,
      trainerId: trainer?.id || null,
    },
  })

  revalidatePath("/clients")
  revalidatePath("/")
  return { success: true, clientId: client.id }
}

export async function updateClient(clientId: string, formData: FormData) {
  const name = formData.get("name") as string
  const phone = (formData.get("phone") as string) || null
  const email = (formData.get("email") as string) || null
  const rawPassword = (formData.get("password") as string) || null
  const age = formData.get("age") ? parseInt(formData.get("age") as string) : null
  const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null
  const height = formData.get("height") ? parseFloat(formData.get("height") as string) : null
  const goals = (formData.get("goals") as string) || null
  const notes = (formData.get("notes") as string) || null

  const updateData: any = {
    name,
    phone,
    email,
    age,
    weight,
    height,
    goals,
    notes,
  }

  if (rawPassword && rawPassword.trim() !== "") {
    updateData.password = await bcrypt.hash(rawPassword.trim(), 10)
  }

  await prisma.client.update({
    where: { id: clientId },
    data: updateData,
  })

  revalidatePath(`/clients/${clientId}`)
  revalidatePath("/clients")
  return { success: true }
}

export async function createSubscription(clientId: string, formData: FormData) {
  const planName = (formData.get("planName") as string) || "اشتراک ورزشی"
  const durationMonths = parseInt((formData.get("durationMonths") as string) || "1")
  const price = formData.get("price") ? parseFloat(formData.get("price") as string) : null
  const notes = (formData.get("notes") as string) || null

  const startDate = new Date()
  const endDate = new Date()
  endDate.setMonth(endDate.getMonth() + durationMonths)

  // Get active trainer or set fallback
  const trainer = await prisma.trainer.findFirst()
  if (!trainer) {
    throw new Error("هیچ مربی در سیستم یافت نشد.")
  }

  await prisma.subscription.create({
    data: {
      clientId,
      trainerId: trainer.id,
      planName,
      startDate,
      endDate,
      status: "ACTIVE",
      price,
      notes,
    },
  })

  revalidatePath(`/clients/${clientId}`)
  revalidatePath("/clients")
  return { success: true }
}

export async function deleteClient(clientId: string) {
  // Soft delete - trainers can only soft-delete
  await prisma.client.update({
    where: { id: clientId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    } as any,
  })

  revalidatePath("/clients")
  revalidatePath("/")
  return { success: true }
}

export async function restoreClient(clientId: string) {
  await prisma.client.update({
    where: { id: clientId },
    data: {
      isDeleted: false,
      deletedAt: null,
    } as any,
  })

  revalidatePath("/clients")
  revalidatePath("/")
  return { success: true }
}

export async function hardDeleteClient(clientId: string) {
  // Only SUPER_ADMIN should call this - enforced at the UI level
  await prisma.client.delete({
    where: { id: clientId },
  })

  revalidatePath("/clients")
  revalidatePath("/")
  return { success: true }
}

export async function logClientProgress(clientId: string, formData: FormData) {
  const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null
  const chest = formData.get("chest") ? parseFloat(formData.get("chest") as string) : null
  const waist = formData.get("waist") ? parseFloat(formData.get("waist") as string) : null
  const biceps = formData.get("biceps") ? parseFloat(formData.get("biceps") as string) : null
  const thigh = formData.get("thigh") ? parseFloat(formData.get("thigh") as string) : null
  const notes = (formData.get("notes") as string) || null

  await prisma.clientProgressLog.create({
    data: {
      clientId,
      weight,
      chest,
      waist,
      biceps,
      thigh,
      notes,
    },
  })

  if (weight) {
    await prisma.client.update({
      where: { id: clientId },
      data: { weight },
    })
  }

  revalidatePath(`/clients/${clientId}`)
  revalidatePath("/client")
  return { success: true }
}

export async function addProgressPhoto(clientId: string, photoUrl: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { photoUrls: true },
  })

  if (!client) throw new Error("شاگرد پیدا نشد.")

  await prisma.client.update({
    where: { id: clientId },
    data: {
      photoUrls: [...client.photoUrls, photoUrl],
    },
  })

  revalidatePath(`/clients/${clientId}`)
  revalidatePath("/client")
  return { success: true }
}

export async function deleteClientProgressLog(logId: string) {
  const log = await prisma.clientProgressLog.delete({
    where: { id: logId },
  })

  if (log?.clientId) {
    revalidatePath(`/clients/${log.clientId}`)
    revalidatePath("/client")
  }
  return { success: true }
}


