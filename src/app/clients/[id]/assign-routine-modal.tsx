"use client"

import { useState } from "react"
import { Dumbbell, Plus, Loader2, Check } from "lucide-react"
import { assignExistingRoutineToClient } from "@/app/actions/routine"
import { toast } from "sonner"

interface AssignRoutineModalProps {
  clientId: string
  routines: Array<{ id: string; title: string; isTemplate: boolean; workoutDaysCount: number }>
}

export function AssignRoutineModal({ clientId, routines }: AssignRoutineModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleAssign() {
    if (!selectedId) return
    setLoading(true)
    try {
      await assignExistingRoutineToClient(selectedId, clientId)
      setIsOpen(false)
      setSelectedId("")
    } catch (err: any) {
      toast.error(err.message || "خطا در تخصیص برنامه تمرینی")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-xs font-bold bg-slate-100 hover:bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors flex items-center gap-1"
      >
        <Plus className="h-3.5 w-3.5" />
        انتخاب از برنامه‌های موجود
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-extrabold text-slate-900 font-heading flex items-center gap-2 text-base">
                <Dumbbell className="h-5 w-5 text-emerald-600" />
                تخصیص برنامه تمرینی موجود
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {routines.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                هیچ برنامه تمرینی در آرشیو شما یافت نشد.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {routines.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      selectedId === r.id
                        ? "bg-emerald-50 border-emerald-500 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-900 block">{r.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {r.workoutDaysCount} روز تمرینی {r.isTemplate ? "• (قالب آماده)" : ""}
                      </span>
                    </div>

                    {selectedId === r.id && (
                      <div className="h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedId || loading}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تخصیص برنامه"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
