# 🚀 Guide Complet - Actions Avant Déploiement

## Date: 2024-12-19
## Statut: ✅ Scripts Créés

---

## 📋 Scripts Disponibles

### 1. Script Principal (Tout-en-un)
```bash
./scripts/pre-deployment-complete.sh
```
**Description**: Orchestre toutes les actions recommandées
- Vérifications initiales
- Configuration Vercel (backend + frontend)
- Configuration Railway
- Vérification Redis
- Configuration S3
- Test des endpoints

---

### 2. Configuration Vercel
```bash
# Backend
./scripts/configure-vercel-env.sh production backend

# Frontend
./scripts/configure-vercel-env.sh production frontend
```
**Description**: Configure les variables d'environnement Vercel via CLI
- Interactive
- Support multi-environnements (production/preview/development)
- Génération automatique des clés JWT

---

### 3. Configuration Railway
```bash
./scripts/configure-railway-env.sh
```
**Description**: Configure les variables d'environnement Railway via CLI
- Interactive
- Support des services Railway (Postgres, Redis)
- Génération automatique des clés JWT

---

### 4. Vérification Redis
```bash
./scripts/verify-redis.sh [REDIS_URL]
```
**Description**: Vérifie la connexion Redis pour BullMQ
- Test de connexion
- Vérification des queues BullMQ
- Test de performance (latence)
- Support redis-cli et Node.js

---

### 5. Configuration S3
```bash
./scripts/configure-s3.sh
```
**Description**: Configure et teste S3 pour le storage
- Création de bucket (si nécessaire)
- Configuration CORS
- Configuration des politiques
- Test d'upload/download

---

### 6. Test des Endpoints
```bash
./scripts/test-endpoints.sh [API_URL] [API_KEY]
```
**Description**: Teste tous les endpoints widget API
- Health check
- Widget Product Config
- Widget Save Design
- Widget Load Design
- Render Print-Ready

---

### 7. Vérifications Initiales
```bash
./scripts/run-all-checks.sh
```
**Description**: Vérifie tous les fichiers et configurations
- Fichiers de configuration
- Modules backend
- Pages frontend
- Schema Prisma
- Dépendances

---

## 🚀 Utilisation Rapide

### Option 1: Script Principal (Recommandé)
```bash
cd /Users/emmanuelabougadous/luneo-platform
./scripts/pre-deployment-complete.sh
```

### Option 2: Étapes Individuelles

#### 1. Vérifications
```bash
./scripts/run-all-checks.sh
```

#### 2. Configuration Vercel
```bash
# Backend
./scripts/configure-vercel-env.sh production backend

# Frontend
./scripts/configure-vercel-env.sh production frontend
```

#### 3. Configuration Railway
```bash
./scripts/configure-railway-env.sh
```

#### 4. Vérification Redis
```bash
./scripts/verify-redis.sh redis://localhost:6379
# Ou avec Railway: ./scripts/verify-redis.sh ${{Redis.REDIS_URL}}
```

#### 5. Configuration S3
```bash
./scripts/configure-s3.sh
```

#### 6. Test des Endpoints
```bash
# Local
./scripts/test-endpoints.sh http://localhost:3001 test-api-key

# Production
./scripts/test-endpoints.sh https://api.luneo.app your-api-key
```

---

## 📋 Variables d'Environnement Requises

### Backend (Vercel/Railway)

**Obligatoires:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` ou `REDIS_URL` - Redis connection
- `JWT_SECRET` - Clé JWT (générée automatiquement)
- `JWT_REFRESH_SECRET` - Clé JWT refresh (générée automatiquement)
- `NODE_ENV` - production/preview/development
- `PORT` - Port du serveur (défaut: 3001)

**Recommandées:**
- `AWS_ACCESS_KEY_ID` - Pour S3
- `AWS_SECRET_ACCESS_KEY` - Pour S3
- `AWS_REGION` - Région AWS
- `AWS_S3_BUCKET` - Nom du bucket S3
- `FRONTEND_URL` - URL du frontend
- `CORS_ORIGIN` - Origine CORS
- `STRIPE_SECRET_KEY` - Pour paiements

### Frontend (Vercel)

**Obligatoires:**
- `NEXT_PUBLIC_API_URL` - URL de l'API backend
- `NEXT_PUBLIC_WIDGET_URL` - URL du widget CDN

**Recommandées:**
- `NEXT_PUBLIC_APP_URL` - URL de l'application
- `NEXT_PUBLIC_AUTH_URL` - URL d'authentification

---

## ✅ Checklist Complète

### Avant Déploiement
- [ ] Vérifications initiales (`run-all-checks.sh`)
- [ ] Variables Vercel backend configurées
- [ ] Variables Vercel frontend configurées
- [ ] Variables Railway configurées
- [ ] Redis vérifié et opérationnel
- [ ] S3 configuré et testé
- [ ] Endpoints API testés

### Après Déploiement
- [ ] Backend déployé sur Railway
- [ ] Frontend déployé sur Vercel
- [ ] Endpoints testés en production
- [ ] Widget fonctionnel
- [ ] Rendu print-ready fonctionnel

---

## 🎯 Commandes de Déploiement

### Backend (Railway)
```bash
cd apps/backend
railway up
```

### Frontend (Vercel)
```bash
cd apps/frontend
vercel --prod
```

---

## 📝 Notes Importantes

1. **JWT Secrets**: Générés automatiquement par les scripts
2. **Redis**: Utiliser Upstash sur Vercel, Redis natif sur Railway
3. **S3**: Peut être AWS S3, Cloudflare R2, ou compatible
4. **Database**: Vercel Postgres ou Railway Postgres
5. **API Key**: À générer via l'interface admin ou API

---

## 🆘 Dépannage

### Erreur: Vercel CLI non connecté
```bash
vercel login
```

### Erreur: Railway CLI non connecté
```bash
railway login
```

### Erreur: Redis non accessible
- Vérifier les credentials
- Vérifier le firewall
- Vérifier la configuration réseau

### Erreur: S3 upload échoué
- Vérifier les credentials AWS
- Vérifier les permissions du bucket
- Vérifier la configuration CORS

---

## 🎉 Prêt pour Déploiement !

Une fois toutes les actions complétées, le projet est prêt pour déploiement en production.

**Commandes finales:**
```bash
# Backend
cd apps/backend && railway up

# Frontend
cd apps/frontend && vercel --prod
```






