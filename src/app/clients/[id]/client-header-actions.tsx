"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit3, Trash2, X, Loader2 } from "lucide-react"
import { updateClient, deleteClient } from "@/app/actions/client"
import { Modal } from "@/components/ui/modal"
import { toast } from "sonner"

export function ClientHeaderActions({ client }: { client: any }) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`آیا از حذف پرونده شاگرد "${client.name}" اطمینان دارید؟`)) return
    setDeleting(true)
    try {
      await deleteClient(client.id)
      toast.success(`پرونده "${client.name}" با موفقیت حذف شد.`)
      router.push("/clients")
    } catch (err: any) {
      toast.error(err.message || "خطا در حذف شاگرد")
    } finally {
      setDeleting(false)
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await updateClient(client.id, formData)
      toast.success("مشخصات شاگرد با موفقیت بروزرسانی شد.")
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err.message || "خطا در به‌روزرسانی مشخصات شاگرد")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
        >
          <Edit3 className="h-3.5 w-3.5 text-emerald-600" />
          ویرایش مشخصات
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-rose-200 transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-rose-600" />}
          حذف پرونده
        </button>
      </div>

      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title={`ویرایش پرونده "${client.name}"`}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">نام و نام خانوادگی</label>
              <input
                type="text"
                name="name"
                defaultValue={client.name}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">شماره تماس (ورود با موبایل)</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={client.phone || ""}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">کلمه عبور جدید (اختیاری)</label>
                <input
                  type="text"
                  name="password"
                  placeholder="تغییر کلمه عبور..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ایمیل (اختیاری)</label>
              <input
                type="email"
                name="email"
                defaultValue={client.email || ""}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">جنسیت</label>
                <select
                  name="gender"
                  defaultValue={client.gender || "MALE"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 font-bold"
                >
                  <option value="MALE">مرد</option>
                  <option value="FEMALE">زن</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سن</label>
                <input
                  type="number"
                  name="age"
                  defaultValue={client.age ?? ""}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وزن (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  defaultValue={client.weight ?? ""}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">قد (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  name="height"
                  defaultValue={client.height ?? ""}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اهداف ورزشی</label>
                <input
                  type="text"
                  name="goals"
                  defaultValue={client.goals || ""}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سطح آمادگی ورزشی (Fitness Level)</label>
                <select
                  name="fitnessLevel"
                  defaultValue={client.fitnessLevel || "INTERMEDIATE"}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 font-semibold"
                >
                  <option value="BEGINNER">مبتدی (Beginner)</option>
                  <option value="INTERMEDIATE">متوسط (Intermediate)</option>
                  <option value="ADVANCED">پیشرفته / ورزشکار حرفه‌ای (Advanced / Pro)</option>
                </select>
              </div>
            </div>

            {/* Muscular Athlete Checkbox option */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-3">
              <div>
                <span className="block text-xs font-bold text-amber-900">ورزشکار عضلانی / تناسب اندام (Muscular Athlete)</span>
                <span className="block text-[11px] text-amber-700 font-medium mt-0.5">
                  دارای توده عضلانی بالا و چربی پایین (شاخص BMI این فرد به عنوان «عضلانی/ورزشکاری» ثبت می‌شود نه اضافه وزن).
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  name="isMuscular"
                  defaultChecked={client.isMuscular === true}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ورزش اصلی / تخصصی (Primary Sport)</label>
              <input
                type="text"
                name="primarySport"
                defaultValue={client.primarySport || ""}
                placeholder="عنوان ورزش اصلی (مثال: بدنسازی، کراس‌فیت، شنا)"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و ملاحظات پزشکی</label>
              <textarea
                name="notes"
                defaultValue={client.notes || ""}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 resize-none"
              />
            </div>
          </fieldset>

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
      </Modal>
    </>
  )
}
