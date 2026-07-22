import prisma from "@/lib/prisma"
import { RoutineBuilderForm } from "./routine-builder-form"

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ clientId?: string }>
}

export default async function NewRoutinePage({ searchParams }: PageProps) {
  const { clientId } = await searchParams

  const exercises = await prisma.exerciseDictionary.findMany({
    orderBy: [{ muscleGroup: "asc" }, { name: "asc" }],
  })

  const clients = await prisma.client.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <RoutineBuilderForm
        exerciseDictionary={exercises}
        clients={clients}
        initialClientId={clientId}
      />
    </div>
  )
}
