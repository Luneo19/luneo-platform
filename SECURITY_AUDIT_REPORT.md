# Luneo Platform – Security Audit Report

**Date:** 2025-02-13  
**Scope:** Backend (`apps/backend`) – CSRF, rate limiting, XSS, CORS, brand scoping, secrets, passwords, SQL injection, admin/DLQ

---

## Executive summary

- **CRITICAL:** Double (and in production triple) rate limiting can cause premature 429s.
- **HIGH:** DLQ controller uses string `'PLATFORM_ADMIN'` instead of `UserRole.PLATFORM_ADMIN`.
- **MEDIUM:** Signup password validation does not enforce complexity; admin/dev password in logs; XSS only on body; webhooks not excluded from Express rate limit.
- **LOW:** Seed default password; CONSUMER/FABRICATOR brandId path not validated (design choice).

---

## 1. CSRF protection

### 1.1 CsrfGuard – `apps/backend/src/common/guards/csrf.guard.ts`

- **Behavior:** Skips GET/HEAD/OPTIONS; skips routes with `@Public()`. For other methods, requires `x-csrf-token` header to match `csrf_token` cookie; otherwise throws `ForbiddenException`.
- **Webhooks:** Billing webhook (`POST .../billing/webhook`), WooCommerce (`POST .../ecommerce/woocommerce/webhook`), Shopify (`POST .../integrations/shopify/webhooks`) and ecommerce Shopify (`POST .../ecommerce/shopify/webhook`) are correctly marked `@Public()` in their controllers, so CSRF is not applied to them.
- **Finding:** No issue. Webhooks are excluded via `@Public()`.

### 1.2 CSRF token middleware – `apps/backend/src/common/middleware/csrf-token.middleware.ts`

- **Behavior:** Runs on all requests; sets or reuses `csrf_token` cookie (32-byte hex); `httpOnly: false` so the client can send it in `x-csrf-token`; `sameSite: 'strict'`, `secure` in production.
- **Finding:** No issue. No need to skip webhooks in middleware; they are excluded at guard level.

---

## 2. Rate limiting (CRITICAL – multiple layers)

### 2.1 Three rate-limit layers

| Layer | Location | Mechanism |
|-------|----------|-----------|
| 1 | `main.ts` (production only) | `express-rate-limit` + `express-slow-down` by IP |
| 2 | `AppModule` | `ThrottlerModule` (Redis) + `GlobalRateLimitGuard` (extends `ThrottlerGuard`) |
| 3 | `CommonModule` | `RateLimitGuard` + `SlidingWindowRateLimitService` (Redis) |

Every non–health, non-OPTIONS request in production is counted by (1) Express, (2) Throttler, and (3) SlidingWindow. Limits are not coordinated, so users can hit 429 earlier than intended (e.g. 100/min from Express while Nest uses 60/min or path-specific limits).

**Severity:** CRITICAL  
**Files:**  
- `apps/backend/src/app.module.ts` (lines 191–202, 412–415)  
- `apps/backend/src/common/common.module.ts` (lines 41–43)  
- `apps/backend/src/main.ts` (lines 371–399)

**Recommended fix:** Use a single rate-limit strategy.

- **Option A (recommended):** Remove `RateLimitGuard` from `CommonModule` and keep only `ThrottlerModule` + `GlobalRateLimitGuard`. Remove the Express `rateLimit()` and `speedLimiter` in `main.ts` so Nest handles all rate limiting.
- **Option B:** Remove `ThrottlerModule` and `GlobalRateLimitGuard` from `AppModule`, keep `RateLimitGuard` in `CommonModule`, and remove Express rate limiting in `main.ts`.

### 2.2 Express rate limit – webhooks not skipped

**File:** `apps/backend/src/main.ts` (lines 379–383, 391–394)

`skip` only excludes OPTIONS and `/health`, `/api/v1/health`. Webhook paths are not skipped. High-volume webhook traffic (e.g. Stripe) could hit 429 by IP.

**Severity:** MEDIUM  
**Fix:** Add webhook paths to `skip`:

