import Link from "next/link"
import { Users, Phone, ArrowLeft, Dumbbell, Utensils, AlertTriangle, Clock, CheckCircle2 } from "lucide-react"
import prisma from "@/lib/prisma"
import { ClientFormModal } from "./client-form-modal"
import { ClientList } from "./client-list"

export const revalidate = 0

export default async function ClientsPage() {
  const activeTrainer = await prisma.trainer.findFirst({
    where: { role: "TRAINER" },
  })

  // Scoped to trainerId and filter out soft-deleted clients
  const whereClause: any = {
    isDeleted: false,
  }
  if (activeTrainer) {
    whereClause.trainerId = activeTrainer.id
  }

  const clients = await prisma.client.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      subscriptions: {
        orderBy: { endDate: "desc" },
        take: 1,
      },
      routineHistory: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { routine: true },
      },
      dietHistory: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { dietPlan: true },
      },
    },
  })

  const now = new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-heading flex items-center gap-2.5">
            <Users className="h-7 w-7 text-emerald-600" />
            مدیریت شاگردان
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده پرونده، برنامه‌های تمرینی، رژیم غذایی و مدیریت اشتراک
          </p>
        </div>

        <ClientFormModal />
      </div>

      {/* Clients List Component with Search & Filters */}
      <ClientList initialClients={clients} />
    </div>
  )
}

