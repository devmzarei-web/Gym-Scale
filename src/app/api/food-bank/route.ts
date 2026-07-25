import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { appCache } from "@/lib/cache"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const role = (session?.user as any)?.role

    if (role !== "TRAINER" && role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "فقط مربیان و مدیران دسترسی دارند." }, { status: 403 })
    }

    const body = await req.json()
    const { name, category, unitLabel, calories, protein, carbs, fats } = body

    if (!name || !calories) {
      return NextResponse.json({ error: "نام ماده غذایی و میزان کالری الزامی است." }, { status: 400 })
    }

    const food = await (prisma as any).foodDictionary.create({
      data: {
        name: String(name),
        category: category || "پروتئینی",
        unitLabel: unitLabel || "100 گرم",
        calories: Number(calories),
        protein: protein ? Number(protein) : 0,
        carbs: carbs ? Number(carbs) : 0,
        fats: fats ? Number(fats) : 0,
      },
    })


    // Invalidate food bank cache
    appCache.invalidate("food_bank_all")

    return NextResponse.json({ message: "ماده غذایی با موفقیت ایجاد شد.", food }, { status: 201 })
  } catch (error: any) {
    console.error("Create food error:", error)
    return NextResponse.json({ error: "خطا در ثبت ماده غذایی." }, { status: 500 })
  }
}
