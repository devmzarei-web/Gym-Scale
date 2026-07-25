import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { RoutineBuilderForm } from "../../new/routine-builder-form"

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditRoutinePage({ params }: PageProps) {
  const { id } = await params

  const routine = await prisma.routine.findUnique({
    where: { id },
    include: {
      workoutDays: {
        orderBy: { order: "asc" },
        include: {
          exercises: {
            orderBy: { order: "asc" },
          },
        },
      },
      history: {
        take: 1,
        include: { client: true },
      },
    },
  })

  if (!routine) return notFound()

  const exercises = await prisma.exerciseDictionary.findMany({
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  })

  const clients = await prisma.client.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const initialClientId = routine.history[0]?.clientId

  return (
    <div className="space-y-6">
      <RoutineBuilderForm
        exerciseDictionary={exercises}
        clients={clients}
        initialClientId={initialClientId}
        existingRoutine={routine}
      />
    </div>
  )
}
