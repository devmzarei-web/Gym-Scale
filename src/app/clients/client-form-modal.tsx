"use client"

import { useState } from "react"
import { UserPlus, Loader2, KeyRound } from "lucide-react"
import { createClient } from "@/app/actions/client"
import { Modal } from "@/components/ui/modal"
import { toast } from "sonner"

export function ClientFormModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await createClient(formData)
      toast.success("شاگرد جدید با موفقیت ثبت شد.")
      setIsOpen(false)
    } catch (err: any) {
      toast.error(err.message || "خطا در ایجاد شاگرد")
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
        <UserPlus className="h-4 w-4" />
        افزودن شاگرد جدید
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="ثبت شاگرد جدید"
        titleIcon={<UserPlus className="h-5 w-5 text-emerald-600" />}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <fieldset disabled={loading} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نام و نام خانوادگی <span className="text-emerald-600">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="مثال: علی محمدی"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Account Credentials Section */}
            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
              <p className="text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                اطلاعات ورود شاگرد به اپلیکیشن
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    شماره موبایل (ورود با موبایل)
                  </label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="09123456789"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    کلمه عبور اختصاصی
                  </label>
                  <input
                    type="text"
                    name="password"
                    placeholder="مثال: 123456"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ایمیل شاگرد (اختیاری)</label>
                <input
                  type="email"
                  name="email"
                  placeholder="ali@example.com"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">جنسیت</label>
                <select
                  name="gender"
                  defaultValue="MALE"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 transition-colors"
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
                  placeholder="25"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وزن (کیلوگرم)</label>
                <input
                  type="number"
                  step="0.1"
                  name="weight"
                  placeholder="75.5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">قد (سانتی‌متر)</label>
                <input
                  type="number"
                  step="0.1"
                  name="height"
                  placeholder="180"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">اهداف ورزشی</label>
              <input
                type="text"
                name="goals"
                placeholder="مثال: افزایش حجم عضلانی و کاهش چربی بدن"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
              />
            </div>

            {/* Primary Sport Dropdown + Custom Text Input */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">ورزش اصلی / تخصصی (Primary Sport)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  onChange={(e) => {
                    const customInput = document.getElementById("customSportInput") as HTMLInputElement
                    if (customInput && e.target.value !== "سایر") {
                      customInput.value = e.target.value
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 transition-colors"
                >
                  <option value="">انتخاب از لیست ورزش‌ها...</option>
                  <option value="تمرین در منزل">تمرین در منزل (Home Workout)</option>
                  <option value="کراس‌فیت">کراس‌فیت (CrossFit WOD)</option>
                  <option value="شنا">شنا (Swimming)</option>
                  <option value="فوتبال">فوتبال (Football/Soccer)</option>
                  <option value="بسکتبال">بسکتبال (Basketball)</option>
                  <option value="والیبال">والیبال (Volleyball)</option>
                  <option value="دو و میدانی">دو و میدانی (Running/Track)</option>
                  <option value="دوچرخه‌سواری">دوچرخه‌سواری (Cycling)</option>
                  <option value="کشتی">کشتی (Wrestling)</option>
                  <option value="هنرهای رزمی">هنرهای رزمی (MMA/Martial Arts)</option>
                  <option value="تنیس">تنیس (Tennis)</option>
                  <option value="بدنسازی">بدنسازی و فیتنس (Bodybuilding)</option>
                  <option value="سایر">سایر (تایپ دستی...)</option>
                </select>
                <input
                  id="customSportInput"
                  type="text"
                  name="primarySport"
                  placeholder="عنوان دقیق ورزش (مثال: شنا سرعتی)"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">توضیحات و ملاحظات پزشکی</label>
              <textarea
                name="notes"
                rows={2}
                placeholder="مصدومیت‌ها، حساسیت‌های غذایی یا نکات مهم..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-emerald-600 transition-colors resize-none"
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
              ثبت شاگرد
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
