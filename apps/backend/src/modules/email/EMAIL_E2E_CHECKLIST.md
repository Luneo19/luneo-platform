# Email E2E Checklist (SendGrid-first)

## Auth & Security
- [ ] Forgot password returns generic success message (anti-enumeration)
- [ ] Reset token invalid/expired/reused is rejected
- [ ] Reset link host is always `https://luneo.app`
- [ ] Password reset flow works end-to-end in production

## Core Transactional Emails
- [ ] Welcome email sent in FR/EN according to locale
- [ ] Email confirmation sent with valid verification link
- [ ] Password reset email sent with valid reset link
- [ ] Contact form submits through backend `EmailService` only

## Billing / Invoices
- [ ] `checkout.session.completed` triggers subscription email
- [ ] `invoice.paid` sends invoice paid email with invoice link
- [ ] `invoice.payment_failed` sends payment failure email
- [ ] `customer.subscription.updated/deleted` triggers customer notification

## Marketing Admin
- [ ] Templates endpoint returns `sendgridTemplateId` when available
- [ ] Automation "Run test" sends a real email via provider
- [ ] Marketing communications logs endpoint is available on frontend proxy

## Observability
- [ ] SendGrid Event Webhook `POST /api/v1/webhooks/sendgrid/events` stores events
- [ ] Admin communications stats include SendGrid event counts
- [ ] Admin communications logs include SendGrid delivery events
