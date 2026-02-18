# Guide de Déploiement Production - Luneo Platform

## Architecture de déploiement

```
[Vercel] ---- Frontend (Next.js) ---- https://app.luneo.app
                     |
                     | API calls
                     v
[Railway] --- Backend (NestJS) ------ https://api.luneo.app
                     |
              +------+------+
              |             |
        [Railway]     [Railway/Upstash]
        PostgreSQL       Redis
```

---

## 1. Railway - Backend

### 1.1 Créer le projet
1. Aller sur https://railway.app
2. "New Project" > "Deploy from GitHub repo"
3. Sélectionner le repo `luneo-platform`

### 1.2 Ajouter PostgreSQL
1. Dans le projet Railway, cliquer "New" > "Database" > "PostgreSQL"
2. Railway génère automatiquement `DATABASE_URL`
3. Noter l'URL pour la configuration

### 1.3 Ajouter Redis
**Option A : Railway Redis (simple)**
1. "New" > "Database" > "Redis"
2. Railway génère automatiquement `REDIS_URL`

**Option B : Upstash Redis (recommandé pour production)**
1. Aller sur https://console.upstash.com
2. "Create Database" > Région "eu-west-1" (proche CDG1)
3. Copier `REDIS_URL` (format: `rediss://default:xxx@xxx.upstash.io:6379`)
4. Le backend détecte automatiquement Upstash et active TLS

### 1.4 Configurer les variables
Dans Railway > Service > Variables, ajouter toutes les variables du fichier
`apps/backend/.env.production.template`

**Variables auto-fournies par Railway** (ne pas configurer manuellement) :
- `DATABASE_URL` (si PostgreSQL Railway)
- `REDIS_URL` (si Redis Railway)
- `PORT` (Railway gère automatiquement)

### 1.5 Build Settings
- **Root Directory** : `/`
- **Build Command** : via Dockerfile (automatique avec `railway.json`)
- **Start Command** : `sh /app/start.sh`

---

## 2. Vercel - Frontend

### 2.1 Connecter le repo
1. Aller sur https://vercel.com
2. "Add New" > "Project" > Sélectionner le repo
3. **Framework Preset** : Next.js
4. **Root Directory** : `apps/frontend`

### 2.2 Configurer les variables d'environnement
Dans Vercel > Project > Settings > Environment Variables :

| Variable | Valeur | Environnement |
|----------|--------|---------------|
| `NEXT_PUBLIC_API_URL` | `https://api.luneo.app` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://app.luneo.app` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://app.luneo.app` | Production |
| `NEXT_PUBLIC_WS_URL` | `wss://api.luneo.app` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxx` | Production |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Votre cloud name | Production |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Votre client ID | Production |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | Votre client ID | Production |
| `NEXT_PUBLIC_SENTRY_DSN` | Votre DSN Sentry | Production |
| `NEXT_PUBLIC_APP_VERSION` | `1.0.0` | Production |
| `SKIP_INSTALL_HOOKS` | `true` | Production |

### 2.3 Build Settings (déjà dans vercel.json)
- **Install Command** : `pnpm install`
- **Build Command** : `cd apps/frontend && npx prisma generate && pnpm run build`
- **Output Directory** : `apps/frontend/.next`
- **Region** : `cdg1` (Paris)

### 2.4 Domaine
1. Settings > Domains > Ajouter `app.luneo.app`
2. Configurer DNS : CNAME `app.luneo.app` → `cname.vercel-dns.com`

---

## 3. SendGrid - Emails transactionnels

### 3.1 Créer un compte
1. Aller sur https://app.sendgrid.com
2. Créer un compte (plan gratuit : 100 emails/jour)

### 3.2 Authentifier le domaine
1. Settings > Sender Authentication > Domain Authentication
2. Ajouter `luneo.app`
3. Configurer les DNS records (CNAME) fournis par SendGrid
4. Vérifier le domaine

### 3.3 Créer une API Key
1. Settings > API Keys > Create API Key
2. Nom : `luneo-production`
3. Permissions : "Full Access" ou "Restricted Access" avec Mail Send
4. Copier la clé `SG.xxx`

### 3.4 Configurer dans Railway
```
SENDGRID_API_KEY=SG.votre_cle_ici
SENDGRID_DOMAIN=luneo.app
SENDGRID_FROM_NAME=Luneo
SENDGRID_FROM_EMAIL=no-reply@luneo.app
SENDGRID_REPLY_TO=support@luneo.app
FROM_EMAIL=no-reply@luneo.app
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.votre_cle_ici
```

### 3.5 Templates d'emails
Le backend utilise ces templates (configurables dans SendGrid Dynamic Templates) :
- Welcome (`d-welcome-template-id`)
- Password Reset (`d-password-reset-template-id`)
- Order Confirmation (`d-order-confirmation-template-id`)
- Production Ready (`d-production-ready-template-id`)

---

## 4. Services externes - Checklist

### Stripe (https://dashboard.stripe.com)
- [ ] Activer le mode Live
- [ ] Créer les produits et prix (Starter, Pro, Business, Enterprise)
- [ ] Configurer le Webhook endpoint : `https://api.luneo.app/api/v1/billing/webhook`
- [ ] Copier les clés Live (sk_live, pk_live, whsec)

### Cloudinary (https://console.cloudinary.com)
- [ ] Créer un compte
- [ ] Copier Cloud Name, API Key, API Secret
- [ ] Configurer l'upload preset

### OAuth - Google (https://console.cloud.google.com)
- [ ] Créer un projet
- [ ] APIs & Services > Credentials > Create OAuth 2.0 Client
- [ ] Ajouter URI de redirection : `https://api.luneo.app/api/v1/auth/google/callback`
- [ ] Copier Client ID et Client Secret

### OAuth - GitHub (https://github.com/settings/developers)
- [ ] New OAuth App
- [ ] Authorization callback URL : `https://api.luneo.app/api/v1/auth/github/callback`
- [ ] Copier Client ID et Client Secret

### Sentry (https://sentry.io)
- [ ] Créer un projet "luneo-backend" (Node.js)
- [ ] Créer un projet "luneo-frontend" (Next.js)
- [ ] Copier les DSN respectifs

### OpenAI (https://platform.openai.com)
- [ ] Créer une API Key
- [ ] Configurer les limites de dépenses

---

## 5. Vérification post-déploiement

```bash
# Backend health
curl https://api.luneo.app/health

# API health détaillé
curl https://api.luneo.app/api/v1/health

# Swagger documentation
# Ouvrir https://api.luneo.app/api/v1/docs

# Frontend
curl -s -o /dev/null -w "%{http_code}" https://app.luneo.app
# Doit retourner 200

# Auth flow
curl -X POST https://api.luneo.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@luneo.com","password":"votre_mot_de_passe"}'
```

---

## 6. Fichiers de configuration

| Fichier | Usage |
|---------|-------|
| `apps/backend/.env` | Développement local |
| `apps/backend/.env.production.template` | Template Railway |
| `apps/backend/.env.test` | Tests unitaires/E2E |
| `apps/frontend/.env.local` | Développement local |
| `apps/frontend/.env.production` | Template Vercel |
| `railway.json` | Config déploiement Railway |
| `vercel.json` | Config déploiement Vercel |
| `Dockerfile` | Image Docker backend |
