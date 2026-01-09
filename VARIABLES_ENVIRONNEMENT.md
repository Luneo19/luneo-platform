# 🔐 VARIABLES D'ENVIRONNEMENT

**Guide complet des variables d'environnement requises pour Luneo Platform**

---

## 📁 BACKEND (`apps/backend/.env`)

### 🔴 OBLIGATOIRES

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/luneo_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-super-secret-refresh-key-different
JWT_REFRESH_EXPIRES_IN=7d

# Application
NODE_ENV=development
PORT=3001
API_PREFIX=/api/v1
FRONTEND_URL=http://localhost:3000
```

### 🟡 RECOMMANDÉES

```env
# Redis (pour queues/cache)
REDIS_URL=redis://localhost:6379

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@luneo.app
SENDGRID_FROM_NAME=Luneo

# Email (Alternative - Mailgun)
MAILGUN_API_KEY=xxx
MAILGUN_DOMAIN=mg.luneo.app
MAILGUN_FROM_EMAIL=noreply@luneo.app

# Email (Alternative - SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password

# Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# AI (OpenAI)
OPENAI_API_KEY=sk-xxx

# Monitoring (Sentry)
SENTRY_DSN=https://xxx@sentry.io/xxx

# Security
CORS_ORIGIN=http://localhost:3000,https://app.luneo.app
ENABLE_CSRF_IN_DEV=false
ENABLE_RATE_LIMIT_IN_DEV=false
```

### 🟢 OPTIONNELLES

```env
# Analytics
ANALYTICS_ENABLED=true
ANALYTICS_SAMPLE_RATE=1.0

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,video/mp4

# AR Engine
AR_ENGINE_URL=http://localhost:8000
AR_ENGINE_API_KEY=xxx

# Worker
WORKER_CONCURRENCY=5
WORKER_REDIS_URL=redis://localhost:6379
```

---

## 📁 FRONTEND (`apps/frontend/.env.local`)

### 🔴 OBLIGATOIRES

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 🟡 RECOMMANDÉES

```env
# Analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=true
NEXT_PUBLIC_GA_ID=G-XXX

# Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx

# Payments (Stripe)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Storage (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx

# Supabase (si utilisé)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 🟢 OPTIONNELLES

```env
# Feature Flags
NEXT_PUBLIC_ENABLE_3D_PREVIEW=true
NEXT_PUBLIC_ENABLE_AR=true
NEXT_PUBLIC_ENABLE_AI_GENERATION=true

# External Services
NEXT_PUBLIC_HOTJAR_ID=xxx
NEXT_PUBLIC_INTERCOM_APP_ID=xxx
```

---

## 🔧 CONFIGURATION PAR ENVIRONNEMENT

### Development

```env
# Backend
NODE_ENV=development
ENABLE_CSRF_IN_DEV=false
ENABLE_RATE_LIMIT_IN_DEV=false
LOG_LEVEL=debug

# Frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Staging

```env
# Backend
NODE_ENV=staging
ENABLE_CSRF_IN_DEV=true
ENABLE_RATE_LIMIT_IN_DEV=true
LOG_LEVEL=info

# Frontend
NEXT_PUBLIC_APP_URL=https://staging.luneo.app
```

### Production

```env
# Backend
NODE_ENV=production
# CSRF et Rate Limiting activés automatiquement
LOG_LEVEL=warn

# Frontend
NEXT_PUBLIC_APP_URL=https://app.luneo.app
```

---

## ✅ CHECKLIST SETUP

### Backend
- [ ] `DATABASE_URL` configuré
- [ ] `JWT_SECRET` et `JWT_REFRESH_SECRET` configurés (min 32 chars)
- [ ] `FRONTEND_URL` configuré
- [ ] Email service configuré (SendGrid/Mailgun/SMTP)
- [ ] Redis configuré (si utilisé)
- [ ] Cloudinary configuré (si utilisé)
- [ ] Stripe configuré (si utilisé)

### Frontend
- [ ] `NEXT_PUBLIC_API_URL` configuré
- [ ] `NEXT_PUBLIC_APP_URL` configuré
- [ ] Sentry configuré (recommandé)
- [ ] Analytics configurés (recommandé)

---

## 🔒 SÉCURITÉ

### ⚠️ IMPORTANT

1. **Ne JAMAIS commiter les fichiers `.env`** dans Git
2. **Utiliser des secrets différents** pour chaque environnement
3. **JWT_SECRET** : Minimum 32 caractères, générer avec :
   ```bash
   openssl rand -base64 32
   ```
4. **Variables sensibles** : Utiliser un gestionnaire de secrets (AWS Secrets Manager, Vault, etc.)

### Génération de Secrets

```bash
# JWT Secret
openssl rand -base64 32

# Refresh Secret
openssl rand -base64 32

# API Keys
openssl rand -hex 32
```

---

## 📚 RESSOURCES

- **NestJS Config** : https://docs.nestjs.com/techniques/configuration
- **Next.js Environment Variables** : https://nextjs.org/docs/basic-features/environment-variables
- **12 Factor App** : https://12factor.net/config

---

*Dernière mise à jour : Décembre 2024*
