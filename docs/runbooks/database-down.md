# Runbook: Database Down

**Severity:** P1 — Service unavailable  
**Owner:** Backend / DevOps  
**Estimated resolution:** 15–30 min

---

## 1. Detection

- **Health check fails:** `/health` or `/api/v1/health` returns 5xx or "unhealthy"
- **Sentry alerts:** Exceptions like "Connection refused", "ETIMEDOUT", "Connection pool exhausted"
- **API returns 500** on most endpoints that touch the database
- **Symptoms:** Login/signup fails, all data-dependent pages fail

---

## 2. Diagnosis

### Step 1: Confirm it's the database

```bash
# From backend app or a jump host
curl -s http://localhost:3001/health
# If DB check fails, health will show database: false
```

### Step 2: Check connection and env

- **DATABASE_URL** — Correct in the environment? No typos, correct host/port/db name.
- **Connection limits** — Check provider (e.g. Supabase, Railway) for max connections; Prisma default pool may be too high.
- **Disk space** — On self-hosted Postgres: `df -h` on DB server; low disk can cause failures.

### Step 3: Check provider status

- **Supabase:** https://status.supabase.com
- **Railway:** https://status.railway.app
- **Neon / other:** Check provider status page

### Step 4: Quick connectivity test

```bash
# If you have psql
psql "$DATABASE_URL" -c "SELECT 1;"
```

---

## 3. Resolution

### Option A: Restart connection pool (app-side)

- Restart the backend service so the pool is recreated.
- **Railway/Vercel:** Redeploy or restart the backend service.
- **Local:** Stop and start `apps/backend` (e.g. `pnpm dev` or `npm run start:dev`).

### Option B: Failover to replica (if configured)

- If you have a read replica and failover:
  1. Point `DATABASE_URL` to the replica (or use provider failover).
  2. Restart backend so it picks up the new URL.
  3. Be aware: replica may be read-only; writes may need to go to primary after it recovers.

### Option C: Restore from backup

- Use only if data is corrupted or lost.
- Follow [DISASTER_RECOVERY.md](../DISASTER_RECOVERY.md) — Full DB restore.

### After resolution

- Confirm health: `curl http://<backend>/health`
- Check Sentry for new DB errors.
- If you changed env (e.g. DATABASE_URL), document it and inform the team.

---

## 4. Prevention

| Action | Description |
|--------|-------------|
| **Connection pooling** | Use Prisma connection pool limits; avoid opening too many connections (e.g. keep pool size within provider limits). |
| **Monitoring** | Alert on health check failures and DB connection errors in Sentry. |
| **Automated backups** | Daily (or more frequent) backups; test restore periodically. |
| **Status checks** | Subscribe to provider status page for outages. |

---

## 5. Escalation

- **P1:** Page on-call if not resolved in 15 minutes.
- **Provider outage:** Post status update, consider maintenance message on app.
- **Data loss suspected:** Follow [DISASTER_RECOVERY.md](../DISASTER_RECOVERY.md) and notify lead/CTO.
