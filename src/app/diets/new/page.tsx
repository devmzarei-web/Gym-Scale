import prisma from "@/lib/prisma"
import { DietBuilderForm } from "./diet-builder-form"

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ clientId?: string }>
}

export default async function NewDietPage({ searchParams }: PageProps) {
  const { clientId } = await searchParams

  const clients = await prisma.client.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true, age: true, weight: true, height: true, goals: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <DietBuilderForm clients={clients} initialClientId={clientId} />
    </div>
  )
}
