import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

import { DEFAULT_FOODS } from "@/lib/default-foods"


export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "غیرمجاز" }, { status: 401 })
    }

    let dbFoods = await (prisma as any).foodDictionary.findMany({
      orderBy: { name: "asc" },
    })

    const dbFoodNames = new Set(dbFoods.map((f: any) => f.name.toLowerCase().trim()))
    const missingDefaults = DEFAULT_FOODS.filter((f) => !dbFoodNames.has(f.name.toLowerCase().trim()))

    if (missingDefaults.length > 0) {
      await (prisma as any).foodDictionary.createMany({
        data: missingDefaults,
        skipDuplicates: true,
      })
      dbFoods = await (prisma as any).foodDictionary.findMany({
        orderBy: { name: "asc" },
      })
    }

    const foods = dbFoods.length > 0 ? dbFoods : DEFAULT_FOODS



    return NextResponse.json({ foods })
  } catch (error: any) {
    console.error("Food bank error:", error)
    return NextResponse.json({ foods: DEFAULT_FOODS })
  }
}
