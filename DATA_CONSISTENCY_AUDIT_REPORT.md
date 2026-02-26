# Data Consistency Audit Report: Frontend vs Backend

**Date:** February 13, 2025  
**Scope:** Luneo Platform – enum consistency, API response shapes, type definitions, error codes, middleware role checks.

---

## 1. Enum Consistency

### 1.1 UserRole

| Source | Values | Status |
|--------|--------|--------|
| **Backend Prisma** (`apps/backend/prisma/schema.prisma`) | `CONSUMER`, `BRAND_USER`, `BRAND_ADMIN`, `PLATFORM_ADMIN`, `FABRICATOR` | Reference |
| **Frontend** `apps/frontend/src/lib/types/index.ts` | Same | Matches |
| **Frontend** `apps/frontend/src/lib/rbac.ts` | `USER`, `ADMIN`, `SUPER_ADMIN`, `TEAM_MEMBER`, `OWNER` (values: `'user'`, `'admin'`, `'super_admin'`, etc.) | **MISMATCH** |
| **Mobile** `apps/mobile/src/types/index.ts` | `PLATFORM_ADMIN`, `BRAND_ADMIN`, `BRAND_USER`, **`CUSTOMER`** | **CUSTOMER vs CONSUMER** |

**Findings:**

- **rbac.ts**: Defines a different `UserRole` enum that does **not** match Prisma. The actual checks in `isAdmin()` / `isSuperAdmin()` use string comparison (`role === 'PLATFORM_ADMIN'` etc.), so behaviour matches backend for `PLATFORM_ADMIN`, but the enum is misleading and `ADMIN` / `SUPER_ADMIN` are **never** emitted by the backend.
- **Mobile**: Uses `CUSTOMER`; backend uses `CONSUMER`. Any API or shared logic that relies on role name will be inconsistent.

**Recommendations:**

- In `rbac.ts`, use `UserRole` from `@/lib/types` (Prisma-aligned) or document that the local enum is for permission labels only.
- In mobile, align with backend: use `CONSUMER` or map `CUSTOMER` → `CONSUMER` at the API boundary.

---

### 1.2 SubscriptionPlan

| Source | Values | Status |
|--------|--------|--------|
| **Backend Prisma** | `FREE`, `STARTER`, `PROFESSIONAL`, `BUSINESS`, `ENTERPRISE` (uppercase) | Reference |
| **Backend** `plan-config.types.ts` (PlanTier) | `'free'`, `'starter'`, `'professional'`, `'business'`, `'enterprise'` (lowercase) | Used in billing |
| **Backend** `billing.service.ts` `getSubscription()` | Returns `plan` as lowercase | OK |
| **Frontend** pricing / billing | Compares `plan !== 'free'`, uses plan ids from API | Consistent with lowercase |

**Findings:**

- Prisma stores uppercase; billing API and frontend use lowercase. No `'PRO'` or other alias for `PROFESSIONAL` found. Frontend is consistent with backend billing response.

**Recommendation:**

- Document that subscription plan in API responses is lowercase; Prisma enum stays uppercase.

---

## 2. API Response Shape

### 2.1 GET /api/v1/auth/me

| Aspect | Backend (getMe) | Frontend |
|--------|-----------------|----------|
| **Shape** | Single object (no wrapper) | `api.get<User>('/api/v1/auth/me')` |
| **Backend returns** | id, email, firstName, lastName, avatar, role, brandId, notificationPreferences, phone, website, timezone, brand, organization, industry, onboardingCompleted | — |
| **Frontend User type** | — | id, email, firstName, lastName, name, avatar, role, **isActive**, **emailVerified**, brandId, **createdAt**, **updatedAt** |

**Findings:**

- Backend does **not** return `isActive`, `emailVerified`, `createdAt`, `updatedAt`. They will be undefined when using auth/me.
- Backend returns brand, organization, industry, onboardingCompleted; frontend `User` does not type them.

**Recommendations:**

- Add isActive, emailVerified, createdAt, updatedAt to getMe response, or remove from frontend User type / mark optional.
- Optionally extend frontend User (or a separate type) for brand, organization, industry, onboardingCompleted.

---

### 2.2 GET /api/v1/billing/subscription

