import Link from "next/link"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { Utensils, ArrowRight, Calendar } from "lucide-react"

export const revalidate = 0

export default async function ClientDietViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  const userId = session?.user?.id

  if (!userId) return null

  const dietPlan: any = await prisma.dietPlan.findUnique({
    where: { id },
  })

  if (!dietPlan) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 text-center text-xs text-slate-500 space-y-4">
        <p>برنامه تغذیه‌ای یافت نشد.</p>
        <Link href="/client" className="text-xs font-bold text-emerald-600 hover:underline">
          بازگشت به داشبورد
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-xl border border-teal-200 mb-2">
            <Utensils className="h-4 w-4" />
            برنامه تغذیه اختصاصی شما
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading">
            {dietPlan.title}
          </h1>
        </div>

        <Link
          href="/client"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-all"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت
        </Link>
      </div>

      {/* Content Container */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        {dietPlan.description && (
          <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
            {dietPlan.description}
          </p>
        )}

        <div
          className="prose prose-emerald max-w-none text-xs sm:text-sm text-slate-800 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: dietPlan.content }}
        />
      </div>
    </div>
  )
}
