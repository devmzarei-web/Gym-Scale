import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    const routine = await (prisma as any).routine.findUnique({
      where: { id },
      include: {
        workoutDays: {
          orderBy: { order: "asc" },
          include: {
            exercises: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    })

    if (!routine) {
      return NextResponse.json({ error: "برنامه تمرینی یافت نشد." }, { status: 404 })
    }

    return NextResponse.json({ routine })
  } catch (error: any) {
    console.error("Fetch routine error:", error)
    return NextResponse.json({ error: "خطا در دریافت اطلاعات برنامه تمرینی." }, { status: 500 })
  }
}
