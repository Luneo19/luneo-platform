# 🚀 Déploiement Production - Vercel & Railway

**Date** : 15 Janvier 2025  
**Statut** : ✅ **Prêt pour déploiement**

---

## ✅ Vérification Pré-Déploiement

Toutes les variables Stripe ont été vérifiées et sont **configurées** :

- ✅ **24 variables Stripe** présentes
- ✅ Clé de production valide
- ✅ Tous les Product IDs et Price IDs configurés
- ✅ Add-ons complets

---

## 📋 Variables à Configurer

### Vercel (Frontend)

**Fichier généré** : `apps/frontend/vercel-production-vars.txt`

#### Méthode 1 : Via Dashboard (RECOMMANDÉ)

1. Aller sur https://vercel.com/dashboard
2. Sélectionner votre projet
3. **Settings** > **Environment Variables**
4. Ajouter chaque variable pour **Production** uniquement
5. Copier depuis `vercel-production-vars.txt`

#### Méthode 2 : Via CLI

```bash
cd apps/frontend

# Installer Vercel CLI si nécessaire
npm i -g vercel

# Se connecter
vercel login

# Ajouter les variables une par une
vercel env add STRIPE_SECRET_KEY production
# ... (copier la valeur depuis vercel-production-vars.txt)

# OU utiliser le script automatique
./scripts/deploy-production-vercel-railway.sh
```

### Railway (Backend)

**Fichier généré** : `apps/frontend/railway-production-vars.txt`

#### Méthode 1 : Via Dashboard

1. Aller sur https://railway.app/dashboard
2. Sélectionner votre projet **backend**
3. **Variables** > **New Variable**
4. Ajouter les variables (sans `NEXT_PUBLIC_`)

#### Méthode 2 : Via CLI

```bash
# Installer Railway CLI si nécessaire
npm i -g @railway/cli

# Se connecter
railway login

# Ajouter les variables
railway variables set STRIPE_SECRET_KEY="sk_live_..." --service backend
railway variables set STRIPE_WEBHOOK_SECRET="whsec_..." --service backend
# ... (voir railway-production-vars.txt)

# OU utiliser le script automatique
cd apps/frontend
./scripts/deploy-production-vercel-railway.sh
```

---

## 📝 Liste Complète des Variables

### Variables Stripe (Frontend + Backend)

```env
# Clés Stripe
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_jL5xDF4ylCaiXVDswVAliVA3
STRIPE_WEBHOOK_SECRET=whsec_rgKvTaCDRSLV6Iv6yrF8fNBh9c2II3uu

# Plans
STRIPE_PRODUCT_PROFESSIONAL=prod_TnxDl4p9a6eSNI
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_1SqLIkKG9MsM6fdSt59Vg3F1
STRIPE_PRICE_PROFESSIONAL_YEARLY=price_1SqLIlKG9MsM6fdSDh9Xya8V
STRIPE_PRODUCT_BUSINESS=prod_TnxDPQxSdrgqXZ
STRIPE_PRICE_BUSINESS_MONTHLY=price_1SqLImKG9MsM6fdS9rmCQyIE
STRIPE_PRICE_BUSINESS_YEARLY=price_1SqLImKG9MsM6fdSO6ihDDpO

# Add-ons
STRIPE_ADDON_EXTRA_DESIGNS_PRODUCT_ID=prod_TnxDw9ptrsLGmv
STRIPE_ADDON_EXTRA_DESIGNS_MONTHLY=price_1SqLInKG9MsM6fdSwzWbxxIC
STRIPE_ADDON_EXTRA_DESIGNS_YEARLY=price_1SqLInKG9MsM6fdSzTnYtCYU
STRIPE_ADDON_EXTRA_STORAGE_PRODUCT_ID=prod_TnxDwoZUIpmyWS
STRIPE_ADDON_EXTRA_STORAGE_MONTHLY=price_1SqLIoKG9MsM6fdS6jlwiSOH
STRIPE_ADDON_EXTRA_STORAGE_YEARLY=price_1SqLIoKG9MsM6fdSj1m67Kje
STRIPE_ADDON_EXTRA_TEAM_MEMBERS_PRODUCT_ID=prod_TnxDmSWBs4qQAa
STRIPE_ADDON_EXTRA_TEAM_MEMBERS_MONTHLY=price_1SqLIpKG9MsM6fdSx383a4oO
STRIPE_ADDON_EXTRA_TEAM_MEMBERS_YEARLY=price_1SqLIpKG9MsM6fdSOuEfX04V
STRIPE_ADDON_EXTRA_API_CALLS_PRODUCT_ID=prod_TnxDLgYLS6utW5
STRIPE_ADDON_EXTRA_API_CALLS_MONTHLY=price_1SqLIqKG9MsM6fdSqkPAOLfL
STRIPE_ADDON_EXTRA_API_CALLS_YEARLY=price_1SqLIqKG9MsM6fdS9NX7mAA9
STRIPE_ADDON_EXTRA_RENDERS_3D_PRODUCT_ID=prod_TnxDyUIRrIkvjh
STRIPE_ADDON_EXTRA_RENDERS_3D_MONTHLY=price_1SqLIrKG9MsM6fdSOmW1WjM9
STRIPE_ADDON_EXTRA_RENDERS_3D_YEARLY=price_1SqLIrKG9MsM6fdSt9h1vXh5
```

