# Security Audit Report: Authentication & Authorization — Luneo Platform

**Audit date:** February 13, 2025  
**Scope:** Backend auth module, guards, token/cookie handling, brute-force, 2FA, RBAC  
**Severity scale:** CRITICAL | HIGH | MEDIUM | LOW

---

## Executive Summary

| Finding | Count |
|--------|--------|
| CRITICAL | 3 |
| HIGH | 4 |
| MEDIUM | 6 |
| LOW | 4 |

**Key answers**

1. **Tokens:** Stored in **httpOnly cookies** (migration complete). No tokens in response body for signup/login/refresh; tempToken for 2FA flow is in body by design.
2. **Role at signup:** A user **can** register as ADMIN/PLATFORM_ADMIN — client can send `role` and server accepts it. **CRITICAL.**
3. **@Public():** Used only on intended public routes (signup, login, refresh, forgot/reset password, verify email, resend verification, OAuth/SAML/OIDC entry and callbacks). No sensitive routes wrongly marked public.
4. **Brute-force:** Implemented (5 attempts, 15 min lockout) but **fail-open** on Redis errors/timeouts — lockout can be bypassed if Redis is down or slow.
5. **2FA:** Properly implemented (TOTP, backup codes hashed, reuse detection). Legacy plaintext backup codes still accepted (migration path).
6. **Refresh token rotation:** Implemented with family and reuse detection; rotation and invalidation work as intended.
7. **Token cleanup cron:** Working — `TokenCleanupScheduler` runs daily at 3 AM.
8. **Admin routes:** Protected by `@UseGuards(JwtAuthGuard)` + `@Roles(UserRole.PLATFORM_ADMIN)` at controller level. `POST /admin/create-admin` is `@Public()` but protected by `X-Setup-Key` in handler.
9. **Brand-scoped guard:** Correctly enforces `brandId` for BRAND_ADMIN/BRAND_USER and prevents IDOR when path has `:brandId`.

---

## 1. auth.controller.ts

**Path:** `apps/backend/src/modules/auth/auth.controller.ts`

| Line(s) | Issue | Data | Severity | Correction |
|---------|--------|------|----------|------------|
| 353–395 | **POST /logout** has no `@UseGuards(JwtAuthGuard)` | N/A | **CRITICAL** | Unauthenticated call hits `req.user!.id` → runtime error (500) instead of 401. Add guard so unauthenticated users get 401. |
| 434–442 | **GET /me** has no `@UseGuards(JwtAuthGuard)` | N/A | **CRITICAL** | Same as logout: no guard, so missing user causes 500. Add guard. |
| 196–199 | **Login 2FA response** returns `tempToken` in JSON body | Dynamic | **LOW** | By design for client to send in next step. Consider short expiry (5m) and one-time use only; already 5m. Document as acceptable. |
| 322–326 | **Refresh** accepts token from body | Dynamic | **MEDIUM** | Allowing refresh token in body enables token leakage via logs/Referer. Prefer cookie-only for refresh; keep body only for legacy and deprecate. |

**Correction code (logout + me):**

```typescript
// Line 353 - Add guard to logout
@Post('logout')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
// ... rest unchanged

// Line 434 - Add guard to getProfile
@Get('me')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
// ... rest unchanged
```

**@Public() usage:** Correct. Only used on signup, login, login/2fa, refresh, forgot-password, reset-password, verify-email, resend-verification, OAuth/SAML/OIDC entry and callbacks.

---

## 2. auth.service.ts

**Path:** `apps/backend/src/modules/auth/auth.service.ts`

| Line(s) | Issue | Data | Severity | Correction |
|---------|--------|------|----------|------------|
| 56–57, 94 | **Signup accepts client-supplied `role`** and uses `role \|\| UserRole.CONSUMER` | Client-controlled | **CRITICAL** | Attacker can register as PLATFORM_ADMIN or BRAND_ADMIN. Ignore role from DTO and set server-side to CONSUMER only. |
| 246–258 | **Login 2FA required for admins** returns `requires2FASetup` but no `user` in response | Static | **LOW** | Frontend may expect `user`; add minimal user info (e.g. id, email) if needed for UX. |
| 364–365 | **loginWith2FA** does not call brute-force service | N/A | **MEDIUM** | 2FA code guessing is not rate-limited. Add brute-force (or separate 2FA attempt counter) for tempToken + code. |
| 447–448 | **verifyAndEnable2FA** returns `backupCodes` from DB (hashed) | Dynamic | **MEDIUM** | Backup codes are already hashed; returning them is useless and could confuse. Return only `message` or confirm “2FA enabled”; do not return `backupCodes`. |
| 469–471 | **disable2FA** does not require password or 2FA confirmation | N/A | **MEDIUM** | Any authenticated session can disable 2FA. Require password or current 2FA code to disable. |

