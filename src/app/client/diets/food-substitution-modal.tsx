"use client"

import { useState, useEffect, useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import { Search, Loader2, ArrowRightLeft, Sparkles, CheckCircle2, Filter } from "lucide-react"

export function FoodSubstitutionModal({ isOpen, onClose, row }: any) {
  const [foods, setFoods] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<string>("RECOMMENDED")

  useEffect(() => {
    if (isOpen && row) {
      if (foods.length === 0) {
        fetchFoods()
      }
      setSelectedGroup("RECOMMENDED")
      setSearch("")
    }
  }, [isOpen, row])

  async function fetchFoods() {
    setLoading(true)
    try {
      const res = await fetch("/api/client/food-bank")
      if (res.ok) {
        const data = await res.json()
        setFoods(data.foods || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Original item macros
  const origP = parseFloat(row?.protein || "0")
  const origC = parseFloat(row?.carbs || "0")
  const origF = parseFloat(row?.fats || "0")
  const origCal = parseFloat(row?.calories || "0")

  // Determine dominant macro category of original food
  const primaryCategory = useMemo(() => {
    if (!row) return "PROTEIN"
    const pCal = origP * 4
    const cCal = origC * 4
    const fCal = origF * 9

    const cat = (row.category || "").toLowerCase()
    if (cat.includes("سبزیجات") || cat.includes("میوه")) return "VEG_FRUIT"
    if (cat.includes("پروتئین") || cat.includes("گوشت") || cat.includes("لبنیات")) return "PROTEIN"
    if (cat.includes("کربوهیدرات") || cat.includes("غلات") || cat.includes("نان")) return "CARB"
    if (cat.includes("چربی") || cat.includes("روغن") || cat.includes("آجیل")) return "FAT"

    if (pCal >= cCal && pCal >= fCal) return "PROTEIN"
    if (cCal >= pCal && cCal >= fCal) return "CARB"
    if (fCal >= pCal && fCal >= cCal) return "FAT"
    return "PROTEIN"
  }, [row, origP, origC, origF])

  // Helper to categorize any food item from FoodBank
  function getFoodCategory(f: any) {
    const pCal = (f.protein || 0) * 4
    const cCal = (f.carbs || 0) * 4
    const fCal = (f.fats || 0) * 9
    const cat = (f.category || "").toLowerCase()

    if (cat.includes("سبزیجات") || cat.includes("میوه")) return "VEG_FRUIT"
    if (cat.includes("پروتئین") || cat.includes("گوشت") || cat.includes("لبنیات")) return "PROTEIN"
    if (cat.includes("کربوهیدرات") || cat.includes("غلات") || cat.includes("نان")) return "CARB"
    if (cat.includes("چربی") || cat.includes("روغن") || cat.includes("آجیل")) return "FAT"

    if (pCal >= cCal && pCal >= fCal) return "PROTEIN"
    if (cCal >= pCal && cCal >= fCal) return "CARB"
    return "FAT"
  }

  // Filter foods by selected tab & search
  const filteredFoods = useMemo(() => {
    return foods.filter((f) => {
      // Exclude same food item
      if (f.name.trim().toLowerCase() === (row?.name || "").trim().toLowerCase()) return false

      if (search && !f.name.includes(search)) return false

      const fCat = getFoodCategory(f)
      if (selectedGroup === "RECOMMENDED") {
        return fCat === primaryCategory
      }
      if (selectedGroup === "PROTEIN") return fCat === "PROTEIN"
      if (selectedGroup === "CARB") return fCat === "CARB"
      if (selectedGroup === "FAT") return fCat === "FAT"
      if (selectedGroup === "VEG_FRUIT") return fCat === "VEG_FRUIT"

      return true
    })
  }, [foods, search, selectedGroup, primaryCategory, row])

  // Calculate scaled quantity & equivalent macros
  function calculateEquivalent(targetFood: any) {
    if (origCal === 0 || !targetFood.calories || targetFood.calories === 0) {
      return {
        amountLabel: "مقدار نامشخص",
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
      }
    }

    const ratio = origCal / targetFood.calories
    const unit = targetFood.unitLabel || "100 گرم"

    let amountLabel = ""
    if (unit.includes("عدد") || unit.includes("پیمانه") || unit.includes("قاشق") || unit.includes("لیوان")) {
      const baseQty = parseFloat(unit) || 1
      let qty = (baseQty * ratio).toFixed(1)
      if (qty.endsWith(".0")) qty = qty.slice(0, -2)
      const unitText = unit.replace(/[0-9.]/g, "").trim()
      amountLabel = `${qty} ${unitText}`
    } else {
      const qty = Math.round(100 * ratio)
      amountLabel = `${qty} گرم`
    }

    return {
      amountLabel,
      calories: Math.round(origCal),
      protein: Math.round((targetFood.protein || 0) * ratio * 10) / 10,
      carbs: Math.round((targetFood.carbs || 0) * ratio * 10) / 10,
      fats: Math.round((targetFood.fats || 0) * ratio * 10) / 10,
    }
  }

  const categoryLabels: Record<string, string> = {
    PROTEIN: "پروتئینی",
    CARB: "کربوهیدراتی",
    FAT: "چربی سالم",
    VEG_FRUIT: "سبزیجات و میوه",
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="موتور جایگزین هوشمند غذایی"
      titleIcon={<ArrowRightLeft className="h-5 w-5 text-emerald-600" />}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5 text-right">
        {/* Original Food Item Card */}
        <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-white/15 px-3 py-1 rounded-full border border-white/20">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              ماده غذایی اصلی برنامه
            </span>
            <span className="text-xs font-extrabold bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-lg border border-emerald-400/30">
              گروه: {categoryLabels[primaryCategory] || "پروتئینی"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold font-heading">{row?.name}</h3>
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-xl">
              {row?.amount}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs pt-1 border-t border-white/10">
            <div className="bg-white/10 p-1.5 rounded-xl">
              <span className="block text-[10px] text-emerald-200">کالری</span>
              <strong className="font-extrabold">{Math.round(origCal)} kcal</strong>
            </div>
            <div className="bg-white/10 p-1.5 rounded-xl">
              <span className="block text-[10px] text-emerald-200">پروتئین</span>
              <strong className="font-extrabold">{origP}g</strong>
            </div>
            <div className="bg-white/10 p-1.5 rounded-xl">
              <span className="block text-[10px] text-emerald-200">کربوهیدرات</span>
              <strong className="font-extrabold">{origC}g</strong>
            </div>
            <div className="bg-white/10 p-1.5 rounded-xl">
              <span className="block text-[10px] text-emerald-200">چربی</span>
              <strong className="font-extrabold">{origF}g</strong>
            </div>
          </div>
        </div>

        {/* Category Tabs & Filter */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-emerald-600" />
              انتخاب جایگزین هم‌ارز:
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setSelectedGroup("RECOMMENDED")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedGroup === "RECOMMENDED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              🎯 هم‌گروه (توصیه شده)
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroup("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedGroup === "ALL"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              همه غذاها
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroup("PROTEIN")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedGroup === "PROTEIN"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              پروتئینی
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroup("CARB")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedGroup === "CARB"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              کربوهیدرات
            </button>
            <button
              type="button"
              onClick={() => setSelectedGroup("FAT")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedGroup === "FAT"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              چربی سالم
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="جستجوی نام جایگزین دلخواه (مثلاً: فیله بوقلمون، تخم مرغ...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
          />
        </div>

        {/* Equivalent Substitutes List */}
        <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-slate-400 gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-bold">در حال محاسبه هم‌ارزها...</span>
            </div>
          ) : filteredFoods.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              هیچ غذای جایگزینی در این دسته یافت نشد.
            </div>
          ) : (
            filteredFoods.map((f) => {
              const eq = calculateEquivalent(f)
              return (
                <div
                  key={f.id}
                  className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/30 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        {f.name}
                      </h4>
                    </div>

                    <div className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl text-xs font-extrabold">
                      مقدار جایگزین: {eq.amountLabel}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="font-semibold text-slate-600">
                      ارزش غذایی این مقدار جایگزین:
                    </span>
                    <div className="flex gap-2 font-bold">
                      <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        {eq.calories} kcal
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {eq.protein}g P
                      </span>
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                        {eq.carbs}g C
                      </span>
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                        {eq.fats}g F
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Modal>
  )
}
