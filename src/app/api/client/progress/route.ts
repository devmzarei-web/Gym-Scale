import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"


export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    const client = await (prisma.client as any).findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        age: true,
        height: true,
        weight: true,
        gender: true,
        goals: true,
      },
    })

    const logs = await prisma.clientProgressLog.findMany({
      where: { clientId: userId },
      orderBy: { loggedAt: "desc" },
    })

    return NextResponse.json({ logs, client })
  } catch (error: any) {
    console.error("Fetch progress logs error:", error)
    return NextResponse.json({ error: "خطا در دریافت تاریخچه پیشرفت." }, { status: 500 })
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
    const { weight, chest, waist, biceps, thigh, notes } = body

    if (!weight && !chest && !waist && !biceps && !thigh) {
      return NextResponse.json({ error: "لطفاً حداقل یک شاخص را وارد نمایید." }, { status: 400 })
    }

    const numericWeight = weight ? Number(weight) : null
    const numericChest = chest ? Number(chest) : null
    const numericWaist = waist ? Number(waist) : null
    const numericBiceps = biceps ? Number(biceps) : null
    const numericThigh = thigh ? Number(thigh) : null

    // Create progress log entry
    const newLog = await prisma.clientProgressLog.create({
      data: {
        clientId: userId,
        weight: numericWeight,
        chest: numericChest,
        waist: numericWaist,
        biceps: numericBiceps,
        thigh: numericThigh,
        notes: notes ? String(notes).trim() : null,
      },
    })

    // Also update current client weight if weight was logged
    if (numericWeight) {
      await prisma.client.update({
        where: { id: userId },
        data: { weight: numericWeight },
      })
    }

    return NextResponse.json({ message: "پیشرفت با موفقیت ثبت شد.", log: newLog }, { status: 201 })
  } catch (error: any) {
    console.error("Create progress log error:", error)
    return NextResponse.json({ error: "خطا در ثبت پیشرفت." }, { status: 500 })
  }
}