**Correction code (signup role):**

```typescript
// auth.service.ts - signup(), replace line 88-99
const user = await this.prisma.user.create({
  data: {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role: UserRole.CONSUMER, // Always CONSUMER; ignore signupDto.role
  },
  include: {
    brand: true,
  },
});
```

**Correction (SignupDto):** Remove or restrict `role` from signup DTO so it cannot be sent by client (e.g. remove from DTO or use `@IsOptional()` with server-side override only).

---

## 3. auth-cookies.helper.ts

**Path:** `apps/backend/src/modules/auth/auth-cookies.helper.ts`

| Line(s) | Issue | Data | Severity | Correction |
|---------|--------|------|----------|------------|
| 23–30 | **accessToken** cookie has no `SameSite=Strict` option | Config | **LOW** | `sameSite: 'lax'` is acceptable; Strict is stricter for cross-site. Optional hardening. |
| 64–69 | **clearAuthCookies** clears `access_token` and `refresh_token` (snake_case) with path `/api/v1/auth/refresh` | Static | **LOW** | Set cookies use `accessToken`/`refreshToken` (camelCase). Clearing both naming conventions is correct; ensure no other path sets snake_case only. |
| 19 | **domain** from `frontendUrl` | Config | **MEDIUM** | If `FRONTEND_URL` is wrong, cookies may be set for wrong domain. Validate domain allowlist in production. |

No CRITICAL/HIGH in this file. httpOnly, Secure in production, and SameSite are correctly set.

---

## 4. jwt.strategy.ts

**Path:** `apps/backend/src/modules/auth/strategies/jwt.strategy.ts`

| Line(s) | Issue | Data | Severity | Correction |
|---------|--------|------|----------|------------|
| 16–19 | JWT from **cookies** (`access_token`, `accessToken`) and **Bearer** | N/A | **LOW** | Multiple extractors are fine; document that cookie takes precedence if both present. |
| 26–33 | **validate()** loads user from DB on every request | Dynamic | **MEDIUM** | Extra DB hit per request. Consider short-lived cache (e.g. 60s) keyed by `payload.sub` to reduce load; ensure cache invalidated on logout/password change. |
| 32 | **!user.isActive** rejects inactive users | Dynamic | OK | Correct. |

No CRITICAL/HIGH. Optional: add `jti` or token-version in JWT and check against revoked list for immediate logout.

---

## 5. jwt-auth.guard.ts

**Path:** `apps/backend/src/common/guards/jwt-auth.guard.ts`

| Line(s) | Issue | Data | Severity | Correction |
|---------|--------|------|----------|------------|
| 14–21 | **@Public()** bypasses JWT check | Metadata | OK | Intended; no issue. |
| N/A | **No global JWT guard** | N/A | **HIGH** | App uses only `GlobalRateLimitGuard` as APP_GUARD. Any route without explicit `@UseGuards(JwtAuthGuard)` is unprotected. GET /me and POST /logout are two examples. |

**Recommendation:** Either add `JwtAuthGuard` as a second global guard (and keep `@Public()` for auth routes), or consistently add `@UseGuards(JwtAuthGuard)` to every protected route and audit all controllers. Prefer fixing GET /me and POST /logout immediately and then auditing the rest.

---

## 6. roles.guard.ts

**Path:** `apps/backend/src/common/guards/roles.guard.ts`

| Line(s) | Issue | Data | Severity | Correction |
|---------|--------|------|----------|------------|
| 18 | **IS_PUBLIC_KEY** hardcoded as `'isPublic'` | Static | **LOW** | Duplicate of `public.decorator.ts`. Import from decorator: `import { IS_PUBLIC_KEY } from '@/common/decorators/public.decorator';` to avoid drift. |
| 39–41 | If **no requiredRoles** metadata, guard returns **true** | N/A | **MEDIUM** | Routes with RolesGuard but no `@Roles()` are allowed for any authenticated user. Ensure every use of RolesGuard has `@Roles(...)`. |
| 44–47 | **!user** → **false** (403) | N/A | OK | Correct. |

---

## 7. brand-scoped.guard.ts

**Path:** `apps/backend/src/common/guards/brand-scoped.guard.ts`

