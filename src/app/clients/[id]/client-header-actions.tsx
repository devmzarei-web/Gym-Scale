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

            <div className="grid grid-cols-3 gap-3">
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
