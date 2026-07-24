"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import crypto from "crypto"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

async function handleFileUpload(file: File | null): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("حجم فایل نباید بیشتر از ۵ مگابایت باشد.")
  }
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "gifs")
    await mkdir(uploadDir, { recursive: true })
    const ext = path.extname(file.name) || ".gif"
    const safeExt = ext.match(/^\.(gif|webp|png|jpg|jpeg)$/i) ? ext.toLowerCase() : ".gif"
    const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${safeExt}`
    await writeFile(path.join(uploadDir, fileName), buffer)
    return `/uploads/gifs/${fileName}`
  } catch (err) {
    console.error("Error saving uploaded file in exercise action:", err)
    return null
  }
}

export async function createExerciseDictionaryItem(formData: FormData) {
  const name = formData.get("name") as string
  const muscleGroup = formData.get("muscleGroup") as string
  const description = (formData.get("description") as string) || null
  const videoUrl = (formData.get("videoUrl") as string) || null

  let gifUrl = (formData.get("gifUrl") as string) || null
  const gifFile = formData.get("gifFile") as File | null

  if (gifFile && gifFile.size > 0) {
    const uploadedUrl = await handleFileUpload(gifFile)
    if (uploadedUrl) gifUrl = uploadedUrl
  }

  if (!name || !muscleGroup) {
    throw new Error("نام حرکت و گروه عضله الزامی هستند.")
  }

  await prisma.exerciseDictionary.create({
    data: {
      name,
      muscleGroup,
      description,
      videoUrl,
      gifUrl,
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

  let gifUrl = (formData.get("gifUrl") as string) || null
  const gifFile = formData.get("gifFile") as File | null

  if (gifFile && gifFile.size > 0) {
    const uploadedUrl = await handleFileUpload(gifFile)
    if (uploadedUrl) gifUrl = uploadedUrl
  }

  await prisma.exerciseDictionary.update({
    where: { id },
    data: {
      name,
      muscleGroup,
      description,
      videoUrl,
      gifUrl,
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
