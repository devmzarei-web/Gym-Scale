"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2, Image as ImageIcon, Link as LinkIcon, Check } from "lucide-react"

interface GifUploadInputProps {
  value?: string | null
  onChange?: (url: string) => void
  name?: string
  label?: string
  compact?: boolean
}

export function GifUploadInput({
  value = "",
  onChange,
  name = "gifUrl",
  label = "تصویر متحرک آموزش (GIF / تصویر)",
  compact = false,
}: GifUploadInputProps) {
  const [currentUrl, setCurrentUrl] = useState<string>(value || "")
  const [uploading, setUploading] = useState<boolean>(false)
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUrlChange = (newUrl: string) => {
    setCurrentUrl(newUrl)
    if (onChange) onChange(newUrl)
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return

    // Preview locally immediately
    const localPreview = URL.createObjectURL(file)
    setCurrentUrl(localPreview)
    setError(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || "خطا در آپلود فایل")
      }

      handleUrlChange(data.url)
    } catch (err: any) {
      setError(err.message || "خطا در آپلود تصویر")
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleClear = () => {
    setCurrentUrl("")
    if (onChange) onChange("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label className={`block font-bold text-slate-700 ${compact ? "text-[10px]" : "text-xs"}`}>
            {label}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-semibold"
          >
            {showUrlInput ? (
              <>
                <Upload className="h-3 w-3" />
                آپلود فایل
              </>
            ) : (
              <>
                <LinkIcon className="h-3 w-3" />
                درج لینک (URL)
              </>
            )}
          </button>
        </div>
      )}

      {/* Hidden input to pass gifUrl to parent forms */}
      <input type="hidden" name={name} value={currentUrl} />

      {currentUrl ? (
        <div className={`relative border border-emerald-200 bg-emerald-50/50 rounded-xl overflow-hidden flex items-center gap-3 ${compact ? "p-2" : "p-3"}`}>
          <div className="relative h-14 w-14 rounded-lg bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 border border-slate-200 shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUrl}
              alt="GIF preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                // If preview fails
                ;(e.target as HTMLElement).style.display = "none"
              }}
            />
            {uploading && (
              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-emerald-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              {uploading ? "در حال آپلود..." : "فایل GIF انتخاب شد"}
            </p>
            <p className="text-[10px] text-slate-500 truncate dir-ltr text-right mt-0.5">
              {currentUrl}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            title="حذف GIF"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : showUrlInput ? (
        <div className="space-y-1">
          <input
            type="url"
            value={currentUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="https://example.com/exercise.gif"
            className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors ${
              compact ? "text-[11px]" : "text-xs"
            }`}
          />
        </div>
      ) : (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/gif,image/webp,image/png,image/jpeg"
            onChange={handleFileSelect}
            className="hidden"
            id={`gif-upload-input-${name}`}
          />
          <label
            htmlFor={`gif-upload-input-${name}`}
            className={`flex items-center justify-center gap-2 border border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 rounded-xl cursor-pointer transition-all ${
              compact ? "py-2 px-3 text-[11px]" : "py-3 px-4 text-xs"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
                <span className="font-semibold text-emerald-700">در حال آپلود...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-slate-700">انتخاب یا رهاسازی فایل GIF / تصویر</span>
              </>
            )}
          </label>
        </div>
      )}

      {error && <p className="text-[10px] text-rose-600 font-semibold">{error}</p>}
    </div>
  )
}
