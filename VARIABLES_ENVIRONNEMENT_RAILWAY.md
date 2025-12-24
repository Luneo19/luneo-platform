# 🔐 VARIABLES D'ENVIRONNEMENT RAILWAY - BACKEND

## Variables OBLIGATOIRES

Ces variables doivent être configurées dans Railway pour que l'application démarre :

```env
# Base de données (OBLIGATOIRE)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secrets (OBLIGATOIRE - minimum 32 caractères chacun)
JWT_SECRET=your-super-secret-jwt-key-32-chars-minimum
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32-chars-minimum

# Environnement (OBLIGATOIRE)
NODE_ENV=production
```

## Variables RECOMMANDÉES

```env
# API Configuration
API_PREFIX=/api
CORS_ORIGIN=https://app.luneo.app,https://luneo.app
FRONTEND_URL=https://app.luneo.app

# Redis (si utilisé)
REDIS_URL=redis://host:port

# Stripe (si utilisé)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary (si utilisé)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Monitoring
SENTRY_DSN=https://...
SENTRY_ENVIRONMENT=production
```

## Comment configurer dans Railway

### Via Dashboard

1. Aller sur [railway.app](https://railway.app)
2. Sélectionner votre projet backend
3. Cliquer sur "Variables"
4. Ajouter chaque variable avec sa valeur

### Via CLI

```bash
railway variables set DATABASE_URL="postgresql://..."
railway variables set JWT_SECRET="your-32-char-secret"
railway variables set JWT_REFRESH_SECRET="your-32-char-refresh-secret"
railway variables set NODE_ENV="production"
railway variables set CORS_ORIGIN="https://app.luneo.app,https://luneo.app"
railway variables set FRONTEND_URL="https://app.luneo.app"
```

## Validation

Après avoir configuré les variables, vérifier que l'application démarre :

```bash
railway logs
```

Vous devriez voir :
```
✅ Environment variables validated
✅ NestJS application created
🚀 Application is running on: http://localhost:PORT
```
