"use client"

import { useState } from "react"
import { Edit3, Trash2, X, Loader2, KeyRound, CheckCircle, XCircle, Zap } from "lucide-react"
import { deleteTrainerAccount, updateTrainerAccount, toggleTrainerApproval } from "@/app/actions/admin"
import { toast } from "sonner"
import { TierSelectDropdown } from "@/components/tier-select-dropdown"
import { SubscriptionTierType } from "@/lib/subscription"

export function TrainerTableActions({ trainer }: { trainer: any }) {
  const [isEditing, setIsEditing] = useState(false)
  const [tier, setTier] = useState<SubscriptionTierType>(trainer.tier || "TRIAL")
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [approving, setApproving] = useState(false)

  async function handleToggleApproval() {
    const nextStatus = !trainer.isApproved
    const actionName = nextStatus ? "تایید" : "تعلیق"
    if (!confirm(`آیا از ${actionName} حساب مربی "${trainer.name}" اطمینان دارید؟`)) return
    setApproving(true)
    try {
      await toggleTrainerApproval(trainer.id, nextStatus)
    } catch (err: any) {
      toast.error(err.message || "خطا در تغییر وضعیت حساب مربی")
    } finally {
      setApproving(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`آیا از حذف حساب مربی "${trainer.name}" اطمینان دارید؟`)) return
    setDeleting(true)
    try {
      await deleteTrainerAccount(trainer.id)
    } catch (err: any) {
      toast.error(err.message || "خطا در حذف حساب مربی")
    } finally {
      setDeleting(false)
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new FormData(e.currentTarget)
      await updateTrainerAccount(trainer.id, formData)
      setIsEditing(false)
      toast.success("اطلاعات مربی با موفقیت به‌روزرسانی شد.")
    } catch (err: any) {
      toast.error(err.message || "خطا در به‌روزرسانی حساب مربی")
    } finally {
      setLoading(false)
    }
  }

  if (trainer.role === "SUPER_ADMIN") return null

  return (
    <>
      <div className="flex items-center gap-1 justify-center">
        <button
          onClick={handleToggleApproval}
          disabled={approving}
          className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors ${
            trainer.isApproved
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
              : "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-emerald-600 hover:text-white"
          }`}
          title={trainer.isApproved ? "حساب فعال (کلیک برای تعلیق)" : "در انتظار تایید (کلیک برای تایید)"}
        >
          {approving ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : trainer.isApproved ? (
            <>
              <CheckCircle className="h-3 w-3 text-emerald-600" />
              فعال
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 text-amber-700" />
              تایید حساب
            </>
          )}
        </button>

        <button
          onClick={() => setIsEditing(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
          title="ویرایش دسترسی‌ها و سهمیه هوش مصنوعی"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1 rounded-lg text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-50"
          title="حذف مربی"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 shadow-xl space-y-6 text-right">
            
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <h2 className="text-base font-bold text-slate-900 font-heading">
                ویرایش حساب مربی "{trainer.name}"
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نام مربی</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={trainer.name}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">کد اختصاصی مربی (Trainer ID / Code)</label>
                <input
                  type="text"
                  name="trainerCode"
                  defaultValue={trainer.trainerCode || `NT-${trainer.id.slice(-4).toUpperCase()}`}
                  placeholder="مثال: NT-1042 یا NT-ALIREZA"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">شماره تماس</label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={trainer.phone || ""}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">تغییر رمز عبور (در صورت نیاز)</label>
                <input
                  type="password"
                  name="password"
                  placeholder="در صورت عدم تغییر، خالی بگذارید..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600"
                />
              </div>

              {/* AI Quota & Tier Settings */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
                <span className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5 font-heading">
                  <Zap className="h-4 w-4 text-emerald-600 animate-pulse" />
                  مدیریت سطح اشتراک و سهمیه‌ها
                </span>
                
                <div>
                  <label className="block text-[11px] text-emerald-900 font-bold mb-1.5">انتخاب سطح اشتراک و پلن</label>
                  <TierSelectDropdown
                    value={tier}
                    onChange={(newTier) => setTier(newTier)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-emerald-900 font-bold mb-1">سهمیه هوش مصنوعی (ماهانه)</label>
                    <input
                      type="number"
                      name="aiQuota"
                      defaultValue={trainer.aiQuota ?? 3}
                      min={0}
                      max={999}
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-emerald-900 font-bold mb-1">سقف شاگردان فعال</label>
                    <input
                      type="number"
                      name="maxClients"
                      defaultValue={trainer.maxClients ?? 5}
                      min={1}
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-200/60">
                  <div>
                    <label className="block text-[11px] text-emerald-900 font-bold mb-1">تمدید اعتبار (به تعداد روز)</label>
                    <input
                      type="number"
                      name="extendDays"
                      placeholder="مثال: ۳۰"
                      min={1}
                      className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1">
                      یا تاریخ انقضای دستی:
                    </label>
                    <input
                      type="date"
                      name="expiresAt"
                      defaultValue={trainer.expiresAt ? new Date(trainer.expiresAt).toISOString().split("T")[0] : ""}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="block text-xs font-bold text-slate-800">دسترسی‌های مربی:</span>
                
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      name="canCreateRoutines"
                      defaultChecked={trainer.canCreateRoutines}
                      className="accent-emerald-600 rounded h-4 w-4"
                    />
                    امکان ساخت برنامه‌های تمرینی
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      name="canCreateDiets"
                      defaultChecked={trainer.canCreateDiets}
                      className="accent-emerald-600 rounded h-4 w-4"
                    />
                    امکان ساخت برنامه‌های تغذیه
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      name="canAccessRecipes"
                      defaultChecked={trainer.canAccessRecipes}
                      className="accent-emerald-600 rounded h-4 w-4"
                    />
                    دسترسی به بانک دستورپخت‌ها
                  </label>
                </div>
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
