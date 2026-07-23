import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const rawTrainers = await prisma.trainer.findMany({
      where: {
        role: { not: "SUPER_ADMIN" },
        isApproved: true,
      },
      select: {
        id: true,
        name: true,
        bio: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
    })

    const trainers = rawTrainers.map((t: any) => ({
      id: t.id,
      name: t.name,
      bio: t.bio,
      avatarUrl: t.avatarUrl,
      trainerCode: `NT-${t.id.slice(-4).toUpperCase()}`,
    }))

    return NextResponse.json({ trainers })
  } catch (error: any) {
    console.error("Public Trainers Fetch Error:", error)
    return NextResponse.json({ error: "خطا در دریافت لیست مربیان." }, { status: 500 })
  }
}
