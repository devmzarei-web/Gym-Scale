"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Utensils, Save, ArrowRight, Loader2, Plus, Trash2 } from "lucide-react"
import { createDietPlan } from "@/app/actions/diet"

interface MealItem {
  id: string
  mealName: string
  foodDetails: string
}

export function DietBuilderForm({
  clients,
  initialClientId,
}: {
  clients: Array<{ id: string; name: string }>
  initialClientId?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [clientId, setClientId] = useState(initialClientId || "")
  const [isTemplate, setIsTemplate] = useState(!initialClientId)

  const [meals, setMeals] = useState<MealItem[]>([
    { id: "m-1", mealName: "صبحانه", foodDetails: "3 عدد تخم‌مرغ کامل آب‌پز + 50 گرم نان سنگک + 10 عدد بادام" },
    { id: "m-2", mealName: "میان وعده صبح", foodDetails: "1 عدد سیب + 1 اسکوپ وی پروتئین" },
    { id: "m-3", mealName: "ناهار", foodDetails: "200 گرم فیله مرغ گریل شده + 150 گرم کته کم‌روغن + سالاد فصل" },
    { id: "m-4", mealName: "میان وعده عصر (قبل تمرین)", foodDetails: "1 عدد موز + 1 قاشق غذاخوری کره بادام زمینی" },
    { id: "m-5", mealName: "شام", foodDetails: "150 گرم ماهی قزل‌آلا + سبزیجات بخارپز" },
  ])

  function handleAddMeal() {
    setMeals((prev) => [
      ...prev,
      { id: `m-${Date.now()}`, mealName: "وعده جدید", foodDetails: "" },
    ])
  }

  function handleRemoveMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id))
  }

  async function handleSave() {
    if (!title.trim()) {
      alert("لطفا عنوان برنامه تغذیه را وارد کنید.")
      return
    }

    const formattedContent = meals
      .map((m) => `<div style="margin-bottom:16px"><h3 style="font-weight:bold;font-size:14px;color:#0f172a;margin-bottom:4px">${m.mealName}</h3><p style="color:#475569;font-size:13px">${m.foodDetails}</p></div>`)
      .join("")

    setLoading(true)
    try {
      await createDietPlan({
        title,
        description,
        content: formattedContent,
        isTemplate,
        clientId: clientId || undefined,
      })

      if (clientId) {
        router.push(`/clients/${clientId}`)
      } else {
        router.push("/diets")
      }
    } catch (err: any) {
      alert(err.message || "خطا در ثبت برنامه تغذیه")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 font-heading flex items-center gap-2">
              <Utensils className="h-6 w-6 text-teal-600" />
              طراحی برنامه تغذیه جدید
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">تنظیم وعده‌های روزانه و جزئیات رژیم غذایی</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          ذخیره برنامه تغذیه
        </button>
      </div>

      {/* General Settings */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان برنامه تغذیه <span className="text-teal-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: رژیم چربی‌سوزی و حفظ عضله (های پروتئین)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">تخصیص به شاگرد (اختیاری)</label>
            <select
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value)
                if (e.target.value) setIsTemplate(false)
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 transition-colors"
            >
              <option value="">بدون تخصیص (قالب آماده)</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و دستورالعمل کلی رژیم</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="مثال: نوشیدن حداقل ۳ لیتر آب در روز، عدم استفاده از قندهای مصنوعی..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Meals Builder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 font-heading">وعده‌های غذایی برنامه</h2>
          <button
            onClick={handleAddMeal}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-teal-50 text-teal-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            افزودن وعده جدید
          </button>
        </div>

        <div className="space-y-4">
          {meals.map((m, idx) => (
            <div
              key={m.id}
              className="p-5 rounded-3xl bg-white border border-slate-200 space-y-3 shadow-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-7 w-7 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={m.mealName}
                    onChange={(e) =>
                      setMeals((prev) =>
                        prev.map((item) => (item.id === m.id ? { ...item, mealName: e.target.value } : item))
                      )
                    }
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-600"
                  />
                </div>

                {meals.length > 1 && (
                  <button
                    onClick={() => handleRemoveMeal(m.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div>
                <textarea
                  value={m.foodDetails}
                  onChange={(e) =>
                    setMeals((prev) =>
                      prev.map((item) => (item.id === m.id ? { ...item, foodDetails: e.target.value } : item))
                    )
                  }
                  rows={2}
                  placeholder="مواد غذایی و مقادیر مربوطه را وارد کنید..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
