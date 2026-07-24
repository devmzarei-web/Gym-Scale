import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    const body = await req.json()
    const { routineId, dayLabel, durationMinutes, completedExercises, totalExercises, notes, setDetails } = body

    if (!dayLabel) {
      return NextResponse.json({ error: "نام روز تمرینی الزامی است." }, { status: 400 })
    }

    const log = await prisma.workoutSessionLog.create({
      data: {
        clientId: userId,
        routineId: routineId ? String(routineId) : null,
        dayLabel: String(dayLabel),
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        completedExercises: completedExercises ? Number(completedExercises) : 0,
        totalExercises: totalExercises ? Number(totalExercises) : 0,
        notes: notes ? String(notes).trim() : null,
        setDetails: setDetails ? JSON.stringify(setDetails) : null,
      },
    })

    return NextResponse.json({ message: "تمرین امروز با موفقیت ثبت شد!", log }, { status: 201 })
  } catch (error: any) {
    console.error("Workout session log error:", error)
    return NextResponse.json({ error: "خطا در ثبت جلسه تمرینی." }, { status: 500 })
  }
}
