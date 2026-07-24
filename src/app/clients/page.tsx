import Link from "next/link"
import { Users, Phone, ArrowLeft, Dumbbell, Utensils, AlertTriangle, Clock, CheckCircle2 } from "lucide-react"
import prisma from "@/lib/prisma"
import { ClientFormModal } from "./client-form-modal"

export const revalidate = 0

export default async function ClientsPage() {
  const activeTrainer = await prisma.trainer.findFirst({
    where: { role: "TRAINER" },
  })

  // Scoped to trainerId and filter out soft-deleted clients
  const whereClause: any = {
    isDeleted: false,
  }
  if (activeTrainer) {
    whereClause.trainerId = activeTrainer.id
  }

  const clients = await prisma.client.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: {
        orderBy: { endDate: "desc" },
        take: 1,
      },
      routineHistory: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { routine: true },
      },
      dietHistory: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { dietPlan: true },
      },
    },
  })

  const now = new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
            <Users className="h-7 w-7 text-emerald-600" />
            مدیریت شاگردان
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده پرونده، برنامه‌های تمرینی، رژیم غذایی و مدیریت اشتراک
          </p>
        </div>

        <ClientFormModal />
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-4 shadow-xs">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">هنوز شاگردی ثبت نشده است</h3>
            <p className="text-xs text-slate-500 mt-1">با کلیک بر روی دکمه فوق، اولین شاگرد خود را اضافه کنید.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client: any) => {
            const sub = client.subscriptions[0]
            const lastRoutine = client.routineHistory[0]?.routine
            const lastDiet = client.dietHistory[0]?.dietPlan

            // Subscription status calculation
            let subBadge = {
              label: "بدون اشتراک",
              className: "bg-slate-100 text-slate-500 border-slate-200",
              icon: null as any,
            }

            if (sub) {
              const endDate = new Date(sub.endDate)
              const diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 3600 * 24))

              if (endDate < now || sub.status === "EXPIRED") {
                subBadge = {
                  label: "منقضی شده (نیازمند تمدید)",
                  className: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
                  icon: <AlertTriangle className="h-3 w-3 text-rose-600 inline ml-1" />,
                }
              } else if (diffDays <= 7) {
                subBadge = {
                  label: `${diffDays} روز تا انقضا`,
                  className: "bg-amber-50 text-amber-700 border-amber-200 font-bold",
                  icon: <Clock className="h-3 w-3 text-amber-600 inline ml-1" />,
                }
              } else {
                subBadge = {
                  label: "اشتراک فعال",
                  className: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
                  icon: <CheckCircle2 className="h-3 w-3 text-emerald-600 inline ml-1" />,
                }
              }
            }

            return (
              <div
                key={client.id}
                className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md"
              >
                <div className="space-y-4">
                  {/* Avatar & Basic Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-lg shrink-0">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <Link href={`/clients/${client.id}`} className="font-bold text-base text-slate-900 hover:text-emerald-600 transition-colors">
                          {client.name}
                        </Link>
                        {client.phone && (
                          <span className="block text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-slate-400" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`text-[10px] border px-2 py-1 rounded-lg shrink-0 flex items-center ${subBadge.className}`}>
                      {subBadge.icon}
                      {subBadge.label}
                    </span>
                  </div>

                  {/* Body Stats */}
                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                    <div>
                      <span className="block text-[10px] text-slate-400">سن</span>
                      <span className="text-xs font-bold text-slate-800">{client.age ? `${client.age} سال` : '-'}</span>
                    </div>
                    <div className="border-x border-slate-200">
                      <span className="block text-[10px] text-slate-400">وزن</span>
                      <span className="text-xs font-bold text-slate-800">{client.weight ? `${client.weight} kg` : '-'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">قد</span>
                      <span className="text-xs font-bold text-slate-800">{client.height ? `${client.height} cm` : '-'}</span>
                    </div>
                  </div>

                  {/* Goals & Programs */}
                  <div className="space-y-2 text-xs">
                    {client.goals && (
                      <p className="text-slate-600 line-clamp-1">
                        <span className="text-slate-400">هدف: </span>
                        {client.goals}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Dumbbell className="h-3.5 w-3.5 text-emerald-600" />
                          تمرین:
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {lastRoutine ? lastRoutine.title : 'تعیین نشده'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-slate-50 border border-slate-200/60">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <Utensils className="h-3.5 w-3.5 text-teal-600" />
                          تغذیه:
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {lastDiet ? lastDiet.title : 'تعیین نشده'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Link */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    ثبت: {new Date(client.createdAt).toLocaleDateString('fa-IR')}
                  </span>
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group-hover:translate-x-[-2px] transition-all"
                  >
                    مشاهده پرونده کامل
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
