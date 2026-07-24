"use client"

import { useState } from "react"
import { Plus, Loader2, BookOpen } from "lucide-react"
import { createExerciseDictionaryItem } from "@/app/actions/exercise"
import { GifUploadInput } from "@/components/gif-upload-input"
import { Modal } from "@/components/ui/modal"
import { toast } from "sonner"

const muscleGroups = [
  "سینه",
  "پشت",
  "سرشانه",
  "بازو",
  "پا",
  "ساق پا",
  "شکم و پهلو",
]

export function AddExerciseModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await createExerciseDictionaryItem(formData)
      toast.success("حرکت جدید با موفقیت ثبت شد.")
      setIsOpen(false)
    } catch (err: any) {
      toast.error(err.message || "خطا در ثبت حرکت جدید")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
      >
        <Plus className="h-4 w-4" />
        افزودن حرکت جدید
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="ثبت حرکت در بانک اطلاعاتی"
        titleIcon={<BookOpen className="h-5 w-5 text-emerald-600" />}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نام حرکت <span className="text-emerald-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="مثال: پرس بالا سینه دمبل"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                گروه عضله اصلی <span className="text-emerald-600">*</span>
              </label>
              <select
                name="muscleGroup"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 transition-colors"
              >
                {muscleGroups.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و نحوه اجرا</label>
              <textarea
                name="description"
                rows={2}
                placeholder="نکات کلیدی اجرا، فرم صحیح یا هشدارها..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors resize-none"
              />
            </div>

            <GifUploadInput name="gifUrl" />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">لینک ویدیوی آموزش (آپارات / یوتیوب)</label>
              <input
                type="url"
                name="videoUrl"
                placeholder="https://aparat.com/v/..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
              />
            </div>
          </fieldset>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              ثبت حرکت
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
