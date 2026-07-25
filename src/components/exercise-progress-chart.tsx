"use client"

import {
  Activity,
  Flame,
  Dumbbell,
  Scale,
  HeartPulse,
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from "lucide-react"

interface WeightLog {
  id: string
  loggedAt: string
  weight?: number
  chest?: number
  waist?: number
  biceps?: number
  thigh?: number
}

interface ClientProfile {
  id?: string
  name?: string
  age?: number
  height?: number
  weight?: number
  gender?: string
  goals?: string
}

interface ExerciseProgressChartProps {
  logs: WeightLog[]
  clientProfile?: ClientProfile
}

// Convert English numbers to clean Persian digits
function toFa(n: number | string | undefined | null): string {
  if (n === undefined || n === null || n === "") return "-"
  return String(n)
    .replace(/0/g, "۰")
    .replace(/1/g, "۱")
    .replace(/2/g, "۲")
    .replace(/3/g, "۳")
    .replace(/4/g, "۴")
    .replace(/5/g, "۵")
    .replace(/6/g, "۶")
    .replace(/7/g, "۷")
    .replace(/8/g, "۸")
    .replace(/9/g, "۹")
}

function formatCal(n: number): string {
  return toFa(n.toLocaleString("en-US"))
}

export default function ExerciseProgressChart({ logs, clientProfile }: ExerciseProgressChartProps) {
  // Sort logs by date descending (latest first)
  const sortedLogs = [...(logs || [])].sort(
    (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
  )

  const latestLog = sortedLogs[0] || {}
  const initialLog = sortedLogs[sortedLogs.length - 1]

  // Read measurements directly from client profile & submitted logs (no hardcoded defaults)
  const rawWeight = latestLog.weight ?? clientProfile?.weight
  const rawHeight = clientProfile?.height
  const rawAge = clientProfile?.age
  const rawGender = clientProfile?.gender

  // Empty state if client profile and logs have no physical metrics at all
  if (!rawWeight && !rawHeight && !rawAge) {
    return (
      <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-sm space-y-3 text-center font-vazirmatn">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
          <Activity className="h-6 w-6" />
        </div>
        <div className="space-y-1 max-w-md mx-auto">
          <h3 className="text-sm font-extrabold text-slate-900 font-heading">
            تحلیل هوشمند آنتروپومتریک و آنالیز سلامتی
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            اطلاعات اولیه پرونده شما (وزن، قد یا سن) هنوز ثبت نشده است. لطفاً نخستین اندازه بدنی خود را در فرم زیر ثبت کنید تا محاسبات سلامت و متابولیسم شما بر اساس اطلاعات واقعی نمایش داده شود.
          </p>
        </div>
      </div>
    )
  }

  // Use real client values or fallback to non-zero values for mathematical safety
  const currentWeight = rawWeight || 70
  const initialWeight = initialLog?.weight || currentWeight
  const heightCm = rawHeight || 175
  const age = rawAge || 25
  const isFemale = rawGender?.toUpperCase() === "FEMALE" || rawGender === "زن"
  const genderText = isFemale ? "زن" : "مرد"

  const heightM = heightCm / 100

  // 1. BMI Calculation
  const bmi = Math.round((currentWeight / (heightM * heightM)) * 10) / 10

  let bmiStatus = { text: "نرمال و ایده‌آل", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
  if (bmi < 18.5) {
    bmiStatus = { text: "کمبود وزن", color: "bg-blue-50 text-blue-700 border-blue-200" }
  } else if (bmi >= 25 && bmi < 30) {
    bmiStatus = { text: "اضافه وزن خفیف", color: "bg-amber-50 text-amber-700 border-amber-200" }
  } else if (bmi >= 30) {
    bmiStatus = { text: "چاقی (نیازمند اصلاح)", color: "bg-rose-50 text-rose-700 border-rose-200" }
  }

  // Ideal weight range for height (BMI 18.5 - 24.9)
  const minIdealW = Math.round(18.5 * heightM * heightM * 10) / 10
  const maxIdealW = Math.round(24.9 * heightM * heightM * 10) / 10

  // 2. BMR Calculation (Mifflin-St Jeor Equation based on Gender)
  const bmr = isFemale
    ? Math.round(10 * currentWeight + 6.25 * heightCm - 5 * age - 161)
    : Math.round(10 * currentWeight + 6.25 * heightCm - 5 * age + 5)

  // 3. TDEE Calculation (Total Daily Energy Expenditure)
  const tdee = Math.round(bmr * 1.45)
  const fatLossCal = Math.round(tdee - 450)

  // 4. Estimated Body Fat % & Lean Body Mass (Deurenberg Formula based on Gender)
  const rawBfPct = isFemale
    ? 1.2 * bmi + 0.23 * age - 5.4
    : 1.2 * bmi + 0.23 * age - 16.2

  const estimatedBodyFatPct = Math.max(5, Math.min(45, Math.round(rawBfPct)))
  const fatMassKg = Math.round(((currentWeight * estimatedBodyFatPct) / 100) * 10) / 10
  const leanMassKg = Math.round((currentWeight - fatMassKg) * 10) / 10

  // 5. Waist-to-Height Ratio (WtHR) & V-Taper Index from Submitted Measurements
  const waistCm = latestLog.waist
  const chestCm = latestLog.chest
  const wthr = waistCm ? Math.round((waistCm / heightCm) * 100) / 100 : null

  let wthrStatus = { text: "سالم و متناسب", color: "text-emerald-600" }
  if (wthr && wthr >= 0.5) {
    wthrStatus = { text: "خطر چاقی احشایی شکمی", color: "text-amber-600" }
  }

  const vTaperIndex = chestCm && waistCm ? Math.round((chestCm / waistCm) * 100) / 100 : null

  // Net Weight Change from Progress Logs
  const weightDiff = Math.round((currentWeight - initialWeight) * 10) / 10

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 font-vazirmatn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" />
            تحلیل هوشمند آنتروپومتریک و شاخص‌های سلامت بدن
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-vazirmatn">
            محاسبات خودکار بر اساس اطلاعات واقعی پرونده و آخرین اندازه‌گیری‌های ثبت‌شده شما
          </p>
        </div>

        {weightDiff !== 0 && (
          <div
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${
              weightDiff < 0
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-blue-50 text-blue-800 border border-blue-200"
            }`}
          >
            {weightDiff < 0 ? (
              <TrendingDown className="h-4 w-4 text-emerald-600" />
            ) : (
              <TrendingUp className="h-4 w-4 text-blue-600" />
            )}
            <span>تغییر کل وزن:</span>
            <span className="font-extrabold dir-rtl">
              {toFa(Math.abs(weightDiff))} کیلوگرم {weightDiff < 0 ? "کاهش" : "افزایش"}
            </span>
          </div>
        )}
      </div>

      {/* Client Registered Profile Metadata Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-vazirmatn">
        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold block">متقاضی</span>
          <span className="font-extrabold text-slate-800 truncate block">
            {clientProfile?.name || "ورزشکار"}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold block">جنسیت و سن پرونده</span>
          <span className="font-extrabold text-slate-800 block">
            {genderText} • {rawAge ? `${toFa(rawAge)} سال` : "ثبت‌نشده"}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold block">قد ثبت‌شده پرونده</span>
          <span className="font-extrabold text-slate-800 block">
            {rawHeight ? `${toFa(rawHeight)} سانتی‌متر` : "ثبت‌نشده"}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold block">وزن آخرین ثبت پیشرفت</span>
          <span className="font-extrabold text-emerald-700 block">
            {rawWeight ? `${toFa(rawWeight)} کیلوگرم` : "ثبت‌نشده"}
          </span>
        </div>

        <div className="space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold block">تعداد ثبت‌های پیشرفت</span>
          <span className="font-extrabold text-slate-800 block">{toFa(logs?.length || 0)} رکورد ثبت‌شده</span>
        </div>
      </div>

      {/* Main Physiological & Metabolism Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-vazirmatn">
        {/* Card 1: BMI & Ideal Weight Range */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">شاخص توده بدنی (BMI)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">{toFa(bmi)}</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${bmiStatus.color}`}>
                    {bmiStatus.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* BMI Progress Bar Scale */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>{toFa(18.5)} (کمبود)</span>
              <span>{toFa(25.0)} (ایده‌آل)</span>
              <span>{toFa(30.0)} (اضافه وزن)</span>
            </div>
            <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden flex">
              <div className="h-full w-[25%] bg-blue-400" />
              <div className="h-full w-[35%] bg-emerald-500" />
              <div className="h-full w-[25%] bg-amber-400" />
              <div className="h-full w-[15%] bg-rose-500" />
            </div>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
            <span className="text-slate-500 text-[11px] font-bold">محدوده وزن استاندارد قد شما ({toFa(heightCm)}cm):</span>
            <span className="font-extrabold text-emerald-700">
              {toFa(minIdealW)} تا {toFa(maxIdealW)} کیلوگرم
            </span>
          </div>
        </div>

        {/* Card 2: BMR & Daily TDEE Metabolism Engine */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">نرخ متابولیسم و کالری روزانه</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900">
                  {formatCal(tdee)}
                </span>
                <span className="text-xs font-semibold text-slate-500">کیلوکالری در روز</span>
              </div>
            </div>
          </div>

          {/* BMR vs TDEE Comparison */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-white rounded-2xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">سوخت‌وساز پایه (BMR)</span>
              <span className="font-black text-slate-800 text-sm block">{formatCal(bmr)} کیلوکالری</span>
              <span className="block text-[9px] text-slate-400 mt-0.5">سوخت‌وساز در استراحت مطلق</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">کل انرژی با تمرین (TDEE)</span>
              <span className="font-black text-amber-700 text-sm block">{formatCal(tdee)} کیلوکالری</span>
              <span className="block text-[9px] text-slate-400 mt-0.5">مصرف انرژی روزانه با تمرین</span>
            </div>
          </div>

          {/* Goal Targets */}
          <div className="flex items-center justify-between text-[11px] bg-amber-500/10 p-2.5 rounded-2xl border border-amber-200/60">
            <span className="font-bold text-amber-900">کالری پیشنهادی چربی‌سوزی:</span>
            <span className="font-black text-amber-800">{formatCal(fatLossCal)} کیلوکالری</span>
          </div>
        </div>

        {/* Card 3: Lean Muscle & Fat Mass Breakdown */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">ترکیب بدنی (عضله در برابر چربی)</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black text-slate-900">{toFa(estimatedBodyFatPct)}٪</span>
                <span className="text-xs font-bold text-slate-500">درصد چربی بدنی تخمینی</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-white rounded-2xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">جرم خالص عضلانی (LBM)</span>
              <span className="font-black text-emerald-700 text-base block">{toFa(leanMassKg)} کیلوگرم</span>
              <span className="block text-[9px] text-slate-400 mt-0.5">عضله، استخوان و مایعات</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">کل جرم چربی (Fat Mass)</span>
              <span className="font-black text-rose-600 text-base block">{toFa(fatMassKg)} کیلوگرم</span>
              <span className="block text-[9px] text-slate-400 mt-0.5">بافت چربی ذخیره</span>
            </div>
          </div>
        </div>

        {/* Card 4: Waist-to-Height Ratio & Physical Symmetry from Progress Logs */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-teal-100 text-teal-700">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">شاخص‌های تناسب از اندازه‌های جدید</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-slate-900">
                  {wthr ? toFa(wthr) : "-"}
                </span>
                <span className={`text-xs font-bold ${wthrStatus.color}`}>
                  {wthr ? wthrStatus.text : "نیاز به ثبت دور کمر"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-white rounded-2xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">نسبت دور کمر به قد (WtHR)</span>
              <span className="font-extrabold text-slate-800 block">
                {wthr ? toFa(wthr) : "-"}
              </span>
              <span className="block text-[9px] text-slate-400 mt-0.5">حد سلامت: کمتر از ۰.۵۰</span>
            </div>

            <div className="p-3 bg-white rounded-2xl border border-slate-200">
              <span className="block text-[10px] text-slate-400 font-bold mb-0.5">شاخص V-Taper (سینه به کمر)</span>
              <span className="font-extrabold text-teal-700 block">
                {vTaperIndex ? toFa(vTaperIndex) : "-"}
              </span>
              <span className="block text-[9px] text-slate-400 mt-0.5">ایده‌آل فیزیک: بیش از ۱.۲۰</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