- Backend returns a **single object** (plan, planName, status, limits, currentUsage, usage, etc.) with **no** `subscription` or `data` wrapper.
- Frontend usePricingPage uses `raw?.subscription ?? raw?.data ?? (raw ? { plan: raw.plan, status: raw.status } : undefined)`, so top-level `plan`/`status` work. **No mismatch** (frontend does not expect `user.subscriptions` array here; billing is separate).

**Recommendation:**

- Add a typed response for `endpoints.billing.subscription()` to match backend return shape.

---

### 2.3 useProfile and /auth/me

- useProfile expects `Profile` with snake_case (`avatar_url`, `created_at`, `subscription_tier`, `subscription_status`).
- Backend returns camelCase and does **not** include subscription in auth/me.

**Recommendation:**

- Align Profile with auth/me (camelCase) and get subscription from billing if needed.

---

## 3. Type Definitions

- **Frontend** `lib/types/index.ts`: User has isActive, emailVerified, createdAt, updatedAt not returned by auth/me (see §2.1).
- **packages/types**: Exports only widget and ar; no shared User/UserRole/SubscriptionPlan. Enum consistency is not enforced via this package.

**Recommendation:**

- Consider shared types for UserRole and plan-related enums in packages/types.

---

## 4. Error Code Mapping

- **Backend**: Sends `{ success: false, error: code, message, category, metadata, timestamp }` (e.g. `error: "AUTH_1001"`). Defines AUTH_REQUIRED, AUTH_INSUFFICIENT_PERMISSIONS, BUSINESS_QUOTA_EXCEEDED, RATE_LIMIT_*, etc.
- **Frontend**: error-handler classifies by HTTP status (401 → UNAUTHORIZED, 403 → FORBIDDEN). Does **not** map backend `error` codes to specific messages or behaviour.

**Findings:**

- No **conflict**: status codes align. Frontend simply does not use backend error codes for UX.

**Recommendation:**

- Optionally parse `response.data.error` and map AUTH_1001, BIZ_4004, RATE_7001, etc. to user-facing messages or actions.

---

## 5. Frontend Middleware Role Check

**Location:** `apps/frontend/middleware.ts` lines 166–168

