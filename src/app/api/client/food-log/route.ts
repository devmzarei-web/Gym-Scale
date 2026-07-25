import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get("date")

    let targetDate = new Date()
    if (dateParam) {
      const parsed = new Date(dateParam)
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed
      }
    }

    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    const logs = (prisma as any).clientFoodLog
      ? await (prisma as any).clientFoodLog.findMany({
          where: {
            clientId: userId,
            loggedAt: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          orderBy: { loggedAt: "asc" },
        })
      : []

    return NextResponse.json({ logs })
  } catch (error: any) {
    console.error("Fetch food logs error:", error)
    return NextResponse.json({ error: "خطا در دریافت لیست غذاهای مصرفی." }, { status: 500 })
  }
}


export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    const body = await req.json()
    const { foodName, mealType, amount, unitLabel, calories, protein, carbs, fats } = body

    if (!foodName || !calories) {
      return NextResponse.json({ error: "نام غذا و میزان کالری الزامی است." }, { status: 400 })
    }

    const log = await (prisma as any).clientFoodLog.create({
      data: {
        clientId: userId,
        foodName: String(foodName),
        mealType: mealType || "SNACK",
        amount: amount ? Number(amount) : 1,
        unitLabel: unitLabel || "100 گرم",
        calories: Number(calories),
        protein: protein ? Number(protein) : 0,
        carbs: carbs ? Number(carbs) : 0,
        fats: fats ? Number(fats) : 0,
      },
    })

    return NextResponse.json({ message: "غذا با موفقیت ثبت شد!", log }, { status: 201 })
  } catch (error: any) {
    console.error("Create food log error:", error)
    return NextResponse.json({ error: "خطا در ثبت غذا." }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const logId = searchParams.get("id")

    if (!logId) {
      return NextResponse.json({ error: "شناسه غذا الزامی است." }, { status: 400 })
    }

    await (prisma as any).clientFoodLog.deleteMany({
      where: {
        id: logId,
        clientId: userId,
      },
    })


    return NextResponse.json({ message: "غذا حذف شد." })
  } catch (error: any) {
    console.error("Delete food log error:", error)
    return NextResponse.json({ error: "خطا در حذف غذا." }, { status: 500 })
  }
}
