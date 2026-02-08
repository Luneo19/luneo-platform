# Secrets Rotation Guide – Luneo Platform

This document describes how to rotate critical secrets without downtime and how to verify each rotation.

---

## 1. JWT_SECRET and JWT_REFRESH_SECRET

**Purpose:** Signing and verifying access and refresh tokens.

### How to generate new values

```bash
# 32+ character secrets (recommended: 64)
openssl rand -base64 48
```

Use two different values: one for `JWT_SECRET`, one for `JWT_REFRESH_SECRET`.

### Rolling update (no downtime)

1. **Add new secrets** in your secret store (e.g. Railway, Vercel, Kubernetes) as new variable names, e.g.:
   - `JWT_SECRET_NEW`
   - `JWT_REFRESH_SECRET_NEW`
2. **Code change:** Update the auth service to accept both old and new secrets and verify tokens with either (sign new tokens only with the new secret). This requires a short deployment that supports dual verification.
3. **Deploy** the version that verifies with both old and new, but issues only with new.
4. **Replace** `JWT_SECRET` with the new value and remove `JWT_SECRET_NEW`. Same for refresh secret.
5. **Deploy** again with a single secret (or remove dual verification in a follow-up release).

**Simpler approach (brief logout):** Set new values in env, deploy. All existing tokens become invalid; users must log in again. Prefer during a maintenance window.

### Verify

- Call `POST /api/v1/auth/login` and receive access + refresh tokens.
- Call `GET /api/v1/auth/me` with the access token — must return 200.
- Call `POST /api/v1/auth/refresh` with the refresh token — must return new tokens.
- After rotating to the new secret only, old tokens must return 401.

---

## 2. STRIPE_SECRET_KEY

**Purpose:** Stripe API authentication for payments and subscriptions.

### How to generate a new value

- Stripe Dashboard → **Developers** → **API keys**.
- Create a new **Secret key** (or roll in Stripe’s “Restrict key” / key rotation if available).
- Revoke or delete the old key after the new one is in use.

### Deploy without downtime

1. Create the new secret key in Stripe Dashboard; keep the old one active.
2. Update `STRIPE_SECRET_KEY` in your environment to the new key.
3. Deploy/restart the backend so it picks up the new env.
4. Verify payments and webhooks (see below).
5. Revoke the old key in Stripe Dashboard.

### Verify

- Create a test checkout session or subscription and complete a test payment.
- In Stripe Dashboard, confirm the payment appears and is linked to the correct account.
- Send a test webhook from Stripe (or trigger a real event) and confirm the backend logs process it successfully.

---

## 3. STRIPE_WEBHOOK_SECRET

**Purpose:** Verifying that webhook requests come from Stripe (signature verification).

### How to get a new value

- Stripe Dashboard → **Developers** → **Webhooks** → your endpoint.
- **Add endpoint** (or **Reveal** signing secret on existing endpoint); the signing secret is shown once (e.g. `whsec_...`).

If you create a new endpoint, you get a new signing secret. You can run two endpoints temporarily (old + new) or switch in one go.

### Deploy without downtime

1. In Stripe, add a new webhook endpoint (same URL or new) and copy the new **Signing secret**.
2. If your app supports multiple webhook secrets, add the new one and deploy.
3. Otherwise: set `STRIPE_WEBHOOK_SECRET` to the new value, deploy, then in Stripe disable or delete the old endpoint.
4. Update Stripe to use a single endpoint if you created two.

### Verify

- Trigger a test event (e.g. `customer.subscription.updated`) from Stripe Dashboard.
- Confirm in backend logs that the webhook was received and processed (no signature errors).
- Check that subscription/billing state in your DB matches Stripe after the event.

---

## 4. Database credentials (DATABASE_URL)

**Purpose:** PostgreSQL connection used by the backend and by backup scripts.

### How to generate new credentials

- **Managed DB (e.g. Railway, Supabase, Neon):** Create a new user or reset password in the provider’s dashboard; they give you a new connection string.
- **Self‑hosted:** Create a new DB user with the same privileges, then build the new `DATABASE_URL` with that user.

### Deploy without downtime

1. Create the new DB user and get the new `DATABASE_URL`.
2. Run a quick connectivity test: `psql "$NEW_DATABASE_URL" -c 'SELECT 1'`.
3. Deploy the backend with the new `DATABASE_URL` (e.g. via env var update and restart).
4. Monitor logs and health for connection errors.
5. After confirming stability, revoke or drop the old DB user (optional but recommended).

