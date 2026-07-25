"use client"

import { useState } from "react"
import { Plus, X, Loader2, ChefHat } from "lucide-react"
import { createRecipe } from "@/app/actions/recipe"
import { toast } from "sonner"
import { DEFAULT_FOODS } from "@/lib/default-foods"

const categories = ["صبحانه", "ناهار/شام", "میان وعده", "پروتئینی", "دسر رژیمی"]

export function AddRecipeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [calories, setCalories] = useState("")
  const [protein, setProtein] = useState("")
  const [carbs, setCarbs] = useState("")
  const [fats, setFats] = useState("")
  const [ingredients, setIngredients] = useState("")


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await createRecipe(formData)
      setIsOpen(false)
    } catch (err: any) {
      toast.error(err.message || "خطا در ثبت دستورپخت")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
      >
        <Plus className="h-4 w-4" />
        افزودن دستورپخت
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <ChefHat className="h-5 w-5 text-teal-600" />
                ثبت دستورپخت جدید
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان وعده / غذا <span className="text-teal-600">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="مثال: اوتمیل پروتئینی موز و بادام"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    دسته‌بندی <span className="text-teal-600">*</span>
                  </label>
                  <select
                    name="category"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 transition-colors"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">زمان آماده‌سازی</label>
                  <input
                    type="text"
                    name="prepTime"
                    placeholder="مثال: 15 دقیقه"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 transition-colors"
                  />
                </div>
              </div>

              {/* Food Bank Auto Picker */}
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5">
                    🔍 انتخاب مواد اولیه از بانک غذا (محاسبه اتوماتیک)
                  </label>
                </div>
                <select
                  onChange={(e) => {
                    const foodName = e.target.value
                    if (!foodName) return
                    const food = DEFAULT_FOODS.find((f) => f.name === foodName)
                    if (!food) return

                    setIngredients((prev) => (prev ? `${prev}\n- ${food.name} (${food.unitLabel})` : `- ${food.name} (${food.unitLabel})`))
                    setCalories((prev) => (parseFloat(prev || "0") + food.calories).toString())
                    setProtein((prev) => (parseFloat(prev || "0") + food.protein).toFixed(1))
                    setCarbs((prev) => (parseFloat(prev || "0") + food.carbs).toFixed(1))
                    setFats((prev) => (parseFloat(prev || "0") + food.fats).toFixed(1))
                    e.target.value = ""
                  }}
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none"
                >
                  <option value="">-- کلیک کنید تا ماده غذایی انتخاب شود --</option>
                  {DEFAULT_FOODS.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name} ({f.calories} kcal | P: {f.protein}g)
                    </option>
                  ))}
                </select>
              </div>

              {/* Macros Grid */}
              <div className="grid grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">کالری (kcal)</label>
                  <input
                    type="number"
                    name="calories"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="350"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">پروتئین (گرم)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="protein"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="30"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-emerald-700 focus:outline-hidden focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">کربوهیدرات (گرم)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="carbs"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="45"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-blue-700 focus:outline-hidden focus:border-teal-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">چربی (گرم)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="fats"
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                    placeholder="8"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-amber-700 focus:outline-hidden focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مواد اولیه <span className="text-teal-600">*</span>
                </label>
                <textarea
                  name="ingredients"
                  required
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  rows={3}
                  placeholder="مثال:&#10;- 50 گرم جو پرک&#10;- 1 اسکوپ وی پروتئین&#10;- 150 میلی‌لیتر شیر کم‌چرب"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 transition-colors resize-none font-mono"
                />
              </div>


              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  دستور و مراحل تهیه <span className="text-teal-600">*</span>
                </label>
                <textarea
                  name="instructions"
                  required
                  rows={3}
                  placeholder="مراحل پخت و آماده‌سازی را وارد کنید..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  ثبت دستورپخت
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
