# Production deployment checklist – Luneo Backend

Use this list before going live to ensure the backend is production-ready.

## Production readiness (completed)

The following items have been implemented and are in place:

- [x] **httpOnly cookies** – Auth tokens stored in httpOnly cookies (no localStorage)
- [x] **SEO** – Metadata and SEO handling in place
- [x] **CI/CD** – Automated pipelines (e.g. GitHub Actions) for build and deploy
- [x] **Monitoring/SLO** – Sentry and health checks; SLO/monitoring configured
- [x] **Content moderation** – AI prompt/content moderation in place
- [x] **RBAC** – Role-based access control implemented
- [x] **Database backups** – Backup strategy and tooling in place
- [x] **Shopify sync** – Shopify integration/sync implemented
- [x] **Documentation** – API docs (Swagger), README and internal docs updated
- [x] **Industry Adaptive Dashboard** — 9 industries, adaptive widgets, KPIs, terminology
- [x] **Onboarding Flow** — 6-step onboarding with industry selection
- [x] **Organization Model** — Organization -> Brand hierarchy
- [x] **Dashboard Customization** — Per-user widget preferences

## Environment variables

- [ ] **DATABASE_URL** – PostgreSQL connection string. For production, add pooling params to the URL, e.g. `?schema=public&connection_limit=10&pool_timeout=20&connect_timeout=10` (see `.env.example`).
- [ ] **JWT_SECRET** – Min 32 characters
- [ ] **JWT_REFRESH_SECRET** – Min 32 characters
- [ ] **STRIPE_SECRET_KEY** – Stripe secret key (starts with `sk_`)
- [ ] **STRIPE_WEBHOOK_SECRET** – Stripe webhook signing secret
- [ ] **ENCRYPTION_KEY** – 64 hex characters for AES-256-GCM
- [ ] **FRONTEND_URL** or **CORS_ORIGIN** – Production frontend URL or explicit CORS origins (not `*` in production)
- [ ] **Email** – At least one of:
  - **SENDGRID_API_KEY**, or
  - **MAILGUN_API_KEY** + **MAILGUN_DOMAIN**, or
  - **SMTP_HOST** + **SMTP_FROM** (or **FROM_EMAIL**)

## Database connection pooling

- [ ] **Production DATABASE_URL** includes pooling query params when using a single connection string (e.g. Neon, Supabase direct): `connection_limit=10`, `pool_timeout=20`, `connect_timeout=10`. If you use an external connection pooler (e.g. PgBouncer, Neon pooler), use the pooler URL and follow the provider’s recommended limits.

## Infrastructure

- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] SSL/HTTPS active (TLS termination at load balancer or reverse proxy)
- [ ] CORS configured with production domains (no `*` in production)

## Security & reliability

- [ ] Rate limiting enabled (e.g. `ENABLE_RATE_LIMIT_IN_DEV=true` or default in production)
- [ ] **SENTRY_DSN** configured for error tracking
- [ ] Stripe webhook endpoint configured and pointing to your production URL
- [ ] Email provider configured and tested (welcome, password reset, etc.)

## Dependencies

- [ ] **REDIS_URL** set and Redis reachable (for rate limiting, caching, sessions)
- [ ] Health check endpoint responding at **/health** (and optionally **/api/v1/health**)
- [ ] Monitoring dashboard configured (e.g. Sentry, Prometheus, or provider dashboard)

## Post-deployment steps

- [ ] Run database seed: `pnpm prisma db seed` (populates 9 industries with configs)
- [ ] Verify `/api/v1/industries` returns 9 active industries
- [ ] Verify `/api/v1/health` returns `status: "ok"`
- [ ] Test onboarding flow: register -> select industry -> complete -> adaptive dashboard
- [ ] Configure Stripe webhook endpoint: `https://your-domain.com/api/v1/billing/webhook`

## Database backup strategy

- [ ] **Automated daily backups** – Configure your PostgreSQL provider (Neon/Supabase/RDS) for automated daily snapshots
- [ ] **Point-in-time recovery (PITR)** – Enable WAL archiving for point-in-time recovery (supported by Neon/Supabase natively)
- [ ] **Backup retention** – Minimum 7 days for daily backups, 30 days for weekly backups
- [ ] **Backup testing** – Quarterly restore test to verify backup integrity
- [ ] **Cross-region replication** – For disaster recovery, consider a read replica in a different region

### Backup commands (manual, if needed)

```bash
# Export database (pg_dump)
pg_dump $DATABASE_URL --format=custom --file=backup_$(date +%Y%m%d).dump

# Restore from backup
pg_restore --dbname=$DATABASE_URL backup_20260208.dump
```

## Alerting and monitoring

- [ ] **Sentry alerts** – Configure alert rules in Sentry dashboard:
  - Error spike: alert when error rate exceeds 10/min for 5 minutes
  - New issue: notify on first occurrence of any new error
  - Regression: alert when a previously resolved issue recurs
- [ ] **Uptime monitoring** – Set up external health check monitoring (e.g. Better Stack, Pingdom):
  - Backend: `https://api.luneo.app/health` (interval: 1 min, alert after 2 failures)
  - Frontend: `https://luneo.app/api/health` (interval: 1 min, alert after 2 failures)
- [ ] **SSL certificate expiry** – Monitor SSL certificate expiration (30-day warning)
- [ ] **Notification channels** – Configure at least 2 channels:
  - Primary: Slack (`SLACK_WEBHOOK_URL` in GitHub secrets)
  - Secondary: Email to ops team
- [ ] **On-call rotation** – Define who receives production alerts

## Optional but recommended

- [ ] **CLOUDINARY_CLOUD_NAME** (and API key/secret) for media storage
- [ ] **OPENAI_API_KEY** if using AI features
- [ ] **SENTRY_DSN** for production error monitoring

---

After deployment, call `GET /health` or `GET /api/v1/health` and confirm `status: "ok"` and that `dependencies.database`, `dependencies.redis`, `dependencies.stripe`, and `dependencies.email` show expected statuses.
