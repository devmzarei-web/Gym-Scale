"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Calendar,
  Clock,
  CheckCircle2,
  Dumbbell,
  Award,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react"

export default function ClientWorkoutHistoryPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  const totalMinutes = logs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0)
  const totalCompletedExercises = logs.reduce((acc, log) => acc + (log.completedExercises || 0), 0)

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
            <Award className="h-7 w-7 text-emerald-600" />
            تاریخچه تمرینات انجام شده
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            لیست جلسات تمرینی تکمیل شده و ثبت شده توسط شما
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-semibold">تعداد جلسات انجام شده</span>
            <span className="text-xl font-extrabold text-slate-900">{logs.length} جلسه</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-semibold">مجموع زمان تمرین</span>
            <span className="text-xl font-extrabold text-slate-900">{totalMinutes} دقیقه</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-cyan-50 text-cyan-600 rounded-2xl border border-cyan-100">
            <Dumbbell className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 font-semibold">کل حرکات اجرا شده</span>
            <span className="text-xl font-extrabold text-slate-900">{totalCompletedExercises} حرکت</span>
          </div>
        </div>
      </div>

      {/* History Log List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
          <Calendar className="h-5 w-5 text-emerald-600" />
          جلسات تمرینی ثبت شده
        </h2>

        {loading ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600 mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            هنوز تمرینی توسط شما تکمیل و ثبت نشده است. پس از اجرای اولین تمرین در حالت زنده، رکورد شما در اینجا ثبت می‌گردد.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-emerald-200"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                      {log.dayLabel}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      {new Date(log.completedAt).toLocaleDateString("fa-IR")}
                    </span>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
