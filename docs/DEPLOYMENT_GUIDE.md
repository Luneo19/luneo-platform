# Luneo -- Guide de Deploiement Production

## Pre-requis

- Compte GitHub avec acces admin au repo
- Compte Railway avec projet cree
- Compte Vercel avec projet cree
- Compte Stripe (mode live)
- Compte Cloudinary
- Redis (Upstash recommande)
- Base de donnees PostgreSQL (Neon, Supabase, ou Railway Postgres)

---

## Etape 1: Secrets GitHub Actions

Aller dans **GitHub > repo > Settings > Secrets and variables > Actions > New repository secret**

### Secrets obligatoires

| Secret | Description | Ou le trouver |
|--------|-------------|---------------|
| `DOCKER_USERNAME` | Nom utilisateur Docker Hub | hub.docker.com > Account Settings |
| `DOCKER_PASSWORD` | Token Docker Hub | hub.docker.com > Account Settings > Security > Access Tokens |
| `RAILWAY_TOKEN` | Token API Railway | railway.app > Account Settings > Tokens |
| `VERCEL_TOKEN` | Token API Vercel | vercel.com > Settings > Tokens |
| `VERCEL_ORG_ID` | ID organisation Vercel | vercel.com > Settings > General |
| `VERCEL_PROJECT_ID` | ID projet frontend Vercel | vercel.com > Project Settings > General |
| `CODECOV_TOKEN` | Token Codecov | codecov.io > repo > Settings |
| `STRIPE_SECRET_KEY` | Cle secrete Stripe (pour tests CI) | dashboard.stripe.com > Developers > API keys |
| `STRIPE_PUBLISHABLE_KEY` | Cle publique Stripe | dashboard.stripe.com > Developers > API keys |

### Secrets optionnels

| Secret | Description |
|--------|-------------|
| `SLACK_WEBHOOK_URL` | Webhook Slack pour notifications deploy |
| `SNYK_TOKEN` | Token Snyk pour security scan |
| `VERCEL_BACKEND_PROJECT_ID` | ID projet backend Vercel (staging) |
| `VERCEL_FRONTEND_PROJECT_ID` | ID projet frontend Vercel (staging) |
| `TURBO_TOKEN` | Token Turborepo (cache distant) |

### Variables (pas secrets)

Aller dans **Actions > Variables** (pas Secrets):

| Variable | Valeur |
|----------|--------|
| `TURBO_TEAM` | Nom de votre equipe Turbo |

---

## Etape 2: Creer l'environnement "staging"

1. GitHub > repo > **Settings > Environments**
2. Cliquer **New environment**
3. Nom: **staging**
4. Sauvegarder

Cela supprime les warnings "Value staging is not valid" dans l'IDE.

---

## Etape 3: Variables d'environnement Railway (Backend)

Dans Railway > projet > service backend > **Variables**, ajouter:

### Application
```
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1
FRONTEND_URL=https://app.luneo.app
BACKEND_URL=https://api.luneo.app
```

### Base de donnees
```
DATABASE_URL=postgresql://user:password@host:5432/luneo?schema=public&connection_limit=10&pool_timeout=20&connect_timeout=10
```

### Redis
```
REDIS_URL=rediss://default:token@endpoint.upstash.io:6379
```

### Authentification
```
JWT_SECRET=<generer: openssl rand -hex 32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generer: openssl rand -hex 32>
JWT_REFRESH_EXPIRES_IN=7d
```

### OAuth
```
GOOGLE_CLIENT_ID=<votre-id>
GOOGLE_CLIENT_SECRET=<votre-secret>
GOOGLE_CALLBACK_URL=https://api.luneo.app/api/v1/auth/google/callback
GITHUB_CLIENT_ID=<votre-id>
GITHUB_CLIENT_SECRET=<votre-secret>
GITHUB_CALLBACK_URL=https://api.luneo.app/api/v1/auth/github/callback
```

