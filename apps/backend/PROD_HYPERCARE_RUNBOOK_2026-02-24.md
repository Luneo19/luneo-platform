# Go-Live Hypercare — 2026-02-24

## Scope

- Backend production: Railway service `backend` on `api.luneo.app`
- Frontend production: Vercel project `frontend` on `luneo.app` (canonique) avec redirection `www.luneo.app` et `app.luneo.app` vers l'apex
- Redis/Bull target state: enabled and healthy

## Fast Rollback (<10 min)

1. Frontend rollback
   - `vercel list`
   - `vercel promote <deployment-url> --scope luneos-projects --yes`
2. Backend rollback
   - `railway deployment list --service backend --environment production`
   - `railway redeploy --service backend --environment production`
3. Health confirmation
   - `curl https://api.luneo.app/health`
   - `curl https://api.luneo.app/api/v1/health`
   - `curl -I https://luneo.app`

## Hypercare Window (24h)

Monitor every 15 minutes for 2 hours, then hourly:

- Availability:
  - `api.luneo.app/health` and `api.luneo.app/api/v1/health` == `200`
  - `luneo.app` == `200`, `www.luneo.app` et `app.luneo.app` == `301/308` vers `https://luneo.app`
- Errors:
  - Railway logs: no sustained `5xx`, no restart loops
  - Vercel logs: no spikes of `500/503` on `/api/v1/*` proxies
  - Sentry: no critical unhandled exceptions
- Payments:
  - Stripe webhook ingestion stays healthy
  - Checkout and portal requests succeed
- Queues:
  - Redis dependency remains `status: ok` on `/api/v1/health`
  - Bull queue backlog stable (`waiting/failed`)
- Latency:
  - p95 API latency remains within target

## Rollback Triggers

Rollback if unresolved for >10 minutes:

- API health not `ok`
- Auth critical path broken (signup/login)
- Stripe checkout/webhook broken
- Sustained critical `5xx` increase

## Hypercare Closure

- No unresolved P1/P2 incident
- Redis/Bull healthy over full window
- No critical Sentry regressions
- Post-release report completed: `apps/backend/GO_LIVE_FINAL_REPORT_2026-02-24.md`
