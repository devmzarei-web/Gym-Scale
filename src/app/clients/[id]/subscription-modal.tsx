"use client"

import { useState } from "react"
import { ShieldCheck, X, Loader2 } from "lucide-react"
import { createSubscription } from "@/app/actions/client"
import { toast } from "sonner"

export function SubscriptionModal({ clientId }: { clientId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await createSubscription(clientId, formData)
      setIsOpen(false)
    } catch (err: any) {
      toast.error(err.message || "خطا در تمدید اشتراک")
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
        <ShieldCheck className="h-4 w-4" />
        تمدید / ثبت اشتراک
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-slate-200 p-6 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                ثبت اشتراک جدید
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان پلن / دوره</label>
                <input
                  type="text"
                  name="planName"
                  defaultValue="اشتراک ۱ ماهه اختصاصی"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مدت دوره (ماه)</label>
                  <select
                    name="durationMonths"
                    defaultValue="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 transition-colors"
                  >
                    <option value="1">۱ ماهه</option>
                    <option value="2">۲ ماهه</option>
                    <option value="3">۳ ماهه (VIP)</option>
                    <option value="6">۶ ماهه</option>
                    <option value="12">یک ساله</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مبلغ (تومان)</label>
                  <input
                    type="number"
                    name="price"
                    placeholder="1500000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات / یادداشت</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="ملاحظات پرداختی یا جزئیات..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors resize-none"
                />
              </div>

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
                  ثبت و فعال‌سازی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
