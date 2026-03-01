# Support Ops Runbook (Email + Live Chat)

## Scope

This runbook defines the operational support model for Luneo public channels:

- Primary channel: `support@luneo.app`
- Secondary channel: live chat (when `NEXT_PUBLIC_SUPPORT_CHAT_URL` is configured)
- Fallback channel: `/contact` form

No phone support is part of the public support contract.

## SLA Targets

- P0 (production blocking, checkout/auth/support outage): first response <= 30 min
- P1 (major degradation, partial outage): first response <= 2 h
- P2 (functional bug, no critical block): first response <= 8 h
- P3 (question/feature request): first response <= 24 h

Target coverage window:

- Email: 24/7 intake, triage during business hours with on-call escalation for P0/P1
- Chat: business hours (CET), with escalation to email ticket if unavailable

## Triage Procedure

1. Confirm source and context (email/chat/contact).
2. Classify severity (P0/P1/P2/P3).
3. Create or update incident/ticket with timestamp and owner.
4. Acknowledge customer with ETA and next update window.
5. Escalate to engineering if P0/P1 or blocked by platform dependency.

## Escalation Matrix

- Billing/checkout/webhook: backend + billing owners
- Auth/session/admin access: backend + frontend owners
- Support delivery issues (email/chat outage): ops + frontend owners

Escalate immediately for:

- Multiple customers impacted
- Security/compliance suspicion
- Revenue-impacting flow blocked

## Operational Checks (daily)

- Verify support page `/help/support` is reachable and displays email/chat options
- Validate support inbox can receive and send replies
- Validate chat widget availability when configured
- Run critical smoke checks (`pnpm run smoke:critical`) and log result

## Incident Communication Template

- Acknowledge issue and impact scope
- Share current status and mitigation
- Share next update time
- Confirm resolution and post-incident follow-up

## Post-Incident

- Publish concise RCA for P0/P1 incidents
- Record action items at J+1 and J+7
- Update this runbook when process gaps are identified
