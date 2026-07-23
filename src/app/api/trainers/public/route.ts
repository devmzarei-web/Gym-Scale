import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const trainers = await prisma.trainer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        avatarUrl: true,
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ trainers })
  } catch (error: any) {
    console.error("Public Trainers Fetch Error:", error)
    return NextResponse.json({ error: "خطا در دریافت لیست مربیان." }, { status: 500 })
  }
}
