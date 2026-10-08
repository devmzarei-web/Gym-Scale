# Interface Contract: Subscription Enforcement & Lifecycle

**Feature**: `001-tiered-subscriptions-header-nav`  
**Date**: 2026-10-06  

---

## 1. Helper Module Contract: `@/lib/subscription.ts`

### Types
```typescript
export type SubscriptionTierType = 'TRIAL' | 'STARTER' | 'PRO' | 'FREE'

export type SubscriptionAccessState = 'ACTIVE' | 'GRACE_PERIOD' | 'LOCKED'

export interface TierConfig {
  name: string
  label: string
  defaultMaxClients: number
  defaultAiQuota: number
  defaultValidityDays: number
}

export interface TrainerSubscriptionStatus {
  state: SubscriptionAccessState
  isGracePeriod: boolean
  isLocked: boolean
  daysRemaining: number | null
  graceDaysRemaining: number | null
  currentClientCount: number
  maxClients: number
  aiQuota: number
  canCreateClient: boolean
  canGenerateAi: boolean
}
```

### Methods
```typescript
/**
 * Evaluates the subscription access state for a trainer based on expiresAt and grace period (3 days).
 */
export function getTrainerSubscriptionState(
  expiresAt: Date | string | null,
  role?: string
): { state: SubscriptionAccessState; daysRemaining: number | null; graceDaysRemaining: number | null }

/**
 * Validates whether a trainer can create a new client.
 * Returns { allowed: true } or throws / returns error object.
 */
export async function assertCanCreateClient(trainerId: string): Promise<void>

/**
 * Validates whether a trainer can execute AI generation.
 */
export async function assertCanGenerateAi(trainerId: string): Promise<void>
```

---

## 2. Server Action Contract: `createClient` (`@/app/actions/client.ts`)

### Behavior
- **Authentication**: Obtains `session = await auth()`. If unauthenticated, throws `Unauthorized`.
- **Quota Validation**:
  - Fetches trainer by `session.user.id`.
  - Computes `getTrainerSubscriptionState(trainer.expiresAt, trainer.role)`.
  - If state is `LOCKED`, throws `"اشتراک شما منقضی شده است. لطفا جهت تمدید اقدام فرمایید."`
  - Counts active clients: `activeCount = await prisma.client.count({ where: { trainerId: trainer.id, isDeleted: false } })`.
  - If `activeCount >= (trainer.maxClients ?? 5)`, throws `"ظرفیت شاگردان شما در پلن فعلی تکمیل شده است (حداکثر ${trainer.maxClients} شاگرد). جهت افزودن شاگرد بیشتر، اشتراک خود را ارتقا دهید."`
- **Output**: Returns `{ success: true, clientId: string }` or throws Error caught by UI form handler.
