"use server"

import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"

export async function createRecipe(formData: FormData) {
  const title = formData.get("title") as string
  const category = formData.get("category") as string
  const prepTime = (formData.get("prepTime") as string) || null
  const calories = formData.get("calories") ? parseInt(formData.get("calories") as string) : null
  const protein = formData.get("protein") ? parseFloat(formData.get("protein") as string) : null
  const carbs = formData.get("carbs") ? parseFloat(formData.get("carbs") as string) : null
  const fats = formData.get("fats") ? parseFloat(formData.get("fats") as string) : null
  const ingredients = formData.get("ingredients") as string
  const instructions = formData.get("instructions") as string

  if (!title || !category || !ingredients || !instructions) {
    throw new Error("عنوان، دسته‌بندی، مواد اولیه و طرز تهیه الزامی هستند.")
  }

  await prisma.recipe.create({
    data: {
      title,
      category,
      prepTime,
      calories,
      protein,
      carbs,
      fats,
      ingredients,
      instructions,
    },
  })

  revalidatePath("/recipes")
  return { success: true }
}

export async function updateRecipe(id: string, formData: FormData) {
  const title = formData.get("title") as string
  const category = formData.get("category") as string
  const prepTime = (formData.get("prepTime") as string) || null
  const calories = formData.get("calories") ? parseInt(formData.get("calories") as string) : null
  const protein = formData.get("protein") ? parseFloat(formData.get("protein") as string) : null
  const carbs = formData.get("carbs") ? parseFloat(formData.get("carbs") as string) : null
  const fats = formData.get("fats") ? parseFloat(formData.get("fats") as string) : null
  const ingredients = formData.get("ingredients") as string
  const instructions = formData.get("instructions") as string

  await prisma.recipe.update({
    where: { id },
    data: {
      title,
      category,
      prepTime,
      calories,
      protein,
      carbs,
      fats,
      ingredients,
      instructions,
    },
  })

  revalidatePath("/recipes")
  return { success: true }
}

export async function deleteRecipe(id: string) {
  await prisma.recipe.delete({
    where: { id },
  })

  revalidatePath("/recipes")
  return { success: true }
}
