"use client"

import { useState, useMemo, useEffect } from "react"

import { useRouter } from "next/navigation"
import {
  Utensils,
  Save,
  ArrowRight,
  Loader2,
  Plus,
  Trash2,
  Palette,
  Table as TableIcon,
  FileText,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Pill,
  ShieldAlert,
  Apple,
  Search,
  X,
  Calculator,
  Flame,
  Activity,
  Dumbbell,
} from "lucide-react"

import { createDietPlan, updateDietPlan } from "@/app/actions/diet"
import { toast } from "sonner"
import { DEFAULT_FOODS, getFoodUnitConfig } from "@/lib/default-foods"



export type HeaderColor = "emerald" | "teal" | "blue" | "amber" | "purple" | "rose" | "indigo"

export interface FoodRow {
  id: string
  name: string
  amount: string
  note: string
  calories?: number
  protein?: number
  carbs?: number
  fats?: number
}

export interface MealSection {
  id: string
  mealName: string
  headerColor: HeaderColor
  mode: "table" | "text"
  rows: FoodRow[]
  textNotes?: string
}


const COLOR_MAP: Record<HeaderColor, { bg: string; text: string; border: string; hexBg: string; hexText: string }> = {
  emerald: { bg: "bg-emerald-600", text: "text-emerald-700", border: "border-emerald-200", hexBg: "#059669", hexText: "#ffffff" },
  teal: { bg: "bg-teal-600", text: "text-teal-700", border: "border-teal-200", hexBg: "#0d9488", hexText: "#ffffff" },
  blue: { bg: "bg-blue-600", text: "text-blue-700", border: "border-blue-200", hexBg: "#2563eb", hexText: "#ffffff" },
  amber: { bg: "bg-amber-600", text: "text-amber-700", border: "border-amber-200", hexBg: "#d97706", hexText: "#ffffff" },
  purple: { bg: "bg-purple-600", text: "text-purple-700", border: "border-purple-200", hexBg: "#9333ea", hexText: "#ffffff" },
  rose: { bg: "bg-rose-600", text: "text-rose-700", border: "border-rose-200", hexBg: "#e11d48", hexText: "#ffffff" },
  indigo: { bg: "bg-indigo-600", text: "text-indigo-700", border: "border-indigo-200", hexBg: "#4f46e5", hexText: "#ffffff" },
}

