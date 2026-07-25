"use client"

import { useState, useMemo } from "react"
import { Search, X, Flame, Utensils } from "lucide-react"

interface FoodBankListProps {
  initialFoods: any[]
}

export function FoodBankList({ initialFoods }: FoodBankListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")

  const categories = ["ALL", "پروتئینی", "کربوهیدرات", "سبزیجات", "میوه", "لبنیات", "چربی مفید", "مکمل / پروتئین", "غذاهای سنتی ایرانی"]


  const filteredFoods = useMemo(() => {
    return initialFoods.filter((f) => {
      const q = searchQuery.trim().toLowerCase().replace(/[\s\u200c]+/g, "")
      const nameNorm = f.name.toLowerCase().replace(/[\s\u200c]+/g, "")
      const catNorm = (f.category || "").toLowerCase().replace(/[\s\u200c]+/g, "")

      const matchesSearch = !q || nameNorm.includes(q) || catNorm.includes(q)
      const matchesCat = selectedCategory === "ALL" || f.category === selectedCategory
      return matchesSearch && matchesCat
    })
  }, [initialFoods, searchQuery, selectedCategory])

  return (
    <div className="space-y-6">
      {/* Search & Category Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام ماده غذایی (مثال: سینه مرغ، موز، جو دوسر)..."
            className="w-full pr-10 pl-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat === "ALL" ? `همه (${initialFoods.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Counter */}
      <div className="text-xs text-slate-500 px-1">
        نمایش <strong className="text-slate-900 font-bold">{filteredFoods.length}</strong> از {initialFoods.length} ماده غذایی
      </div>

      {/* Foods Grid */}
      {filteredFoods.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
          <Utensils className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">ماده غذایی با این مشخصات پیدا نشد</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFoods.map((food) => (
            <div
              key={food.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-amber-300 transition-all shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 font-heading">{food.name}</h3>
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5 block">
                    مبنای سنجش: {food.unitLabel}
                  </span>
                </div>

                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg shrink-0">
                  {food.category}
                </span>
              </div>

              {/* Macro Specs */}
              <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-center font-mono text-xs">
                <div>
                  <span className="block text-[9px] text-slate-400 font-sans">کالری</span>
                  <span className="font-extrabold text-amber-600 flex items-center justify-center gap-0.5">
                    <Flame className="h-3 w-3 text-amber-500 inline" />
                    {food.calories}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-sans">پروتئین</span>
                  <span className="font-bold text-emerald-700">{food.protein}g</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-sans">کربو</span>
                  <span className="font-bold text-blue-700">{food.carbs}g</span>
                </div>
                <div>
                  <span className="block text-[9px] text-slate-400 font-sans">چربی</span>
                  <span className="font-bold text-amber-700">{food.fats}g</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
