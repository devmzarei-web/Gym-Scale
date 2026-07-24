"use client"

import { useState } from "react"
import { Edit3, Trash2, X, Loader2 } from "lucide-react"
import { deleteExerciseDictionaryItem, updateExerciseDictionaryItem } from "@/app/actions/exercise"
import { GifUploadInput } from "@/components/gif-upload-input"
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

export function ExerciseCardActions({ exercise }: { exercise: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`آیا از حذف حرکت "${exercise.name}" اطمینان دارید؟`)) return
    setDeleting(true)
    try {
      await deleteExerciseDictionaryItem(exercise.id)
    } catch (err: any) {
      toast.error(err.message || "خطا در حذف حرکت")
    } finally {
      setDeleting(false)
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await updateExerciseDictionaryItem(exercise.id, formData)
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err.message || "خطا در به‌روزرسانی حرکت")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
          title="ویرایش حرکت"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
          title="حذف حرکت"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-xl space-y-6 text-right">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900 font-heading">
                ویرایش حرکت "{exercise.name}"
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام حرکت</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={exercise.name}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">گروه عضله</label>
                <select
                  name="muscleGroup"
                  defaultValue={exercise.muscleGroup}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                >
                  {muscleGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات</label>
                <textarea
                  name="description"
                  defaultValue={exercise.description || ""}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 resize-none"
                />
              </div>

              <GifUploadInput name="gifUrl" value={exercise.gifUrl || ""} />

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">لینک ویدیوی آموزش</label>
                <input
                  type="url"
                  name="videoUrl"
                  defaultValue={exercise.videoUrl || ""}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
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
                  ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