### Stripe
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...
STRIPE_SUCCESS_URL=https://app.luneo.app/dashboard/billing/success
STRIPE_CANCEL_URL=https://app.luneo.app/dashboard/billing/cancel
STRIPE_TRIAL_PERIOD_DAYS=14
```

### Media
```
CLOUDINARY_CLOUD_NAME=<votre-cloud>
CLOUDINARY_API_KEY=<votre-key>
CLOUDINARY_API_SECRET=<votre-secret>
```

### Email
```
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=no-reply@luneo.app
SENDGRID_FROM_NAME=Luneo
SENDGRID_REPLY_TO=support@luneo.app
```

### Monitoring
```
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production
```

### CORS et Securite
```
CORS_ORIGINS=https://app.luneo.app,https://luneo.app,https://www.luneo.app
ADMIN_DEFAULT_PASSWORD=<mot-de-passe-fort>
ADMIN_EMAIL=admin@luneo.app
SEED_SAMPLE_DATA=false
SKIP_EMAIL_VERIFICATION=false
```

---

## Etape 4: Variables d'environnement Vercel (Frontend)

Dans Vercel > projet > **Settings > Environment Variables**, ajouter:

### URLs
```
NEXT_PUBLIC_APP_URL=https://app.luneo.app
NEXT_PUBLIC_API_URL=https://api.luneo.app
NEXT_PUBLIC_SITE_URL=https://luneo.app
```

### Auth
```
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<votre-id>
NEXT_PUBLIC_GITHUB_CLIENT_ID=<votre-id>
```

### Stripe
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_YEARLY=price_...
```

### Media et monitoring
```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<votre-cloud>
CLOUDINARY_API_KEY=<votre-key>
CLOUDINARY_API_SECRET=<votre-secret>
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

### Redis (rate limiting)
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### Email
```
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=no-reply@luneo.app
CONTACT_EMAIL=contact@luneo.app
```

---

## Etape 5: Deployer

### Backend (Railway)
```bash
# 1. Migrer la base de donnees
cd apps/backend
pnpm prisma migrate deploy

# 2. Seeder (admin uniquement)
SEED_SAMPLE_DATA=false pnpm prisma db seed

# 3. Le deploy se fait automatiquement via CI/CD sur push main
git push origin main
```

### Frontend (Vercel)
Le deploy se fait automatiquement via le CI/CD ou via Vercel Git integration.

---

## Etape 6: Verification post-deploiement

### Backend
```bash
# Health check
curl https://api.luneo.app/health
# Reponse attendue: { "status": "ok" }

# Health detaille
curl https://api.luneo.app/health/terminus
# Reponse attendue: { "status": "ok", "info": { "database": {...}, "redis": {...} } }
```

### Frontend
- [ ] Page d'accueil: https://app.luneo.app
- [ ] Page login: https://app.luneo.app/login
- [ ] Page pricing: https://app.luneo.app/pricing

### Flux complet
1. Creer un compte (inscription)
2. Verifier l'email (si SKIP_EMAIL_VERIFICATION=false)
3. Completer l'onboarding
4. Acceder au dashboard
5. Tester le checkout Stripe (plan Starter)
6. Verifier la redirection post-paiement
7. Verifier les credits et limites du plan
8. Creer un design
9. Tester l'export

### Webhooks Stripe
1. Stripe Dashboard > Developers > Webhooks
2. Ajouter endpoint: `https://api.luneo.app/api/v1/billing/webhook`
3. Evenements: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
4. Tester avec "Send test webhook"

---

## Etape 7: Monitoring post-deploiement

### Sentry
1. Verifier les erreurs dans le dashboard Sentry
2. Configurer les alertes: Error spike > 10x, New issue, p95 > 2s

### Uptime
Configurer Better Stack ou Pingdom:
- `GET https://api.luneo.app/health` (toutes les 1 min)
- `GET https://app.luneo.app` (toutes les 5 min)

### Slack
Si `SLACK_WEBHOOK_URL` est configure, les deployments envoient des notifications.
