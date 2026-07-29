import Link from "next/link"
import { notFound } from "next/navigation"
import { Phone, Mail, Dumbbell, Utensils, Calendar, Plus, ArrowRight, Clock } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"
import { SubscriptionModal } from "./subscription-modal"
import { ClientHeaderActions } from "./client-header-actions"
import { RoutineActions } from "@/app/routines/[id]/routine-actions"
import { DietActions } from "@/app/diets/[id]/diet-actions"
import { AssignRoutineModal } from "./assign-routine-modal"
import { AssignDietModal } from "./assign-diet-modal"
import { UnassignDietButton } from "./unassign-diet-button"
import { UnassignRoutineButton } from "./unassign-routine-button"
import { TdeeCalculatorModal } from "@/components/tdee-calculator-modal"
import { ClientProgressChart } from "@/components/client-progress-chart"
import { ProgressPhotoGallery } from "@/components/progress-photo-gallery"
import { RevokeSubscriptionButton } from "./revoke-subscription-button"

export const revalidate = 0

interface ClientPageProps {
  params: Promise<{ id: string }>
}

export default async function ClientDetailPage({ params }: ClientPageProps) {
  const { id } = await params
  const session = await auth()
  const user = session?.user
  const isSuperAdmin = (user as any)?.role === "SUPER_ADMIN"

  const client: any = await prisma.client.findUnique({
    where: { id },
    include: {
      subscriptions: {
        orderBy: { createdAt: "desc" },
      },
      routineHistory: {
        orderBy: { createdAt: "desc" },
        include: {
          routine: {
            include: {
              workoutDays: {
                include: { exercises: true }
              }
            }
          }
        }
      },
      dietHistory: {
        orderBy: { createdAt: "desc" },
        include: { dietPlan: true }
      },
      workoutLogs: {
        orderBy: { completedAt: "desc" },
        take: 10,
      },
      progressLogs: {
        orderBy: { loggedAt: "asc" },
      }
    }
  })

  if (!client) {
    notFound()
  }

  // Fetch available routines & diets created by trainer (or templates) for assignment
  const routineWhere = isSuperAdmin
    ? {}
    : user?.id
    ? { OR: [{ trainerId: user.id }, { isTemplate: true }] }
    : { isTemplate: true }

  const dietWhere = isSuperAdmin
    ? {}
    : user?.id
    ? { OR: [{ trainerId: user.id }, { isTemplate: true }] }
    : { isTemplate: true }

  const availableRoutines = await prisma.routine.findMany({
    where: routineWhere,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { workoutDays: true } } }
  })

  const availableDiets = await prisma.dietPlan.findMany({
    where: dietWhere,
    orderBy: { createdAt: "desc" }
  })

  const formattedRoutines = availableRoutines.map((r: any) => ({
    id: r.id,
    title: r.title,
    isTemplate: r.isTemplate,
    workoutDaysCount: r._count.workoutDays
  }))

  const formattedDiets = availableDiets.map((d: any) => ({
    id: d.id,
    title: d.title,
    isTemplate: d.isTemplate
  }))

  // Calculate BMI if height and weight exist
  let bmi: string | null = null
  let bmiCategory: string | null = null
  if (client.weight && client.height) {
    const heightInMeters = client.height / 100
    const calculatedBmi = client.weight / (heightInMeters * heightInMeters)
    bmi = calculatedBmi.toFixed(1)

    const isAthletic = client.isMuscular === true

    if (calculatedBmi < 18.5) bmiCategory = "کمبود وزن"
    else if (calculatedBmi >= 25 && isAthletic) bmiCategory = "عضلانی / ورزشکاری 🏋️‍♂️"
    else if (calculatedBmi < 25) bmiCategory = "وزن ایده‌آل"
    else if (calculatedBmi < 30) bmiCategory = "اضافه وزن"
    else bmiCategory = "چاقی"
  }

  const activeSub = client.subscriptions.find((s: any) => s.status === "ACTIVE")
  const currentRoutine = client.routineHistory[0]?.routine
  const currentDiet = client.dietHistory[0]?.dietPlan

  return (
    <div className="space-y-8">
      {/* Back button & Header Actions */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Link
          href="/clients"
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به لیست شاگردان
        </Link>

        <ClientHeaderActions client={client} />
      </div>

      {/* Client Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-2xl shadow-xs">
              {client.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900 font-heading">{client.name}</h1>
                {activeSub ? (
                  <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    اشتراک فعال
                  </span>
                ) : (
                  <span className="text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
                    اشتراک منقضی شده / نیازمند تمدید
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                {client.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {client.phone}
                  </span>
                )}
                {client.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {client.email}
                  </span>
                )}
                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  عضویت: {new Date(client.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <TdeeCalculatorModal
              initialAge={client.age}
              initialWeight={client.weight}
              initialHeight={client.height}
            />
            <SubscriptionModal clientId={client.id} />
          </div>
        </div>

        {/* Physical Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <span className="block text-xs text-slate-400">سن</span>
            <span className="text-sm font-bold text-slate-800">{client.age ? `${client.age} سال` : "-"}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-400">وزن</span>
            <span className="text-sm font-bold text-slate-800">{client.weight ? `${client.weight} کیلوگرم` : "-"}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-400">قد</span>
            <span className="text-sm font-bold text-slate-800">{client.height ? `${client.height} سانتی‌متر` : "-"}</span>
          </div>
          <div>
            <span className="block text-xs text-slate-400">شاخص BMI</span>
            <span className="text-sm font-bold text-emerald-700">
              {bmi ? `${bmi} (${bmiCategory})` : "-"}
            </span>
          </div>
        </div>

        {client.goals && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-slate-700 block mb-1">اهداف ورزشی:</span>
            <p className="text-slate-600">{client.goals}</p>
          </div>
        )}
      </div>

      {/* Progress Chart & Anthropometric Analytics Component */}
      <ClientProgressChart clientId={client.id} logs={client.progressLogs} clientProfile={client} />

      {/* Progress Photo Gallery Component */}
      <ProgressPhotoGallery clientId={client.id} photoUrls={client.photoUrls} />

      {/* Routine & Diet Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Workout Routine Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Dumbbell className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 font-heading">برنامه تمرینی جاری</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <AssignRoutineModal clientId={client.id} routines={formattedRoutines} />

              <Link
                href={`/routines/new?clientId=${client.id}`}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                طراحی برنامه جدید
              </Link>
            </div>
          </div>

          {client.routineHistory && client.routineHistory.length > 0 ? (
            <div className="space-y-3">
              {client.routineHistory.map((historyItem: any) => {
                const routine = historyItem.routine
                if (!routine) return null
                return (
                  <div key={historyItem.id} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900">{routine.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                          {routine.workoutDays?.length || 0} روز تمرینی
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          {new Date(historyItem.createdAt).toLocaleDateString("fa-IR")}
                        </span>
                      </div>
                    </div>
                    {routine.description && (
                      <p className="text-xs text-slate-600">{routine.description}</p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/routines/${routine.id}`}
                          className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 bg-white border border-slate-200 px-3 py-2 rounded-xl transition-all"
                        >
                          مشاهده جزئیات
                          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                        </Link>
                        <a
                          href={`/api/routines/${routine.id}/pdf?clientId=${client.id}`}
                          download
                          className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          دانلود PDF
                        </a>
                      </div>
                      <UnassignRoutineButton historyId={historyItem.id} clientId={client.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
              <p className="text-xs text-slate-500">هیچ برنامه تمرینی برای این شاگرد ثبت نشده است.</p>
            </div>
          )}
        </div>

        {/* Diet Plan Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                <Utensils className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 font-heading">برنامه تغذیه جاری</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <AssignDietModal clientId={client.id} diets={formattedDiets} />

              <Link
                href={`/diets/new?clientId=${client.id}`}
                className="text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                طراحی برنامه تغذیه جدید
              </Link>
            </div>
          </div>

          {client.dietHistory && client.dietHistory.length > 0 ? (
            <div className="space-y-3">
              {client.dietHistory.map((historyItem: any) => {
                const diet = historyItem.dietPlan
                if (!diet) return null
                return (
                  <div key={historyItem.id} className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900">{diet.title}</h3>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                        {new Date(historyItem.createdAt).toLocaleDateString("fa-IR")}
                      </span>
                    </div>
                    {diet.description && (
                      <p className="text-xs text-slate-600">{diet.description}</p>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/diets/${diet.id}`}
                          className="text-xs font-bold text-slate-500 hover:text-slate-700 flex items-center gap-1 bg-white border border-slate-200 px-3 py-2 rounded-xl transition-all"
                        >
                          مشاهده جزئیات
                          <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                        </Link>
                        <a
                          href={`/api/diets/${diet.id}/pdf?clientId=${client.id}`}
                          download
                          className="text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                          دانلود PDF
                        </a>
                      </div>
                      <UnassignDietButton historyId={historyItem.id} clientId={client.id} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
              <p className="text-xs text-slate-500">هیچ برنامه تغذیه‌ای برای این شاگرد ثبت نشده است.</p>
            </div>
          )}
        </div>

      </div>

      {/* Completed Workout History */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-emerald-600" />
          تاریخچه تمرینات انجام شده توسط شاگرد
        </h2>

        {!client.workoutLogs || client.workoutLogs.length === 0 ? (
          <p className="text-xs text-slate-500">شاگرد هنوز در حالت تمرین زنده تمرینی ثبت نکرده است.</p>
        ) : (
          <div className="space-y-2">
            {client.workoutLogs.map((wLog: any) => (
              <div
                key={wLog.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{wLog.dayLabel}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(wLog.completedAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                  {wLog.notes && <p className="text-[11px] text-slate-500">{wLog.notes}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-600">{wLog.durationMinutes || 0} دقیقه</span>
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    {wLog.completedExercises} از {wLog.totalExercises} حرکت
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription History */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-600" />
          تاریخچه اشتراک‌های ورزشی
        </h2>

        {client.subscriptions.length === 0 ? (
          <p className="text-xs text-slate-500">هیچ اشتراکی تاکنون ثبت نشده است.</p>
        ) : (
          <div className="space-y-2">
            {client.subscriptions.map((sub: any) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800 block">{sub.planName}</span>
                  <span className="text-[10px] text-slate-400">
                    از {new Date(sub.startDate).toLocaleDateString("fa-IR")} تا {new Date(sub.endDate).toLocaleDateString("fa-IR")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {sub.price && <span className="font-bold text-slate-700">{sub.price.toLocaleString("fa-IR")} تومان</span>}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      sub.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : sub.status === "CANCELLED"
                        ? "bg-slate-100 text-slate-600 border border-slate-300"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {sub.status === "ACTIVE" ? "فعال" : sub.status === "CANCELLED" ? "لغو شده" : "منقضی شده"}
                  </span>
                  {sub.status === "ACTIVE" && (
                    <RevokeSubscriptionButton subscriptionId={sub.id} planName={sub.planName} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
