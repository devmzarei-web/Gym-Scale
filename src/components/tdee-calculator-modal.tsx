"use client"

import { useState } from "react"
import { Calculator, Flame, Scale, Activity, Check, Sparkles } from "lucide-react"
import { Modal } from "@/components/ui/modal"

interface TdeeCalculatorProps {
  initialAge?: number | null
  initialWeight?: number | null
  initialHeight?: number | null
}

export function TdeeCalculatorModal({
  initialAge,
  initialWeight,
  initialHeight,
}: TdeeCalculatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [age, setAge] = useState<string>(initialAge ? String(initialAge) : "25")
  const [weight, setWeight] = useState<string>(initialWeight ? String(initialWeight) : "75")
  const [height, setHeight] = useState<string>(initialHeight ? String(initialHeight) : "175")
  const [gender, setGender] = useState<"male" | "female">("male")
  const [activity, setActivity] = useState<string>("1.375") // Lightly active default

  const activityOptions = [
    { value: "1.2", label: "کم‌تحرک (کار پشت‌میزی، بدون ورزش)" },
    { value: "1.375", label: "فعالیت سبک (۱ تا ۳ روز ورزش در هفته)" },
    { value: "1.55", label: "فعالیت متوسط (۳ تا ۵ روز ورزش در هفته)" },
    { value: "1.725", label: "فعالیت زیاد (۶ تا ۷ روز ورزش سنگین)" },
    { value: "1.9", label: "فعالیت بسیار شدید (تمرین روزانه دو نوبته)" },
  ]

  // Calculations
  const numAge = Number(age) || 0
  const numWeight = Number(weight) || 0
  const numHeight = Number(height) || 0
  const numActivity = Number(activity) || 1.375

  // Mifflin-St Jeor Equation
  let bmr = 0
  if (numWeight > 0 && numHeight > 0 && numAge > 0) {
    if (gender === "male") {
      bmr = 10 * numWeight + 6.25 * numHeight - 5 * numAge + 5
    } else {
      bmr = 10 * numWeight + 6.25 * numHeight - 5 * numAge - 161
    }
  }

  const tdee = Math.round(bmr * numActivity)
  const weightLoss = Math.max(1200, Math.round(tdee - 500))
  const muscleGain = Math.round(tdee + 300)

  // Macros for Maintenance (40% Carb, 30% Protein, 30% Fat)
  const proteinGrams = Math.round((tdee * 0.3) / 4)
  const carbGrams = Math.round((tdee * 0.4) / 4)
  const fatGrams = Math.round((tdee * 0.3) / 9)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-2xs"
      >
        <Calculator className="h-4 w-4 text-emerald-600" />
        محاسبه‌گر TDEE و کالری
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="محاسبه‌گر نرخ متابولیسم و کالری روزانه (TDEE)"
        titleIcon={<Calculator className="h-5 w-5 text-emerald-600" />}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Inputs Section */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">جنسیت</label>
              <div className="flex rounded-lg border border-slate-200 p-0.5 bg-white text-xs">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`flex-1 py-1 rounded-md font-bold transition-all ${
                    gender === "male" ? "bg-emerald-600 text-white" : "text-slate-600"
                  }`}
                >
                  مرد
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`flex-1 py-1 rounded-md font-bold transition-all ${
                    gender === "female" ? "bg-emerald-600 text-white" : "text-slate-600"
                  }`}
                >
                  زن
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">سن (سال)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">وزن (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">قد (cm)</label>
              <input
                type="number"
                step="0.1"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Activity Level Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-600" />
              سطح فعالیت روزانه
            </label>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-hidden"
            >
              {activityOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Results Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-1 text-center shadow-sm">
              <span className="text-[11px] text-slate-400 font-semibold block">متابولیسم پایه (BMR)</span>
              <span className="text-2xl font-extrabold text-emerald-400">{Math.round(bmr)}</span>
              <span className="text-[10px] text-slate-400 block">کالری سوخت‌وساز پایه</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-600 text-white space-y-1 text-center shadow-md relative overflow-hidden">
              <Sparkles className="absolute top-2 left-2 h-4 w-4 text-emerald-300 opacity-60" />
              <span className="text-[11px] text-emerald-100 font-semibold block">کالری تثبیت (TDEE)</span>
              <span className="text-2xl font-extrabold text-white">{tdee}</span>
              <span className="text-[10px] text-emerald-200 block">مصرف کالری روزانه برای حفظ وزن</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500 text-white space-y-1 text-center shadow-sm">
              <span className="text-[11px] text-amber-100 font-semibold block">هدف چربی‌سوزی</span>
              <span className="text-2xl font-extrabold text-white">{weightLoss}</span>
              <span className="text-[10px] text-amber-100 block">کاهش حدود ۰.۵ کیلو در هفته</span>
            </div>
          </div>

          {/* Macro Breakdown */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-emerald-600" />
              توزیع درشت‌مغذی‌های پیشنهادی برای تثبیت وزن ({tdee} کالری):
            </h4>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block">پروتئین (۳۰٪)</span>
                <span className="text-sm font-extrabold text-emerald-700">{proteinGrams} گرم</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block">کربوهیدرات (۴۰٪)</span>
                <span className="text-sm font-extrabold text-teal-700">{carbGrams} گرم</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 block">چربی مفید (۳۰٪)</span>
                <span className="text-sm font-extrabold text-cyan-700">{fatGrams} گرم</span>
              </div>
            </div>
          </div>

          {/* Targets Breakdown */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-xs space-y-2 text-emerald-950">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Scale className="h-4 w-4 text-emerald-600" />
                کالری پیشنهادی برای افزایش حجم عضلانی:
              </span>
              <span className="font-extrabold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                {muscleGain} کالری
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
