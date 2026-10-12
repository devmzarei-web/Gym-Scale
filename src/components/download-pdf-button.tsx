"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface DownloadPdfButtonProps {
  url: string
  previewUrl: string
  fileName?: string
  className?: string
  label?: string
}

export function DownloadPdfButton({
  url,
  previewUrl,
  fileName,
  className = "text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50",
  label = "دانلود PDF",
}: DownloadPdfButtonProps) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault()
    setDownloading(true)
    const toastId = toast.loading("در حال آماده‌سازی و دریافت فایل PDF...")

    try {
      const res = await fetch(url)
      
      const contentType = res.headers.get("Content-Type") || ""
      // If server redirected to printable preview (e.g. 307 fallback), navigate directly
      if (res.redirected || contentType.includes("text/html")) {
        toast.dismiss(toastId)
        toast.info("در حال انتقال به صفحه چاپ و ذخیره مستقیم PDF...", { duration: 4000 })
        const targetUrl = res.url || (previewUrl.includes("?") ? `${previewUrl}&autoPrint=true` : `${previewUrl}?autoPrint=true`)
        window.location.href = targetUrl
        return
      }

      if (!res.ok) {
        throw new Error("خطا در پاسخ سرور")
      }

      const contentDisposition = res.headers.get("Content-Disposition")
      let targetFileName = fileName || "NutriTrain-Document.pdf"
      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)
        if (match && match[1]) {
          targetFileName = decodeURIComponent(match[1].replace(/["']/g, ""))
        }
      }

      const blob = await res.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = targetFileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)

      toast.dismiss(toastId)
      toast.success("فایل PDF با موفقیت دانلود شد.")
    } catch (err: any) {
      toast.dismiss(toastId)
      toast.info(
        "دانلود خودکار با محدودیت مواجه شد؛ در حال هدایت به صفحه چاپ و ذخیره مستقیم PDF...",
        { duration: 4500 }
      )
      // Navigate current tab to preview with auto-print — zero popup blocker traps!
      const fallbackUrl = previewUrl.includes("?")
        ? `${previewUrl}&autoPrint=true&error=server_engine_fallback`
        : `${previewUrl}?autoPrint=true&error=server_engine_fallback`
      window.location.href = fallbackUrl
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={className}
      title="دانلود مستقیم فایل PDF یا ذخیره مستقیم از صفحه استاندارد چاپی"
    >
      {downloading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      <span>{downloading ? "در حال دریافت..." : label}</span>
    </button>
  )
}
