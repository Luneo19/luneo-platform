# Performance & Infrastructure Audit – Luneo Platform

**Date:** February 2025  
**Scope:** Database, caching, connection pooling, Docker, CI/CD, monitoring, environment validation.

---

## Executive summary

The platform has solid foundations: rich Prisma indexes, Redis-backed cache and rate limiting, health checks with dependencies, and strict env validation in production. Main improvements: add a few targeted indexes, document and enforce DB connection pooling, harden CI (no `continue-on-error` on tests, add backend security audit), add a dedicated readiness/DB connections check, and ensure cache warming and revenue query scale.

---

## 1. Database performance

### 1.1 Schema indexes (Prisma)

**Findings:** The schema already has strong index coverage on hot paths.

| Area | Status | Notes |
|------|--------|--------|
| **User** | OK | `email`, `brandId`, `role`, `deletedAt`, `(brandId, role)`, `(brandId, isActive)`, `(brandId, createdAt)` |
| **Brand** | OK | `status`, `stripeCustomerId`, `stripeSubscriptionId`, `subscriptionPlan`, `subscriptionStatus`, `deletedAt`, `trialEndsAt`, `planExpiresAt`, `(subscriptionStatus, trialEndsAt)` |
| **Product** | OK | `brandId`, `isActive`, `status`, `deletedAt`, `(brandId, isActive)`, `(brandId, status)`, `(brandId, createdAt)`, `(brandId, category)` |
| **Design** | OK | `userId`, `brandId`, `productId`, `status`, `createdAt`, `deletedAt`, `(brandId, status)`, `(brandId, status, createdAt)`, `(status, createdAt)` |
| **Order** | OK | `userId`, `brandId`, `status`, `orderNumber`, `createdAt`, `paymentStatus`, `paidAt`, `deletedAt`, composites for brand+status+date and user+date |
| **UsageRecord** | OK | `brandId`, `recordedAt`, `type`, `(brandId, type, recordedAt)` |

**Gap – medium severity**

- **User.lastLoginAt** is used in `CacheWarmingService.warmupUserSessions()` with `where: { lastLoginAt: { gte: yesterday } }` but has **no index**. On large user tables this can cause full scans.

**Recommendation**

- Add in `apps/backend/prisma/schema.prisma` on `User`:
  - `@@index([lastLoginAt])`
  - Optionally `@@index([brandId, lastLoginAt])` if you often filter by brand + recent login.

---

### 1.2 N+1 query patterns

**Findings:** Several services use `findMany` without `include` and then may use relations in the same flow. Not all were confirmed as N+1, but list endpoints that return related data should be reviewed.

- **orders.service.ts** (e.g. ~84–192): Uses batch `findMany` for products and designs by `id: { in: [...] }` — good. No N+1 in the inspected flow.
- **admin.service.ts**: Multiple `findMany` (brands, users, orders, invoices, etc.) with `select` or no `include`; if the API or code later accesses relations per row, N+1 is possible.
- **designs.service.ts**: `findMany` with `select`; ensure no per-item loads of `brand`, `product`, `user` in the same request.
- **products.service.ts**: Similar pattern; variants loaded in a separate call by `productId` (batch by product), which is acceptable.

**Recommendation (low–medium severity)**

- For any list endpoint that returns `brand`, `user`, `product`, or other relations, use a single query with `include` or a batched loader instead of per-item lookups.
- Add a short "N+1 review" checklist in your backend docs: for each list API, confirm that relations are loaded in bulk (include/select or DataLoader-style).

---

## 2. Caching

### 2.1 Cache module and Redis

**Files:** `apps/backend/src/modules/cache/cache.module.ts`, `apps/backend/src/libs/cache/smart-cache.module.ts`, `apps/backend/src/libs/redis/redis-optimized.service.ts`

**Findings**

