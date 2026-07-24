"use client"

import { useState } from "react"
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
} from "lucide-react"
import { createDietPlan, updateDietPlan } from "@/app/actions/diet"
import { toast } from "sonner"

export type HeaderColor = "emerald" | "teal" | "blue" | "amber" | "purple" | "rose" | "indigo"

export interface FoodRow {
  id: string
  name: string
  amount: string
  note: string
}

export interface MealSection {
  id: string
  mealName: string
  headerColor: HeaderColor
  mode: "table" | "text"
  rows: FoodRow[]
  textNotes: string
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
  clients: Array<{ id: string; name: string }>
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

  // Initialize sections from existingDiet HTML if present, or default template
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
        textNotes: "ترجیحاً نیم ساعت قبل یا بعد از غذا آب مصرف نشود.",
      },
    ]
  })

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
    return sections
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
          isTemplate,
        })
        toast.success("برنامه تغذیه با موفقیت بروزرسانی شد")
        router.push(`/diets/${existingDiet.id}`)
      } else {
        await createDietPlan({
          title,
          description,
          content: formattedContent,
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

                      {/* Add Row Button */}
                      <button
                        onClick={() => handleAddRow(sec.id)}
                        className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100/70 border border-teal-200/60 px-3 py-1.5 rounded-xl transition-colors mt-2"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        افزودن ردیف جدید به جدول
                      </button>
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
    </div>
  )
}
