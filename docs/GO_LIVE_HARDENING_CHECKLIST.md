# GO-LIVE Hardening Checklist

## Scope

This checklist covers the final hardening pass for waves 8 to 10:

- API public security and quota enforcement
- Outbound webhooks reliability and DLQ replay
- Scheduled messages reliability guardrails
- Public status page consistency (backend-driven)
- Enterprise endpoints baseline (white-label, partners, export)

## Endpoint Security Review

- `public/*`
  - `ApiKeyGuard` enabled
  - `ApiScopeGuard` enabled
  - `ApiPermissionGuard` enabled
  - `ApiQuotaGuard` enabled (Redis-backed, fail-open on Redis outage)
  - Payload validation enabled for outbound message DTO
  - Query limit parsing hardened with `ParseIntPipe`

- `public/developer/*`
  - `JwtAuthGuard` enabled
  - Organization scoping enforced (`requireOrg`)
  - API key lifecycle operations audited in `audit_logs`
  - Sandbox execution route isolated

- `webhooks/*`
  - `JwtAuthGuard` enabled for management endpoints
  - URL + event + retry constraints validated by DTO
  - HMAC signature on outbound delivery (`sha256`)
  - Delivery logs persisted in `webhook_logs`
  - DLQ path persisted in `failed_jobs`
  - Manual replay endpoint available

- `scheduled-messages/*`
  - `JwtAuthGuard` enabled
  - Organization scoping enforced
  - Future timestamp validation enforced
  - Conversation existence validation enforced
  - Unsupported contact-only scheduling blocked

- `status/public`
  - Public route intentionally exposed
  - Data source is backend consolidated health + incidents
  - No sensitive payload returned

## Reliability Controls

- Webhook retries:
  - Exponential delay with cap
  - Max retry threshold from `Webhook.maxRetries`
  - Auto-status switch to `FAILED` after retry budget exhaustion

- DLQ replay:
  - Failed payload persisted before retry scheduling
  - Replay endpoint marks failed job as resolved on success

- Scheduled messages:
  - Minute-based scheduler
  - Per-item failure isolation
  - Failure recording in `failed_jobs`

## Observability

- Public API auth and management actions written to `audit_logs`
- Webhook deliveries written to `webhook_logs`
- Failed async jobs written to `failed_jobs`
- Public status endpoint aggregates current signals for external visibility

## Validation Commands Executed

- `pnpm --filter @luneo/backend type-check`
- `pnpm --filter luneo-frontend type-check`
- Linter diagnostics checked on changed modules

## Remaining Production Recommendations

- Add integration tests for:
  - API key scope/permission mismatch matrix
  - webhook retry chain + manual replay
  - scheduled message dispatch timing window
- Add per-endpoint audit correlation IDs in responses and logs
- Add signed webhook secret rotation workflow
- Add runbook for DLQ operational recovery
