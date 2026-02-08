# Disaster Recovery Plan — Luneo Platform

**Objectives:** Restore service and data within agreed limits. Review and test this plan quarterly.

---

## Recovery objectives

| Metric | Target | Notes |
|--------|--------|------|
| **RPO** (Recovery Point Objective) | **6 hours max** data loss | Backups at least every 6 hours (or more frequently if required). |
| **RTO** (Recovery Time Objective) | **30 minutes** to restore service | From decision to restore until core services are up. |

---

## Procedures

### 1. Full database restore

**When:** Database is corrupted, lost, or must be reverted to a known-good state.

**Steps:**

1. **Identify latest usable backup**  
   Use your provider’s backup list (Supabase, Railway, Neon, or self-hosted schedule). Note backup time to communicate RPO.

2. **Restore to a new instance or over existing**  
   - **Managed (Supabase/Neon/Railway):** Use provider UI/CLI to restore from backup (often creates a new instance or restores to a chosen time).  
   - **Self-hosted:** Restore from pg_dump or filesystem backup per your backup procedure.

3. **Update DATABASE_URL**  
   Point backend (and any other consumers) to the restored instance. Use env vars in your deployment platform; no secrets in repo.

4. **Run migrations if needed**  
   If restore is to an empty or older schema, run:
   ```bash
   cd apps/backend && npx prisma migrate deploy
   ```

5. **Restart backend**  
   Redeploy or restart the API so it uses the new connection.

6. **Verify**  
   Hit `/health`, test login and one critical flow. Check Sentry for DB errors.

7. **Communicate**  
   Notify stakeholders (see Communication plan). If data was lost (e.g. last 2 hours), state the last restored time (RPO).

---

### 2. Partial data recovery (e.g. single table or time range)

**When:** Accidental delete, bad migration, or corrupted data in a subset of tables.

**Steps:**

1. **Stop further writes** if possible (e.g. turn off background jobs or put app in maintenance) to avoid new data that conflicts with restore.

2. **Identify source of truth**  
   Restore from a backup (table-level export, logical backup, or PITR if provider supports it).

3. **Restore selectively**  
   - Use a backup copy or staging DB restored from backup.  
   - Export the needed table(s) or rows (e.g. `pg_restore` with table filter, or SQL dump of specific tables).  
   - Import into production (e.g. `psql` or Prisma scripts). Prefer restoring to a staging DB first and validating.

4. **Re-run or fix migrations** if the incident was migration-related; coordinate with backend lead.

5. **Resume writes** and verify app behavior and Sentry.

6. **Document** what was restored and from which backup/time.

---

### 3. Service re-deployment (full outage)

**When:** Entire application or platform is down (e.g. bad deploy, provider outage).

**Steps:**

1. **Rollback deploy**  
   Use the platform’s rollback (e.g. Vercel/Railway “Promote previous deployment”). See [runbooks/deploy-failed.md](./runbooks/deploy-failed.md).

2. **If rollback is not enough:**  
   - Restart services (backend, frontend, workers).  
   - Check DATABASE_URL, REDIS_URL, and critical env vars.  
   - If DB or Redis is down, follow [runbooks/database-down.md](./runbooks/database-down.md) and [runbooks/redis-down.md](./runbooks/redis-down.md).

3. **Restore from backup only if** data is lost or corrupted; otherwise restoring service is enough (procedure 1 above).

4. **Verify** health checks and critical paths; then communicate all-clear.

---

## Communication plan

| Role / channel | Responsibility |
|----------------|----------------|
| **Incident lead** | Decides when to invoke DR (full restore, partial, rollback). |
| **On-call / DevOps** | Executes procedures; updates status page and internal channel. |
| **Status page** | Post “Investigating” → “Identified” → “Restoring” → “Resolved” with short, honest updates (e.g. “Payments delayed”, “Database restored; data prior to 14:00 UTC”). |
| **Stakeholders** | Notify product/lead/CTO when RPO/RTO is breached or when a full DB restore is completed. |
| **Post-incident** | Post-mortem with timeline, root cause, and DR improvements (backup frequency, automation, testing). |

Keep a short contact list (Slack channel, PagerDuty, or equivalent) in a pinned doc or runbook so anyone can trigger communication.

---

## Test schedule

| Activity | Frequency | Owner |
|----------|------------|--------|
| **DR test (restore from backup)** | **Quarterly** | DevOps / Backend lead |
| **Review RPO/RTO and backup retention** | After any incident or major change | Same |
| **Update runbooks and this doc** | After runbook or infra changes | Anyone making the change |

**Suggested DR test:** Restore the latest backup to a staging DB, run migrations, smoke-test login and one payment flow, and document duration and any issues.

---

## Checklist (quick reference)

- [ ] Backups run at least every 6 hours (or per your RPO).
- [ ] Backup restore procedure documented and tested quarterly.
- [ ] DATABASE_URL and other secrets are in the deployment platform, not in repo.
- [ ] Rollback path (previous deploy) is known and tested.
- [ ] Status page and contact list are defined and accessible.
- [ ] Runbooks linked: [runbooks/](./runbooks/) (database-down, redis-down, stripe-down, deploy-failed).

---

**Last updated:** February 2025
