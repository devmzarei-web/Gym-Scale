import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    const currentUserId = session?.user?.id
    const currentUserRole = (session?.user as any)?.role

    if (!currentUserId) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const targetClientId = searchParams.get("clientId") || currentUserId

    // If fetching for another client, ensure current user is TRAINER or SUPER_ADMIN
    if (targetClientId !== currentUserId && currentUserRole === "CLIENT") {
      return NextResponse.json({ error: "دسترسی غیرمجاز" }, { status: 403 })
    }

    const workoutLogs = await prisma.workoutSessionLog.findMany({
      where: { clientId: targetClientId },
      orderBy: { completedAt: "desc" },
    })

    return NextResponse.json({ workoutLogs })
  } catch (error: any) {
    console.error("Fetch workout history error:", error)
    return NextResponse.json({ error: "خطا در دریافت تاریخچه تمرینات." }, { status: 500 })
  }
}
