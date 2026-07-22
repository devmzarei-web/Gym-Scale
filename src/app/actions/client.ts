"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"

export async function createClient(formData: FormData) {
  const name = formData.get("name") as string
  const phone = (formData.get("phone") as string) || null
  const email = (formData.get("email") as string) || null
  const age = formData.get("age") ? parseInt(formData.get("age") as string) : null
  const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null
  const height = formData.get("height") ? parseFloat(formData.get("height") as string) : null
  const goals = (formData.get("goals") as string) || null
  const notes = (formData.get("notes") as string) || null

  if (!name || name.trim() === "") {
    throw new Error("نام شاگرد الزامی است.")
  }

  const trainer = await prisma.trainer.findFirst({
    where: { role: "TRAINER" },
  })

  const client = await prisma.client.create({
    data: {
      name,
      phone,
      email,
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
  const age = formData.get("age") ? parseInt(formData.get("age") as string) : null
  const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null
  const height = formData.get("height") ? parseFloat(formData.get("height") as string) : null
  const goals = (formData.get("goals") as string) || null
  const notes = (formData.get("notes") as string) || null

  await prisma.client.update({
    where: { id: clientId },
    data: {
      name,
      phone,
      email,
      age,
      weight,
      height,
      goals,
      notes,
    },
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
  await prisma.client.delete({
    where: { id: clientId },
  })

  revalidatePath("/clients")
  revalidatePath("/")
  return { success: true }
}
