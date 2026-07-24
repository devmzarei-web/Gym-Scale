"use client"

import { useState } from "react"
import { Loader2, UserCheck } from "lucide-react"
import { assignClientToTrainer } from "@/app/actions/admin"
import { toast } from "sonner"

interface ClientTrainerAssignSelectorProps {
  clientId: string
  currentTrainerId: string | null
  trainers: Array<{ id: string; name: string }>
}

export function ClientTrainerAssignSelector({
  clientId,
  currentTrainerId,
  trainers,
}: ClientTrainerAssignSelectorProps) {
  const [loading, setLoading] = useState(false)
  const [selectedTrainerId, setSelectedTrainerId] = useState(currentTrainerId || "")

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newTrainerId = e.target.value
    setSelectedTrainerId(newTrainerId)
    setLoading(true)

    try {
      await assignClientToTrainer(clientId, newTrainerId || null)
    } catch (err: any) {
      toast.error(err.message || "خطا در تخصیص شاگرد به مربی")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
      ) : (
        <UserCheck className="h-3.5 w-3.5 text-slate-400" />
      )}
      <select
        value={selectedTrainerId}
        onChange={handleChange}
        disabled={loading}
        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-emerald-600"
      >
        <option value="">بدون تخصیص (آزاد)</option>
        {trainers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  )
}
