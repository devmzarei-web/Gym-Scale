"use client"

import { useState } from "react"
import { ShieldCheck, Plus, X, Loader2 } from "lucide-react"
import { createTrainerAccount } from "@/app/actions/admin"
import { toast } from "sonner"

export function AddTrainerModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isDemo, setIsDemo] = useState(true)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await createTrainerAccount(formData)
      setIsOpen(false)
    } catch (err: any) {
      toast.error(err.message || "خطا در ساخت حساب مربی")
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
        تعریف مربی / اکانت دمو
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                تعریف مربی جدید (با دسترسی‌های سفارشی دمو)
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام مربی <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="مثال: استاد رضا کریمی"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ایمیل ورودی <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="trainer@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    کد اختصاصی مربی (اختیاری)
                  </label>
                  <input
                    type="text"
                    name="trainerCode"
                    placeholder="خودکار ساخته می‌شود یا دستی وارد کنید..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رمز عبور <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                />
              </div>

              {/* Demo Account Switch */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isDemo"
                      checked={isDemo}
                      onChange={(e) => setIsDemo(e.target.checked)}
                      className="accent-emerald-600 rounded h-4 w-4"
                    />
                    حساب آزمایشی / دمو (محدودیت زمانی یا شاگردان)
                  </label>
                </div>

                {isDemo && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">سقف مجاز شاگردان</label>
                      <input
                        type="number"
                        name="maxClients"
                        defaultValue={10}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">مدت اعتبار (روز)</label>
                      <input
                        type="number"
                        name="durationDays"
                        defaultValue={14}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="block text-xs font-bold text-slate-800">دسترسی‌های فعال مربی:</span>
                
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" name="canCreateRoutines" defaultChecked className="accent-emerald-600 rounded h-4 w-4" />
                    امکان ساخت و ویرایش برنامه‌های تمرینی
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" name="canCreateDiets" defaultChecked className="accent-emerald-600 rounded h-4 w-4" />
                    امکان ساخت و ویرایش برنامه‌های تغذیه
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input type="checkbox" name="canAccessRecipes" defaultChecked className="accent-emerald-600 rounded h-4 w-4" />
                    دسترسی به بانک دستورپخت‌ها
                  </label>
                </div>
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
                  ساخت اکانت مربی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