export function DietBuilderForm({
  clients,
  initialClientId,
  existingDiet,
}: {
  clients: Array<{
    id: string
    name: string
    age?: number | null
    weight?: number | null
    height?: number | null
    goals?: string | null
  }>
  initialClientId?: string
  existingDiet?: any
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(existingDiet?.title || "")
  const [description, setDescription] = useState(existingDiet?.description || "")
  const [clientId, setClientId] = useState(
    initialClientId || existingDiet?.history?.[0]?.clientId || ""
  )
  const [isTemplate, setIsTemplate] = useState(
    existingDiet ? existingDiet.isTemplate : !initialClientId
  )
  const [builderMode, setBuilderMode] = useState<"standard" | "macro">("standard")
  const [targetCalories, setTargetCalories] = useState("2200")
  const [targetProtein, setTargetProtein] = useState("140")
  const [targetCarbs, setTargetCarbs] = useState("220")
  const [targetFats, setTargetFats] = useState("60")

  // Scientific Calculator State
  const [showBmrCalc, setShowBmrCalc] = useState(false)
  const [calcGender, setCalcGender] = useState<"male" | "female">("male")

  const [calcAge, setCalcAge] = useState("25")
  const [calcWeight, setCalcWeight] = useState("75")
  const [calcHeight, setCalcHeight] = useState("175")
  const [calcActivity, setCalcActivity] = useState("1.375") // Light activity
  const [calcGoal, setCalcGoal] = useState("FAT_LOSS_MODERATE") // -15%
  const [aiGenerating, setAiGenerating] = useState(false)
  const [aiStatus, setAiStatus] = useState<{ provider: string; model: string; isSimulated: boolean; elapsedMs: number } | null>(null)

  // AI Diet Generator Handler (Calls GapGPT API / Backend Route)
  async function handleGenerateAiDiet() {
    setAiGenerating(true)
    try {
      const res = await fetch("/api/ai/generate-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCalories,
          targetProtein,
          targetCarbs,
          targetFats,
          goal: calcGoal,
          notes: description || "رژیم کاربردی با غذاهای ایرانی",
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.sections && data.sections.length > 0) {
          setSections(data.sections)
          setAiStatus({
            provider: data.provider || "GapGPT AI",
            model: data.aiModel || "gpt-4o-mini",
            isSimulated: Boolean(data.isSimulated),
            elapsedMs: data.elapsedMs || 0,
          })

          if (data.isSimulated) {
            toast.info("رژیم علمی با الگوریتم هوشمند تولید شد")
          } else {
            toast.success(`✨ پاسخ زنده از ${data.provider} (${data.aiModel}) در ${((data.elapsedMs || 1000) / 1000).toFixed(1)} ثانیه دریافت شد!`)
          }
        }
      } else {
        toast.error("خطا در ارتباط با سرویس هوش مصنوعی.")
      }
    } catch (e) {
      console.error(e)
      toast.error("خطا در تولید رژیم هوش مصنوعی.")
    } finally {
      setAiGenerating(false)
    }
  }






  // Sync client stats when client is selected
  useEffect(() => {
    if (!clientId) return
    const client = clients.find((c) => c.id === clientId)
    if (client) {
      setCalcAge(client.age ? client.age.toString() : "")
      setCalcWeight(client.weight ? client.weight.toString() : "")
      setCalcHeight(client.height ? client.height.toString() : "")
      
      if (client.goals) {
        const g = client.goals.toLowerCase()
        if (g.includes("شدید") || g.includes("سریع") || g.includes("کاهش شدید")) setCalcGoal("FAT_LOSS_AGGRESSIVE")
        else if (g.includes("عضله") || g.includes("حجم") || g.includes("افزایش")) setCalcGoal("MUSCLE_GAIN")
        else if (g.includes("تثبیت") || g.includes("سلامت")) setCalcGoal("MAINTENANCE")
        else setCalcGoal("FAT_LOSS_MODERATE")
      } else {
        setCalcGoal("FAT_LOSS_MODERATE")
      }
    }
  }, [clientId, clients])

  // Compute Scientific BMR & TDEE & Target Macros (Mifflin-St Jeor Formula)
  const scientificCalc = useMemo(() => {
    const age = parseFloat(calcAge) || 25
    const weight = parseFloat(calcWeight) || 75
    const height = parseFloat(calcHeight) || 175
    const act = parseFloat(calcActivity) || 1.375

    const bmr =
      calcGender === "male"
        ? 10 * weight + 6.25 * height - 5 * age + 5
        : 10 * weight + 6.25 * height - 5 * age - 161

    const tdee = bmr * act

    let goalMult = 0.85
    if (calcGoal === "FAT_LOSS_AGGRESSIVE") goalMult = 0.75
    if (calcGoal === "FAT_LOSS_MODERATE") goalMult = 0.85
    if (calcGoal === "MAINTENANCE") goalMult = 1.0
    if (calcGoal === "MUSCLE_GAIN") goalMult = 1.15

    const targetCal = Math.round(tdee * goalMult)

    // Scientific Macro Split
    const proteinG = Math.round(weight * 2.0)
    const fatG = Math.round((targetCal * 0.25) / 9)
    const carbG = Math.round((targetCal - proteinG * 4 - fatG * 9) / 4)

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      targetCal,
      proteinG,
      carbG,
      fatG,
    }
  }, [calcGender, calcAge, calcWeight, calcHeight, calcActivity, calcGoal])

  function handleApplyScientificMacros() {
    setTargetCalories(scientificCalc.targetCal.toString())
    setTargetProtein(scientificCalc.proteinG.toString())
    setTargetCarbs(scientificCalc.carbG.toString())
    setTargetFats(scientificCalc.fatG.toString())
    setBuilderMode("macro")
    setShowBmrCalc(false)
    toast.success(`محاسبات علمی (${scientificCalc.targetCal} کالری) بر روی اهداف رژیم اعمال شد!`)
  }

  // Smart Auto Fill Macro Diet Generator (Scaled to Exact Target Calories)
  function handleSmartAutoFillMacroDiet() {
    const tCal = parseFloat(targetCalories) || 2200
    const ratio = Math.max(0.4, tCal / 2060)

    const S = (baseQty: number, unitName: string, cal: number, p: number, c: number, f: number) => {
      const q = Math.round(baseQty * ratio * 10) / 10
      return {
        amount: `${q} ${unitName}`,
        calories: Math.round(cal * ratio),
        protein: Math.round(p * ratio * 10) / 10,
        carbs: Math.round(c * ratio * 10) / 10,
        fats: Math.round(f * ratio * 10) / 10,
      }
    }

    const o = S(50, "گرم", 190, 6.5, 33, 3.5)
    const e = S(4, "عدد", 68, 14.4, 0.8, 0.4)
    const b = S(1, "عدد", 105, 1.3, 27, 0.3)
    const pb = S(16, "گرم", 95, 4, 3, 8)

    const ch = S(180, "گرم پخته", 297, 55.8, 0, 6.5)
    const r = S(200, "گرم پخته", 260, 5.4, 56, 0.6)
    const sal = S(1, "بشقاب", 137, 1, 4, 13.5)

    const w = S(30, "گرم", 120, 24, 2, 1.5)
    const d = S(1, "عدد", 77, 0.4, 21, 0.2)
    const n = S(20, "گرم", 130, 3, 2.7, 12.6)

    const fi = S(150, "گرم", 309, 33, 0, 19.5)
    const po = S(250, "گرم", 217, 4.7, 50, 0.25)
    const veg = S(150, "گرم", 57, 5.5, 10.3, 0.7)

    const autoSections: MealSection[] = [
      {
        id: "m1",
        mealName: "وعده ۱: صبحانه انرژی‌بخش",
        headerColor: "amber",
        mode: "table",
        rows: [
          { id: "r1", name: "جو دوسر پرک (Oats)", amount: o.amount, note: "پخته با آب یا شیر کم‌چرب", calories: o.calories, protein: o.protein, carbs: o.carbs, fats: o.fats },
          { id: "r2", name: "سفیده تخم‌مرغ (آب‌پز)", amount: e.amount, note: "سفیده کامل بدون زردی", calories: e.calories, protein: e.protein, carbs: e.carbs, fats: e.fats },
          { id: "r3", name: "موز تازه", amount: b.amount, note: "همراه با اوتمیل", calories: b.calories, protein: b.protein, carbs: b.carbs, fats: b.fats },
          { id: "r4", name: "کره بادام زمینی", amount: pb.amount, note: "کره طبیعی بدون قند", calories: pb.calories, protein: pb.protein, carbs: pb.carbs, fats: pb.fats },
        ],
        textNotes: "همراه با ۱ لیوان چای سبز یا قهوه تلخ میل شود.",
      },
      {
        id: "m2",
        mealName: "وعده ۲: ناهار اصلی پُرپروتئین",
        headerColor: "emerald",
        mode: "table",
        rows: [
          { id: "r5", name: "سینه مرغ پخته (گریل/آب‌پز)", amount: ch.amount, note: "وزن پخته شده", calories: ch.calories, protein: ch.protein, carbs: ch.carbs, fats: ch.fats },
          { id: "r6", name: "برنج کته (بدون روغن)", amount: r.amount, note: "برنج کته پخته شده", calories: r.calories, protein: r.protein, carbs: r.carbs, fats: r.fats },
          { id: "r7", name: "سالاد فصل (خیار و گوجه)", amount: sal.amount, note: "با 1 ق‌غ روغن زیتون فرابکر", calories: sal.calories, protein: sal.protein, carbs: sal.carbs, fats: sal.fats },
        ],
        textNotes: "حداقل نیم ساعت بعد از غذا آب نوشیده شود.",
      },
      {
        id: "m3",
        mealName: "وعده ۳: میان‌وعده بعد از تمرین",
        headerColor: "blue",
        mode: "table",
        rows: [
          { id: "r8", name: "پروتئین وی (Whey Protein)", amount: w.amount, note: "مخلوط با 250ml آب", calories: w.calories, protein: w.protein, carbs: w.carbs, fats: w.fats },
          { id: "r9", name: "سیب درختی یا خرما", amount: d.amount, note: "جهت تامین گلیکوژن", calories: d.calories, protein: d.protein, carbs: d.carbs, fats: d.fats },
          { id: "r10", name: "مغز گردو یا بادام", amount: n.amount, note: "آجیل خام بدون نمک", calories: n.calories, protein: n.protein, carbs: n.carbs, fats: n.fats },
        ],
        textNotes: "بلافاصله بعد از اتمام تمرین ورزشی میل شود.",
      },
      {
        id: "m4",
        mealName: "وعده ۴: شام سبک و ترمیم‌کننده",
        headerColor: "teal",
        mode: "table",
        rows: [
          { id: "r11", name: "فیله گوساله یا ماهی سالمون گریل", amount: fi.amount, note: "پخته شده روی چدن", calories: fi.calories, protein: fi.protein, carbs: fi.carbs, fats: fi.fats },
          { id: "r12", name: "سیب‌زمینی تنوری ایرفرایر", amount: po.amount, note: "وزن پخته", calories: po.calories, protein: po.protein, carbs: po.carbs, fats: po.fats },
          { id: "r13", name: "بروکلی و قارچ بخارپز", amount: veg.amount, note: "همراه با لیموترش تازه", calories: veg.calories, protein: veg.protein, carbs: veg.carbs, fats: veg.fats },
        ],
        textNotes: "حداقل ۲ ساعت قبل از خواب میل شود.",
      },
    ]

    setSections(autoSections)
    toast.success(`چیدمان هوشمند وعده‌ها دقیقا طبق هدف ${Math.round(tCal)} کالری تولید شد!`)
  }


  // Food Bank Modal State
  const [activeFoodModalSectionId, setActiveFoodModalSectionId] = useState<string | null>(null)
  const [foodSearchQuery, setFoodSearchQuery] = useState("")
  const [foodSearchCategory, setFoodSearchCategory] = useState("ALL")
  const [foodQuantities, setFoodQuantities] = useState<Record<string, number>>({})

  function handleInsertFoodFromBank(foodItem: any, userInputValue?: number) {
    if (!activeFoodModalSectionId) return

    const config = getFoodUnitConfig(foodItem)
    const val = userInputValue ?? (foodQuantities[foodItem.name] ?? config.defaultVal)
    const calc = config.calculate(val)

    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== activeFoodModalSectionId) return sec
        const newRow: FoodRow = {
          id: Date.now().toString() + Math.random().toString().substring(2, 5),
          name: foodItem.name,
          amount: calc.amount,
          note: `${calc.calories} kcal (P: ${calc.protein}g | C: ${calc.carbs}g | F: ${calc.fats}g)`,
          calories: calc.calories,
          protein: calc.protein,
          carbs: calc.carbs,
          fats: calc.fats,
        }
        return { ...sec, rows: [...sec.rows, newRow] }
      })
    )

    toast.success(`"${foodItem.name}" (${calc.amount} - ${calc.calories} کالری) اضافه شد.`)
    setActiveFoodModalSectionId(null)
  }




  const [sections, setSections] = useState<MealSection[]>(() => {
    if (existingDiet?.content) {
      try {
        if (typeof window !== "undefined") {
          const parser = new DOMParser()
          const doc = parser.parseFromString(existingDiet.content, "text/html")
          const divElements = doc.querySelectorAll("body > div")

          if (divElements.length > 0) {
            const parsed: MealSection[] = []
            divElements.forEach((el, idx) => {
              const headerText = el.querySelector("span, h3")?.textContent?.trim() || `وعده ${idx + 1}`
              const tableRows = el.querySelectorAll("tbody tr")
              const rows: FoodRow[] = []

              tableRows.forEach((tr, rIdx) => {
                const tds = tr.querySelectorAll("td")
                if (tds.length >= 2) {
                  rows.push({
                    id: `r-${idx}-${rIdx}`,
                    name: tds[0]?.textContent?.trim() || "",
                    amount: tds[1]?.textContent?.trim() || "",
                    note: tds[2]?.textContent?.trim() || "",
                  })
                }
              })

              const noteText = el.querySelector("div[style*='font-size: 11px'], p")?.textContent?.trim() || ""

              parsed.push({
                id: `s-${idx + 1}`,
                mealName: headerText,
                headerColor: (["emerald", "teal", "blue", "amber", "purple", "rose", "indigo"] as HeaderColor[])[idx % 7],
                mode: rows.length > 0 ? "table" : "text",
                rows,
                textNotes: rows.length === 0 && !noteText ? el.textContent?.trim() || "" : noteText,
              })
            })
            if (parsed.length > 0) return parsed
          }
        }
      } catch (e) {
        console.error("Error parsing existing diet HTML:", e)
      }
    }

    return [
      {
        id: "s-1",
        mealName: "وعده ۱: صبحانه",
        headerColor: "emerald",
        mode: "table",
        rows: [
          { id: "r-1", name: "تخم‌مرغ آب‌پز کامل", amount: "۳ عدد", note: "همراه با زرده" },
          { id: "r-2", name: "نان سنگک یا جو", amount: "۶۰ گرم", note: "حدود ۲ کف دست" },
          { id: "r-3", name: "پنیر کم‌چرب و مغز گردو", amount: "۳۰ گرم پنیر + ۲ عدد گردو", note: "ترجیحاً کم‌نمک" },
        ],
        textNotes: "همراه با ۱ لیوان چای سبز یا قهوه بدون قند",
      },
      {
        id: "s-2",
        mealName: "وعده ۲: میان‌وعده صبح",
        headerColor: "amber",
        mode: "table",
        rows: [
          { id: "r-4", name: "سیب درختی یا موز", amount: "۱ عدد", note: "متوسط" },
          { id: "r-5", name: "پروتئین وی (Whey)", amount: "۱ اسکوپ (۳۰ گرم)", note: "مخلوط با آب" },
        ],
        textNotes: "",
      },
      {
        id: "s-3",
        mealName: "وعده ۳: ناهار",
        headerColor: "blue",
        mode: "table",
        rows: [
          { id: "r-6", name: "فیله مرغ یا سینه مرغ گریل شده", amount: "۲۰۰ گرم", note: "وزن پخته شده" },
          { id: "r-7", name: "کته کم‌روغن یا برنج قهوه‌ای", amount: "۱۵۰ گرم", note: "حدود ۶ قاشق غذاخوری" },
          { id: "r-8", name: "سالاد فصل + روغن زیتون", amount: "۱ بشقاب + ۱ قاشق م‌خ روغن", note: "بدون سس مایونز" },
        ],
      },
    ]
  })


  // Real-time calculated live macro totals across all meal tables
  const totalDietMacros = useMemo(() => {
    let calories = 0
    let protein = 0
    let carbs = 0
    let fats = 0

    sections.forEach((sec) => {
      sec.rows.forEach((row) => {
        if (row.calories) calories += Number(row.calories)
        if (row.protein) protein += Number(row.protein)
        if (row.carbs) carbs += Number(row.carbs)
        if (row.fats) fats += Number(row.fats)
      })
    })

    return {
      calories: Math.round(calories),
      protein: Math.round(protein * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fats: Math.round(fats * 10) / 10,
    }
  }, [sections])


  // Section Handlers
  function handleAddCustomSection() {
    setSections((prev) => [
      ...prev,
      {
        id: `s-${Date.now()}`,
        mealName: "وعده جدید",
        headerColor: "teal",
        mode: "table",
        rows: [
          { id: `r-${Date.now()}-1`, name: "", amount: "", note: "" },
        ],
        textNotes: "",
      },
    ])
  }

  function handleRemoveSection(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id))
  }

  function handleMoveSection(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sections.length) return
    const newSections = [...sections]
    const [moved] = newSections.splice(index, 1)
    newSections.splice(targetIndex, 0, moved)
    setSections(newSections)
  }

  function handleUpdateSection(id: string, updates: Partial<MealSection>) {
    setSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec))
    )
  }

  // Row Handlers
  function handleAddRow(sectionId: string) {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            rows: [...sec.rows, { id: `r-${Date.now()}`, name: "", amount: "", note: "" }],
          }
        }
        return sec
      })
    )
  }

  function handleUpdateRow(sectionId: string, rowId: string, updates: Partial<FoodRow>) {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            rows: sec.rows.map((r) => (r.id === rowId ? { ...r, ...updates } : r)),
          }
        }
        return sec
      })
    )
  }

  function handleRemoveRow(sectionId: string, rowId: string) {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id === sectionId) {
          return {
            ...sec,
            rows: sec.rows.filter((r) => r.id !== rowId),
          }
        }
        return sec
      })
    )
  }

  // Quick Preset Insertions
  function insertPreset(type: "breakfast" | "lunch" | "dinner" | "supplements" | "tips") {
    const now = Date.now()
    if (type === "breakfast") {
      setSections((prev) => [
        ...prev,
        {
          id: `s-${now}`,
          mealName: "وعده: صبحانه مقوی",
          headerColor: "emerald",
          mode: "table",
          rows: [
            { id: `r-${now}-1`, name: "تخم‌مرغ آب‌پز", amount: "۳ عدد", note: "۲ عدد سفیده + ۱ عدد کامل" },
            { id: `r-${now}-2`, name: "نان جو یا سنگک", amount: "۵۰ گرم", note: "کم‌نمک" },
            { id: `r-${now}-3`, name: "خیار و گوجه فرنگی", amount: "به میزان دلخواه", note: "تازه‌خوری" },
          ],
          textNotes: "همراه با ۱ فنجان چای سبز",
        },
      ])
    } else if (type === "lunch") {
      setSections((prev) => [
        ...prev,
        {
          id: `s-${now}`,
          mealName: "وعده: ناهار اصلی",
          headerColor: "blue",
          mode: "table",
          rows: [
            { id: `r-${now}-1`, name: "سینه مرغ گریل شده", amount: "۲۰۰ گرم", note: "وزن خام پخته شده" },
            { id: `r-${now}-2`, name: "برنج کته کم‌روغن", amount: "۱۵۰ گرم", note: "حدود ۷ قاشق" },
            { id: `r-${now}-3`, name: "سالاد زیتون و کاهو", amount: "۱ بشقاب", note: "با لیموترش تازه" },
          ],
          textNotes: "",
        },
      ])
    } else if (type === "dinner") {
      setSections((prev) => [
        ...prev,
        {
          id: `s-${now}`,
          mealName: "وعده: شام سبک",
          headerColor: "teal",
          mode: "table",
          rows: [
            { id: `r-${now}-1`, name: "فیله ماهی یا بوقلمون", amount: "۱۷۰ گرم", note: "بخارپز" },
            { id: `r-${now}-2`, name: "کدو سبز و سبزیجات بخارپز", amount: "۱ بشقاب", note: "با پودر سیر و آویشن" },
          ],
          textNotes: "حداقل ۲ ساعت قبل خواب مصرف شود.",
        },
      ])
    } else if (type === "supplements") {
      setSections((prev) => [
        ...prev,
        {
          id: `s-${now}`,
          mealName: "جدول راهنمای مصرف مکمل‌ها",
          headerColor: "indigo",
          mode: "table",
          rows: [
            { id: `r-${now}-1`, name: "کراتین مونوهیدرات", amount: "۵ گرم", note: "بلافاصله بعد تمرین با آب" },
            { id: `r-${now}-2`, name: "مولتی‌ویتامین و مینرال", amount: "۱ قرص", note: "همراه با وعده صبحانه" },
            { id: `r-${now}-3`, name: "امگا ۳ (روغن ماهی)", amount: "۱ کپسول", note: "همراه با ناهار" },
          ],
          textNotes: "مکمل‌ها حتماً با فراوانی آب مصرف شوند.",
        },
      ])
    } else if (type === "tips") {
      setSections((prev) => [
        ...prev,
        {
          id: `s-${now}`,
          mealName: "قوانین و توصیه‌های مهم رژیم",
          headerColor: "rose",
          mode: "text",
          rows: [],
          textNotes: "۱. نوشیدن روزانه حداقل ۳ تا ۴ لیوان آب ترجیحاً ولرم\n۲. پرهیز مطلق از مصرف نوشابه، قند مصنوعی و فست‌فود\n۳. عدم حذف وعده‌های اصلی رژیم بدون هماهنگی با مربی\n۴. خواب کافی ۷ تا ۸ ساعت در شبانه روز",
        },
      ])
    }
    toast.success("بخش جدید با موفقیت اضافه شد")
  }

  // Generate Styled HTML Output for Backend Storage
  function compileHtmlContent(): string {
    const mainHtml = sections
      .map((sec) => {

        const color = COLOR_MAP[sec.headerColor] || COLOR_MAP.emerald

        let bodyHtml = ""
        if (sec.mode === "table" && sec.rows.length > 0) {
          const rowsHtml = sec.rows
            .filter((r) => r.name.trim() !== "" || r.amount.trim() !== "")
            .map(
              (r, idx) => `
              <tr style="background-color: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #1e293b;">${r.name}</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 12px; font-weight: bold; color: #0d9488;">${r.amount}</td>
                <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">${r.note || "-"}</td>
              </tr>
            `
            )
            .join("")

          bodyHtml = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 8px; font-size: 12px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background-color: #f1f5f9; color: #334155; text-align: right;">
                  <th style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; width: 45%;">ماده غذایی</th>
                  <th style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; width: 25%;">مقدار / وزن</th>
                  <th style="padding: 8px 12px; border: 1px solid #cbd5e1; font-weight: bold; width: 30%;">توضیحات</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          `
        }

        let notesHtml = ""
        if (sec.textNotes && sec.textNotes.trim()) {
          notesHtml = `
            <div style="font-size: 11px; color: #475569; background-color: #f8fafc; border-right: 3px solid ${color.hexBg}; padding: 6px 12px; border-radius: 4px; margin-top: 6px;">
              ${sec.textNotes.replace(/\n/g, "<br />")}
            </div>
          `
        }

        return `
          <div style="margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; page-break-inside: avoid;">
            <div style="background-color: ${color.hexBg}; color: ${color.hexText}; padding: 8px 14px; font-family: 'Morabba', serif; font-weight: 800; font-size: 14px; display: flex; justify-content: space-between; align-items: center;">
              <span>${sec.mealName}</span>
            </div>
            <div style="padding: 10px 14px; background-color: #ffffff;">
              ${bodyHtml}
              ${notesHtml}
            </div>
          </div>
        `
      })
      .join("")

    return mainHtml
  }




  async function handleSave() {
    if (!title.trim()) {
      toast.error("لطفا عنوان برنامه تغذیه را وارد کنید.")
      return
    }

    const formattedContent = compileHtmlContent()

    setLoading(true)
    try {
      if (existingDiet) {
        await updateDietPlan(existingDiet.id, {
          title,
          description,
          content: formattedContent,
          sectionsJson: sections,
          isTemplate,
        })
        toast.success("برنامه تغذیه با موفقیت بروزرسانی شد")
        router.push(`/diets/${existingDiet.id}`)
      } else {
        await createDietPlan({
          title,
          description,
          content: formattedContent,
          sectionsJson: sections,
          isTemplate,
          clientId: clientId || undefined,
        })
        toast.success("برنامه تغذیه با موفقیت ذخیره شد")

        if (clientId) {
          router.push(`/clients/${clientId}`)
        } else {
          router.push("/diets")
        }
      }
    } catch (err: any) {
      toast.error(err.message || "خطا در ثبت برنامه تغذیه")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 pb-16">
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
              طراحی برنامه تغذیه حرفه‌ای
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">تنظیم وعده‌ها به صورت جدول، رنگ‌بندی هدرها و افزدون سریع مواد غذایی</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          ذخیره برنامه تغذیه
        </button>
      </div>

      {/* Mode Switcher Tab Bar */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs">
        <button
          type="button"
          onClick={() => setBuilderMode("standard")}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            builderMode === "standard"
              ? "bg-white text-teal-700 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="h-4 w-4 text-teal-600" />
          طراحی استاندارد (جدول و متن آزاد)
        </button>
        <button
          type="button"
          onClick={() => {
            setBuilderMode("macro")
            setSections([
              { id: "m1", mealName: "وعده ۱: صبحانه", headerColor: "amber", mode: "table", rows: [], textNotes: "" },
              { id: "m2", mealName: "وعده ۲: ناهار", headerColor: "emerald", mode: "table", rows: [], textNotes: "" },
              { id: "m3", mealName: "وعده ۳: میان‌وعده", headerColor: "blue", mode: "table", rows: [], textNotes: "" },
              { id: "m4", mealName: "وعده ۴: شام", headerColor: "teal", mode: "table", rows: [], textNotes: "" },
            ])
            toast.info("حالت ماکرو فعال شد. جداول خالی شدند تا مواد غذایی را از بانک غذا اضافه کنید.")
          }}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
            builderMode === "macro"
              ? "bg-white text-teal-700 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="h-4 w-4 text-amber-500" />
          طراحی پیشرفته ماکرویی (محاسبه دقیق کالری و ارزش غذایی)
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
              placeholder="مثال: رژیم چربی‌سوزی تخصصی (های پروتئین)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 transition-colors"
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-teal-600 transition-colors font-medium"
            >
              <option value="">بدون تخصیص (قالب آماده عمومی)</option>
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
            placeholder="مثال: نوشیدن حداقل ۳ لیتر آب در روز، عدم استفاده از قندهای مصنوعی، خواب ناکافی راندمان را کاهش می‌دهد..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Unified Macro Command Center Card (Visible ONLY in Macro Mode) */}

      {/* Unified Macro Command Center Card (Visible ONLY in Macro Mode) */}

      {/* Unified Macro Command Center Card (Visible ONLY in Macro Mode) */}

      {/* Unified Macro Command Center Card (Visible ONLY in Macro Mode) */}

      {builderMode === "macro" && (
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 space-y-6 shadow-sm">
          
          {/* Main Top Header Bar (RTL) */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            {/* Title & Subtitle (Right side) */}
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 font-heading">
                  استودیو هوشمند و علمی
                </h3>
                <p className="text-xs text-slate-500">
                  طراحی علمی برنامه غذایی و مکمل‌ها بر اساس هوش مصنوعی
                </p>
              </div>
            </div>

            {/* Action Buttons (Left side) */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleGenerateAiDiet}
                disabled={aiGenerating}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold px-4 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-300" />}
                تولید برنامه با هوش مصنوعی
              </button>
            </div>
          </div>

          {/* 3-Column Grid (RTL Order: Column 1 ➔ Column 2 ➔ Column 3) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* COLUMN 1 (Far Right - ورودی‌های ورزشکار) */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-slate-100 text-emerald-700 font-bold flex items-center justify-center text-xs border border-slate-200">1</span>
                  ورودی‌های ورزشکار
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Client Dropdown (At Top of Section 1) */}
                <div className="space-y-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                  <label className="block text-slate-700 font-extrabold text-[11px]">انتخاب و تخصیص به شاگرد:</label>
                  <select
                    value={clientId}
                    onChange={(e) => {
                      setClientId(e.target.value)
                      if (e.target.value) setIsTemplate(false)
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-none"
                  >
                    <option value="">بدون تخصیص (تنظیم عمومی رژیم)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.weight ? `(وزن: ${c.weight} کیلوگرم)` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Age */}
                <div className="flex items-center gap-2">
                  <label className="w-20 text-slate-600 font-bold">سن:</label>
                  <input
                    type="number"
                    value={calcAge}
                    onChange={(e) => setCalcAge(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-bold text-center focus:outline-none"
                  />
                </div>

                {/* Weight */}
                <div className="flex items-center gap-2">
                  <label className="w-20 text-slate-600 font-bold">وزن:</label>
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
                    <input
                      type="number"
                      value={calcWeight}
                      onChange={(e) => setCalcWeight(e.target.value)}
                      className="w-full bg-transparent text-slate-900 font-bold text-center focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-bold ml-1">کیلوگرم</span>
                  </div>
                </div>

                {/* Height */}
                <div className="flex items-center gap-2">
                  <label className="w-20 text-slate-600 font-bold">قد:</label>
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
                    <input
                      type="number"
                      value={calcHeight}
                      onChange={(e) => setCalcHeight(e.target.value)}
                      className="w-full bg-transparent text-slate-900 font-bold text-center focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 font-bold ml-1">سانتی‌متر</span>
                  </div>
                </div>

                {/* Activity */}
                <div className="space-y-1">
                  <label className="block text-slate-600 font-bold">سطح فعالیت:</label>
                  <select
                    value={calcActivity}
                    onChange={(e) => setCalcActivity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-none"
                  >
                    <option value="1.2">کم‌تحرک (کاری پشت‌میزی)</option>
                    <option value="1.375">تمرین ۱ تا ۳ روز در هفته</option>
                    <option value="1.55">تمرین ۳ تا ۵ روز در هفته</option>
                    <option value="1.725">تمرین ۶ تا ۷ روز در هفته</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleApplyScientificMacros}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 rounded-xl text-xs transition-all shadow-xs"
                >
                  اعمال مشخصات و محاسبات
                </button>
              </div>
            </div>

            {/* COLUMN 2 (Middle - محاسبات علمی و استراتژی) */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-slate-100 text-emerald-700 font-bold flex items-center justify-center text-xs border border-slate-200">2</span>
                  محاسبات علمی و استراتژی
                </span>
              </div>

              {/* 3 Metric Badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 block font-bold">متابولیسم پایه</span>
                  <span className="font-extrabold text-base text-slate-900 block">{scientificCalc.bmr}</span>
                  <span className="text-[10px] text-slate-400 block">کالری</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 block font-bold">کالری کل روزانه</span>
                  <span className="font-extrabold text-base text-slate-900 block">{scientificCalc.tdee}</span>
                  <span className="text-[10px] text-slate-400 block">کالری</span>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                  <span className="text-[10px] text-emerald-700 block font-bold">هدف کالری</span>
                  <span className="font-extrabold text-base text-emerald-700 block">{scientificCalc.targetCal}</span>
                  <span className="text-[10px] text-emerald-600 block">کالری</span>
                </div>
              </div>

              {/* Strategies Pills */}
              <div className="space-y-2 pt-2">
                <span className="block text-xs font-bold text-slate-600">استراتژی رژیم:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "MUSCLE_GAIN", label: "عضله‌سازی", color: "bg-emerald-50 border-emerald-300 text-emerald-800" },
                    { id: "MAINTENANCE", label: "ثبات وزن", color: "bg-blue-50 border-blue-300 text-blue-800" },
                    { id: "FAT_LOSS_MODERATE", label: "کاهش وزن تدریجی", color: "bg-amber-50 border-amber-300 text-amber-800" },
                    { id: "FAT_LOSS_AGGRESSIVE", label: "کاهش چربی شدید", color: "bg-rose-50 border-rose-300 text-rose-800" },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setCalcGoal(g.id)}
                      className={`p-2.5 rounded-2xl border font-bold text-center transition-all ${
                        calcGoal === g.id
                          ? `${g.color} ring-2 ring-emerald-500/50 shadow-2xs`
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="block text-xs">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMN 3 (Far Left - اهداف درشت‌مغذی نهایی) */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-extrabold text-xs text-slate-800 flex items-center gap-2">
                  <span className="h-5 w-5 rounded-full bg-slate-100 text-emerald-700 font-bold flex items-center justify-center text-xs border border-slate-200">3</span>
                  اهداف درشت‌مغذی نهایی
                </span>
              </div>

              {/* Target Calorie Progress Header */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-600">کالری چیده شده:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-900 text-sm font-extrabold">
                      {totalDietMacros.calories} / {targetCalories}
                    </span>
                    <span className="text-emerald-700 font-extrabold">
                      ({Math.min(100, Math.round((totalDietMacros.calories / (parseFloat(targetCalories) || 1)) * 100))}٪)
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (totalDietMacros.calories / (parseFloat(targetCalories) || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>

              {/* 4 Macro Input Cards (2x2 Grid) */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Calorie */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">کالری کل هدف</span>
                  <input
                    type="number"
                    value={targetCalories}
                    onChange={(e) => setTargetCalories(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2 py-1 text-sm font-extrabold text-slate-900 text-center focus:outline-none"
                  />
                </div>

                {/* Protein */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">پروتئین کل هدف</span>
                  <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1">
                    <input
                      type="number"
                      value={targetProtein}
                      onChange={(e) => setTargetProtein(e.target.value)}
                      className="w-full bg-transparent text-sm font-extrabold text-blue-700 text-center focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold ml-1">گرم</span>
                  </div>
                </div>

                {/* Carbs */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">کربوهیدرات کل هدف</span>
                  <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1">
                    <input
                      type="number"
                      value={targetCarbs}
                      onChange={(e) => setTargetCarbs(e.target.value)}
                      className="w-full bg-transparent text-sm font-extrabold text-emerald-700 text-center focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold ml-1">گرم</span>
                  </div>
                </div>

                {/* Fats */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">چربی کل هدف</span>
                  <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1">
                    <input
                      type="number"
                      value={targetFats}
                      onChange={(e) => setTargetFats(e.target.value)}
                      className="w-full bg-transparent text-sm font-extrabold text-amber-700 text-center focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 font-bold ml-1">گرم</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Full-Width Bar (Macro Check & Plan Status) */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs shadow-2xs">
            
            {/* Left Action Side */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSmartAutoFillMacroDiet}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-2.5 rounded-2xl text-xs transition-all shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="h-4 w-4 text-amber-300" />
                ساخت رژیم
              </button>
            </div>

            {/* Right Live Macro Status Bars */}
            <div className="flex-1 space-y-2 max-w-xl">
              <span className="font-extrabold text-slate-800 block text-left md:text-right">
                درشت‌مغذی‌ها و وضعیت چیدمان زنده:
              </span>
              <div className="grid grid-cols-3 gap-3">
                {/* Protein */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600">پروتئین ({targetProtein}g)</span>
                    <span className="text-blue-700">{totalDietMacros.protein}g</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (totalDietMacros.protein / (parseFloat(targetProtein) || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Carbs */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600">کربوهیدرات ({targetCarbs}g)</span>
                    <span className="text-emerald-700">{totalDietMacros.carbs}g</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (totalDietMacros.carbs / (parseFloat(targetCarbs) || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Fats */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600">چربی ({targetFats}g)</span>
                    <span className="text-amber-700">{totalDietMacros.fats}g</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-600 rounded-full"
                      style={{
                        width: `${Math.min(100, (totalDietMacros.fats / (parseFloat(targetFats) || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}










      {/* Quick Insert Preset Bar */}
      <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200/80 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
          <Sparkles className="h-4 w-4 text-teal-600" />
          افزودن سریع وعده‌های آماده با یک کلیک:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => insertPreset("breakfast")}
            className="text-xs font-bold bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Apple className="h-3.5 w-3.5 text-emerald-600" />
            + صبحانه مقوی
          </button>
          <button
            onClick={() => insertPreset("lunch")}
            className="text-xs font-bold bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Utensils className="h-3.5 w-3.5 text-blue-600" />
            + ناهار اصلی
          </button>
          <button
            onClick={() => insertPreset("dinner")}
            className="text-xs font-bold bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Utensils className="h-3.5 w-3.5 text-teal-600" />
            + شام سبک
          </button>
          <button
            onClick={() => insertPreset("supplements")}
            className="text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <Pill className="h-3.5 w-3.5 text-indigo-600" />
            + جدول مکمل‌ها
          </button>
          <button
            onClick={() => insertPreset("tips")}
            className="text-xs font-bold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs flex items-center gap-1.5"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            + قوانین و نکات رژیم
          </button>
        </div>
      </div>

      {/* Meals & Sections Builder */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 font-heading">بخش‌ها و وعده‌های غذایی ({sections.length})</h2>
          <button
            onClick={handleAddCustomSection}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
          >
            <Plus className="h-4 w-4" />
            افزودن وعده / بخش جدید
          </button>
        </div>

        <div className="space-y-6">
          {sections.map((sec, secIndex) => {
            const color = COLOR_MAP[sec.headerColor] || COLOR_MAP.emerald
            const secCal = sec.rows.reduce((a, b) => a + (b.calories || 0), 0)
            const secProt = sec.rows.reduce((a, b) => a + (b.protein || 0), 0)

            return (
              <div
                key={sec.id}
                className="rounded-3xl bg-white border border-slate-200 shadow-xs overflow-hidden transition-all hover:shadow-md"
              >
                {/* Header Banner Control */}
                <div className={`p-4 ${color.bg} text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="h-7 w-7 rounded-lg bg-white/20 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {secIndex + 1}
                    </span>
                    <input
                      type="text"
                      value={sec.mealName}
                      onChange={(e) => handleUpdateSection(sec.id, { mealName: e.target.value })}
                      className="bg-white/10 hover:bg-white/20 focus:bg-white/30 border border-white/20 rounded-xl px-3 py-1 text-sm font-bold text-white placeholder-white/60 focus:outline-hidden w-full max-w-md transition-colors"
                      placeholder="عنوان وعده (مثال: وعده اول - صبحانه)"
                    />
                    {secCal > 0 && (
                      <span className="text-[10px] bg-white/20 border border-white/30 text-white px-2.5 py-1 rounded-lg font-mono font-bold shrink-0 hidden sm:inline-block">
                        {Math.round(secCal)} kcal | P: {Math.round(secProt * 10) / 10}g
                      </span>
                    )}
                  </div>


                  {/* Header Actions & Color Palette */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Mode Toggle */}
                    <button
                      onClick={() => handleUpdateSection(sec.id, { mode: sec.mode === "table" ? "text" : "table" })}
                      className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                      title="تغییر به جدول یا متن آزاد"
                    >
                      {sec.mode === "table" ? (
                        <>
                          <TableIcon className="h-3.5 w-3.5" /> حالت جدول
                        </>
                      ) : (
                        <>
                          <FileText className="h-3.5 w-3.5" /> حالت متن
                        </>
                      )}
                    </button>

                    {/* Palette Picker */}
                    <div className="flex items-center gap-1 bg-white/20 p-1 rounded-lg">
                      <Palette className="h-3.5 w-3.5 text-white/80 ml-1" />
                      {(["emerald", "teal", "blue", "amber", "purple", "rose", "indigo"] as HeaderColor[]).map((c) => (
                        <button
                          key={c}
                          onClick={() => handleUpdateSection(sec.id, { headerColor: c })}
                          className={`h-4 w-4 rounded-full border border-white/40 transition-transform ${
                            COLOR_MAP[c].bg
                          } ${sec.headerColor === c ? "scale-125 ring-2 ring-white" : "hover:scale-110"}`}
                        />
                      ))}
                    </div>

                    {/* Order Move Controls */}
                    <button
                      onClick={() => handleMoveSection(secIndex, "up")}
                      disabled={secIndex === 0}
                      className="p-1 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(secIndex, "down")}
                      disabled={secIndex === sections.length - 1}
                      className="p-1 rounded-md bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>

                    {/* Delete Section */}
                    {sections.length > 1 && (
                      <button
                        onClick={() => handleRemoveSection(sec.id)}
                        className="p-1 rounded-md bg-white/10 hover:bg-rose-500 text-white transition-colors"
                        title="حذف وعده"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Section Content Body */}
                <div className="p-5 space-y-4">
                  {sec.mode === "table" ? (
                    <div className="space-y-3">
                      {/* Table Header */}
                      <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-500 px-2">
                        <div className="col-span-5 sm:col-span-5">ماده غذایی / عنوان</div>
                        <div className="col-span-3 sm:col-span-3">مقدار / وزن</div>
                        <div className="col-span-3 sm:col-span-3">توضیحات / جایگزین</div>
                        <div className="col-span-1 text-center">حذف</div>
                      </div>

                      {/* Food Rows */}
                      <div className="space-y-2">
                        {sec.rows.map((row) => (
                          <div key={row.id} className="grid grid-cols-12 gap-2 items-center">
                            <input
                              type="text"
                              value={row.name}
                              onChange={(e) => handleUpdateRow(sec.id, row.id, { name: e.target.value })}
                              placeholder="مثال: فیله مرغ گریل"
                              className="col-span-5 sm:col-span-5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-600"
                            />
                            <input
                              type="text"
                              value={row.amount}
                              onChange={(e) => handleUpdateRow(sec.id, row.id, { amount: e.target.value })}
                              placeholder="مثال: ۱۵۰ گرم"
                              className="col-span-3 sm:col-span-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-teal-700 focus:outline-hidden focus:border-teal-600"
                            />
                            <input
                              type="text"
                              value={row.note}
                              onChange={(e) => handleUpdateRow(sec.id, row.id, { note: e.target.value })}
                              placeholder="مثال: وزن پخته شده"
                              className="col-span-3 sm:col-span-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 focus:outline-hidden focus:border-teal-600"
                            />
                            <div className="col-span-1 flex justify-center">
                              <button
                                onClick={() => handleRemoveRow(sec.id, row.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add Row Buttons */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <button
                          onClick={() => handleAddRow(sec.id)}
                          className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/70 border border-teal-200/60 px-3 py-1.5 rounded-xl transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          افزودن ردیف جدید
                        </button>

                        <button
                          onClick={() => {
                            setActiveFoodModalSectionId(sec.id)
                            setFoodSearchQuery("")
                            setFoodSearchCategory("ALL")
                          }}
                          className="flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs"
                        >
                          <Search className="h-3.5 w-3.5 text-amber-600" />
                          🔍 جستجو و افزودن از بانک غذا (کالری‌دار)
                        </button>
                      </div>
                    </div>
                  ) : null}


                  {/* Additional Notes Box */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      {sec.mode === "table" ? "توضیحات و دستورالعمل تکمیلی وعده (اختیاری)" : "متن کامل دستورالعمل رژیم"}
                    </label>
                    <textarea
                      value={sec.textNotes}
                      onChange={(e) => handleUpdateSection(sec.id, { textNotes: e.target.value })}
                      rows={sec.mode === "table" ? 2 : 4}
                      placeholder={
                        sec.mode === "table"
                          ? "مثال: همراه با این وعده ۲ لیوان آب ولرم میل شود..."
                          : "دستورالعمل‌ها و لیست مواد غذایی..."
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-teal-600 transition-colors resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>


      {/* Food Bank Quick Selector Modal */}
      {activeFoodModalSectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-100 space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Utensils className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 font-heading">انتخاب و افزودن از بانک غذا</h3>
                  <p className="text-[11px] text-slate-500">انتخاب ماده غذایی جهت افزودن مستقیم به جدول وعده غذایی</p>
                </div>
              </div>
              <button
                onClick={() => setActiveFoodModalSectionId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={foodSearchQuery}
                onChange={(e) => setFoodSearchQuery(e.target.value)}
                placeholder="جستجوی نام ماده غذایی (مثال: سینه مرغ، فیله، برنج، موز)..."
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0">
              {["ALL", "پروتئینی", "غذاهای سنتی ایرانی", "کربوهیدرات", "سبزیجات", "میوه", "چربی مفید", "لبنیات", "مکمل / پروتئین"].map(

                (cat) => (
                  <button
                    key={cat}
                    onClick={() => setFoodSearchCategory(cat)}
                    className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 ${
                      foodSearchCategory === cat
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat === "ALL" ? "همه دسته‌ها" : cat}
                  </button>
                )
              )}
            </div>

            {/* Food Grid Feed */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {DEFAULT_FOODS.filter((f) => {
                const q = foodSearchQuery.trim().toLowerCase().replace(/[\s\u200c]+/g, "")
                const nameNorm = f.name.toLowerCase().replace(/[\s\u200c]+/g, "")
                const catNorm = f.category.toLowerCase().replace(/[\s\u200c]+/g, "")

                const matchesSearch = !q || nameNorm.includes(q) || catNorm.includes(q)
                const matchesCat = foodSearchCategory === "ALL" || f.category === foodSearchCategory
                return matchesSearch && matchesCat
              }).map((food) => {
                const config = getFoodUnitConfig(food)
                const currentVal = foodQuantities[food.name] ?? config.defaultVal
                const calc = config.calculate(currentVal)

                return (
                  <div
                    key={food.id || food.name}
                    onClick={() => handleInsertFoodFromBank(food, currentVal)}
                    className="p-3 bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-300 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-extrabold text-slate-900 font-heading group-hover:text-amber-800">
                        {food.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        پایه: {food.unitLabel} | دسته: {food.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 text-[11px] font-mono font-bold flex-wrap sm:flex-nowrap">
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2 py-0.5"
                      >
                        <span className="text-[10px] text-slate-600 font-sans font-bold">{config.label}</span>
                        <input
                          type="number"
                          min={config.type === "GRAMS" ? 1 : 0.5}
                          step={config.type === "GRAMS" ? 5 : 0.5}
                          value={currentVal}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0
                            setFoodQuantities((prev) => ({ ...prev, [food.name]: val }))
                          }}
                          className={`${config.type === "GRAMS" ? "w-16" : "w-12"} text-center text-xs font-extrabold text-amber-800 font-mono focus:outline-none`}
                        />
                      </div>

                      <span className="text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded-lg">
                        {calc.calories} kcal
                      </span>
                      <span className="text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-lg">
                        P: {calc.protein}g
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleInsertFoodFromBank(food, currentVal)
                        }}
                        className="bg-amber-500 text-white font-sans text-xs px-3 py-1 rounded-xl font-bold hover:bg-amber-600 shadow-2xs"
                      >
                        + افزودن به جدول
                      </button>
                    </div>
                  </div>
                )
              })}


            </div>
          </div>
        </div>
      )}
    </div>
  )
}

