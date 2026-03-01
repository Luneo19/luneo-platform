# CSRF/RBAC Matrix — Admin Mutative Routes (2026-02-24)

## Scope

Audit scope: `apps/frontend/src/app/api/admin/**` routes with mutative verbs (`POST`, `PUT`, `PATCH`, `DELETE`) that proxy to backend endpoints.

Validation criteria:
- Frontend proxy enforces admin access (`getAdminUser` / equivalent).
- Forwarded headers include `Cookie` + `x-csrf-token` (via `buildAdminForwardHeaders`).
- Backend receives request under global guards (`CsrfGuard`, `JwtAuthGuard`, `RolesGuard`).

## Routes audited

- `POST|PUT|DELETE /api/admin/tenants/[brandId]/features`
- `POST /api/admin/webhooks/[webhookId]/test`
- `PATCH|DELETE /api/admin/webhooks/[webhookId]`
- `POST /api/admin/webhooks`
- `PUT /api/admin/settings`
- `PATCH /api/admin/brands/[brandId]`
- `PUT|DELETE /api/admin/marketing/templates/[id]`
- `POST /api/admin/marketing/automations`
- `PUT|DELETE /api/admin/orion/automations/[id]`
- `POST /api/admin/orion/automations`
- `PUT|DELETE /api/admin/orion/communications/templates/[id]`
- `POST /api/admin/orion/communications/templates`
- `PUT /api/admin/orion/agents/[id]`
- `POST /api/admin/orion/quick-wins/welcome-setup`
- `PUT /api/admin/orion/notifications/read-all`
- `PUT /api/admin/orion/notifications/[id]/read`
- `POST /api/admin/orion/experiments`
- `DELETE /api/admin/orion/segments/[id]`
- `POST /api/admin/orion/segments`
- `POST /api/admin/orion/seed`
- `PUT|DELETE /api/admin/marketing/automations/[id]`

## Result

- All listed mutative routes forward headers through `buildAdminForwardHeaders`.
- `buildAdminForwardHeaders` forwards `Cookie`, `Authorization` (if present), and `x-csrf-token` (if present).
- Frontend RBAC guard remains in place on all listed routes.

## Test evidence

- Unit test added: `apps/frontend/src/lib/api/__tests__/admin-forward-headers.test.ts`
  - verifies forwarding of `x-csrf-token` when present,
  - verifies no forged CSRF header is injected when absent.

## Notes

- This matrix is a code-level hardening artifact. Runtime validation (staging/prod) should execute:
  1. mutation without `x-csrf-token` + `csrf_token` cookie mismatch => expected `403`,
  2. mutation with matching header+cookie and admin session => expected `2xx`.
