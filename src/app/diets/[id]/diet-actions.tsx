"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Download, Trash2, Loader2, Edit3, Printer } from "lucide-react"
import { deleteDietPlan } from "@/app/actions/diet"
import { toast } from "sonner"

export function DietActions({ dietId, clientId }: { dietId: string; clientId?: string }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const printUrl = clientId
    ? `/diets/${dietId}/pdf?clientId=${clientId}`
    : `/diets/${dietId}/pdf`

  async function handleDownloadPdf() {
    setDownloading(true)
    const toastId = toast.loading("در حال آماده‌سازی و دانلود فایل PDF...")
    try {
      const urlPath = clientId
        ? `/api/diets/${dietId}/pdf?clientId=${clientId}`
        : `/api/diets/${dietId}/pdf`

      const res = await fetch(urlPath)
      const contentType = res.headers.get("Content-Type") || ""

      if (res.redirected || contentType.includes("text/html")) {
        toast.dismiss(toastId)
        toast.info("در حال انتقال به صفحه چاپ و ذخیره مستقیم PDF...", { duration: 4000 })
        const targetUrl = res.url || (printUrl.includes("?") ? `${printUrl}&autoPrint=true` : `${printUrl}?autoPrint=true`)
        window.location.href = targetUrl
        return
      }

      if (!res.ok) {
        throw new Error("خطا در پاسخ سرور")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `NutriTrain-Diet-${dietId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.dismiss(toastId)
      toast.success("فایل PDF برنامه تغذیه با موفقیت دانلود شد.")
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.info(
        "دانلود خودکار با محدودیت مواجه شد؛ در حال هدایت به صفحه چاپ و ذخیره مستقیم PDF...",
        { duration: 4500 }
      )
      const fallbackUrl = printUrl.includes("?")
        ? `${printUrl}&autoPrint=true&error=server_engine_fallback`
        : `${printUrl}?autoPrint=true&error=server_engine_fallback`
      window.location.href = fallbackUrl
    } finally {
      setDownloading(false)
    }
  }

  async function handleDelete() {
    if (!confirm("آیا از حذف این برنامه تغذیه اطمینان دارید؟")) return
    setDeleting(true)
    try {
      await deleteDietPlan(dietId)
      router.push("/diets")
    } catch (err: any) {
      toast.error(err.message || "خطا در حذف برنامه تغذیه")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={printUrl}
        target="_blank"
        className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs"
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
          <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
        ) : (
          <Download className="h-4 w-4 text-teal-600" />
        )}
        {downloading ? "در حال دریافت..." : "دانلود مستقیم"}
      </button>

      <Link
        href={`/diets/${dietId}/edit`}
        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors border border-slate-200 shadow-2xs"
      >
        <Edit3 className="h-4 w-4 text-slate-600" />
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
