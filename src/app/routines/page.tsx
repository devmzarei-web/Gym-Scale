import Link from "next/link"
import { Dumbbell, Plus, ArrowLeft, User } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export const revalidate = 0

export default async function RoutinesPage() {
  const session = await auth()
  const user = session?.user
  const isSuperAdmin = (user as any)?.role === "SUPER_ADMIN"

  // Strict isolation: SuperAdmin sees all; Trainer sees ONLY their own routines or global templates
  const whereClause = isSuperAdmin
    ? {}
    : user?.id
    ? { OR: [{ trainerId: user.id }, { isTemplate: true }] }
    : { isTemplate: true }

  const routines = await prisma.routine.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      workoutDays: {
        include: { exercises: true },
      },
      history: {
        take: 1,
        include: { client: true },
      },
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
            <Dumbbell className="h-7 w-7 text-emerald-600" />
            برنامه‌های تمرینی
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            طراحی و مدیریت قالب‌های تمرینی اختصاصی و تخصیص به شاگردان
          </p>
        </div>

        <Link
          href="/routines/new"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
        >
          <Plus className="h-4 w-4" />
          ایجاد برنامه تمرینی جدید
        </Link>
      </div>

      {/* Routine Cards Grid */}
      {routines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3 shadow-xs">
          <Dumbbell className="mx-auto h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">هنوز برنامه تمرینی ایجاد نشده است.</p>
          <Link
            href="/routines/new"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
          >
            <Plus className="h-4 w-4" />
            ایجاد اولین برنامه تمرینی
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {routines.map((routine: any) => {
            const assignedClient = routine.history[0]?.client
            const totalExercises = routine.workoutDays.reduce((acc: number, day: any) => acc + day.exercises.length, 0)

            return (
              <div
                key={routine.id}
                className="group flex flex-col justify-between p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 transition-all space-y-4 shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors">
                      {routine.title}
                    </h3>
                    {routine.isTemplate ? (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                        قالب آماده
                      </span>
                    ) : assignedClient ? (
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <User className="h-3 w-3 text-emerald-600" />
                        {assignedClient.name}
                      </span>
                    ) : null}
                  </div>

                  {routine.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {routine.description}
                    </p>
                  )}

                  {/* Summary Info */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div>
                      <span className="block text-[10px] text-slate-400">روزهای تمرینی</span>
                      <span className="text-xs font-bold text-slate-800">{routine.workoutDays.length} روز</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400">مجموع حرکات</span>
                      <span className="text-xs font-bold text-emerald-700">{totalExercises} حرکت</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {new Date(routine.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                  <Link
                    href={`/routines/${routine.id}`}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group-hover:translate-x-[-2px] transition-all"
                  >
                    مشاهده برنامه
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
