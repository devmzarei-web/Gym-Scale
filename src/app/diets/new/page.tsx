import prisma from "@/lib/prisma"
import { DietBuilderForm } from "./diet-builder-form"

export const revalidate = 0

interface PageProps {
  searchParams: Promise<{ clientId?: string }>
}

export default async function NewDietPage({ searchParams }: PageProps) {
  const { clientId } = await searchParams

  const clients = await prisma.client.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <DietBuilderForm clients={clients} initialClientId={clientId} />
    </div>
  )
}
