"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Utensils, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function AddFoodItemModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [category, setCategory] = useState("پروتئینی")
  const [unitLabel, setUnitLabel] = useState("100 گرم")
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fats, setFats] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !calories) {
      toast.error("لطفاً نام ماده غذایی و میزان کالری را وارد کنید.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/food-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          category,
          unitLabel,
          calories: parseFloat(calories),
          protein: protein ? parseFloat(protein) : 0,
          carbs: carbs ? parseFloat(carbs) : 0,
          fats: fats ? parseFloat(fats) : 0,
        }),
      })

      if (res.ok) {
        toast.success("ماده غذایی جدید با موفقیت اضافه شد.")
        setIsOpen(false)
        resetForm()
        router.refresh()
      } else {
        const data = await res.json()
        toast.error(data.error || "خطا در ثبت ماده غذایی.")
      }
    } catch (e) {
      console.error(e)
      toast.error("خطا در ارتباط با سرور.")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setName("")
    setCategory("پروتئینی")
    setUnitLabel("100 گرم")
    setCalories("")
    setProtein("")
    setCarbs("")
    setFats("")
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0"
      >
        <Plus className="h-4 w-4" />
        افزودن ماده غذایی جدید
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Utensils className="h-5 w-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 font-heading">ثبت ماده غذایی جدید</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نام ماده غذایی:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: فیله مرغ گریل، موز، نان سنگک..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">دسته‌بندی:</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
                  >
                    <option value="پروتئینی">پروتئینی</option>
                    <option value="کربوهیدرات">کربوهیدرات</option>
                    <option value="میوه">میوه</option>
                    <option value="لبنیات">لبنیات</option>
                    <option value="چربی مفید">چربی مفید</option>
                    <option value="مکمل / پروتئین">مکمل / پروتئین</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">مبنای واحد سنجش:</label>
                  <input
                    type="text"
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    placeholder="مثال: 100 گرم، 1 عدد"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">کالری (kcal):</label>
                  <input
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="165"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">پروتئین (گرم):</label>
                  <input
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="31"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">کربوهیدرات (گرم):</label>
                  <input
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">چربی (گرم):</label>
                  <input
                    type="number"
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                    placeholder="3.6"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "ذخیره در بانک غذا"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
