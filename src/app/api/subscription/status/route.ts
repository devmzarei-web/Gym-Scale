import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { getTrainerSubscriptionState, TIER_CONFIGS } from "@/lib/subscription"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const role = (session.user as any).role
  if (role === "SUPER_ADMIN") {
    return NextResponse.json({
      role: "SUPER_ADMIN",
      tier: "PRO",
      tierLabel: "مدیر ارشد",
      state: "ACTIVE",
      isGracePeriod: false,
      isLocked: false,
      daysRemaining: null,
      graceDaysRemaining: null,
      clientCount: 0,
      maxClients: 999999,
      aiQuota: 999999,
    })
  }

  if (role === "CLIENT") {
    return NextResponse.json({
      role: "CLIENT",
      state: "ACTIVE",
      isGracePeriod: false,
      isLocked: false,
    })
  }

  // Trainer role
  const trainer = await prisma.trainer.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      tier: true,
      maxClients: true,
      aiQuota: true,
      expiresAt: true,
      role: true,
      _count: {
        select: {
          clients: {
            where: { isDeleted: false },
          },
        },
      },
    },
  })

  if (!trainer) {
    return NextResponse.json({ error: "Trainer not found" }, { status: 404 })
  }

  const subStatus = getTrainerSubscriptionState(trainer.expiresAt, trainer.role)
  const tierConfig = TIER_CONFIGS[trainer.tier] || TIER_CONFIGS.TRIAL
  const maxClients = trainer.maxClients ?? tierConfig.defaultMaxClients
  const clientCount = trainer._count.clients

  return NextResponse.json({
    role: trainer.role,
    tier: trainer.tier,
    tierLabel: tierConfig.label,
    state: subStatus.state,
    isGracePeriod: subStatus.isGracePeriod,
    isLocked: subStatus.isLocked,
    daysRemaining: subStatus.daysRemaining,
    graceDaysRemaining: subStatus.graceDaysRemaining,
    expiresAt: trainer.expiresAt,
    clientCount,
    maxClients,
    aiQuota: trainer.aiQuota,
    canCreateClient: clientCount < maxClients && !subStatus.isLocked,
  })
}
