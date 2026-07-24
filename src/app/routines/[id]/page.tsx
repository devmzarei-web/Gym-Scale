import Link from "next/link"
import { notFound } from "next/navigation"
import { Dumbbell, ArrowRight, User, Clock, Layers } from "lucide-react"
import prisma from "@/lib/prisma"
import { RoutineActions } from "./routine-actions"

export const revalidate = 0

interface RoutinePageProps {
  params: Promise<{ id: string }>
}

export default async function RoutineDetailPage({ params }: RoutinePageProps) {
  const { id } = await params

  const routine = await prisma.routine.findUnique({
    where: { id },
    include: {
      workoutDays: {
        orderBy: { order: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
          },
        },
      },
      history: {
        take: 1,
        include: { client: true },
      },
    },
  })

  if (!routine) {
    notFound()
  }

  const assignedClient = routine.history[0]?.client

  const groupBadges: Record<string, { label: string; className: string }> = {
    SUPERSET: { label: "سوپرست", className: "bg-amber-50 text-amber-800 border-amber-200 font-bold" },
    TRISET: { label: "تری‌ست", className: "bg-purple-50 text-purple-800 border-purple-200 font-bold" },
    CIRCUIT: { label: "سیرکت (چرخه‌ای)", className: "bg-cyan-50 text-cyan-800 border-cyan-200 font-bold" },
    DROPSET: { label: "دراپ‌ست", className: "bg-rose-50 text-rose-800 border-rose-200 font-bold" },
    REST_PAUSE: { label: "رست-پاز", className: "bg-blue-50 text-blue-800 border-blue-200 font-bold" },
    TEMPO: { label: "تمپو", className: "bg-teal-50 text-teal-800 border-teal-200 font-bold" },
  }

  return (
    <div className="space-y-8">
      {/* Back button & Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Link
          href="/routines"
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به لیست برنامه‌ها
        </Link>

        <RoutineActions routineId={routine.id} />
      </div>

      {/* Routine Title Card */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 font-heading">{routine.title}</h1>
              {routine.isTemplate ? (
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  قالب آماده
                </span>
              ) : assignedClient ? (
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                  مخصوص {assignedClient.name}
                </span>
              ) : null}
            </div>
            {routine.description && (
              <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-3xl">
                {routine.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Workout Days */}
      <div className="space-y-6">
        {routine.workoutDays.map((day: any) => (
          <div
            key={day.id}
            className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-emerald-600" />
                {day.label || day.day}
              </h2>
              <span className="text-xs text-slate-500 font-semibold">
                {day.exercises.length} حرکت
              </span>
            </div>

            <div className="space-y-3">
              {day.exercises.map((ex: any, idx: number) => {
                const groupInfo = groupBadges[ex.groupType]

                return (
                  <div
                    key={ex.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border gap-3 ${
                      ex.groupType !== "NORMAL" ? "bg-amber-50/40 border-amber-200" : "bg-slate-50 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-7 w-7 rounded-lg bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900">{ex.name}</h3>
                          {groupInfo && (
                            <span className={`text-[10px] border px-2 py-0.5 rounded-md flex items-center gap-1 ${groupInfo.className}`}>
                              <Layers className="h-3 w-3" />
                              {groupInfo.label}
                            </span>
                          )}
                        </div>
                        {ex.muscleGroup && (
                          <span className="text-[10px] text-emerald-700 font-semibold">{ex.muscleGroup}</span>
                        )}
                        {ex.customDescription && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{ex.customDescription}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl font-bold text-slate-800">
                        {ex.sets} ست
                      </span>
                      <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl font-semibold text-slate-700">
                        {ex.repetitions} تکرار
                      </span>
                      {ex.restTime && (
                        <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-slate-600 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {ex.restTime}
                        </span>
                      )}
                      {ex.weight && (
                        <span className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-amber-700 font-bold">
                          {ex.weight}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
