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
    const toastId = toast.loading("در حال آماده‌سازی و دانلود فایل PDF...")

    try {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error("خطا در تولید فایل توسط سرور")
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
        "دانلود مستقیم موقتاً با محدودیت سرور مواجه شد؛ صفحه اختصاصی چاپ برای شما باز شد تا مستقیماً فایل PDF را ذخیره کنید.",
        { duration: 6000 }
      )
      window.open(previewUrl, "_blank")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className={className}
      title="دانلود مستقیم فایل PDF یا باز کردن صفحه استاندارد چاپی"
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
