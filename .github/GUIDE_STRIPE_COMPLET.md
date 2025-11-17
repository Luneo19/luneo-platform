# 💳 Guide Complet Configuration Stripe

**Date**: 17 novembre 2025  
**Objectif**: Configurer Stripe complètement pour activer le billing

---

## 📋 Étapes de Configuration

### Étape 1: Créer/Accéder à votre Compte Stripe

1. Allez sur https://stripe.com
2. Créez un compte ou connectez-vous
3. Complétez la vérification de votre compte si nécessaire

---

### Étape 2: Récupérer les Clés API

#### 2.1 Clés API (Test Mode)

1. Allez dans **Developers** → **API keys**
2. Vous verrez deux clés :

**Publishable Key** (Clé Publique):
- Format: `pk_test_...` (test) ou `pk_live_...` (production)
- Visible directement dans le dashboard
- ✅ **Sécurisée à partager publiquement**

**Secret Key** (Clé Secrète):
- Format: `sk_test_...` (test) ou `sk_live_...` (production)
- Cachée par défaut, cliquez sur "Reveal test key" ou "Reveal live key"
- ⚠️ **NE JAMAIS exposer publiquement**

#### 2.2 Webhook Secret

1. Allez dans **Developers** → **Webhooks**
2. Cliquez sur **Add endpoint**
3. Configurez:
   - **Endpoint URL**: `https://backend-luneos-projects.vercel.app/api/stripe/webhook`
   - **Description**: "Luneo Platform Webhook"
   - **Events to send**: Sélectionnez:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
4. Cliquez sur **Add endpoint**
5. Copiez le **Signing secret** (commence par `whsec_...`)

---

### Étape 3: Créer les Price IDs dans Stripe

Pour que le checkout fonctionne, vous devez créer des produits et prix dans Stripe :

1. Allez dans **Products** → **Add product**

**Plan Pro (Mensuel)**:
- Name: "Luneo Pro - Monthly"
- Price: 47€ / month
- Billing period: Monthly
- Copiez le **Price ID** (commence par `price_...`)

**Plan Pro (Annuel)**:
- Name: "Luneo Pro - Yearly"
- Price: 470€ / year (ou 278.40€ avec -20%)
- Billing period: Yearly
- Copiez le **Price ID**

**Plan Business (Mensuel)**:
- Name: "Luneo Business - Monthly"
- Price: 97€ / month
- Copiez le **Price ID**

**Plan Enterprise**:
- Name: "Luneo Enterprise - Monthly"
- Price: Sur devis (ou créez un prix custom)
- Copiez le **Price ID**

---

### Étape 4: Configurer dans Vercel

Une fois que vous avez toutes les clés, utilisez le script automatique :

```bash
./scripts/configure-stripe-complete.sh
```

Ou configurez manuellement :

**Frontend**:
```bash
cd apps/frontend
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
# Coller: pk_test_... ou pk_live_...
```

**Backend**:
```bash
cd apps/backend
vercel env add STRIPE_SECRET_KEY production
# Coller: sk_test_... ou sk_live_...

vercel env add STRIPE_WEBHOOK_SECRET production
# Coller: whsec_...

vercel env add STRIPE_PRICE_PRO production
# Coller: price_... (Pro mensuel)

vercel env add STRIPE_PRICE_BUSINESS production
# Coller: price_... (Business mensuel)

vercel env add STRIPE_PRICE_ENTERPRISE production
# Coller: price_... (Enterprise mensuel)
```

---

## ✅ Vérification

### Tester le Checkout

1. Aller sur `/dashboard/plans`
2. Cliquer sur "Choisir ce plan" pour un plan payant
3. Vérifier que le checkout Stripe s'ouvre
4. Tester avec une carte de test: `4242 4242 4242 4242`

### Cartes de Test Stripe

- **Succès**: `4242 4242 4242 4242`
- **Échec**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`
- **Date d'expiration**: N'importe quelle date future
- **CVC**: N'importe quel 3 chiffres

---

## 🔗 Liens Utiles

- **Stripe Dashboard**: https://dashboard.stripe.com
- **API Keys**: https://dashboard.stripe.com/apikeys
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Products**: https://dashboard.stripe.com/products
- **Test Cards**: https://stripe.com/docs/testing

---

**Dernière mise à jour**: 17 novembre 2025

