import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { DietBuilderForm } from "../../new/diet-builder-form"

export const revalidate = 0

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditDietPage({ params }: PageProps) {
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

  if (!diet) return notFound()

  const clients = await prisma.client.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const initialClientId = diet.history[0]?.clientId

  return (
    <div className="space-y-6">
      <DietBuilderForm
        clients={clients}
        initialClientId={initialClientId}
        existingDiet={diet}
      />
    </div>
  )
}