### Variables URLs (Frontend uniquement)

```env
NEXT_PUBLIC_APP_URL=https://app.luneo.app
NEXT_PUBLIC_API_URL=https://api.luneo.app/api
NEXT_PUBLIC_STRIPE_SUCCESS_URL=https://app.luneo.app/dashboard/billing/success?session_id={CHECKOUT_SESSION_ID}
NEXT_PUBLIC_STRIPE_CANCEL_URL=https://app.luneo.app/pricing
```

---

## 🚀 Déploiement

### Option 1 : Déploiement Automatique (Script)

```bash
cd apps/frontend
./scripts/deploy-production-vercel-railway.sh
```

Le script va :
1. ✅ Vérifier toutes les variables
2. ✅ Proposer de configurer Vercel
3. ✅ Proposer de configurer Railway
4. ✅ Déployer automatiquement

### Option 2 : Déploiement Manuel

#### Vercel (Frontend)

```bash
cd apps/frontend

# Vérifier la configuration
vercel

# Déployer en production
vercel --prod
```

#### Railway (Backend)

```bash
cd apps/backend

# Se connecter
railway login

# Lier le projet
railway link

# Déployer
railway up
```

---

## ✅ Checklist Pré-Déploiement

- [x] Variables Stripe vérifiées (24/24)
- [ ] Variables configurées dans Vercel (Production)
- [ ] Variables configurées dans Railway (Backend)
- [ ] URLs de production correctes
- [ ] Webhook Stripe configuré
- [ ] Domaine configuré (app.luneo.app, api.luneo.app)
- [ ] Tests de la page pricing effectués

---

## 🔍 Vérification Post-Déploiement

### 1. Tester la page pricing

- Aller sur https://app.luneo.app/pricing
- Vérifier que les plans s'affichent correctement
- Cliquer sur "Professional" ou "Business"
- Vérifier la redirection vers Stripe Checkout

### 2. Tester le checkout

- Utiliser une carte de test Stripe
- Compléter le checkout
- Vérifier la redirection vers `/dashboard/billing/success`

### 3. Vérifier les webhooks

- Dans Stripe Dashboard : https://dashboard.stripe.com/webhooks
- Vérifier que les webhooks sont actifs
- Vérifier les logs dans Railway

---

## 🎉 Résultat Final

Une fois déployé :

- ✅ Frontend : https://app.luneo.app
- ✅ API : https://api.luneo.app
- ✅ Page Pricing : https://app.luneo.app/pricing
- ✅ Stripe Checkout fonctionnel
- ✅ Add-ons disponibles

---

## 📞 Support

Si des erreurs surviennent :

1. Vérifier les logs Vercel : https://vercel.com/dashboard > Deployments > Logs
2. Vérifier les logs Railway : Dashboard > Service > Logs
3. Vérifier les webhooks Stripe : Dashboard > Webhooks > Logs

---

**Tout est prêt pour le déploiement !** 🚀
