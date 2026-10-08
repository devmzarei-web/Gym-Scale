# Interface Contract: SuperAdmin Trainer Tier Management

**Feature**: `001-tiered-subscriptions-header-nav`  
**Date**: 2026-10-06  

---

## 1. Server Action: `updateTrainer` (`@/app/actions/admin.ts`)

### Payload Parameters
```typescript
interface UpdateTrainerPayload {
  trainerId: string
  name?: string
  email?: string
  phone?: string
  tier?: 'TRIAL' | 'STARTER' | 'PRO' | 'FREE'
  maxClients?: number
  aiQuota?: number
  expiresAt?: string // ISO date string or empty string to clear
  canCreateDiets?: boolean
  canCreateRoutines?: boolean
  canAccessRecipes?: boolean
}
```

### Auto-fill Presets (Admin UI behavior)
When SuperAdmin changes the `tier` selector in the modal:
- **`TRIAL`**: `maxClients = 5`, `aiQuota = 3`, `expiresAt = now + 14 days`
- **`STARTER`**: `maxClients = 25`, `aiQuota = 30`, `expiresAt = now + 30 days`
- **`PRO`**: `maxClients = 100`, `aiQuota = 100`, `expiresAt = now + 30 days`
Admin can manually override any of the auto-filled fields before pressing "ذخیره تغییرات".

---

## 2. Server Action: `createTrainer` (`@/app/actions/admin.ts`)

### Payload Parameters
- Accepts `tier` selection alongside other credentials.
- Auto-populates `maxClients`, `aiQuota`, and initial `expiresAt` based on the chosen tier preset.
