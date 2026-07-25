"use client"

import { useState } from "react"
import Image from "next/image"
import { Camera, Plus, Loader2, Lock, Eye, Trash2 } from "lucide-react"
import { Modal } from "@/components/ui/modal"
import { addProgressPhoto } from "@/app/actions/client"
import { toast } from "sonner"
import { compressImage } from "@/lib/image-compressor"

interface ProgressPhotoGalleryProps {
  clientId: string
  photoUrls: string[]
}

export function ProgressPhotoGallery({ clientId, photoUrls }: ProgressPhotoGalleryProps) {
  const [photos, setPhotos] = useState<string[]>(photoUrls)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0]
    if (!rawFile) return

    setUploading(true)
    try {
      // Compress image client-side before uploading
      const compressedFile = await compressImage(rawFile, 1200, 1200, 0.8)

      const formData = new FormData()
      formData.append("file", compressedFile)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })


      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || "خطا در آپلود تصویر")
      }

      await addProgressPhoto(clientId, data.url)
      setPhotos((prev) => [...prev, data.url])
      toast.success("تصویر پیشرفت با موفقیت اضافه شد.")
      setIsModalOpen(false)
    } catch (err: any) {
      toast.error(err.message || "خطا در آپلود تصویر")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-heading flex items-center gap-1.5">
              آلبوم تصاویر پیشرفت بدنی
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="h-2.5 w-2.5 text-emerald-600" />
                محرمانه (فقط مربی و شاگرد)
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              ثبت تصاویری برای مقایسه روند تغییرات ظاهری
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-2xs"
        >
          <Plus className="h-3.5 w-3.5" />
          افزودن تصویر جدید
        </button>
      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <Camera className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-500">
            تصویری برای این شاگرد ثبت نشده است.
          </p>
          <p className="text-[11px] text-slate-400">
            با افزودن عکس‌های ماهانه، روند تغییرات بدنی را به تصویر بکشید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {photos.map((url, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedPhoto(url)}
              className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 cursor-pointer bg-slate-100 hover:border-teal-500 transition-all shadow-2xs"
            >
              <Image
                src={url}
                alt={`تصویر پیشرفت ${idx + 1}`}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Eye className="h-5 w-5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="آپلود تصویر جدید پیشرفت بدنی"
        titleIcon={<Camera className="h-5 w-5 text-teal-600" />}
      >
        <div className="space-y-4 text-center py-4">
          <div className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-6 transition-colors bg-slate-50">
            {uploading ? (
              <div className="space-y-2 py-4">
                <Loader2 className="h-8 w-8 text-teal-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-700">در حال آپلود و ذخیره تصویر...</p>
              </div>
            ) : (
              <label className="cursor-pointer space-y-3 block">
                <div className="mx-auto h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100">
                  <Camera className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-teal-700 hover:underline">
                    انتخاب تصویر از گوشی یا رایانه
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">فرمت‌های مجاز: JPG, PNG, WEBP (حداکثر ۵ مگابایت)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </Modal>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full h-full flex items-center justify-center">
            <Image
              src={selectedPhoto}
              alt="تصویر پیشرفت کامل"
              fill
              className="object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  )
}