- **CacheModule**: Wires `CacheWarmingService` with Prisma + Redis; no extra config.
- **SmartCacheModule**: Global; provides `SmartCacheService` and `CacheableInterceptor`; uses `RedisOptimizedService` and Prisma. Used across many feature modules.
- **RedisOptimizedService**:
  - TTLs by type: user 30m, brand 1h, product 2h, design 15m, analytics 5m, session 24h, api 10m.
  - If `REDIS_URL` is missing or invalid (e.g. localhost in prod), client is `null` and the app runs in **degraded mode** (no cache, no crash).
  - Upstash/TLS supported (`rediss://`); `connectTimeout: 10000`, `maxRetriesPerRequest: 3`, `enableOfflineQueue: false`.
  - Single Redis connection per process (ioredis default); no explicit pool size (acceptable for typical backend usage).

**Recommendations**

- **Low:** Document in ops runbook that when Redis is down or misconfigured, the app runs without cache and with in-memory fallback for rate limiting (if any).
- **Low:** Consider a short TTL or no cache for "admin" or "realtime" analytics if freshness is critical; current 5m analytics TTL is reasonable.

---

### 2.2 Cache warming

**File:** `apps/backend/src/modules/cache/services/cache-warming.service.ts`

**Findings**

- Runs on bootstrap (after 5s) and **every hour** (cron).
- Warms: popular products (50 with brand), active brands (100 with _count), daily analytics (counts + revenue), active user sessions (100 by `lastLoginAt`).
- **Issue 1:** `calculateTotalRevenue()` does `findMany` on **all** orders with `status: 'DELIVERED'` and no `take`. On large tables this is expensive and can spike DB/CPU during warmup.
- **Issue 2:** User warmup uses `lastLoginAt` without an index (see DB section).
- **Issue 3:** Brand warmup uses `where: { status: 'ACTIVE' }`; schema has `BrandStatus` enum and `@@index([status])` — correct.

**Recommendations**

- **Medium:** In `calculateTotalRevenue()` use an aggregated query instead of loading all rows, e.g. `prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { totalCents: true } })`, or a raw `SELECT SUM(total_cents) FROM orders WHERE status = 'DELIVERED'`.
- **Low:** Add a `take` or time window (e.g. last 30 days) for revenue if you ever need "recent revenue" instead of all-time, to keep warmup bounded.

---

## 3. Connection pooling

**File:** `apps/backend/src/libs/prisma/prisma.service.ts`

**Findings**

- Constructor passes `datasources.db.url` from config; no pool options in code.
- Comment states: *"Connection pool settings are applied via DATABASE_URL query params in production (e.g. connection_limit=10&pool_timeout=20&connect_timeout=10). See .env.example and PRODUCTION_CHECKLIST.md."*
- If `DATABASE_URL` has no query params, Prisma uses its defaults (e.g. connection limit can be high or unbounded depending on driver), which can exhaust DB connections under load or with many instances.

**Recommendations**

- **High:** Document in `.env.example` and PRODUCTION_CHECKLIST.md the exact recommended params, e.g.  
  `?connection_limit=10&pool_timeout=20&connect_timeout=10`.
- **Medium:** In production startup (e.g. in `validateEnv` or a small bootstrap check), validate that `DATABASE_URL` contains `connection_limit=` (or parse and check a minimum) and fail fast if not.
- **Low:** Consider a small helper that builds `DATABASE_URL` with default pool params when not provided, so production always has a safe default.

---

## 4. Docker

**Files:** Root `Dockerfile`, `apps/backend/docker-compose.production.yml` (reference only; file was not readable due to .cursorignore)

**Findings (Dockerfile)**

- Multi-stage build: builder (node:22-alpine, pnpm, Prisma generate, Nest build) and production stage.
- Production image includes runtime libs (cairo, jpeg, pango, etc.) and build deps for native modules; comment states goal < 4.0 GB.
- Build fails if `dist/src/main.js` is missing after build (no silent failures).

**Recommendations**

