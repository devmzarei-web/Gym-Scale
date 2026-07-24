"use client"

import { useState } from "react"
import { Ban, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { revokeSubscription } from "@/app/actions/client"

interface RevokeSubscriptionButtonProps {
  subscriptionId: string
  planName: string
}

export function RevokeSubscriptionButton({ subscriptionId, planName }: RevokeSubscriptionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRevoke() {
    setLoading(true)
    try {
      await revokeSubscription(subscriptionId)
      toast.success("اشتراک با موفقیت لغو شد.")
      setIsOpen(false)
    } catch (err: any) {
      toast.error(err.message || "خطا در لغو اشتراک.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 shrink-0"
        title="لغو فوری اشتراک"
      >
        <Ban className="h-3.5 w-3.5" />
        لغو اشتراک
      </button>

      {/* Confirmation Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4 text-right">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
                <Ban className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 font-heading">تایید لغو اشتراک</h3>
                <p className="text-xs text-slate-500 mt-0.5">آیا از لغو این اشتراک اطمینان دارید؟</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <span className="text-slate-500 block">عنوان اشتراک:</span>
              <span className="font-bold text-slate-900">{planName}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              با لغو این اشتراک، وضعیت آن به حالت <strong>«لغو شده»</strong> تغییر یافته و تاریخ پایان آن به تاریخ امروز بروزرسانی می‌گردد.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all flex items-center gap-1.5 shadow-xs"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "بله، لغو شود"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
