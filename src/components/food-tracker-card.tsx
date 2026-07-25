"use client"

import { useState, useEffect } from "react"
import { Utensils, Plus, Search, Trash2, X, Flame, Scale, PieChart, Sparkles, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { DEFAULT_FOODS } from "@/lib/default-foods"

interface FoodTrackerCardProps {
  targetCalories?: number
  targetProtein?: number
  targetCarbs?: number
  targetFats?: number
}

export function FoodTrackerCard({
  targetCalories = 2200,
  targetProtein = 140,
  targetCarbs = 220,
  targetFats = 60,
}: FoodTrackerCardProps) {
  const getTodayStr = () => new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr())
  const [logs, setLogs] = useState<any[]>([])
  const [foodBank, setFoodBank] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("ALL")
  const [selectedFood, setSelectedFood] = useState<any>(null)
  const [portionAmount, setPortionAmount] = useState(1)
  const [mealType, setMealType] = useState<"BREAKFAST" | "LUNCH" | "DINNER" | "SNACK">("LUNCH")
  const [submitting, setSubmitting] = useState(false)

  // Custom Food state
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customCalories, setCustomCalories] = useState("")
  const [customProtein, setCustomProtein] = useState("")
  const [customCarbs, setCustomCarbs] = useState("")
  const [customFats, setCustomFats] = useState("")

  useEffect(() => {
    fetchFoodLogs(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    fetchFoodBank()
  }, [])

  async function fetchFoodLogs(dateStr: string = selectedDate) {

    setLoading(true)
    try {
      const res = await fetch(`/api/client/food-log?date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }


  async function fetchFoodBank() {
    try {
      const res = await fetch("/api/client/food-bank")
      if (res.ok) {
        const data = await res.json()
        if (data.foods && data.foods.length > 0) {
          setFoodBank(data.foods)
          return
        }
      }
    } catch (e) {
      console.error(e)
    }

    // Fallback default foods
    setFoodBank(DEFAULT_FOODS)
  }



  // Calculate totals
  const totalCalories = logs.reduce((acc, item) => acc + (item.calories || 0), 0)
  const totalProtein = logs.reduce((acc, item) => acc + (item.protein || 0), 0)
  const totalCarbs = logs.reduce((acc, item) => acc + (item.carbs || 0), 0)
  const totalFats = logs.reduce((acc, item) => acc + (item.fats || 0), 0)

  const calPercentage = Math.min(100, Math.round((totalCalories / targetCalories) * 100))

  const filteredFoods = foodBank.filter((f) => {
    const matchesSearch = !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "ALL" || f.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  async function handleAddFoodLog() {
    if (isCustomMode) {
      if (!customName.trim() || !customCalories) {
        toast.error("لطفاً نام غذا و میزان کالری را وارد کنید.")
        return
      }
    } else {
      if (!selectedFood) {
        toast.error("لطفاً یک غذا از لیست انتخاب کنید.")
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = isCustomMode
        ? {
            foodName: customName.trim(),
            mealType,
            amount: 1,
            unitLabel: "سفارشی",
            calories: parseFloat(customCalories),
            protein: customProtein ? parseFloat(customProtein) : 0,
            carbs: customCarbs ? parseFloat(customCarbs) : 0,
            fats: customFats ? parseFloat(customFats) : 0,
          }
        : {
            foodName: selectedFood.name,
            mealType,
            amount: portionAmount,
            unitLabel: selectedFood.unitLabel,
            calories: Math.round(selectedFood.calories * portionAmount),
            protein: Math.round(selectedFood.protein * portionAmount * 10) / 10,
            carbs: Math.round(selectedFood.carbs * portionAmount * 10) / 10,
            fats: Math.round(selectedFood.fats * portionAmount * 10) / 10,
          }

      const res = await fetch("/api/client/food-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success("غذا با موفقیت به کالری‌شمار امروز اضافه شد.")
        setIsAddModalOpen(false)
        resetForm()
        fetchFoodLogs()
      } else {
        toast.error("خطا در ثبت غذا.")
      }
    } catch (e) {
      console.error(e)
      toast.error("خطا در ارتباط با سرور.")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteLog(id: string) {
    try {
      const res = await fetch(`/api/client/food-log?id=${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success("غذا از لیست حذف شد.")
        setLogs((prev) => prev.filter((item) => item.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  function resetForm() {
    setSelectedFood(null)
    setPortionAmount(1)
    setIsCustomMode(false)
    setCustomName("")
    setCustomCalories("")
    setCustomProtein("")
    setCustomCarbs("")
    setCustomFats("")
  }

  const mealLabels: Record<string, string> = {
    BREAKFAST: "صبحانه",
    LUNCH: "ناهار",
    DINNER: "شام",
    SNACK: "میان‌وعده",
  }

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-amber-600">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 font-heading flex items-center gap-2">
              کالری‌شمار روزانه و بانک غذاها
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              ثبت میزان غذاهای مصرفی امروز و محاسبه خودکار کالری و درشت‌مغذی‌ها
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Date Selector Picker */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedDate(getTodayStr())}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                selectedDate === getTodayStr() ? "bg-white text-amber-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              امروز
            </button>

            <button
              onClick={() => {
                const y = new Date()
                y.setDate(y.getDate() - 1)
                setSelectedDate(y.toISOString().split("T")[0])
              }}
              className="px-2.5 py-1 rounded-xl font-bold text-slate-600 hover:text-slate-900 transition-all"
            >
              دیروز
            </button>

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            ثبت غذای جدید
          </button>
        </div>
      </div>


      {/* Calorie & Macro Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-slate-50 to-orange-50/40 border border-amber-100">
        {/* Total Calorie Bar */}
        <div className="md:col-span-1 space-y-2 border-b md:border-b-0 md:border-l border-slate-200 pb-3 md:pb-0 md:pl-4">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <Flame className="h-4 w-4 text-amber-500" />
            کل کالری دریافتی امروز:
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-amber-600 font-mono">
              {Math.round(totalCalories)}
            </span>

            <span className="text-xs text-slate-400 font-semibold">/ {targetCalories} kcal</span>
          </div>
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${calPercentage}%` }}
            />
          </div>
        </div>

        {/* Protein Progress */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            🍗 پروتئین:
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-emerald-700 font-mono">
              {totalProtein.toFixed(1)}g
            </span>
            <span className="text-[10px] text-slate-400">/ {targetProtein}g</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalProtein / targetProtein) * 100)}%` }}
            />
          </div>
        </div>

        {/* Carbs Progress */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            🌾 کربوهیدرات:
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-blue-700 font-mono">
              {totalCarbs.toFixed(1)}g
            </span>
            <span className="text-[10px] text-slate-400">/ {targetCarbs}g</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalCarbs / targetCarbs) * 100)}%` }}
            />
          </div>
        </div>

        {/* Fats Progress */}
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            🥑 چربی مفید:
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-amber-700 font-mono">
              {totalFats.toFixed(1)}g
            </span>
            <span className="text-[10px] text-slate-400">/ {targetFats}g</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (totalFats / targetFats) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's Logged Foods */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-800 font-heading">لیست غذاهای ثبت‌شده برای امروز ({logs.length})</h3>

        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500 mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
            <Utensils className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500">امروز هنوز غذایی ثبت نکرده‌اید.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              افزودن اولین وعده غذایی
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs transition-all hover:bg-white"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100/70 text-amber-800 font-bold text-[10px] shrink-0">
                    {mealLabels[item.mealType] || "وعده"}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 block">{item.foodName}</span>
                    <span className="text-[10px] text-slate-400">
                      مقدار: {item.amount} × {item.unitLabel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left font-mono">
                    <span className="font-extrabold text-amber-600 block">{item.calories} kcal</span>
                    <span className="text-[10px] text-slate-400">
                      P: {item.protein}g | C: {item.carbs}g | F: {item.fats}g
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteLog(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    title="حذف غذا"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Food Modal with Predefined Bank */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-100 space-y-5 text-right max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Utensils className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 font-heading">ثبت غذا در کالری‌شمار</h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  resetForm()
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Meal Type Picker */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">وعده غذایی:</label>
              <div className="grid grid-cols-4 gap-2">
                {(["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMealType(m)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                      mealType === m
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {mealLabels[m]}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Switcher: Predefined Bank vs Custom Food */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                  !isCustomMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                انتخاب از بانک غذاهای پیش‌فرض
              </button>
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                  isCustomMode ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                ثبت غذای دستی / سفارشی
              </button>
            </div>

            {!isCustomMode ? (
              <div className="space-y-4">
                {/* Search Input & Category Filters */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجوی نام غذا (مثال: سینه مرغ، موز، نان سنگک)..."
                      className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                    {["ALL", "پروتئینی", "کربوهیدرات", "میوه", "لبنیات", "چربی مفید"].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition-all ${
                          selectedCategory === cat
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {cat === "ALL" ? "همه دسته‌ها" : cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Predefined Food List */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                  {filteredFoods.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">غذایی یافت نشد.</p>
                  ) : (
                    filteredFoods.map((food) => {
                      const isSelected = selectedFood?.id === food.id
                      return (
                        <button
                          key={food.id}
                          type="button"
                          onClick={() => setSelectedFood(food)}
                          className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between text-xs ${
                            isSelected
                              ? "bg-amber-50 border-amber-400 text-amber-900 font-bold"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                          }`}
                        >
                          <div>
                            <span className="font-bold block">{food.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              هر {food.unitLabel} | {food.calories} کالری (P:{food.protein}g C:{food.carbs}g F:{food.fats}g)
                            </span>
                          </div>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />}
                        </button>
                      )
                    })
                  )}
                </div>

                {/* Selected Food Quantity Adjuster */}
                {selectedFood && (
                  <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">تعداد / ضریب مصرف:</span>
                      <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-amber-300">
                        <button
                          type="button"
                          onClick={() => setPortionAmount((prev) => Math.max(0.5, parseFloat((prev - 0.5).toFixed(1))))}
                          className="h-7 w-7 bg-slate-100 rounded-lg font-black text-slate-700 hover:bg-slate-200"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={portionAmount}
                          onChange={(e) => setPortionAmount(parseFloat(e.target.value) || 1)}
                          className="w-14 text-center font-bold text-amber-800 font-mono focus:outline-none text-xs"
                        />
                        <span className="font-bold text-amber-700 text-xs">x</span>
                        <button
                          type="button"
                          onClick={() => setPortionAmount((prev) => parseFloat((prev + 0.5).toFixed(1)))}
                          className="h-7 w-7 bg-slate-100 rounded-lg font-black text-slate-700 hover:bg-slate-200"
                        >
                          +
                        </button>
                      </div>
                    </div>


                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 text-xs">
                      <span className="text-slate-500">کالری کل محاسبه شده:</span>
                      <span className="font-extrabold text-amber-700 font-mono text-sm">
                        {Math.round(selectedFood.calories * portionAmount)} kcal
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Custom Food Inputs */
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">نام غذا:</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="مثال: ساندویچ فیله مرغ خانگی"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">میزان کالری (kcal):</label>
                    <input
                      type="number"
                      value={customCalories}
                      onChange={(e) => setCustomCalories(e.target.value)}
                      placeholder="350"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">پروتئین (گرم):</label>
                    <input
                      type="number"
                      value={customProtein}
                      onChange={(e) => setCustomProtein(e.target.value)}
                      placeholder="30"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">کربوهیدرات (گرم):</label>
                    <input
                      type="number"
                      value={customCarbs}
                      onChange={(e) => setCustomCarbs(e.target.value)}
                      placeholder="40"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">چربی (گرم):</label>
                    <input
                      type="number"
                      value={customFats}
                      onChange={(e) => setCustomFats(e.target.value)}
                      placeholder="8"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false)
                  resetForm()
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleAddFoodLog}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "افزودن به کالری‌شمار"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
