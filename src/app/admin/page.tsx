import { ShieldCheck, Clock, Users, UserCheck } from "lucide-react"
import prisma from "@/lib/prisma"
import { AddTrainerModal } from "./add-trainer-modal"
import { TrainerTableActions } from "./trainer-table-actions"
import { ClientTrainerAssignSelector } from "./client-trainer-assign-selector"

export const revalidate = 0

export default async function AdminPage() {
  const trainers = await prisma.trainer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { clients: true, routines: true, dietPlans: true }
      }
    }
  })

  const clients = await prisma.client.findMany({
    where: { isDeleted: false },
    orderBy: { createdAt: "desc" },
    include: {
      trainer: true,
      subscriptions: {
        where: { status: "ACTIVE" },
        take: 1,
      }
    }
  })

  const trainerList = trainers.map((t: any) => ({ id: t.id, name: t.name }))

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
            پنل مدیریت ارشد سیستم
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            تعریف مربیان، ساخت اکانت‌های دمو با دسترسی‌های محدود و تخصیص شاگردان به مربیان
          </p>
        </div>

        <AddTrainerModal />
      </div>

      {/* Trainers Table */}
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs space-y-2">
        <div className="p-5 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            لیست مربیان و حساب‌های دمو
          </h2>
        </div>

        {trainers.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">هیچ مربی ثبت نشده است.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-4">نام مربی</th>
                  <th className="p-4">کد اختصاصی مربی</th>
                  <th className="p-4">ایمیل / شناسه</th>
                  <th className="p-4">نوع حساب</th>
                  <th className="p-4">سهمیه هوش مصنوعی</th>
                  <th className="p-4">سقف شاگردان</th>
                  <th className="p-4">دسترسی‌ها</th>
                  <th className="p-4">تاریخ انقضا (دمو)</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trainers.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                        {t.name.charAt(0)}
                      </div>
                      {t.name}
                    </td>
                    <td className="p-4 font-mono text-[11px]">
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg font-bold">
                        {t.trainerCode || `NT-${t.id.slice(-4).toUpperCase()}`}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-[11px]">{t.email}</td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1 items-start">
                        {t.role === "SUPER_ADMIN" ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            مدیر ارشد
                          </span>
                        ) : t.isDemo ? (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            حساب دمو (آزمایشی)
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            مربی اصلی
                          </span>
                        )}

                        {!t.isApproved && t.role !== "SUPER_ADMIN" && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-bold px-1.5 py-0.5 rounded-md animate-pulse">
                            در انتظار تایید مدیریت
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                          t.tier === "PRO"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}>
                          ⚡ {t.aiQuota ?? 3} در روز ({t.tier || "FREE"})
                        </span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold">
                      {t.role === "SUPER_ADMIN" || !t.isDemo ? (
                        <span className="text-emerald-700 font-bold">نامحدود ({t._count.clients} شاگرد)</span>
                      ) : (
                        <span className="text-slate-700">{t._count.clients} از {t.maxClients}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-[10px]">
                        {t.canCreateRoutines && <span className="bg-slate-100 text-emerald-700 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">تمرین</span>}
                        {t.canCreateDiets && <span className="bg-slate-100 text-teal-700 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">تغذیه</span>}
                        {t.canAccessRecipes && <span className="bg-slate-100 text-sky-700 px-1.5 py-0.5 rounded border border-slate-200 font-semibold">دستورپخت</span>}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500">
                      {t.expiresAt ? (
                        <span className="flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                          <Clock className="h-3 w-3" />
                          {new Date(t.expiresAt).toLocaleDateString("fa-IR")}
                        </span>
                      ) : (
                        <span className="text-slate-400">نامحدود</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <TrainerTableActions trainer={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SuperAdmin Client Assignment Table */}
      <div className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs space-y-2">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              تخصیص و انتقال شاگردان بین مربیان
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              به عنوان مدیر ارشد سیستم می‌توانید هر شاگرد را به مربی دلخواه تخصیص دهید
            </p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-xl border border-slate-200">
            {clients.length} شاگرد کل
          </span>
        </div>

        {clients.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400">هیچ شاگردی ثبت نشده است.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="p-4">نام شاگرد</th>
                  <th className="p-4">شماره تماس</th>
                  <th className="p-4">وضعیت اشتراک</th>
                  <th className="p-4">مربی فعلی</th>
                  <th className="p-4 text-left">تغییر و تخصیص مربی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                        {c.name.charAt(0)}
                      </div>
                      {c.name}
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-[11px]">{c.phone || "-"}</td>
                    <td className="p-4">
                      {c.subscriptions.length > 0 ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          اشتراک فعال
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          بدون اشتراک
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {c.trainer ? c.trainer.name : <span className="text-amber-600 italic">بدون مربی</span>}
                    </td>
                    <td className="p-4 text-left">
                      <ClientTrainerAssignSelector
                        clientId={c.id}
                        currentTrainerId={c.trainerId}
                        trainers={trainerList}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