- **Low:** Run the app as a **non-root** user in the production stage if not already (USER directive).
- **Low:** Ensure `docker-compose.production.yml` sets resource limits (memory/CPU) and restarts policy, and that the backend service uses the same `DATABASE_URL` pool params as above.
- **Info:** Re-check Dockerfile and compose in a branch where .cursorignore allows access, or in a separate infra review.

---

## 5. CI/CD

### 5.1 `ci.yml`

**Findings**

- Lint and type-check for frontend and backend.
- Backend unit tests: `--passWithNoTests` and `testPathPattern="(pricing|marketplace|enterprise)"` — only a subset of tests run; full suite may be in another job or path.
- Frontend: `test:coverage` with `COVERAGE_THRESHOLD: 70`; Codecov upload with `fail_ci_if_error: false` (coverage does not block).
- Backend tests job: Postgres + Redis services; migrations; `test` and `test:integration`.
- Security: `pnpm audit --audit-level=moderate` in lint (frontend) and again in security-scan (frontend only). **Backend npm audit is not run in the security-scan job.** TruffleHog for secrets — good.

**Recommendations**

- **Medium:** Run `pnpm audit` for **backend** in the security-scan job (or a dedicated audit job) with a defined audit-level; fix or document exceptions.
- **Low:** Consider enabling `fail_ci_if_error: true` for Codecov (or a separate quality gate) so coverage regressions are visible and optionally blocking.
- **Low:** Confirm that the full backend test suite (all patterns) runs in CI; if not, add a job or expand the pattern so critical paths are covered.

---

### 5.2 `deploy-production.yml`

**Findings**

- Test job: lint + unit tests with **`continue-on-error: true`** for the test step — test failures do not block deployment.
- Deploy backend to Railway; then health check: sleep 30s, then up to 5 retries on `/health`. If health fails, the job fails (good).
- No automatic rollback step if health check fails (deployment has already been applied).
- Smoke tests (health, frontend, auth 401) run after deploy; notifications on success/failure.
- Frontend deploy only on `workflow_dispatch` (documented).

**Recommendations**

- **High:** Remove **`continue-on-error: true`** from the unit test step so that test failures block deployment.
- **Medium:** Add a post-deploy "readiness" check that hits an endpoint reflecting DB connectivity (e.g. `/health` or `/health/readiness` that includes DB) and consider a simple rollback (e.g. redeploy previous commit or call Railway rollback API) if readiness fails after N retries.
- **Low:** Add a security scan step to the deploy workflow (or ensure the same audit/scan that runs in CI is required before deploy) so production is not deployed with known high/critical vulnerabilities.

---

## 6. Monitoring

### 6.1 Health checks

**Files:** `apps/backend/src/modules/health/health.service.ts`, `health.controller.ts`

**Findings**

- **getEnrichedHealth()** checks: DB (SELECT 1), Redis (health + memory/clients/keys), Stripe config, email config, and Bull queues (waiting/active/completed/failed/delayed).
- No **active DB connection count** or pool usage exposed in health; useful for debugging exhaustion and for SLOs.
- Controller exposes: `/health` (enriched + optional Prometheus request stats), `/health/terminus` (DB, Redis, memory, Cloudinary), `/health/metrics` (Prometheus scrape), `/health/detailed` (enriched + terminus + env/node version).

**Recommendations**

- **Medium:** Add a **readiness** check (e.g. `/health/readiness` or reuse `/health`) that:
  - Ensures DB is reachable and, if possible, that the pool is not exhausted (e.g. Prisma `$queryRaw` and optionally a query that returns current connection count from PG if you expose it).
  - Use this URL in deploy-production health check and in Kubernetes/orchestrator readiness probes.
- **Low:** Expose **active connection count** (or pool usage) in the enriched/detailed payload when available (e.g. from Prisma or a small PG query), so monitoring/alerting can track pool usage.

---

### 6.2 Prometheus and alerts

**Files:** `monitoring/prometheus/prometheus.yml`, `monitoring/alerts.yml` (both under .cursorignore; not read)

**Recommendations**

