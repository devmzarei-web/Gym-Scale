"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Download, Edit, Trash2, Loader2, Printer } from "lucide-react"
import { deleteRoutine } from "@/app/actions/routine"
import { toast } from "sonner"

export function RoutineActions({ routineId, clientId }: { routineId: string; clientId?: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const printUrl = clientId
    ? `/routines/${routineId}/pdf?clientId=${clientId}`
    : `/routines/${routineId}/pdf`

  async function handleDownloadPdf() {
    setDownloading(true)
    const toastId = toast.loading("در حال آماده‌سازی و دانلود فایل PDF...")
    try {
      const urlPath = clientId
        ? `/api/routines/${routineId}/pdf?clientId=${clientId}`
        : `/api/routines/${routineId}/pdf`

      const res = await fetch(urlPath)
      if (!res.ok) {
        const errorText = await res.text().catch(() => "")
        console.warn("Direct PDF download API error:", errorText)
        toast.dismiss(toastId)
        toast.info(
          "تولید فایل در پس‌زمینه سرور با محدودیت مواجه شد؛ صفحه اختصاصی چاپ برای شما باز می‌شود تا مستقیماً فایل PDF را ذخیره کنید.",
          { duration: 6000 }
        )
        window.open(printUrl, "_blank")
        return
      }
      
      const contentDisposition = res.headers.get("Content-Disposition")
      let fileName = `NutriTrain-Routine-${routineId}.pdf`
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)
        if (match && match[1]) {
          fileName = decodeURIComponent(match[1].replace(/["']/g, ""))
        }
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.dismiss(toastId)
      toast.success("فایل PDF با موفقیت دانلود شد.")
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.info(
        "ارتباط با موتور دانلود سرور برقرار نشد؛ صفحه اختصاصی چاپ برای دانلود و ذخیره مستقیم PDF باز شد.",
        { duration: 6000 }
      )
      window.open(printUrl, "_blank")
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
      toast.error(err.message || "خطا در حذف برنامه")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={printUrl}
        target="_blank"
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
        title="مشاهده نسخه چاپی استاندارد و ذخیره مستقیم PDF از مرورگر"
      >
        <Printer className="h-4 w-4" />
        چاپ و پیش‌نمایش PDF
      </Link>

      <button
        onClick={handleDownloadPdf}
        disabled={downloading}
        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
        title="دانلود خودکار فایل PDF از طریق موتور سرور"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
        ) : (
          <Download className="h-4 w-4 text-emerald-600" />
        )}
        {downloading ? "در حال دریافت..." : "دانلود مستقیم"}
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
