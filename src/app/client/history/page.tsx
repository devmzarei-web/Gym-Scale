"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Calendar,
  Clock,
  CheckCircle2,
  Dumbbell,
  Award,
  ArrowRight,
  Loader2,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Layers,
} from "lucide-react"

export default function ClientWorkoutHistoryPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [activeChartMetric, setActiveChartMetric] = useState<"volume" | "exercises">("volume")

  useEffect(() => {
    fetchLogs()
  }, [])

  async function fetchLogs() {
    setLoading(true)
    try {
      const res = await fetch("/api/client/history")
      const data = await res.json()
      if (res.ok && data.workoutLogs) {
        setLogs(data.workoutLogs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate parsed details & total volume (kg) for each log
  const parsedLogs = useMemo(() => {
    return logs.map((log) => {
      let totalVolume = 0
      let setMetrics: Record<string, { weight: string; reps: string }> = {}
      let completedSets: Record<string, boolean> = {}

      if (log.setDetails) {
        try {
          const parsed = typeof log.setDetails === "string" ? JSON.parse(log.setDetails) : log.setDetails
          setMetrics = parsed.setMetrics || {}
          completedSets = parsed.completedSets || {}

          Object.entries(setMetrics).forEach(([key, val]) => {
            if (completedSets[key]) {
              const w = parseFloat(val.weight || "0") || 0
              const r = parseFloat(val.reps || "0") || 0
              totalVolume += w * r
            }
          })
        } catch (e) {
          console.error("Error parsing setDetails:", e)
        }
      }

      return {
        ...log,
        totalVolume: Math.round(totalVolume),
        setMetrics,
        completedSets,
      }
    })
  }, [logs])

  const totalMinutes = parsedLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0)
  const totalCompletedExercises = parsedLogs.reduce((acc, log) => acc + (log.completedExercises || 0), 0)
  const totalLiftedVolumeKg = parsedLogs.reduce((acc, log) => acc + (log.totalVolume || 0), 0)

  // Chart data (sorted chronologically)
  const chartData = useMemo(() => {
    return [...parsedLogs].reverse().map((log) => ({
      dateLabel: new Date(log.completedAt).toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
      volume: log.totalVolume || 0,
      exercises: log.completedExercises || 0,
      dayLabel: log.dayLabel,
    }))
  }, [parsedLogs])

  const maxVolume = useMemo(() => {
    if (chartData.length === 0) return 1000
    const max = Math.max(...chartData.map((d) => d.volume))
    return max > 0 ? max : 1000
  }, [chartData])

  const maxExercises = useMemo(() => {
    if (chartData.length === 0) return 10
    const max = Math.max(...chartData.map((d) => d.exercises))
    return max > 0 ? max : 10
  }, [chartData])

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
            <Award className="h-7 w-7 text-emerald-600" />
            تاریخچه و روند پیشرفت تمرینات
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            بررسی حجم وزنه‌های جابجا شده، حرکات اجرا شده و روند رشد ورزشی شما
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

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-semibold">جلسات تکمیل‌شده</span>
            <span className="text-lg font-extrabold text-slate-900">{parsedLogs.length} جلسه</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-semibold">مجموع زمان تمرین</span>
            <span className="text-lg font-extrabold text-slate-900">{totalMinutes} دقیقه</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100">
            <Dumbbell className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-semibold">کل حرکات اجرا شده</span>
            <span className="text-lg font-extrabold text-slate-900">{totalCompletedExercises} حرکت</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-semibold">کل حجم وزنه (kg)</span>
            <span className="text-lg font-extrabold text-amber-600 font-mono">
              {totalLiftedVolumeKg.toLocaleString()} kg
            </span>
          </div>
        </div>
      </div>

      {/* Progression Chart Section */}
      {chartData.length > 0 && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 text-white space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm font-heading text-white">
                  نمودار روند پیشرفت و حجم وزنه‌های جابجا شده
                </h3>
                <p className="text-[11px] text-slate-400">
                  نمایش میزان فشار و تناژ تمرینی ثبت شده در جلسات اخیر
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveChartMetric("volume")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeChartMetric === "volume"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🏋️ حجم وزنه (kg)
              </button>
              <button
                type="button"
                onClick={() => setActiveChartMetric("exercises")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeChartMetric === "exercises"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                📊 تعداد حرکات
              </button>
            </div>
          </div>

          {/* Dynamic SVG Visual Chart */}
          <div className="pt-4 pb-2">
            <div className="h-44 w-full flex items-end justify-between gap-2 px-2 border-b border-slate-800 pb-2">
              {chartData.map((d, i) => {
                const val = activeChartMetric === "volume" ? d.volume : d.exercises
                const max = activeChartMetric === "volume" ? maxVolume : maxExercises
                const heightPct = Math.max(8, Math.round((val / max) * 100))

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-[10px] px-2 py-1 rounded-lg text-emerald-300 font-mono font-bold whitespace-nowrap shadow-md pointer-events-none mb-1">
                      {activeChartMetric === "volume" ? `${d.volume.toLocaleString()} kg` : `${d.exercises} حرکت`}
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[36px] bg-slate-800 rounded-t-xl overflow-hidden flex items-end h-full">
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-xl transition-all duration-500 group-hover:from-emerald-500 group-hover:to-teal-300"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-white transition-colors truncate max-w-full">
                      {d.dateLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* History Log List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-600" />
          جزئیات جلسات تمرینی ثبت شده
        </h2>

        {loading ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
          </div>
        ) : parsedLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            هنوز تمرینی توسط شما تکمیل و ثبت نشده است. پس از اجرای اولین تمرین در حالت زنده، رکورد شما در اینجا ثبت می‌گردد.
          </div>
        ) : (
          <div className="space-y-3">
            {parsedLogs.map((log) => {
              const isExpanded = expandedLogId === log.id
              const hasSetMetrics = Object.keys(log.setMetrics || {}).length > 0

              return (
                <div
                  key={log.id}
                  className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all hover:border-emerald-200"
                >
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                          {log.dayLabel}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 font-mono">
                          {new Date(log.completedAt).toLocaleDateString("fa-IR")}
                        </span>

                        {log.totalVolume > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 text-[10px] font-extrabold font-mono border border-amber-200">
                            🏋️ {log.totalVolume.toLocaleString()} kg وزنه
                          </span>
                        )}
                      </div>

                      {log.notes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                          {log.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-700 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Clock className="h-4 w-4 text-slate-400" />
                        <span>{log.durationMinutes || 0} دقیقه</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>
                          {log.completedExercises} از {log.totalExercises} حرکت
                        </span>
                      </div>

                      <div className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Sets & Weights Detail Accordion */}
                  {isExpanded && (
                    <div className="p-5 bg-slate-50 border-t border-slate-100 space-y-3 animate-in fade-in duration-150 text-xs">
                      <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Layers className="h-4 w-4 text-emerald-600" />
                        جزئیات ست‌ها و وزنه‌های ثبت‌شده در این جلسه:
                      </h4>

                      {!hasSetMetrics ? (
                        <p className="text-[11px] text-slate-400 italic">جزئیات تفکیکی وزنه‌ها برای این جلسه ثبت نشده است.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.entries(log.setMetrics).map(([key, metrics]: [string, any]) => {
                            if (!log.completedSets?.[key]) return null
                            return (
                              <div
                                key={key}
                                className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between"
                              >
                                <span className="font-bold text-slate-700">ست {key.split("_")[1] || key}:</span>
                                <div className="font-mono text-emerald-700 font-extrabold text-xs">
                                  {metrics.weight || "0"} kg × {metrics.reps || "0"} تکرار
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
