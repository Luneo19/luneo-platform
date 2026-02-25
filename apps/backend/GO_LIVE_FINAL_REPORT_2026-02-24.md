# Go-Live Final Report — 2026-02-24

## Decision

Status: **GO** (with post-go-live monitoring active).

## Deployments

- Backend Railway deployment: `92afea2a-4528-4e5b-ac8c-ba1b597b7770` (success)
- Frontend Vercel deployment: `dpl_2C8FdtHAZRhdPZYWzXqWBr6hKbtt` (ready, alias `luneo.app`)

## Critical flow verification

- Auth logout:
  - `POST /api/v1/auth/logout` => `200`
  - Follow-up `GET /api/v1/auth/me` => `401`
- Admin RBAC:
  - `GET /api/admin/tenants` (admin session) => `200`
- Public marketing API:
  - `GET /api/public/marketing` => `200` fallback-safe contract
- Login normalization:
  - `POST /api/v1/auth/login` with mixed-case email (`Admin@luneo.app`) => `200`
- OAuth initialization:
  - `GET /api/v1/auth/google` => `302`
  - `GET /api/v1/auth/github` => `302`
- Email stats guard:
  - USER => `401`
  - ADMIN => `200`

## Security hardening closure

- Canonical sitemap cleanup completed (aliases/redirect URLs removed from sitemap output).
- Admin mutative proxy routes aligned on shared forwarding helper:
  - forwards `Cookie`, `Authorization` (if present), and `x-csrf-token`.
  - matrix archived in `apps/frontend/src/lib/api/CSRF_RBAC_MUTATIVE_MATRIX_2026-02-24.md`.
- Email status endpoint now admin-only (`GET /email/status`).
- OAuth defaults are no longer silently assumed:
  - startup warnings now emitted when `state/pkce` flags are unset.

## SEO verification snapshot

- Previous state: 94 URLs with 18x404.
- Current state: 76 URLs, 0x404, canonical redirect-only behavior tracked separately.
- Hardening action completed: sitemap no longer emits known redirected aliases.

## Incident summary (hypercare window)

- P1 unresolved incidents: **0**
- P2 unresolved incidents: **0**
- Known residual risk: runtime checks for CSRF matrix still required on staging/prod per runbook steps.

## SLO / observability checkpoints

- Health endpoints expected green:
  - `https://api.luneo.app/health`
  - `https://api.luneo.app/api/v1/health`
- Frontend canonical host enforcement:
  - `www.luneo.app` / `app.luneo.app` redirect to `https://luneo.app`
- Error tracking:
  - no critical unhandled regressions accepted for closure

## Closure checklist

- [x] Critical auth/RBAC/public API regressions fixed
- [x] CSRF/RBAC mutative proxy hardening completed
- [x] Canonical sitemap cleanup completed
- [x] Security endpoint hardening completed (`/email/status`)
- [x] OAuth flag explicitness improved (startup warnings)
- [x] Final report produced and linked from hypercare runbook
