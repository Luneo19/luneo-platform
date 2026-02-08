# Runbooks — Incident response

Step-by-step guides for common production incidents. Use when alerts fire or a teammate reports an issue. If in doubt, **rollback or restore first**, then fix forward.

---

## Index

| Runbook | Severity | When to use |
|---------|----------|-------------|
| **[database-down.md](./database-down.md)** | P1 | Health check fails, API 500s, Sentry DB connection errors |
| **[redis-down.md](./redis-down.md)** | P2 | Cache/rate limiting broken, Redis connection errors |
| **[stripe-down.md](./stripe-down.md)** | P2 | Checkout failures, webhook timeouts, Stripe API errors |
| **[deploy-failed.md](./deploy-failed.md)** | P1 | CI/CD failed, health check fails after deploy |

---

## How to use

1. **Confirm** the symptom matches the runbook (detection section).
2. **Follow** diagnosis steps to validate the cause.
3. **Apply** resolution steps in order; escalate if resolution fails or severity is higher than expected.
4. **After** resolution: verify health, check Sentry, and update status/team.

For disaster recovery (full DB restore, RPO/RTO), see [../DISASTER_RECOVERY.md](../DISASTER_RECOVERY.md).
