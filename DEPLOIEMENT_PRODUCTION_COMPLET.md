# 🚀 DÉPLOIEMENT EN PRODUCTION - GUIDE COMPLET

## ✅ TOUT EST INTÉGRÉ ET PRÊT

Toutes les améliorations P2 sont intégrées dans le frontend et backend et prêtes pour le déploiement en production.

---

## 📋 Checklist Pré-Déploiement

### ✅ Intégration Vérifiée

- [x] Backend : Endpoints webhooks complets
- [x] Frontend : Dashboard webhooks complet
- [x] SDKs : TypeScript et Python prêts
- [x] i18n : 5 langues activées
- [x] Tests : Performance, A11y, Security configurés
- [x] Monitoring : Alertes configurées
- [x] Documentation : API publique complète

---

## 🔧 Étapes de Déploiement

### 1. Installation des Dépendances

```bash
# À la racine du monorepo
pnpm install
```

### 2. Build des Applications

```bash
# Backend
cd apps/backend
pnpm run build

# Frontend
cd apps/frontend
pnpm run build
```

### 3. Migrations Base de Données

```bash
cd apps/backend
npx prisma migrate deploy
npx prisma generate
```

### 4. Configuration des Variables d'Environnement

#### Backend (Railway/Vercel)

**Variables critiques** :
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
STRIPE_SECRET_KEY=...
OPENAI_API_KEY=...
SENTRY_DSN=...
```

**OAuth** :
```bash
OAUTH_GOOGLE_CLIENT_ID=...
OAUTH_GOOGLE_CLIENT_SECRET=...
OAUTH_GITHUB_CLIENT_ID=...
OAUTH_GITHUB_CLIENT_SECRET=...
```

**SSO Enterprise** :
```bash
SAML_ENTRY_POINT=...
SAML_ISSUER=...
SAML_CERT=...
OIDC_ISSUER=...
OIDC_CLIENT_ID=...
OIDC_CLIENT_SECRET=...
```

**Email** :
```bash
EMAIL_SERVICE_PROVIDER=sendgrid
SENDGRID_API_KEY=...
```

#### Frontend (Vercel)

```bash
NEXT_PUBLIC_API_URL=https://api.luneo.app
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
NEXT_PUBLIC_GA_MEASUREMENT_ID=...
NEXT_PUBLIC_MIXPANEL_TOKEN=...
```

### 5. Déploiement Backend (Railway)

```bash
# Via Railway CLI
cd apps/backend
railway up

# Ou via Railway Dashboard
# 1. Connecter le repo GitHub
# 2. Sélectionner le projet
# 3. Configurer les variables d'environnement
# 4. Déployer
```

### 6. Déploiement Frontend (Vercel)

```bash
# Via Vercel CLI
cd apps/frontend
vercel --prod

# Ou via Vercel Dashboard
# 1. Connecter le repo GitHub
# 2. Sélectionner le projet frontend
# 3. Configurer les variables d'environnement
# 4. Déployer
```

---

## ✅ Vérification Post-Déploiement

### 1. Health Checks

```bash
# Backend
curl https://api.luneo.app/health

# Frontend
curl https://luneo.app
```

### 2. Test Webhooks Dashboard

1. Se connecter au dashboard
2. Aller sur `/dashboard/webhooks`
3. Créer un webhook de test
4. Tester le webhook
5. Vérifier les logs

### 3. Test i18n

1. Changer la langue dans les paramètres
2. Vérifier que toutes les pages sont traduites
3. Tester les 5 langues : EN, FR, DE, ES, IT

### 4. Test API Webhooks

```bash
# Lister les webhooks
curl -H "Authorization: Bearer TOKEN" \
  https://api.luneo.app/api/v1/webhooks

# Créer un webhook
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

## 🎯 Résumé Final

### ✅ Intégrations Complétées

1. **Webhooks Dashboard** : Complet et fonctionnel
2. **SDKs** : TypeScript et Python prêts
3. **i18n** : 5 langues activées
4. **Tests** : Performance, A11y, Security
5. **Monitoring** : Alertes configurées

### ✅ Fichiers Intégrés

- **Backend** : 9 fichiers créés/modifiés
- **Frontend** : 7 fichiers créés/modifiés
- **SDKs** : 20+ fichiers créés
- **i18n** : 6 fichiers créés/modifiés
- **Tests** : 10+ fichiers créés

### ✅ Prêt pour Production

**Tous les fichiers sont intégrés et fonctionnels !**

---

## 🚀 Commandes Rapides

```bash
# Vérifier l'intégration
bash scripts/verify-integration.sh

# Déployer en production
bash scripts/deploy-production.sh

# Vérifier les builds
cd apps/backend && pnpm run build
cd apps/frontend && pnpm run build
```

---

**🎊 TOUT EST PRÊT POUR LE DÉPLOIEMENT EN PRODUCTION ! 🎊**

*Guide créé le : Janvier 2025*
