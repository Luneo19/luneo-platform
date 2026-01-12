# 🚀 GUIDE DE DÉPLOIEMENT EN PRODUCTION

## 📋 Prérequis

- ✅ Tous les fichiers sont intégrés
- ✅ Tests passent
- ✅ Builds réussissent
- ✅ Variables d'environnement configurées

---

## 🔧 Étapes de Déploiement

### 1. Vérification Pré-Déploiement

```bash
# Vérifier l'intégration
bash scripts/verify-integration.sh

# Build backend
cd apps/backend
pnpm run build

# Build frontend
cd apps/frontend
pnpm run build
```

### 2. Configuration des Variables d'Environnement

#### Backend (Railway/Vercel)

```bash
# Variables critiques
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
OPENAI_API_KEY=...

# OAuth
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...
OAUTH_GITHUB_CLIENT_ID=...
OAUTH_GITHUB_CLIENT_SECRET=...

# SSO Enterprise
SAML_ENTRY_POINT=...
SAML_ISSUER=...
SAML_CERT=...
OIDC_ISSUER=...
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...

# Email
EMAIL_SERVICE_PROVIDER=sendgrid
SENDGRID_API_KEY=...

# Monitoring
SENTRY_DSN=...
MONITORING_ENABLED=true
```

#### Frontend (Vercel)

```bash
NEXT_PUBLIC_API_URL=https://api.luneo.app
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
NEXT_PUBLIC_GA_MEASUREMENT_ID=...
NEXT_PUBLIC_MIXPANEL_TOKEN=...
```

### 3. Migrations Base de Données

```bash
cd apps/backend
npx prisma migrate deploy
npx prisma generate
```

### 4. Déploiement Backend (Railway)

```bash
# Option 1: Via Railway CLI
cd apps/backend
railway up

# Option 2: Via Railway Dashboard
# 1. Connecter le repo GitHub
# 2. Sélectionner le projet
# 3. Configurer les variables d'environnement
# 4. Déployer
```

### 5. Déploiement Frontend (Vercel)

```bash
# Option 1: Via Vercel CLI
cd apps/frontend
vercel --prod

# Option 2: Via Vercel Dashboard
# 1. Connecter le repo GitHub
# 2. Sélectionner le projet frontend
# 3. Configurer les variables d'environnement
# 4. Déployer
```

### 6. Vérification Post-Déploiement

```bash
# Health check backend
curl https://api.luneo.app/health

# Health check frontend
curl https://luneo.app

# Test endpoints webhooks
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.luneo.app/api/v1/webhooks
```

---

## ✅ Checklist de Déploiement

### Backend
- [ ] Variables d'environnement configurées
- [ ] Migrations Prisma appliquées
- [ ] Build réussi
- [ ] Health check OK
- [ ] Endpoints API accessibles
- [ ] Webhooks fonctionnels

### Frontend
- [ ] Variables d'environnement configurées
- [ ] Build réussi
- [ ] Pages accessibles
- [ ] Dashboard webhooks fonctionnel
- [ ] i18n fonctionnel (5 langues)
- [ ] Analytics tracking actif

### Intégrations
- [ ] SDKs publiés (optionnel)
- [ ] Postman Collection disponible
- [ ] Documentation API à jour
- [ ] Monitoring configuré
- [ ] Alertes configurées

---

## 🔍 Tests Post-Déploiement

### 1. Test Webhooks Dashboard

1. Se connecter au dashboard
2. Aller sur `/dashboard/webhooks`
3. Créer un webhook de test
4. Tester le webhook
5. Vérifier les logs

### 2. Test i18n

1. Changer la langue dans les paramètres
2. Vérifier que toutes les pages sont traduites
3. Tester les 5 langues : EN, FR, DE, ES, IT

### 3. Test API

```bash
# Test création webhook
curl -X POST https://api.luneo.app/api/v1/webhooks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Webhook",
    "url": "https://example.com/webhook",
    "events": ["order.created"]
  }'
```

---

## 🚨 Dépannage

### Erreur: Module non trouvé
```bash
# Réinstaller les dépendances
pnpm install
```

### Erreur: Migration Prisma
```bash
cd apps/backend
npx prisma migrate deploy
npx prisma generate
```

### Erreur: Build échoue
```bash
# Vérifier les erreurs TypeScript
cd apps/frontend
pnpm run type-check

cd apps/backend
pnpm run build
```

---

## 📊 Monitoring

### Vérifier les Logs

**Railway (Backend)** :
```bash
railway logs
```

**Vercel (Frontend)** :
```bash
vercel logs
```

### Métriques

- **Sentry** : Erreurs et performance
- **Vercel Analytics** : Performance frontend
- **Railway Metrics** : Performance backend

---

## ✅ Statut Final

**Tous les fichiers sont intégrés et prêts pour le déploiement !**

- ✅ Backend : Endpoints webhooks complets
- ✅ Frontend : Dashboard webhooks complet
- ✅ SDKs : TypeScript et Python prêts
- ✅ i18n : 5 langues activées
- ✅ Tests : Performance, A11y, Security
- ✅ Monitoring : Alertes configurées

---

*Guide créé le : Janvier 2025*
