"use client"

import { useState } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { TrendingUp, Plus, Scale, Activity, Trash2, List } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { logClientProgress, deleteClientProgressLog } from "@/app/actions/client"
import { toast } from "sonner"

interface ProgressLog {
  id: string
  weight: number | null
  chest: number | null
  waist: number | null
  biceps: number | null
  thigh: number | null
  notes: string | null
  loggedAt: string | Date
}

interface ClientProgressChartProps {
  clientId: string
  logs: ProgressLog[]
}

export function ClientProgressChart({ clientId, logs }: ClientProgressChartProps) {
  const [activeMetric, setActiveMetric] = useState<"weight" | "chest" | "waist" | "biceps" | "thigh">("weight")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Format logs for Recharts chronologically
  const chartData = [...logs]
    .sort((a, b) => new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime())
    .map((log) => ({
      id: log.id,
      date: new Date(log.loggedAt).toLocaleDateString("fa-IR", {
        month: "short",
        day: "numeric",
      }),
      weight: log.weight,
      chest: log.chest,
      waist: log.waist,
      biceps: log.biceps,
      thigh: log.thigh,
    }))
    .filter((d) => d[activeMetric] !== null && d[activeMetric] !== undefined)

  async function handleAddLog(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await logClientProgress(clientId, formData)
      toast.success("اندازه‌گیری جدید با موفقیت ثبت شد.")
      setIsModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || "خطا در ثبت اندازه‌گیری")
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteLog(logId: string) {
    if (!confirm("آیا از حذف این ردیف اندازه‌گیری اطمینان دارید؟")) return
    setDeletingId(logId)
    try {
      await deleteClientProgressLog(logId)
      toast.success("اندازه‌گیری با موفقیت حذف شد.")
    } catch (err: any) {
      toast.error(err.message || "خطا در حذف اندازه‌گیری")
    } finally {
      setDeletingId(null)
    }
  }

  const metricLabels = {
    weight: "وزن (kg)",
    chest: "دور سینه (cm)",
    waist: "دور کمر (cm)",
    biceps: "دور بازو (cm)",
    thigh: "دور ران (cm)",
  }

  return (
    <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading">
              نمودار تغییرات و پیشرفت اندامی
            </h3>
            <p className="text-[11px] text-slate-500">
              روند تغییر شاخص‌های بدنی شاگرد در طول زمان
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
            {(["weight", "chest", "waist", "biceps", "thigh"] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeMetric === metric
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {metric === "weight" ? "وزن" : metric === "chest" ? "سینه" : metric === "waist" ? "کمر" : metric === "biceps" ? "بازو" : "ران"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-all border border-slate-200"
          >
            <List className="h-3.5 w-3.5" />
            {showHistory ? "پنهان‌سازی جدول" : "جدول اندازه‌گیری‌ها"}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            ثبت اندازه‌گیری
          </button>
        </div>
      </div>

      {/* Recharts Render */}
      {chartData.length === 0 ? (
        <div className="py-12 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Activity className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            هنوز داده‌ای برای شاخص "{metricLabels[activeMetric]}" ثبت نشده است.
          </p>
          <p className="text-[11px] text-slate-400">
            برای ثبت اولین اندازه‌گیری، روی دکمه "ثبت اندازه‌گیری" کلیک کنید.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#334155",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
                labelStyle={{ color: "#94a3b8", fontSize: "11px" }}
                formatter={(value: any) => [`${value} ${activeMetric === "weight" ? "kg" : "cm"}`, metricLabels[activeMetric]]}
              />
              <Area
                type="monotone"
                dataKey={activeMetric}
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorMetric)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History Table & Delete Controls */}
      {showHistory && logs.length > 0 && (
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <h4 className="text-xs font-bold text-slate-800">تاریخچه ثبت اندازه‌گیری‌ها:</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-2.5">تاریخ</th>
                  <th className="p-2.5">وزن</th>
                  <th className="p-2.5">دور سینه</th>
                  <th className="p-2.5">دور کمر</th>
                  <th className="p-2.5">دور بازو</th>
                  <th className="p-2.5">دور ران</th>
                  <th className="p-2.5">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-2.5 font-semibold text-slate-700">
                      {new Date(l.loggedAt).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="p-2.5">{l.weight ? `${l.weight} kg` : "-"}</td>
                    <td className="p-2.5">{l.chest ? `${l.chest} cm` : "-"}</td>
                    <td className="p-2.5">{l.waist ? `${l.waist} cm` : "-"}</td>
                    <td className="p-2.5">{l.biceps ? `${l.biceps} cm` : "-"}</td>
                    <td className="p-2.5">{l.thigh ? `${l.thigh} cm` : "-"}</td>
                    <td className="p-2.5">
                      <button
                        onClick={() => handleDeleteLog(l.id)}
                        disabled={deletingId === l.id}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        title="حذف این ثبت"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for adding log */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="ثبت اندازه‌گیری جدید"
        titleIcon={<Scale className="h-5 w-5 text-emerald-600" />}
      >
        <form onSubmit={handleAddLog} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وزن (کیلوگرم)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  placeholder="مثال: 75.5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">دور سینه (سانتی‌متر)</label>
                <input
                  type="number"
                  step="0.1"
                  name="chest"
                  placeholder="مثال: 102"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">دور کمر (سانتی‌متر)</label>
                <input
                  type="number"
                  step="0.1"
                  name="waist"
                  placeholder="مثال: 84"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">دور بازو (سانتی‌متر)</label>
                <input
                  type="number"
                  step="0.1"
                  name="biceps"
                  placeholder="مثال: 38"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">دور ران (سانتی‌متر)</label>
              <input
                type="number"
                step="0.1"
                name="thigh"
                placeholder="مثال: 60"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">یادداشت و ملاحظات (اختیاری)</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="مثال: اندازه‌گیری ناشتا انجام شد..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 resize-none"
              />
            </div>
          </fieldset>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              ثبت اندازه‌گیری
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
