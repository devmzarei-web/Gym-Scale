import { ChefHat, Clock } from "lucide-react"
import prisma from "@/lib/prisma"
import { AddRecipeModal } from "./add-recipe-modal"
import { RecipeCardActions } from "./recipe-card-actions"

export const revalidate = 0

interface RecipesPageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function RecipesPage({ searchParams }: RecipesPageProps) {
  const { category } = await searchParams

  const whereClause: any = {}
  if (category && category !== "همه") {
    whereClause.category = category
  }

  const recipes = await prisma.recipe.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  })

  const categories = ["همه", "صبحانه", "ناهار/شام", "میان وعده", "پروتئینی", "دسر رژیمی"]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
            <ChefHat className="h-7 w-7 text-teal-600" />
            بانک دستورپخت رژیمی
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مجموعه غنی از غذاها و وعده‌های ورزشی همراه با ارزش غذایی دقیق
          </p>
        </div>

        <AddRecipeModal />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2">
        {categories.map((cat) => {
          const isActive = (!category && cat === "همه") || category === cat

          return (
            <a
              key={cat}
              href={cat === "همه" ? "/recipes" : `/recipes?category=${encodeURIComponent(cat)}`}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat}
            </a>
          )
        })}
      </div>

      {/* Recipe Cards */}
      {recipes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3 shadow-xs">
          <ChefHat className="mx-auto h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">دستورپختی در این دسته‌بندی یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((r: any) => (
            <div
              key={r.id}
              className="group flex flex-col justify-between p-5 rounded-3xl bg-white border border-slate-200 hover:border-teal-300 transition-all space-y-4 shadow-xs hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-700 transition-colors">
                    {r.title}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                      {r.category}
                    </span>
                    <RecipeCardActions recipe={r} />
                  </div>
                </div>

                {r.prepTime && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    آماده‌سازی: {r.prepTime}
                  </span>
                )}

                {/* Macros Badges */}
                <div className="grid grid-cols-4 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div>
                    <span className="block text-[9px] text-slate-400">کالری</span>
                    <span className="text-xs font-bold text-amber-600">{r.calories ?? "-"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400">پروتئین</span>
                    <span className="text-xs font-bold text-emerald-700">{r.protein ? `${r.protein}g` : "-"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400">کربوهیدرات</span>
                    <span className="text-xs font-bold text-sky-700">{r.carbs ? `${r.carbs}g` : "-"}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400">چربی</span>
                    <span className="text-xs font-bold text-rose-700">{r.fats ? `${r.fats}g` : "-"}</span>
                  </div>
                </div>

                {/* Ingredients snippet */}
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-700 block text-[11px]">مواد اولیه:</span>
                  <p className="text-slate-600 whitespace-pre-line line-clamp-3 text-[11px]">
                    {r.ingredients}
                  </p>
                </div>
              </div>

              {/* Instructions */}
              <div className="pt-3 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-700 block text-[11px] mb-1">دستور تهیه:</span>
                <p className="text-slate-600 whitespace-pre-line line-clamp-3 text-[11px] leading-relaxed">
                  {r.instructions}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
