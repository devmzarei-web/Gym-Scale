"use client"

import { useState } from "react"
import Link from "next/link"
import { Dumbbell, Play, FileText, Layers, X, ChevronLeft } from "lucide-react"

interface ClientRoutinesSectionProps {
  assignedRoutines: any[]
  clientId: string
}

export function ClientRoutinesSection({ assignedRoutines, clientId }: ClientRoutinesSectionProps) {
  const [isOpenModal, setIsOpenModal] = useState(false)

  if (assignedRoutines.length === 0) {
    return (
      <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="inline-flex items-center gap-2 text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-200">
              <Dumbbell className="h-4 w-4" />
              برنامه تمرینی فعال
            </span>
          </div>
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            هنوز برنامه تمرینی توسط مربی برای شما ثبت نشده است.
          </div>
        </div>
      </div>
    )
  }

  const activeRoutine = assignedRoutines[0]

  return (
    <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="inline-flex items-center gap-2 text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-200">
            <Dumbbell className="h-4 w-4" />
            برنامه تمرینی جاری شما
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            {activeRoutine.workoutDays?.length || 0} روز تمرینی
          </span>
        </div>

        {/* Active Routine Details */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-slate-900 font-heading">
            {activeRoutine.title}
          </h3>
          {activeRoutine.description && (
            <p className="text-xs text-slate-500 line-clamp-2">
              {activeRoutine.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            <Link
              href={`/client/workout/${activeRoutine.id}`}
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all shadow-xs"
            >
              <Play className="h-4 w-4 fill-white" />
              شروع تمرین زنده
            </Link>

            <a
              href={`/api/routines/${activeRoutine.id}/pdf?clientId=${clientId}`}
              download
              className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-3 px-4 rounded-xl transition-all"
            >
              <FileText className="h-4 w-4 text-emerald-600" />
              دانلود مستقیم PDF
            </a>
          </div>
        </div>

        {/* Multi-routine Switcher Trigger */}
        {assignedRoutines.length > 1 && (
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOpenModal(true)}
              className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-100 text-slate-700 p-3 rounded-2xl border border-slate-200 text-xs font-bold transition-all"
            >
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                <span>مشاهده سایر برنامه‌های تمرینی شما ({assignedRoutines.length} برنامه)</span>
              </div>
              <ChevronLeft className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        )}
      </div>

      {/* Routines Modal */}
      {isOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-600" />
                برنامه‌های تمرینی اختصاصی شما
              </h3>
              <button
                type="button"
                onClick={() => setIsOpenModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
              {assignedRoutines.map((routine, rIdx) => (
                <div
                  key={routine.id || rIdx}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 font-heading">
                      {routine.title}
                    </h4>
                    <span className="text-[10px] font-semibold text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                      {routine.workoutDays?.length || 0} روز تمرینی
                    </span>
                  </div>

                  {routine.description && (
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {routine.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/client/workout/${routine.id}`}
                      onClick={() => setIsOpenModal(false)}
                      className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-xs"
                    >
                      <Play className="h-3.5 w-3.5 fill-white" />
                      شروع تمرین زنده
                    </Link>

                    <a
                      href={`/api/routines/${routine.id}/pdf?clientId=${clientId}`}
                      download
                      className="flex items-center justify-center gap-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all"
                    >
                      <FileText className="h-3.5 w-3.5 text-emerald-600" />
                      دانلود مستقیم PDF
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
