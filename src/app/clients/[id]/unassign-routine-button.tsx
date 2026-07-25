"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { unassignRoutineFromClient } from "@/app/actions/routine"
import { toast } from "sonner"

export function UnassignRoutineButton({ historyId, clientId }: { historyId: string; clientId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleUnassign() {
    if (!confirm("آیا از حذف این برنامه تمرینی برای شاگرد اطمینان دارید؟")) return
    setLoading(true)
    try {
      await unassignRoutineFromClient(historyId, clientId)
      toast.success("برنامه تمرینی با موفقیت از شاگرد حذف شد")
    } catch (err) {
      toast.error("خطا در حذف برنامه تمرینی")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleUnassign}
      disabled={loading}
      className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      حذف تخصیص
    </button>
  )
}
