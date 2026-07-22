import Link from "next/link"
import { Utensils, Plus, ArrowLeft, User } from "lucide-react"
import prisma from "@/lib/prisma"
import { auth } from "@/auth"

export const revalidate = 0

export default async function DietsPage() {
  const session = await auth()
  const user = session?.user
  const isSuperAdmin = (user as any)?.role === "SUPER_ADMIN"

  // Strict isolation: SuperAdmin sees all; Trainer sees ONLY their own diets or global templates
  const whereClause = isSuperAdmin
    ? {}
    : user?.id
    ? { OR: [{ trainerId: user.id }, { isTemplate: true }] }
    : { isTemplate: true }

  const diets = await prisma.dietPlan.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
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
            <Utensils className="h-7 w-7 text-teal-600" />
            برنامه‌های تغذیه و رژیم
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            طراحی وعده‌های غذایی، رژیم‌های کاهش/افزایش وزن و برنامه‌های تغذیه ورزشی
          </p>
        </div>

        <Link
          href="/diets/new"
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-xs"
        >
          <Plus className="h-4 w-4" />
          برنامه تغذیه جدید
        </Link>
      </div>

      {/* Diets Cards Grid */}
      {diets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3 shadow-xs">
          <Utensils className="mx-auto h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">هنوز برنامه تغذیه‌ای ثبت نشده است.</p>
          <Link
            href="/diets/new"
            className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all"
          >
            <Plus className="h-4 w-4" />
            ایجاد اولین برنامه تغذیه
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {diets.map((diet: any) => {
            const assignedClient = diet.history[0]?.client

            return (
              <div
                key={diet.id}
                className="group flex flex-col justify-between p-5 rounded-3xl bg-white border border-slate-200 hover:border-teal-300 transition-all space-y-4 shadow-xs hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-600 transition-colors">
                      {diet.title}
                    </h3>
                    {diet.isTemplate ? (
                      <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-md">
                        قالب آماده
                      </span>
                    ) : assignedClient ? (
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <User className="h-3 w-3 text-teal-600" />
                        {assignedClient.name}
                      </span>
                    ) : null}
                  </div>

                  {diet.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {diet.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {new Date(diet.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                  <Link
                    href={`/diets/${diet.id}`}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 group-hover:translate-x-[-2px] transition-all"
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