```ts
skip: (req: import('express').Request) => {
  if (req.method === 'OPTIONS') return true;
  if (req.path === '/health' || req.path === '/api/v1/health') return true;
  if (req.path === '/api/v1/billing/webhook') return true;
  if (req.path === '/api/v1/ecommerce/woocommerce/webhook') return true;
  if (req.path.startsWith('/api/v1/integrations/shopify/webhooks')) return true;
  return false;
},
```

(Apply the same pattern to the speed limiter if you keep it.)

---

## 3. XSS protection

### 3.1 XSS middleware – `apps/backend/src/common/middleware/xss-sanitize.middleware.ts`

- **Behavior:** Recursively sanitizes string values in `req.body` (arrays and nested objects). Strips `<script>`, event handlers, `javascript:`, `data:text/html`, `vbscript:`, `expression()`, `<iframe>`, `<object>`, `<embed>`.
- **Applied to:** All routes via `CommonModule` (`.forRoutes('*')`).

**Findings:**

- **LOW:** Only `req.body` is sanitized. Query string and headers are not. If any handler uses `req.query` or headers in HTML/JS context without encoding, XSS is still possible. Prefer output encoding and CSP; treat this as defense in depth.
- **Recommendation:** Document that query/header values must be validated/encoded where used in responses; optionally extend sanitization to `req.query` for known string params.

---

## 4. CORS configuration

**File:** `apps/backend/src/main.ts` (lines 239–334)

- Production requires explicit origins; `*` or missing `CORS_ORIGINS` causes startup failure.
- Allowed origins: `CORS_ORIGINS` env, config, or fallback list; Vercel pattern `https://frontend-*.vercel.app`; credentials supported.
- No wildcard `*` with credentials in production.

**Finding:** No issue.

---

## 5. Brand scoping / IDOR

**File:** `apps/backend/src/common/guards/brand-scoped.guard.ts`

- **BRAND_ADMIN / BRAND_USER:** `brandId` from path is validated against `user.brandId`; mismatch → `ForbiddenException`. Read-only mode blocks mutations except billing/credits/auth/health.
- **PLATFORM_ADMIN:** Bypasses scoping; path `brandId` injected when present.
- **CONSUMER / FABRICATOR:** Path `brandId` is injected without validation (documented as multi-brand access).

**Finding:** No issue for BRAND_* and PLATFORM_ADMIN. CONSUMER/FABRICATOR behavior is a design choice; ensure downstream services do not trust `request.brandId` for authorization of sensitive actions without additional checks.

---

## 6. Secrets in code

- Grep did not find hardcoded API keys or passwords in `src/`.
- **Sensitive data in logs:**
  - **File:** `apps/backend/src/main.ts` line 150  
    `logger.warn(\`DEV ONLY: Generated random admin password: ${passwordToHash}\`)`  
  - **File:** `apps/backend/src/modules/admin/admin.service.ts` line 1313  
    Same pattern in admin creation fallback.

**Severity:** MEDIUM (dev-only but still a secret in logs)  
**Fix:** In dev, log only that a password was generated (e.g. `Generated random admin password (check server output only once)`), or avoid logging the value at all.

---

## 7. Password security

### 7.1 Bcrypt rounds

- **auth (Argon2id migration), users, api-keys, main.ts/admin fallback:** use bcrypt with **12** or **13** rounds.
- **Seed:** `prisma/seed.ts` line 59 uses **12** rounds.

**Finding:** No issue (≥10 as required).

### 7.2 Password validation

- **SignupDto** – `apps/backend/src/modules/auth/dto/signup.dto.ts`: only `@MinLength(8)` and `@MaxLength(128)`. No complexity (uppercase, lowercase, number, special char).
- **IsStrongPassword** exists in `apps/backend/src/libs/validation/validation-helpers.ts` (8+ chars, 1 upper, 1 lower, 1 digit, 1 special) but is **not** used on `SignupDto.password`.

**Severity:** MEDIUM  
**File:** `apps/backend/src/modules/auth/dto/signup.dto.ts`  
**Fix:** Add strong password validation, e.g.:

```ts
import { IsStrongPassword } from '@/libs/validation/validation-helpers';

// On password property:
@IsStrongPassword({ message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character' })
password!: string;
```

Also ensure `reset-password` and `change-password` DTOs use the same or equivalent rules (e.g. `change-password.dto.ts` already has `minLength: 8`; consider adding `IsStrongPassword` there too).