```ts
if (!['PLATFORM_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

**Backend UserRole:** CONSUMER, BRAND_USER, BRAND_ADMIN, PLATFORM_ADMIN, FABRICATOR. **No** SUPER_ADMIN or ADMIN.

**Findings:**

- Only `PLATFORM_ADMIN` can ever match. SUPER_ADMIN and ADMIN are dead and misleading.

**Recommendation:**

- Use only `PLATFORM_ADMIN`:

  ```ts
  if (userRole !== 'PLATFORM_ADMIN') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  ```

---

## 6. Summary Table

| Area | Issue | Severity | Action |
|------|--------|----------|--------|
| UserRole | rbac.ts enum differs from Prisma | Medium | Use Prisma-aligned UserRole from @/lib/types or document. |
| UserRole | Mobile CUSTOMER vs backend CONSUMER | Medium | Align with CONSUMER or map at API. |
| Middleware | SUPER_ADMIN, ADMIN never sent by backend | Low | Restrict to PLATFORM_ADMIN only. |
| auth/me vs User | User expects isActive, emailVerified, createdAt, updatedAt | Medium | Add to getMe or make optional in type. |
| useProfile | Snake_case and subscription from wrong source | Medium | Align with auth/me; get subscription from billing. |
| SubscriptionPlan | Prisma uppercase, API lowercase | Info | Document; no change. |
| Error codes | Frontend doesn't use backend codes | Low | Optional: map codes to messages. |

---

## 7. Files Referenced

- Backend: `apps/backend/prisma/schema.prisma`, `auth.service.ts`, `billing.service.ts`, `app-error.ts`, `app-error.filter.ts`, `plan-config.types.ts`
- Frontend: `apps/frontend/src/lib/api/client.ts`, `lib/types/index.ts`, `lib/rbac.ts`, `middleware.ts`, `role-redirect.ts`, `error-handler.ts`, `useProfile.ts`, `usePricingPage.ts`
- Mobile: `apps/mobile/src/types/index.ts`
- Shared: `packages/types/src/index.ts`

---

## 8. Baseline Register Snapshot (2026-02-25)

This section records the execution baseline inventory used for the full-sequence audit/remediation plan.

### 8.1 Inventory Coverage

| Component | Count | Status |
|------|--------|--------|
| Frontend pages (`apps/frontend/src/app/**/page.tsx`) | 250 | warning |
| Backend controllers (`apps/backend/src/modules/**/*.controller.ts`) | 34 | critical |
| Queue/job/processor files (`apps/backend/src/**/*{job,processor,queue}*.ts`) | 17 | warning |
| Workflow/config YAML files (`**/*.yml`) | 19 | critical |
| Test files (`**/*{spec,test}.ts`) | 313 | warning |
| Prisma files (`apps/backend/prisma/**`) | 8 | critical |

### 8.2 Critical Domains in Execution Order

- Auth/session and conversion: `apps/frontend/src/hooks/useAuth.tsx`, `apps/frontend/src/app/(public)/pricing/hooks/usePricingPage.ts`
- Runtime bootstrap parity: `apps/backend/src/main.ts`, `apps/backend/src/serverless.ts`
- Billing/webhooks/quotas: `apps/backend/src/modules/billing/stripe-webhook.controller.ts`, `apps/backend/src/modules/billing/billing.service.ts`, `apps/backend/src/libs/plans/plan-config.ts`
- Widget security: `apps/backend/src/modules/widget-api/widget-api.controller.ts`, `apps/backend/src/modules/widget-api/widget-api.service.ts`
- Deployment gates and migrations: `.github/workflows/deploy-production.yml`, `.github/workflows/ci.yml`, `apps/backend/prisma/schema.prisma`

### 8.3 Execution Matrix

- `critical`: auth, billing/webhooks, runtime parity, widget security, deploy gates, migrations
- `warning`: i18n/seo/a11y, support/status communication, analytics consent, test scope alignment
- `ok`: baseline structure and test footprint exist, but remediation is required for production reliability

---

## 9. Global Baseline Inventory Snapshot (2026-02-26)

This section tracks the exhaustive platform baseline used for the `vision_globale_full_sweep` execution plan.

### 9.1 Inventory Coverage (live codebase)

| Component | Count | Status | Notes |
|------|--------|--------|--------|
| Frontend app pages (`apps/frontend/src/app/**/page.tsx`) | 251 | warning | Includes public, auth, dashboard, super-admin and docs pages |
| Frontend API routes (`apps/frontend/src/app/api/**/route.ts`) | 143 | critical | High surface area, contract drift risk FE/BE |
| Backend controllers (`apps/backend/src/modules/**/*.controller.ts`) | 34 | critical | Security and contract consistency must be enforced |
| Backend guards (`apps/backend/src/**/*.guard.ts`) | 27 | warning | Split between active and `_archive` folders |
| Backend tests (`apps/backend/src/**/*.spec.ts`) | 81 | warning | Good footprint, uneven critical-path coverage |
| Frontend tests (`apps/frontend/src/**/*.test.ts*`) | 31 | warning | Focused tests exist, global E2E journey incomplete |
| GitHub workflows (`.github/workflows/*.yml`) | 8 | warning | Hardening done, final gating still to verify with full smoke |
| Prisma SQL migrations (`apps/backend/prisma/migrations/**/migration.sql`) | 1 | critical | Very low migration depth for current functional scope |
| Docs runbooks/guides (`docs/**/*.md`) | 54 | warning | Rich doc set, operational validation still needed |
| Shared packages files (`packages/**/*.{ts,tsx,js,py,json}`) | 31 | warning | Shared contracts present, need stricter business contract tests |

### 9.2 Critical baseline findings

- `critical` Runtime scope mismatch: `apps/ai-engine` is expected in architecture scope, but directory is currently absent from repository root.
- `critical` Route surface is large (251 pages + 143 frontend API routes) relative to current full-journey regression evidence.
- `critical` Data migration depth appears limited (single SQL migration detected) versus production feature breadth.
- `warning` `_archive` code is substantial and can pollute search/discovery and security posture if not explicitly excluded in checks.

### 9.3 Execution priorities derived from baseline

1. P0 runtime stability and auth/admin redirect integrity (`/admin`, `/login`, refresh/logout).
2. FE/BE/Stripe business contracts (pricing, billing, credits, quotas).
3. FR/EN i18n and content consistency across public + dashboard + admin.
4. Security/compliance hardening and end-to-end operational readiness.
