import Link from "next/link"
import { Utensils, Search, Flame, Scale, Plus, ArrowRight } from "lucide-react"
import prisma from "@/lib/prisma"
import { AddFoodItemModal } from "@/app/food-bank/add-food-item-modal"
import { FoodBankList } from "@/app/food-bank/food-bank-list"


import { DEFAULT_FOODS } from "@/lib/default-foods"

export const revalidate = 0

export default async function FoodBankPage() {
  let dbFoods: any[] = []
  if ((prisma as any).foodDictionary) {
    try {
      dbFoods = await (prisma as any).foodDictionary.findMany({
        orderBy: { name: "asc" },
      })
    } catch (e) {
      console.error(e)
    }
  }

  // Combine DB foods with DEFAULT_FOODS so new items in DEFAULT_FOODS are never missing
  const dbFoodNames = new Set(dbFoods.map((f: any) => f.name.toLowerCase().trim()))
  const missingDefaults = DEFAULT_FOODS.filter((f) => !dbFoodNames.has(f.name.toLowerCase().trim()))

  if (missingDefaults.length > 0 && (prisma as any).foodDictionary) {
    try {
      await (prisma as any).foodDictionary.createMany({
        data: missingDefaults,
        skipDuplicates: true,
      })
      dbFoods = await (prisma as any).foodDictionary.findMany({
        orderBy: { name: "asc" },
      })
    } catch (e) {
      console.error("Error seeding missing default foods:", e)
    }
  }

  const foods = dbFoods.length > 0 ? dbFoods : DEFAULT_FOODS




  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
            <Utensils className="h-7 w-7 text-amber-500" />
            بانک جامع مواد غذایی و ارزش تغذیه‌ای
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده کالری، درشت‌مغذی‌ها (پروتئین، کربوهیدرات، چربی) و افزودن مواد غذایی جدید برای استفاده در رژیم‌ها
          </p>
        </div>

        <AddFoodItemModal />
      </div>

      {/* Interactive Food List Client Component */}
      <FoodBankList initialFoods={foods} />
    </div>
  )
}