- **Info:** In a follow-up, review Prometheus scrape targets, retention, and alert rules (e.g. error rate > 1%, latency P95 > 500 ms, DB connections > 80% of limit) and ensure they match your SLO doc.
- **Low:** If not already, add an alert when health/readiness fails (e.g. from your uptime checker or from Prometheus probing the health endpoint).

---

### 6.3 Sentry

**Findings**

- Sentry initialized in `instrument.ts` only when `SENTRY_DSN` (or `NEXT_PUBLIC_SENTRY_DSN`) is set.
- `configuration.ts` lists `SENTRY_DSN` in **REQUIRED_PRODUCTION_VARS**; production startup fails if it is missing — good.
- `SentryModule.forRoot()` and `SentryGlobalFilter` are registered in `app.module.ts`; workers (e.g. render, export-pack) use `Sentry.captureException` — good.

**Recommendation**

- **None.** Sentry configuration and production requirement are in good shape.

---

## 7. Environment validation

**File:** `apps/backend/src/config/configuration.ts`

**Findings**

- **Critical (all envs):** `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` (min 32 chars).
- **Production-only required:** `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ENCRYPTION_KEY` (64 hex), `SENTRY_DSN`, FRONTEND_URL or CORS, and at least one email provider.
- **Recommended optional:** CLOUDINARY_*, OPENAI_API_KEY, REDIS_URL.
- Zod schema: `JWT_SECRET`/`JWT_REFRESH_SECRET` min length; `STRIPE_SECRET_KEY` starts with `sk_`; `ENCRYPTION_KEY` 64 hex; `DATABASE_URL` is optional in schema but `checkCriticalVars()` enforces it, so startup fails if missing.

**Recommendations**

- **Low:** Add a production check that `DATABASE_URL` includes connection pool parameters (e.g. `connection_limit=`) or a central "required production URL params" list and validate against it.
- **Info:** Keep documenting all sensitive vars and rotation procedures (e.g. JWT, Stripe, API keys) in a single place as per your Phase 2 plan.

---

## 8. Severity and priority summary

| Severity | Item | Action |
|----------|------|--------|
| **High** | Unit tests in deploy-production use `continue-on-error: true` | Remove so failing tests block deploy. |
| **High** | DB connection pool not enforced in production | Document and validate `connection_limit` (and optionally pool_timeout/connect_timeout) in DATABASE_URL. |
| **Medium** | No index on `User.lastLoginAt` | Add `@@index([lastLoginAt])` (and optionally composite with brandId). |
| **Medium** | Cache warming `calculateTotalRevenue()` loads all DELIVERED orders | Use aggregate (e.g. `_sum: { totalCents }`) or bounded query. |
| **Medium** | Backend npm audit not in security-scan | Run backend `pnpm audit` in CI security job. |
| **Medium** | No readiness/DB connection visibility | Add readiness check and optionally expose DB connection count in health. |
| **Low** | Possible N+1 in list endpoints | Review list APIs for relations and use include/batch loads. |
| **Low** | Docker run as non-root, resource limits | Confirm USER in Dockerfile and limits in docker-compose.production. |
| **Low** | Codecov fail_ci_if_error: false | Consider making coverage failures block or visible. |
| **Low** | Production DATABASE_URL params | Validate pool params at startup in production. |

---

## 9. Next steps (suggested order)

1. Remove `continue-on-error: true` from deploy-production unit tests and add backend audit to security-scan.
2. Add `User.lastLoginAt` index and change `calculateTotalRevenue()` to an aggregate.
3. Document and validate `DATABASE_URL` connection pool params; add readiness check and optional connection count in health.
4. Review list endpoints for N+1 and add Docker/user/limits checks.
5. Re-review Prometheus/alerts and SLOs when monitoring files are accessible.

---

*Audit performed against the Luneo Platform codebase (backend, frontend, monitoring, CI/CD). Some files under .cursorignore (docker-compose.production.yml, prometheus.yml, alerts.yml) were not read; recommendations for those are inferred from context.*
