import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    const foods = await prisma.foodDictionary.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json({ foods })
  } catch (error: any) {
    console.error("Food bank error:", error)
    return NextResponse.json({ error: "خطا در دریافت بانک غذا." }, { status: 500 })
  }
}
