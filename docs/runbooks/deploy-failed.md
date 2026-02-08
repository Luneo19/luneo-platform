# Runbook: Deploy Failed

**Severity:** P1 — New version not live or production broken  
**Owner:** DevOps / Backend / Frontend (depending on failure)  
**Estimated resolution:** 10–30 min

---

## 1. Detection

- **CI/CD pipeline fails** — GitHub Actions (or other) red; build, test, or deploy step failed.
- **Health check fails post-deploy** — New deployment is live but `/health` or critical endpoints return 5xx.
- **Runtime errors** — Sentry spike right after a deploy; users report errors.
- **Smoke checks fail** — Automated post-deploy checks (login, API, DB) fail.

---

## 2. Diagnosis

### Step 1: Locate the failure

- **Build failure:** Check CI logs for compile errors (TypeScript, missing deps, wrong Node version).
- **Test failure:** Which test failed (unit, e2e)? Link to failing job and line.
- **Deploy failure:** Platform error (Railway, Vercel, etc.) — quota, env, build command, or start command.
- **Post-deploy failure:** App starts but health check or first requests fail — env vars, DB/Redis, migration, or code bug.

### Step 2: Check build logs

- **Backend (NestJS):** `pnpm build` or `npm run build` in `apps/backend` — look for TS errors, Prisma generate, missing env.
- **Frontend (Next.js):** `pnpm build` in `apps/frontend` — look for build errors, missing env (e.g. `NEXT_PUBLIC_*`).

### Step 3: Check migrations and DB

- **Prisma:** If deploy runs migrations, check for failed migration (syntax, conflict, timeout).
- **Connection:** Ensure production DATABASE_URL is correct and DB is reachable from the platform.

### Step 4: Check environment variables

- Compare required env vars (see [ONBOARDING.md](../ONBOARDING.md) and deployment docs) with what’s set in the deployment platform.
- Typical: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `STRIPE_*`, `NEXT_PUBLIC_*`, etc.

---

## 3. Resolution

### Option A: Rollback to previous version (fastest recovery)

1. **Vercel:** Deployments → select last known good deployment → "Promote to Production".
2. **Railway:** Deployments → select previous successful deploy → "Redeploy" or set as production.
3. **Manual:** Revert the commit that broke the build, push, and let CI redeploy:
   ```bash
   git revert <bad-commit> --no-edit
   git push origin main
   ```
4. Confirm health and Sentry after rollback.

### Option B: Fix and redeploy

- **Build error:** Fix TypeScript, dependencies, or build script; push and let CI run again.
- **Test error:** Fix test or code; push and re-run pipeline.
- **Env error:** Add/fix env vars in platform; trigger redeploy (no code change).
- **Migration error:** Fix migration or run it manually if safe; then redeploy. If migration is destructive, involve lead; consider rollback first.

### Option C: Hotfix branch

- If main is broken and you need a quick fix:
  ```bash
  git checkout -b hotfix/deploy-fix
  # make minimal fix
  git add . && git commit -m "fix: deploy / health check"
  git push origin hotfix/deploy-fix
  ```
- Open PR, get quick review, merge to main and deploy.

### After resolution

- Verify health checks and critical user flows.
- Document cause (e.g. "missing env VAR_X") and add prevention (docs, checklist, or CI check).
- If you rolled back, create a follow-up task to fix forward and redeploy.

---

## 4. Prevention

| Action | Description |
|--------|-------------|
| **Staging environment** | Deploy to staging first; run same migrations and smoke tests before production. |
| **Smoke tests** | Post-deploy job that hits `/health` and maybe login/API; fail the pipeline if it fails. |
| **Canary / phased rollout** | If supported, roll out to a fraction of traffic before full deploy. |
| **Env checklist** | Document required env vars and validate in CI or deploy script (e.g. fail if critical var missing). |
| **Migration safety** | Review migrations for backwards compatibility; avoid long locks; test on staging. |

---

## 5. Escalation

- **P1:** Rollback first if production is broken; then fix. Page on-call if deploy is stuck and production is down.
- **Data or migration issue:** Involve lead/backend before re-running or writing new migrations; follow [DISASTER_RECOVERY.md](../DISASTER_RECOVERY.md) if needed.