| Line(s) | Issue | Data | Severity | Correction |
|---------|--------|------|----------|------------|
| 66 | **No user** → **return true** (“let JwtAuthGuard handle”) | N/A | **HIGH** | If JwtAuthGuard is not applied (e.g. GET /me), BrandScopedGuard runs first and returns true without user, so no 401. Fix by ensuring JWT runs before brand scoping (order of guards) and protecting all auth routes with JwtAuthGuard. |
| 72–76 | **PLATFORM_ADMIN** can set **request.brandId** from path param | Dynamic | **MEDIUM** | Admin can access any brand by passing brandId in URL. Intended for admin; ensure admin controller validates that only PLATFORM_ADMIN can reach brand-scoped admin endpoints. |
| 114–123 | **IDOR check:** path `:brandId` must equal **user.brandId** for BRAND_* | N/A | OK | Correct; prevents IDOR. |
| 125–140 | **readOnlyMode** blocks non-GET except billing/credits/auth/health | N/A | OK | Correct. |

**Conclusion:** Brand-scoped guard correctly prevents IDOR for BRAND_ADMIN/BRAND_USER. The main risk is routes that don’t use JwtAuthGuard (e.g. GET /me), so brand guard sees no user and allows access.

---

## 8. brute-force.service.ts

**Path:** `apps/backend/src/modules/auth/services/brute-force.service.ts`

| Line(s) | Issue | Data | Severity | Correction |
|---------|--------|------|----------|------------|
| 29–31, 46–51, 79–82 | **Redis unavailable or timeout → allow request** (fail-open) | Dynamic | **HIGH** | When Redis is down or slow, brute-force is effectively disabled. Prefer fail-closed (reject login) or circuit-breaker + alert. |
| 56 | **Limit 5 attempts** | Static | OK | Reasonable. |
| 106–108 | **recordFailedAttempt** on Redis error does not throw | N/A | OK | Fail-safe for availability; same trade-off as above. |
| 207–215 | **checkAndThrow** 3s timeout → allow request | Dynamic | **HIGH** | Same as above: timeout bypasses lockout. |

**Correction (optional – fail-closed):**

```typescript
// canAttempt() - when redis is null or errors, return false instead of true
if (!redis) {
  this.logger.warn('Redis unavailable for brute force check');
  return false; // fail closed
}
// and in catch: return false; with alert
```

Document the current fail-open choice and consider making it configurable (e.g. `BRUTE_FORCE_FAIL_OPEN=false`).

---

## 9. two-factor.service.ts

**Path:** `apps/backend/src/modules/auth/services/two-factor.service.ts`

| Line(s) | Issue | Data | Severity | Correction |
|---------|--------|------|----------|------------|
| 36 | **window: 2** (TOTP tolerance) | Static | **LOW** | 2 periods (≈120s) is common; acceptable. |
| 75–98 | **generateBackupCodes** uses crypto.randomBytes(6), base64, 8 chars | Static | OK | Adequate entropy. |
| 114–118 | **Legacy plaintext** backup codes still accepted | Dynamic | **MEDIUM** | Migration path; remove once all codes are hashed and log when plaintext match is used. |
| 17 | **issuer** default `'Luneo'` | Static | OK | Correct. |

2FA is properly implemented; no CRITICAL/HIGH.

---

## 10. token.service.ts

**Path:** `apps/backend/src/modules/auth/services/token.service.ts`

| Line(s) | Issue | Data | Severity | Correction |
|---------|--------|------|----------|------------|
| 47–48 | **expiresAt** hardcoded **+7 days** | Static | **MEDIUM** | Should use `configService.get('jwt.refreshExpiresIn')` (e.g. 7d/30d) and parse to set `expiresAt` so DB matches JWT expiry. |
| 88–119 | **Reuse detection** marks family revoked and throws | N/A | OK | Correct. |
| 134–136 | **usedAt** set on current token; new token saved with same family | N/A | OK | Rotation correct. |
| 184–198 | **cleanupExpiredTokens** deletes expired, revoked, used >24h | N/A | OK | Correct. |

**Correction (expiresAt):**

```typescript
// token.service.ts - saveRefreshToken
const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn') || '7d';
// Parse 7d / 30d to ms and set expiresAt
const match = refreshExpiresIn.match(/^(\d+)([dh])$/);
const value = match ? parseInt(match[1], 10) : 7;
const unit = match?.[2] || 'd';
const days = unit === 'h' ? value / 24 : value;
expiresAt.setDate(expiresAt.getDate() + Math.max(1, Math.floor(days)));
```

---

## 11. rbac.service.ts

**Path:** `apps/backend/src/modules/security/services/rbac.service.ts`

