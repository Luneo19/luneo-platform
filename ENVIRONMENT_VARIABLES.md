# 🌐 Configuration des variables d’environnement

Ce document récapitule les secrets et paramètres indispensables pour exécuter la plateforme Luneo en local, en staging et en production. Chaque application dispose désormais d’un fichier `env.example` décrivant les clés attendues :

| Application | Fichier template | Objectif |
|-------------|------------------|----------|
| Backend (NestJS) | `apps/backend/env.example` | API principale, workers BullMQ, webhooks Stripe… |
| Frontend (Next.js) | `apps/frontend/env.example` | Interface web (variables publiques + API routes server-side) |
| Shopify App | `apps/shopify/env.example` | Application embarquée Shopify (backend + App Bridge) |
| Worker IA | `apps/worker-ia/env.example` | Workers IA / rendu 3D exécutés hors web |

> 💡 Copiez chaque template dans un fichier `.env.local` (développement) ou `.env` (production) et injectez les valeurs via votre gestionnaire de secrets (Vercel, Doppler, GitHub Actions, etc.).

## Variables critiques par domaine

### 1. Accès plateforme & sécurité
- `DATABASE_URL`, `REDIS_URL` : connexions Postgres/Redis (backend et Shopify).
- `JWT_SECRET`, `JWT_REFRESH_SECRET` : tokens d’authentification API.
- `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `GITHUB_CLIENT_ID` : OAuth utilisateurs.
- `FRONTEND_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL` : URLs canoniques utilisées pour redirections et appels API.
- `INTERNAL_API_URL`, `INTERNAL_API_TOKEN` : pont serveur-à-serveur (ex : annulation/refund Stripe) accessible uniquement depuis les services de confiance.

### 2. Paiement & facturation
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` : facturation Stripe côté backend/front.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_STRIPE_SUCCESS_URL`, `NEXT_PUBLIC_STRIPE_CANCEL_URL` : flux checkout client.

### 3. Emails & notifications
- `SENDGRID_API_KEY`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `FROM_EMAIL` : envoi d’e-mails transactionnels.
- Variables optionnelles (`SENDGRID_DOMAIN`, `SMTP_HOST`, `EMAIL_TEMPLATE_*`) documentées dans `apps/backend/env.example`.

### 4. Médias & génération de contenu
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` : media storage (backend, frontend, workers).
- `OPENAI_API_KEY`, `REPLICATE_API_TOKEN`, `MESHY_API_KEY`, `USDZ_CONVERSION_API_KEY` : génération IA et conversions 3D.

### 5. Intégrations e-commerce
- `SHOPIFY_API_KEY` / `SHOPIFY_API_SECRET` / `SHOPIFY_WEBHOOK_SECRET` : app Shopify.
- `NEXT_PUBLIC_SHOPIFY_API_KEY`, `NEXT_PUBLIC_SHOPIFY_SHOP_ORIGIN` : App Bridge côté client.
- `WOOCOMMERCE_WEBHOOK_SECRET`, `PRINTFUL_API_KEY`, `PRINTFUL_WEBHOOK_SECRET` : connecteurs WooCommerce / Printful.

### 6. Observabilité & limites de taux
- `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `NEXT_PUBLIC_SENTRY_DSN` : monitoring complet (backend, frontend, Shopify).
- `RATE_LIMIT_TTL`, `RATE_LIMIT_LIMIT`, `RATE_LIMIT_WINDOW_MS` : protection anti-abus API.
- `TURBO_TOKEN` *(optionnel)* : jeton de cache distant Turborepo (Vercel). À définir dans vos secrets CI/CD si vous activez le cache cloud.

## Bonnes pratiques
- **Ne committez jamais vos fichiers `.env`** : ajoutez uniquement les templates.
- **Centralisez vos secrets** dans un coffre (Vault, Doppler, Vercel Environment Variables…).
- **Documentez les valeurs par environnement** (dev/staging/prod) dans un espace sécurisé (Notion, 1Password…).
- **Synchronisez les clés partagées** (`STRIPE_SECRET_KEY`, `CLOUDINARY_*`, etc.) entre backend, frontend et workers.

Pour toute nouvelle intégration, mettez à jour le template concerné **et** la présente documentation afin de garder une vision exhaustive des secrets requis.
