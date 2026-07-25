import Link from "next/link"
import { Users, Dumbbell, Utensils, BookOpen, ChefHat, Plus, ArrowLeft, UserPlus, ShieldCheck, Settings, Key } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export const revalidate = 0

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user
  const isSuperAdmin = (user as any)?.role === "SUPER_ADMIN"

  const activeTrainer = await prisma.trainer.findFirst({
    where: { role: "TRAINER" },
  })

  // Scoped clients query
  const clientWhereClause: any = { isDeleted: false }
  if (!isSuperAdmin && activeTrainer) {
    clientWhereClause.trainerId = activeTrainer.id
  }

  const clients = await prisma.client.findMany({
    where: clientWhereClause,
    take: 10,
    orderBy: { updatedAt: "desc" },
    include: {
      subscriptions: {
        where: { status: "ACTIVE" },
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

  // System stats for SuperAdmin
  const totalTrainers = isSuperAdmin ? await prisma.trainer.count() : 0
  const totalClients = isSuperAdmin ? await prisma.client.count() : 0
  const totalExercises = isSuperAdmin ? await prisma.exerciseDictionary.count() : 0
  const totalRecipes = isSuperAdmin ? await prisma.recipe.count() : 0

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-800 to-slate-900 text-white p-6 md:p-8 shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-heading tracking-tight">
              به پنل تخصصی Nutri<span className="text-emerald-300">Train</span> خوش آمدید
            </h1>
            <p className="text-xs md:text-sm text-emerald-100/80 mt-1 max-w-2xl">
              {isSuperAdmin
                ? "پنل مدیریت ارشد کل سیستم - مدیریت مربیان، اکانت‌های دمو و نظارت کلی بر پلتفرم."
                : "سامانه هوشمند مدیریت برنامه تمرینی، رژیم غذایی و شاگردان ورزشی."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isSuperAdmin ? (
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
                >
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  مدیریت ارشد مربیان
                </Link>
                <Link
                  href="/exercises"
                  className="flex items-center gap-2 bg-emerald-800/60 hover:bg-emerald-800 text-white border border-emerald-600/50 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                >
                  <BookOpen className="h-4 w-4 text-emerald-300" />
                  مدیریت بانک حرکات
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/clients"
                  className="flex items-center gap-2 bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
                >
                  <UserPlus className="h-4 w-4 text-emerald-600" />
                  افزودن شاگرد جدید
                </Link>
                <Link
                  href="/routines/new"
                  className="flex items-center gap-2 bg-emerald-800/60 hover:bg-emerald-800 text-white border border-emerald-600/50 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                >
                  <Dumbbell className="h-4 w-4 text-emerald-300" />
                  برنامه تمرینی جدید
                </Link>
                <Link
                  href="/diets/new"
                  className="flex items-center gap-2 bg-teal-800/60 hover:bg-teal-800 text-white border border-teal-600/50 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                >
                  <Utensils className="h-4 w-4 text-teal-300" />
                  برنامه تغذیه جدید
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* SuperAdmin Global System Controls */}
      {isSuperAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 block">تعداد کل مربیان</span>
            <span className="text-xl font-black text-slate-900">{totalTrainers} مربی</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 block">تعداد کل شاگردان</span>
            <span className="text-xl font-black text-emerald-700">{totalClients} شاگرد</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 block">حرکات ثبت شده</span>
            <span className="text-xl font-black text-teal-700">{totalExercises} حرکت</span>
          </div>
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <span className="text-xs text-slate-500 block">دستورپخت‌های موجود</span>
            <span className="text-xl font-black text-sky-700">{totalRecipes} دستور</span>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Clients List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <h2 className="text-lg font-bold text-slate-900 font-heading">
                {isSuperAdmin ? "شاگردان کل سیستم" : "لیست شاگردان اخیر"}
              </h2>
            </div>
            <Link
              href="/clients"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
            >
              مشاهده همه
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          {clients.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center space-y-3 shadow-xs">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-xs text-slate-500">هنوز شاگردی در این حساب ثبت نشده است.</p>
              <Link
                href="/clients"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
              >
                <Plus className="h-4 w-4" />
                ثبت اولین شاگرد
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client: any) => {
                const activeSub = client.subscriptions[0]
                const lastRoutine = client.routineHistory[0]?.routine
                const lastDiet = client.dietHistory[0]?.dietPlan

                return (
                  <div
                    key={client.id}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-base">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link href={`/clients/${client.id}`} className="font-bold text-sm text-slate-900 hover:text-emerald-600 transition-colors">
                            {client.name}
                          </Link>
                          {activeSub ? (
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                              اشتراک فعال
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                              بدون اشتراک فعال
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          {client.phone && <span>{client.phone}</span>}
                          {client.goals && <span className="truncate max-w-[200px] text-slate-400">هدف: {client.goals}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      {lastRoutine ? (
                        <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1">
                          <Dumbbell className="h-3.5 w-3.5 text-emerald-600" />
                          {lastRoutine.title}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">بدون برنامه تمرینی</span>
                      )}

                      <Link
                        href={`/clients/${client.id}`}
                        className="text-xs font-bold text-slate-700 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-slate-200 transition-all"
                      >
                        پروفایل
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Side Shortcuts & Tools (1 col) */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              دسترسی سریع به بانک اطلاعاتی
            </h2>

            <div className="grid grid-cols-1 gap-3">
              <Link
                href="/exercises"
                className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      بانک حرکات ورزشی
                    </span>
                    <span className="text-[10px] text-slate-500">۸۹ حرکت همراه با تفکیک عضلات</span>
                  </div>
                </div>
                <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-emerald-600 group-hover:-translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/recipes"
                className="group flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                    <ChefHat className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                      بانک دستورپخت رژیمی
                    </span>
                    <span className="text-[10px] text-slate-500">محاسبه درشت‌مغذی‌ها و کالری</span>
                  </div>
                </div>
                <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:-translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