| Line(s) | Issue | Data | Severity | Correction |
|---------|--------|------|----------|------------|
| 4–9, 84–215 | **Role enum** (SUPER_ADMIN, ADMIN, MANAGER, DESIGNER, VIEWER) does **not** match **Prisma UserRole** (CONSUMER, BRAND_USER, BRAND_ADMIN, PLATFORM_ADMIN, FABRICATOR) | Static | **CRITICAL** | `getRolePermissions(user.role as Role)` with Prisma role returns `undefined` (e.g. ROLE_PERMISSIONS['PLATFORM_ADMIN'] is undefined). So **userHasPermission** always returns false for all real roles. Permission checks and RBAC are broken for the current schema. |
| 168–178 | **getUserRole** returns `user?.role as Role` or **Role.VIEWER** | Dynamic | **CRITICAL** | Casting Prisma UserRole to RBAC Role is invalid; VIEWER fallback understates admins. |
| 202–203, 210–211 | **isAdmin** / **isSuperAdmin** compare to Role.ADMIN and Role.SUPER_ADMIN | Static | **CRITICAL** | Prisma has no Role.ADMIN/Role.SUPER_ADMIN; admins are never recognized. |

**Correction:** Introduce an explicit mapping from Prisma `UserRole` to RBAC `Role` (or to permission sets), and use it in `getUserRole` and permission checks. Example:

```typescript
// Map Prisma UserRole to RBAC Role or permission set
const USER_ROLE_TO_RBAC: Record<string, Role> = {
  PLATFORM_ADMIN: Role.SUPER_ADMIN,
  BRAND_ADMIN: Role.ADMIN,
  BRAND_USER: Role.MANAGER,
  FABRICATOR: Role.DESIGNER,
  CONSUMER: Role.VIEWER,
};

async getUserRole(userId: string): Promise<Role> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const prismaRole = user?.role as string;
  return (prismaRole && USER_ROLE_TO_RBAC[prismaRole]) || Role.VIEWER;
}
```

Then use this in `userHasPermission`, `isAdmin`, and `isSuperAdmin` so that PLATFORM_ADMIN/BRAND_ADMIN get the right permissions.

---

## Token Storage & Migration

- **Backend:** Access and refresh tokens are set only in **httpOnly cookies** (AuthCookiesHelper). No tokens in JSON body for signup, login, or refresh.
- **2FA:** `tempToken` is returned in the body for the second step (login/2fa); this is intentional and has short expiry (5m).
- **Refresh:** Token can still be sent in body (RefreshTokenDto); prefer cookie-only and deprecate body for refresh.

---

## Summary of Required Fixes

| Priority | File | Fix |
|----------|------|-----|
| P0 | auth.controller.ts | Add `@UseGuards(JwtAuthGuard)` to GET /me and POST /logout. |
| P0 | auth.service.ts | Ignore client `role` on signup; set `UserRole.CONSUMER` only. |
| P0 | SignupDto / auth.service | Do not accept or use client-supplied role for signup. |
| P0 | rbac.service.ts | Map Prisma UserRole to RBAC Role (or permissions) and use in getUserRole, userHasPermission, isAdmin, isSuperAdmin. |
| P1 | auth.service.ts | Rate-limit 2FA code attempts in loginWith2FA; do not return hashed backupCodes from verifyAndEnable2FA; require password or 2FA to disable 2FA. |
| P1 | brute-force.service.ts | Document fail-open; consider fail-closed or configurable when Redis fails. |
| P1 | token.service.ts | Set refresh token `expiresAt` from config (e.g. jwt.refreshExpiresIn). |
| P2 | auth.controller.ts | Prefer cookie-only refresh; deprecate body. |
| P2 | roles.guard.ts | Import IS_PUBLIC_KEY from public.decorator. |
| P2 | jwt.strategy.ts | Optional: cache user in validate to reduce DB load. |

---

## Checklist (from audit questions)

- [x] Tokens in httpOnly cookies (migration complete); tempToken in body for 2FA only.
- [ ] **User cannot register as ADMIN** — fix signup to ignore client role.
- [x] @Public() used only on appropriate auth/OAuth routes.
- [x] Brute-force present (5 attempts, 15 min); **fail-open** on Redis/timeout is a known risk.
- [x] 2FA implemented (TOTP, hashed backup codes, reuse handling).
- [x] Refresh token rotation and reuse detection in place.
- [x] Token cleanup cron runs daily at 3 AM.
- [x] Admin routes protected by JWT + PLATFORM_ADMIN; create-admin protected by setup key.
- [x] Brand-scoped guard prevents IDOR for BRAND_* when path has :brandId; ensure JWT is applied on all protected routes so guard sees user.

---

*End of report.*
