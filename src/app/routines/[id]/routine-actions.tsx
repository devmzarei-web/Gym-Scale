"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Download, Edit, Trash2, Loader2 } from "lucide-react"
import { deleteRoutine } from "@/app/actions/routine"

export function RoutineActions({ routineId }: { routineId: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function handleDownloadPdf() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/routines/${routineId}/pdf`)
      if (!res.ok) {
        throw new Error("خطا در تولید فایل PDF")
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `Routine-${routineId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      alert(err.message || "خطا در دانلود فایل PDF")
    } finally {
      setDownloading(false)
    }
  }

  async function handleDelete() {
    if (!confirm("آیا از حذف این برنامه تمرینی اطمینان دارید؟")) return
    setDeleting(true)
    try {
      await deleteRoutine(routineId)
      router.push("/routines")
    } catch (err: any) {
      alert(err.message || "خطا در حذف برنامه")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs disabled:opacity-50"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {downloading ? "در حال تولید PDF..." : "دانلود مستقیم PDF"}
      </button>

      <Link
        href={`/routines/${routineId}/edit`}
        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 transition-colors"
      >
        <Edit className="h-4 w-4 text-emerald-600" />
        ویرایش برنامه
      </Link>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3.5 py-2 rounded-xl border border-rose-200 transition-colors disabled:opacity-50"
      >
        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-rose-600" />}
        حذف برنامه
      </button>
    </div>
  )
}
