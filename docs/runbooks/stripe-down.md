# Runbook: Stripe Down or Checkout Failures

**Severity:** P2 — Payments and checkout affected  
**Owner:** Backend / Product  
**Estimated resolution:** 15–60 min (depending on Stripe status)

---

## 1. Detection

- **Checkout failures** — Users cannot complete payment; errors on payment page.
- **Webhook timeouts** — Stripe webhooks to our backend timing out or returning 5xx.
- **Sentry / logs** — Stripe API errors: "StripeConnectionError", 5xx from Stripe, webhook signature failures.
- **Stripe Dashboard** — Failed payments, delayed webhooks, or status incident.

---

## 2. Diagnosis

### Step 1: Check Stripe status

- **Status page:** https://status.stripe.com  
- If there’s an incident, follow their ETA and consider showing a maintenance message.

### Step 2: Check our webhook endpoint

- **Stripe Dashboard → Developers → Webhooks** — Check recent delivery attempts and response codes.
- **Our logs** — Search for webhook path (e.g. `/api/v1/webhooks/stripe`) and errors (timeouts, 500, signature errors).

### Step 3: Check API key and config

- **STRIPE_SECRET_KEY** and **STRIPE_WEBHOOK_SECRET** — Present and correct for the environment (test vs live).
- No accidental use of test key in production or vice versa.

### Step 4: Idempotency and retries

- Stripe retries webhooks; ensure we return 2xx only after successfully processing (and use idempotency so retries don’t duplicate orders).

---

## 3. Resolution

### Option A: Stripe incident (their side)

1. Post status update (e.g. "Payments temporarily unavailable — we’re monitoring Stripe").
2. **Queue failed payments for retry:** Ensure failed payment intents are not marked as permanently failed; Stripe will retry webhooks; we can also poll or use Stripe’s "retry" in dashboard.
3. **Show maintenance message** on checkout: "Payment processing is temporarily unavailable. Please try again in 30 minutes."
4. Re-enable checkout when Stripe status is green and we’ve verified one successful test payment.

### Option B: Our webhook or backend failing

1. **Fix backend/webhook** (e.g. timeout, bug, wrong secret) and deploy.
2. In Stripe Dashboard → Webhooks → select endpoint → "Resend" for recent failed events if needed.
3. Verify with a test payment (Stripe test mode) and then a small live payment if appropriate.

### Option C: Key or config mistake

1. Correct **STRIPE_SECRET_KEY** and **STRIPE_WEBHOOK_SECRET** in environment.
2. Restart backend and redeploy.
3. Resend failed webhooks from Stripe Dashboard if necessary.

### After resolution

- Confirm one successful payment end-to-end (create payment → webhook received → order/DB updated).
- Check Sentry for new Stripe errors.
- If we showed a maintenance message, remove it and notify (e.g. status page, in-app).

---

## 4. Prevention

| Action | Description |
|--------|-------------|
| **Webhook retry queue** | Process webhooks in a queue (e.g. BullMQ); on failure, retry with backoff so we return 2xx to Stripe only when processing succeeds. |
| **Idempotency keys** | Use idempotency for payment creation and webhook handling so duplicate events don’t create duplicate orders. |
| **Monitoring** | Alert on webhook 5xx or Stripe API errors in Sentry. |
| **Status subscription** | Subscribe to https://status.stripe.com for quick awareness. |

---

## 5. Escalation

- **P2:** Resolve within SLA; if Stripe is down, no code fix will help — focus on communication and retry strategy.
- **Data inconsistency:** If webhooks were lost, reconcile with Stripe Dashboard and our DB; document in post-mortem and consider manual reconciliation for affected orders.
