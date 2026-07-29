import Link from "next/link"
import Image from "next/image"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import {
  Dumbbell,
  Utensils,
  Play,
  TrendingUp,
  User,
  MessageSquare,
  Scale,
  Ruler,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Sparkles,
  FileText,
  AlertTriangle,
  Lock,
} from "lucide-react"

import { ClientRoutinesSection } from "./client-routines-section"
import { ClientDietsSection } from "./client-diets-section"
import { FoodTrackerCard } from "@/components/food-tracker-card"

export const revalidate = 0

export default async function ClientDashboardPage() {
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) {
    return null
  }

  // Fetch client data with subscriptions, assigned routines, assigned diet, trainer, progress logs
  const client: any = await prisma.client.findUnique({
    where: { id: userId },
    include: {
      trainer: true,
      subscriptions: {
        orderBy: { endDate: "desc" },
      },
      routineHistory: {
        orderBy: { createdAt: "desc" },
        include: {
          routine: {
            include: {
              workoutDays: {
                orderBy: { order: "asc" },
                include: {
                  exercises: {
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
          },
        },
      },
      dietHistory: {
        orderBy: { createdAt: "desc" },
        include: {
          dietPlan: true,
        },
      },
      progressLogs: {
        orderBy: { loggedAt: "desc" },
        take: 5,
      },
      workoutLogs: {
        orderBy: { completedAt: "desc" },
        take: 5,
      },
    },
  })

  if (!client) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        اطلاعات حساب پیدا نشد.
      </div>
    )
  }

  // Active Subscription Check
  const now = new Date()
  const activeSub = client.subscriptions?.find(
    (s: any) => s.status === "ACTIVE" && new Date(s.endDate) >= now
  )
  const isSubscriptionActive = Boolean(activeSub)

  const rawRoutines = client.routineHistory?.map((h: any) => h.routine).filter(Boolean) || []
  const assignedRoutines = Array.from(new Map(rawRoutines.map((r: any) => [r.id, r])).values())
  const rawDiets = client.dietHistory?.map((h: any) => h.dietPlan).filter(Boolean) || []
  const assignedDiets = Array.from(new Map(rawDiets.map((d: any) => [d.id, d])).values())
  const latestWeight = client.progressLogs?.[0]?.weight || client.weight
  const heightInMeters = client.height ? client.height / 100 : null
  const numBmi = latestWeight && heightInMeters ? (latestWeight / (heightInMeters * heightInMeters)) : null
  const bmi = numBmi ? numBmi.toFixed(1) : null

  let bmiLabel = ""
  if (numBmi) {
    const isAthletic = client.isMuscular === true

    if (numBmi < 18.5) bmiLabel = " (کمبود وزن)"
    else if (numBmi >= 25 && isAthletic) bmiLabel = " (عضلانی / ورزشکاری)"
    else if (numBmi < 25) bmiLabel = " (وزن ایده‌آل)"
    else if (numBmi < 30) bmiLabel = " (اضافه وزن)"
    else bmiLabel = " (چاقی)"
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />
              پنل اختصاصی ورزشکار NutriTrain
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading">
              خوش آمدید، {client.name} عزیز 👋
            </h1>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              برنامه‌های تمرینی، رژیم غذایی و مسیر آمادگی جسمانی شما به صورت آنلاین و فایل PDF قابل دانلود در دسترس شماست.
            </p>
          </div>

          <Link
            href="/client/history"
            className="inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold px-4 py-3 rounded-2xl backdrop-blur-md transition-all shadow-sm shrink-0 w-fit"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-300" />
            تاریخچه تمرینات انجام شده ({client.workoutLogs?.length || 0})
          </Link>
        </div>

        {/* Decorative background element */}
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      {/* Subscription Expired Warning Banner if inactive */}
      {!isSubscriptionActive && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 shadow-sm space-y-3 text-rose-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold font-heading text-rose-900">
                اشتراک ورزشی شما فعال نیست
              </h3>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                برای دسترسی به برنامه‌های تمرینی آنلاین، برنامه تغذیه و شروع تمرین زنده، لطفاً جهت تمدید اشتراک با مربی خود تماس بگیرید.
              </p>
            </div>
          </div>

          {client.trainer && (
            <div className="pt-2 flex justify-end">
              <Link
                href="/client/messages"
                className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
              >
                <MessageSquare className="h-4 w-4" />
                درخواست تمدید اشتراک از {client.trainer.name}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Grid Section 1: Assigned Routines & Active Diet */}
      {isSubscriptionActive ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workout Routines Card with Modal Switcher */}
          <ClientRoutinesSection assignedRoutines={assignedRoutines} clientId={client.id} />

          {/* Diet Plans Card with Modal Switcher */}
          <ClientDietsSection assignedDiets={assignedDiets} clientId={client.id} />
        </div>
      ) : (
        <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-3">
          <Lock className="h-8 w-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">دسترسی به خدمات محدود شده است</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            به دلیل عدم وجود اشتراک فعال، دسترسی به برنامه‌های تمرینی و تغذیه موقتاً مسدود می‌باشد.
          </p>
        </div>
      )}

      {/* Calorie & Food Bank Tracker Component */}
      <FoodTrackerCard />

      {/* Grid Section 2: Physical Metrics & Assigned Trainer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Physical Stats Card */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <Scale className="h-5 w-5 text-emerald-600" />
              شاخص‌های آمادگی جسمانی
            </h3>
            <Link
              href="/client/progress"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <TrendingUp className="h-4 w-4" />
              ثبت وزنگشت و اندازه‌ها
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="block text-[11px] font-semibold text-slate-400 mb-1">آخرین وزن ثبت شده</span>
              <span className="text-lg font-extrabold text-slate-900">{latestWeight ? `${latestWeight} kg` : "-"}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="block text-[11px] font-semibold text-slate-400 mb-1">قد ثبت شده</span>
              <span className="text-lg font-extrabold text-slate-900">{client.height ? `${client.height} cm` : "-"}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="block text-[11px] font-semibold text-slate-400 mb-1">شاخص BMI</span>
              <span className="text-base font-extrabold text-emerald-700">{bmi ? `${bmi}${bmiLabel}` : "-"}</span>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="block text-[11px] font-semibold text-slate-400 mb-1">سن</span>
              <span className="text-lg font-extrabold text-slate-900">{client.age ? `${client.age} سال` : "-"}</span>
            </div>
          </div>

          {client.goals && (
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/70 rounded-2xl space-y-1">
              <span className="text-xs font-bold text-emerald-900 block">هدف تایید شده شما:</span>
              <p className="text-xs text-slate-700">{client.goals}</p>
            </div>
          )}
        </div>

        {/* Assigned Trainer Card */}
        <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="h-5 w-5 text-emerald-600" />
              مربی اختصاصی شما
            </h3>

            {client.trainer ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-lg border border-emerald-200">
                    {client.trainer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{client.trainer.name}</h4>
                    <span className="text-[11px] font-mono text-emerald-700">
                      {client.trainer.trainerCode || `NT-${client.trainer.id.slice(-4).toUpperCase()}`}
                    </span>
                  </div>
                </div>

                {client.trainer.bio && (
                  <p className="text-xs text-slate-500 line-clamp-3">
                    {client.trainer.bio}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                هنوز مربی اختصاصی برای شما مشخص نشده است.
              </div>
            )}
          </div>

          {client.trainer && (
            <Link
              href="/client/messages"
              className="w-full flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold py-3 rounded-2xl transition-all"
            >
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              ارسال پیام به مربی
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
