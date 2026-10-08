export type SubscriptionTierType = "FREE" | "TRIAL" | "STARTER" | "PRO"

export type SubscriptionAccessState = "ACTIVE" | "GRACE_PERIOD" | "LOCKED"

export interface TierConfig {
  name: SubscriptionTierType
  label: string
  badgeColor: string
  defaultMaxClients: number
  defaultAiQuota: number
  defaultValidityDays: number
}

export const TIER_CONFIGS: Record<SubscriptionTierType, TierConfig> = {
  TRIAL: {
    name: "TRIAL",
    label: "آزمایشی",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    defaultMaxClients: 5,
    defaultAiQuota: 3,
    defaultValidityDays: 14,
  },
  FREE: {
    name: "FREE",
    label: "آزمایشی",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    defaultMaxClients: 5,
    defaultAiQuota: 3,
    defaultValidityDays: 14,
  },
  STARTER: {
    name: "STARTER",
    label: "مربی پایه",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    defaultMaxClients: 25,
    defaultAiQuota: 30,
    defaultValidityDays: 30,
  },
  PRO: {
    name: "PRO",
    label: "باشگاه حرفه‌ای",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    defaultMaxClients: 100,
    defaultAiQuota: 100,
    defaultValidityDays: 30,
  },
}

export interface TrainerSubscriptionStatus {
  state: SubscriptionAccessState
  isGracePeriod: boolean
  isLocked: boolean
  daysRemaining: number | null
  graceDaysRemaining: number | null
}

/**
 * Calculates current subscription access state considering a 3-day grace period.
 */
export function getTrainerSubscriptionState(
  expiresAt: Date | string | null | undefined,
  role?: string
): TrainerSubscriptionStatus {
  // SuperAdmins are exempt from subscription expirations
  if (role === "SUPER_ADMIN") {
    return {
      state: "ACTIVE",
      isGracePeriod: false,
      isLocked: false,
      daysRemaining: null,
      graceDaysRemaining: null,
    }
  }

  // If no expiration date is configured, treat as perpetual active
  if (!expiresAt) {
    return {
      state: "ACTIVE",
      isGracePeriod: false,
      isLocked: false,
      daysRemaining: null,
      graceDaysRemaining: null,
    }
  }

  const expDate = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt
  const now = new Date()

  // Still within regular validity period
  if (now.getTime() <= expDate.getTime()) {
    const daysRemaining = Math.max(
      0,
      Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    )
    return {
      state: "ACTIVE",
      isGracePeriod: false,
      isLocked: false,
      daysRemaining,
      graceDaysRemaining: null,
    }
  }

  // Subscription expired: calculate 3-day grace period (72 hours)
  const graceEnd = new Date(expDate.getTime() + 3 * 24 * 60 * 60 * 1000)

  if (now.getTime() <= graceEnd.getTime()) {
    const graceDaysRemaining = Math.max(
      1,
      Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    )
    return {
      state: "GRACE_PERIOD",
      isGracePeriod: true,
      isLocked: false,
      daysRemaining: 0,
      graceDaysRemaining,
    }
  }

  // Grace period expired: account locked
  return {
    state: "LOCKED",
    isGracePeriod: false,
    isLocked: true,
    daysRemaining: 0,
    graceDaysRemaining: 0,
  }
}
