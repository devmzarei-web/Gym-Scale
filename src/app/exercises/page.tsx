import { BookOpen, Dumbbell, ExternalLink } from "lucide-react"
import prisma from "@/lib/prisma"
import { AddExerciseModal } from "./add-exercise-modal"
import { ExerciseCardActions } from "./exercise-card-actions"

export const revalidate = 0

interface ExercisesPageProps {
  searchParams: Promise<{ group?: string; q?: string }>
}

export default async function ExercisesPage({ searchParams }: ExercisesPageProps) {
  const { group, q } = await searchParams

  const whereClause: any = {}
  if (group && group !== "همه") {
    whereClause.muscleGroup = group
  }
  if (q) {
    whereClause.name = { contains: q, mode: "insensitive" }
  }

  const exercises = await prisma.exerciseDictionary.findMany({
    where: whereClause,
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  })

  // Get muscle group list with counts
  const allExercises = await prisma.exerciseDictionary.findMany({
    select: { muscleGroup: true },
  })

  const muscleGroups = ["همه", "سینه", "پشت", "سرشانه", "بازو", "پا", "ساق پا", "شکم و پهلو"]
  
  const groupCounts = muscleGroups.reduce((acc, cat) => {
    if (cat === "همه") {
      acc[cat] = allExercises.length
    } else {
      acc[cat] = allExercises.filter((e: any) => e.muscleGroup === cat).length
    }
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
            <BookOpen className="h-7 w-7 text-emerald-600" />
            بانک حرکات ورزشی
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            آرشیو حرکات تمرینی همراه با دسته‌بندی عضلات و آموزش تصویری
          </p>
        </div>

        <AddExerciseModal />
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-2 overflow-x-auto">
        {muscleGroups.map((cat) => {
          const isActive = (!group && cat === "همه") || group === cat
          const count = groupCounts[cat] || 0

          return (
            <a
              key={cat}
              href={cat === "همه" ? "/exercises" : `/exercises?group=${encodeURIComponent(cat)}`}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <span>{cat}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${isActive ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </a>
          )
        })}
      </div>

      {/* Exercises Grid */}
      {exercises.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3 shadow-xs">
          <Dumbbell className="mx-auto h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-500">حرکتی در این گروه یافت نشد.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exercises.map((ex: any) => (
            <div
              key={ex.id}
              className="group p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 transition-all space-y-3 flex flex-col justify-between shadow-xs hover:shadow-md"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {ex.name}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                      {ex.muscleGroup}
                    </span>
                    <ExerciseCardActions exercise={ex} />
                  </div>
                </div>

                {ex.gifUrl && (
                  <div className="relative h-28 w-full rounded-xl bg-slate-900 overflow-hidden border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ex.gifUrl}
                      alt={ex.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold bg-slate-900/80 text-emerald-400 px-2 py-0.5 rounded-md backdrop-blur-xs">
                      GIF آموزش
                    </span>
                  </div>
                )}

                {ex.description && (
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {ex.description}
                  </p>
                )}
              </div>

              {(ex.videoUrl || ex.gifUrl) && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {ex.gifUrl ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      تصویر متحرک دارد
                    </span>
                  ) : <div />}

                  {ex.videoUrl && (
                    <a
                      href={ex.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                    >
                      ویدیوی آموزش
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
