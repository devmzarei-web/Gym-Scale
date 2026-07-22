import Link from "next/link"
import { notFound } from "next/navigation"
import { Utensils, ArrowRight, User } from "lucide-react"
import prisma from "@/lib/prisma"
import { DietActions } from "./diet-actions"

export const revalidate = 0

interface DietPageProps {
  params: Promise<{ id: string }>
}

export default async function DietDetailPage({ params }: DietPageProps) {
  const { id } = await params

  const diet = await prisma.dietPlan.findUnique({
    where: { id },
    include: {
      history: {
        take: 1,
        include: { client: true },
      },
    },
  })

  if (!diet) {
    notFound()
  }

  const assignedClient = diet.history[0]?.client

  return (
    <div className="space-y-8">
      {/* Back button & Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <Link
          href="/diets"
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-700 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          بازگشت به لیست برنامه‌های تغذیه
        </Link>

        <DietActions dietId={diet.id} />
      </div>

      {/* Diet Card */}
      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900 font-heading">{diet.title}</h1>
              {diet.isTemplate ? (
                <span className="text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-full">
                  قالب آماده
                </span>
              ) : assignedClient ? (
                <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-teal-600" />
                  مخصوص {assignedClient.name}
                </span>
              ) : null}
            </div>
            {diet.description && (
              <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-3xl">
                {diet.description}
              </p>
            )}
          </div>
        </div>

        {/* Render HTML content safely */}
        <div
          className="prose max-w-none text-xs text-slate-800 leading-relaxed space-y-4 font-sans"
          dangerouslySetInnerHTML={{ __html: diet.content }}
        />
      </div>
    </div>
  )
}
