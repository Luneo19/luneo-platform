# Revenue Audit Matrix

## Endpoint -> Guard -> Quota -> Billing state

| Surface | Endpoint | Protection | Quota/Plan | Billing lock behavior |
|---|---|---|---|---|
| Stripe webhook | `/api/v1/billing/webhook` | Stripe signature + idempotency | N/A | Always allowed |
| SendGrid webhook | `/api/v1/webhooks/sendgrid/events` | SendGrid signature + throttle | N/A | Always allowed |
| Checkout | `/api/v1/billing/create-checkout-session` | JWT + throttle + lock | Plan selection checks | Allowed in lock (recovery path) |
| Change plan | `/api/v1/billing/change-plan` | JWT + throttle + lock | Plan constraints | Allowed in lock (recovery path) |
| Customer portal | `/api/v1/billing/customer-portal` | JWT | N/A | Allowed in lock (recovery path) |
| Widget start | `/api/v1/widget/conversations` | public + origin checks | `conversations` quota | Not affected by auth lock |
| Widget send message | `/api/v1/widget/conversations/:id/messages` | signed conversation token | `messages_ai` quota | Not affected by auth lock |
| Widget read/stream | `/api/v1/widget/conversations/:id/messages` + `/stream` | signed conversation token | N/A | Not affected by auth lock |
| Agent execution | orchestrator runtime | quota check before LLM | `messages_ai` quota + metering | blocked by quota logic |
| Admin refund | `/api/v1/admin/billing/:subscriptionId/refund` | admin role + throttle + distributed lock | N/A | admin bypass lock |

## Webhook event -> Business action -> Email

| Event | Business action | Email |
|---|---|---|
| `checkout.session.completed` | activate plan, reset limits | subscription confirmation |
| `invoice.paid` | clear lock/grace, reactivate | invoice paid |
| `invoice.payment_failed` | set grace read-only (3 days) | payment failed |
| `invoice.payment_action_required` | no state change | action required |
| `customer.subscription.updated` | sync status/plan/period | subscription updated |
| `customer.subscription.deleted` | revert FREE | subscription canceled |
| `customer.subscription.trial_will_end` | reminder | trial ending |
| `checkout.session.async_payment_failed` | no state change | checkout failed |

## P0 hardening status

- Billing entitlements guard global: implemented
- Grace read-only 3 days then suspension: implemented
- Stripe idempotency fail-safe: implemented
- Admin refund anti double and lock: implemented
- SendGrid webhook signature verification: implemented
- Widget signed conversation token: implemented