---

## 8. SQL injection

- **Application code:** Prisma is used with parameterized `$queryRaw`/`$executeRaw` template literals (e.g. `credits.service.ts`, `analytics.service.ts`, `health.service.ts`). No unsafe concatenation of user input into raw SQL found in normal request handling.
- **migration-resolver.ts:** Uses `$executeRawUnsafe` with **static** DDL strings (no user input). Acceptable for migrations.
- **prisma/seed.ts:** Uses `$executeRawUnsafe` with static column/enum DDL. Acceptable for seed.

**Finding:** No issue in application request path. Raw SQL is either parameterized or static.

---

## 9. Admin routes and DLQ

### 9.1 Admin controller – `apps/backend/src/modules/admin/admin.controller.ts`

- **Class-level:** `@Controller('admin')`, `@UseGuards(JwtAuthGuard)`, `@Roles(UserRole.PLATFORM_ADMIN)`.
- All endpoints inherit JWT + PLATFORM_ADMIN except:
  - `POST create-admin`: `@Public()`, protected by `X-Setup-Key` and `SETUP_SECRET_KEY`.
- Redundant `@Roles(UserRole.PLATFORM_ADMIN)` on some methods is harmless.

**Finding:** No issue; all admin endpoints require PLATFORM_ADMIN or the setup-key flow.

### 9.2 DLQ controller – `apps/backend/src/jobs/dlq/dlq.controller.ts`

- **Line 11:** `@Roles('PLATFORM_ADMIN')` uses a **string** instead of the enum.
- **RolesGuard** compares `user.role === role`; at runtime `UserRole.PLATFORM_ADMIN` is `'PLATFORM_ADMIN'`, so behavior is correct today, but the code is inconsistent with `admin.controller.ts` and less type-safe.

**Severity:** HIGH (consistency and type safety)  
**File:** `apps/backend/src/jobs/dlq/dlq.controller.ts` line 11  
**Fix:**

```ts
import { UserRole } from '@prisma/client';

// Replace:
@Roles('PLATFORM_ADMIN')
// With:
@Roles(UserRole.PLATFORM_ADMIN)
```

Remove the `@ts-expect-error` if it was only there for the decorator; with the enum, types should be fine.

---

## 10. Summary table

| # | Severity   | Area           | File(s) / location                    | Fix |
|---|------------|----------------|----------------------------------------|-----|
| 1 | CRITICAL   | Rate limiting  | AppModule, CommonModule, main.ts       | Use a single rate-limit layer (remove duplicate guards/Express limiter). |
| 2 | HIGH       | Admin/DLQ      | dlq.controller.ts:11                  | Use `UserRole.PLATFORM_ADMIN` instead of `'PLATFORM_ADMIN'`. |
| 3 | MEDIUM     | Rate limiting  | main.ts skip                           | Skip webhook paths in Express rate/speed limiter (or remove Express limiter). |
| 4 | MEDIUM     | Passwords      | auth/dto/signup.dto.ts                 | Add `@IsStrongPassword()` (and align reset/change password DTOs). |
| 5 | MEDIUM     | Logging        | main.ts:150, admin.service.ts:1313     | Do not log generated admin password; log only that one was generated. |
| 6 | LOW        | XSS            | xss-sanitize.middleware.ts             | Document or extend to query/headers if used in HTML. |
| 7 | LOW        | Seed           | prisma/seed.ts                         | Avoid default `'admin123'` when `SEED_ADMIN_PASSWORD` is unset in production. |

---

## 11. Positive findings

- CSRF: Mutations protected; webhooks correctly excluded via `@Public()`.
- CORS: No wildcard in production; explicit origin list and validation.
- Brand scoping: IDOR prevented for BRAND_ADMIN/BRAND_USER; path `brandId` validated.
- Bcrypt: Rounds 12–13 used throughout.
- SQL: Prisma used with parameterized raw queries; no user input in raw SQL.
- Admin: All admin routes behind JWT + PLATFORM_ADMIN or setup key.
- Stripe/WooCommerce/Shopify webhooks: Marked `@Public()` and verified by signature in handlers.

---

*End of report.*
