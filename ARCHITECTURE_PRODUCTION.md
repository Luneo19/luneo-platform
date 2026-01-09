# 🏗️ Architecture Production - Luneo Platform

**Date** : 5 janvier 2026  
**Version** : 1.0.0 Production

## 📊 Vue d'Ensemble

Luneo Platform est déployée avec une architecture moderne et scalable, séparant le frontend et le backend pour une meilleure performance et maintenabilité.

## 🎯 Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    UTILISATEURS FINAUX                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                        │
│  - URL : https://luneo.app                                  │
│  - Framework : Next.js 15                                    │
│  - Build : Automatique via Git push                         │
│  - CDN : Vercel Edge Network                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ API Calls
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Railway)                        │
│  - URL : https://api.luneo.app                              │
│  - Framework : NestJS                                        │
│  - Runtime : Node.js 20                                     │
│  - Health Check : /health, /api/health                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Database Connection
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              BASE DE DONNÉES (Railway)                      │
│  - Type : PostgreSQL                                         │
│  - ORM : Prisma                                              │
│  - Migrations : Automatiques au démarrage                   │
└─────────────────────────────────────────────────────────────┘
```

## 🌐 Services et Domaines

### Frontend
- **Plateforme** : Vercel
- **URL Production** : `https://luneo.app`
- **URL Preview** : `https://frontend-*.vercel.app`
- **Repository** : `Luneo19/luneo-platform`
- **Root Directory** : `.` (racine)
- **Build Command** : `cd apps/frontend && pnpm run build`
- **Output Directory** : `apps/frontend/.next`

### Backend
- **Plateforme** : Railway
- **URL Production** : `https://api.luneo.app`
- **Projet** : `believable-learning` (à renommer en `luneo-backend-production`)
- **Repository** : `Luneo19/luneo-platform`
- **Root Directory** : `.` (racine)
- **Dockerfile** : À la racine
- **Start Command** : `node dist/src/main.js`

### Base de Données
- **Plateforme** : Railway PostgreSQL
- **Service** : PostgreSQL (dans le projet `believable-learning`)
- **Connection** : Via `DATABASE_URL` (variable d'environnement)
- **Migrations** : Prisma (automatiques au démarrage)

## 🔐 Variables d'Environnement

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL` : `https://api.luneo.app/api`
- `NEXT_PUBLIC_APP_URL` : `https://luneo.app`
- Autres variables publiques selon les besoins

### Backend (Railway)
- `DATABASE_URL` : `${{Postgres.DATABASE_URL}}`
- `NODE_ENV` : `production`
- `PORT` : `3001` (ou fourni par Railway)
- `API_PREFIX` : `/api`
- `JWT_SECRET` : (généré)
- `JWT_REFRESH_SECRET` : (généré)
- `CORS_ORIGIN` : `https://app.luneo.app,https://luneo.app,https://www.luneo.app`
- `FRONTEND_URL` : `https://app.luneo.app`
- Autres variables selon les besoins (Stripe, SendGrid, OpenAI, etc.)

## 🔄 Flux de Déploiement

### Frontend (Vercel)
1. Push sur `main` → Déclenchement automatique
2. Build : `pnpm install` → `pnpm run build`
3. Déploiement : Automatique sur `luneo.app`
4. Preview : Déploiements sur branches pour preview

### Backend (Railway)
1. Push sur `main` → Déclenchement automatique (si configuré)
2. Build : Dockerfile → `pnpm install` → `pnpm prisma generate` → `pnpm build`
3. Déploiement : Automatique sur `api.luneo.app`
4. Migrations : Exécutées automatiquement au démarrage

## 📡 Endpoints API

### Health Checks
- `GET /health` : Health check root (200 OK)
- `GET /api/health` : Health check API (200 OK)

### API Principale
- Base URL : `https://api.luneo.app/api`
- Version : `v1` (implicite)
- Documentation : `https://api.luneo.app/api/docs` (Swagger)

## 🔒 Sécurité

### CORS
- Origines autorisées : `https://app.luneo.app`, `https://luneo.app`, `https://www.luneo.app`
- Credentials : Activés pour les cookies JWT

### Authentification
- JWT avec refresh tokens
- OAuth : Google, GitHub
- Rate limiting : Configuré

### HTTPS
- Certificats SSL : Automatiques (Vercel + Railway)
- Redirection HTTP → HTTPS : Automatique

## 📊 Monitoring

### Frontend (Vercel)
- Analytics : Vercel Analytics
- Speed Insights : Vercel Speed Insights
- Logs : Vercel Dashboard

### Backend (Railway)
- Logs : Railway Dashboard
- Monitoring : Sentry (si configuré)
- Health Checks : `/health`, `/api/health`

## 🗄️ Base de Données

### PostgreSQL (Railway)
- Version : PostgreSQL (version gérée par Railway)
- ORM : Prisma
- Migrations : Automatiques via `prisma migrate deploy`
- Backup : Géré par Railway

### Schéma Principal
- Users, Brands, Products, Designs, Orders
- Auth : OAuth, Refresh Tokens
- API Keys, Webhooks
- Analytics, Billing

## 🚀 Services Externes

### Cloudinary (Storage)
- Images et assets
- CDN intégré

### Stripe (Paiements)
- Abonnements
- Webhooks

### SendGrid (Email)
- Emails transactionnels
- Templates

### OpenAI (IA)
- Génération d'images
- API DALL-E

## 📋 Checklist de Déploiement

### Initial Setup
- [x] Frontend déployé sur Vercel
- [x] Backend déployé sur Railway
- [x] Base de données configurée
- [x] Variables d'environnement configurées
- [x] Domaines configurés
- [x] Health checks fonctionnels

### Maintenance
- [ ] Monitoring configuré
- [ ] Alertes configurées
- [ ] Backups vérifiés
- [ ] Documentation à jour

## 🔗 URLs Importantes

- **Frontend Production** : https://luneo.app
- **Backend API** : https://api.luneo.app
- **API Health Check** : https://api.luneo.app/api/health
- **API Documentation** : https://api.luneo.app/api/docs
- **Railway Dashboard** : https://railway.app/project/0e3eb9ba-6846-4e0e-81d2-bd7da54da971
- **Vercel Dashboard** : https://vercel.com/luneos-projects/frontend

## 📝 Notes Importantes

1. **Monorepo** : Le projet est un monorepo, les Root Directories sont configurés en conséquence
2. **Variables d'environnement** : Les références Railway (`${{Postgres.DATABASE_URL}}`) doivent être configurées via le Dashboard
3. **Migrations** : Exécutées automatiquement au démarrage du backend
4. **Health Checks** : Désactivés temporairement dans `railway.toml` mais fonctionnels

## 🎯 Prochaines Étapes

1. Nettoyage Railway (supprimer projets obsolètes)
2. Configuration domaine `luneo.app` (si pas déjà fait)
3. Vérification repositories GitHub
4. Documentation complète des endpoints API



