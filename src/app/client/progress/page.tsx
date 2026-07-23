"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  TrendingUp,
  Scale,
  Ruler,
  Plus,
  Loader2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react"

export default function ProgressPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Form states
  const [weight, setWeight] = useState<number | "">("")
  const [chest, setChest] = useState<number | "">("")
  const [waist, setWaist] = useState<number | "">("")
  const [biceps, setBiceps] = useState<number | "">("")
  const [thigh, setThigh] = useState<number | "">("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    try {
      const res = await fetch("/api/client/progress")
      const data = await res.json()
      if (res.ok && data.logs) {
        setLogs(data.logs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch("/api/client/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: weight !== "" ? Number(weight) : undefined,
          chest: chest !== "" ? Number(chest) : undefined,
          waist: waist !== "" ? Number(waist) : undefined,
          biceps: biceps !== "" ? Number(biceps) : undefined,
          thigh: thigh !== "" ? Number(thigh) : undefined,
          notes,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "خطا در ثبت پیشرفت." })
      } else {
        setMessage({ type: "success", text: "اطلاعات جدید با موفقیت ثبت شد!" })
        setWeight("")
        setChest("")
        setWaist("")
        setBiceps("")
        setThigh("")
        setNotes("")
        fetchLogs()
      }
    } catch (err) {
      setMessage({ type: "error", text: "خطا در برقراری ارتباط با سرور." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
            <TrendingUp className="h-7 w-7 text-emerald-600" />
            ثبت پیشرفت و اندازه‌های بدنی
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ثبت منظم وزن و اندازه‌های دور سینه، بازو، کمر و ران جهت بررسی مسیر پیشرفت توسط مربی
          </p>
        </div>

        <Link
          href="/client"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all w-fit"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به داشبورد
        </Link>
      </div>

      {/* Message Feedback */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Log Progress Form */}
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2 border-b border-slate-100 pb-3">
          <Plus className="h-5 w-5 text-emerald-600" />
          ثبت رکورد و اندازه‌گیری جدید
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">وزن (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="75.5"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">دور کمر (cm)</label>
              <input
                type="number"
                step="0.5"
                value={waist}
                onChange={(e) => setWaist(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="82"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">دور سینه (cm)</label>
              <input
                type="number"
                step="0.5"
                value={chest}
                onChange={(e) => setChest(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="100"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">دور بازو (cm)</label>
              <input
                type="number"
                step="0.5"
                value={biceps}
                onChange={(e) => setBiceps(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="38"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">دور ران (cm)</label>
              <input
                type="number"
                step="0.5"
                value={thigh}
                onChange={(e) => setThigh(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="58"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و احساس آمادگی</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: احساس سبک‌تر شدن، انرژی بالا در تمرین امروز..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all shadow-md disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "ثبت رکورد جدید"}
            </button>
          </div>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-2">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            تاریخچه رکوردها و اندازه‌گیری‌ها
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            هنوز رکوردی ثبت نشده است. اولین اندازه خود را بالا ثبت کنید!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-4">تاریخ ثبت</th>
                  <th className="p-4">وزن (kg)</th>
                  <th className="p-4">دور کمر</th>
                  <th className="p-4">دور سینه</th>
                  <th className="p-4">دور بازو</th>
                  <th className="p-4">دور ران</th>
                  <th className="p-4">توضیحات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-700 font-mono text-[11px]">
                      {new Date(log.loggedAt).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="p-4 font-bold text-emerald-700">{log.weight ? `${log.weight} kg` : "-"}</td>
                    <td className="p-4">{log.waist ? `${log.waist} cm` : "-"}</td>
                    <td className="p-4">{log.chest ? `${log.chest} cm` : "-"}</td>
                    <td className="p-4">{log.biceps ? `${log.biceps} cm` : "-"}</td>
                    <td className="p-4">{log.thigh ? `${log.thigh} cm` : "-"}</td>
                    <td className="p-4 text-slate-500">{log.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