### Verify

- Backend health: `GET /health` and `GET /api/v1/health` return 200.
- Run a read and a write (e.g. login, then a simple API that writes to DB) and confirm no errors.
- Run the backup script: `BACKUP_DIR=/tmp/luneo-backups ./scripts/backup-db.sh` (with new `DATABASE_URL` in env) and confirm a new backup file is created.

---

## 5. Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)

**Purpose:** Media upload and storage.

### How to generate new values

- Cloudinary Console → **Settings** → **Access keys** (or **API Keys**).
- Generate new API key/secret or use a new sub-account; note **Cloud name**, **API Key**, **API Secret**.

### Deploy without downtime

1. Create new key/secret (or new sub-account) in Cloudinary; keep old credentials valid.
2. Update `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` with the new values.
3. Deploy/restart backend.
4. Upload a test image via your app and confirm it appears in the expected Cloudinary space.
5. Disable or delete the old API key in Cloudinary.

### Verify

- Upload a new asset through the app and confirm it is visible in Cloudinary and in the app.
- Open existing media URLs; they should still work (storage is keyed by URL, not by current API key).

---

## 6. SendGrid (SENDGRID_API_KEY)

**Purpose:** Sending transactional email.

### How to generate a new value

- SendGrid → **Settings** → **API Keys** → **Create API Key** (e.g. “Full access” or restricted to “Mail Send”).

### Deploy without downtime

1. Create a new API key in SendGrid; keep the old one active.
2. Set `SENDGRID_API_KEY` to the new key and deploy/restart.
3. Trigger a test email (e.g. password reset or welcome) and confirm delivery.
4. Revoke the old API key in SendGrid.

### Verify

- Trigger an email (e.g. forgot password) and confirm it arrives.
- Check SendGrid **Activity** for successful sends and no auth errors.

---

## 7. Other API keys (OpenAI, Mailgun, etc.)

- **OpenAI:** Create a new key in OpenAI dashboard; update `OPENAI_API_KEY`; deploy; then revoke old key.
- **Mailgun:** New key under Mailgun → **Sending** → **Domain settings** (or API keys section); update `MAILGUN_API_KEY` and optionally `MAILGUN_DOMAIN`/`MAILGUN_URL`; deploy; then remove old key.
- **Sentry:** New DSN is created with a new project or key; update `SENTRY_DSN`; deploy; confirm events in Sentry; then disable old key/DSN if desired.

For all: generate new value → set env → deploy → verify → revoke old.

---

## 8. ENCRYPTION_KEY (application-level encryption)

**Purpose:** AES-256-GCM key for encrypting sensitive data at rest (e.g. tokens or PII in DB).

### How to generate

```bash
openssl rand -hex 32
```

(32 bytes = 64 hex characters.)

### Deploy (downtime or dual-key support)

- **With downtime:** Set new `ENCRYPTION_KEY`, deploy, then run a migration/script to re-encrypt all existing data with the new key; old key can be discarded.
- **Without downtime:** Implement dual-key support (decrypt with old or new, encrypt with new only); deploy; re-encrypt data in background; then remove old key support and env.

### Verify

- Read a record that was encrypted with the new key and confirm it decrypts correctly.
- If you have a health or admin endpoint that checks encryption, run it after rotation.

---

## Checklist summary

| Secret                     | Generate / obtain              | Deploy without downtime              | Verify |
|---------------------------|--------------------------------|--------------------------------------|--------|
| JWT_SECRET / JWT_REFRESH  | `openssl rand -base64 48`     | Dual-secret support or brief logout  | Login, /me, refresh |
| STRIPE_SECRET_KEY         | Stripe Dashboard new key      | New key in env → deploy → revoke old | Test payment + webhook |
| STRIPE_WEBHOOK_SECRET     | New endpoint / signing secret | New secret in env → deploy           | Trigger test event |
| DATABASE_URL              | New user / connection string  | New URL in env → deploy              | Health, backup script |
| Cloudinary                | New API key in console        | New env → deploy → revoke old        | Upload + view asset |
| SendGrid                  | New API key                   | New key in env → deploy → revoke     | Send test email |
| ENCRYPTION_KEY            | `openssl rand -hex 32`        | Re-encrypt data or dual-key flow    | Decrypt sample data |

After any rotation, run the backend’s startup checks: the app validates required env vars at boot (see `validateRequiredEnvVars` in `main.ts`). Ensure no secrets are committed to git; use `.env` (ignored) and your platform’s secret store.
