# 🔧 Configuration Stripe et OpenAI

**Date**: 17 novembre 2025  
**Objectif**: Configurer Stripe et OpenAI pour activer toutes les fonctionnalités

---

## 💳 Configuration Stripe (Billing)

### Variables Nécessaires

#### Frontend (Vercel)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Clé publique Stripe

#### Backend (Vercel)
- `STRIPE_SECRET_KEY` - Clé secrète Stripe (commence par `sk_`)
- `STRIPE_WEBHOOK_SECRET` - Secret webhook Stripe (commence par `whsec_`)

### Étapes de Configuration

#### 1. Créer un compte Stripe

1. Allez sur https://stripe.com
2. Créez un compte ou connectez-vous
3. Allez dans **Developers** → **API keys**

#### 2. Récupérer les clés

**Clé Publique (Publishable Key)**:
- Format: `pk_test_...` (test) ou `pk_live_...` (production)
- Visible dans Dashboard → Developers → API keys

**Clé Secrète (Secret Key)**:
- Format: `sk_test_...` (test) ou `sk_live_...` (production)
- **⚠️ Ne jamais exposer publiquement**
- Visible dans Dashboard → Developers → API keys

**Webhook Secret**:
- Créez un webhook endpoint dans Stripe Dashboard
- URL: `https://backend-luneos-projects.vercel.app/api/stripe/webhook`
- Événements: `checkout.session.completed`, `customer.subscription.updated`, etc.
- Copiez le secret (commence par `whsec_`)

#### 3. Configurer dans Vercel

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
```

**Répéter pour preview et development**

#### 4. Script Automatique

```bash
# Utiliser le script de configuration
./scripts/configure-stripe.sh
```

---

## 🤖 Configuration OpenAI (AI Studio)

### Variables Nécessaires

#### Backend (Vercel)
- `OPENAI_API_KEY` - Clé API OpenAI (commence par `sk-`)

### Étapes de Configuration

#### 1. Créer un compte OpenAI

1. Allez sur https://platform.openai.com
2. Créez un compte ou connectez-vous
3. Allez dans **API keys**

#### 2. Créer une clé API

1. Cliquez sur **Create new secret key**
2. Donnez un nom (ex: "Luneo Production")
3. Copiez la clé (commence par `sk-`)
4. **⚠️ Ne peut être vue qu'une seule fois**

#### 3. Configurer dans Vercel

**Backend**:
```bash
cd apps/backend
vercel env add OPENAI_API_KEY production
# Coller: sk-...
```

**Répéter pour preview et development**

#### 4. Script Automatique

```bash
# Utiliser le script de configuration
./scripts/configure-openai.sh
```

---

## ✅ Vérification

### Tester Stripe

1. Aller sur `/dashboard/billing`
2. Cliquer sur "Upgrade Plan"
3. Vérifier que le checkout Stripe s'ouvre
4. Tester avec une carte de test: `4242 4242 4242 4242`

### Tester OpenAI

1. Aller sur `/dashboard/ai-studio`
2. Entrer un prompt
3. Cliquer sur "Générer"
4. Vérifier que l'image est générée

---

## 📋 Checklist

### Stripe
- [ ] Compte Stripe créé
- [ ] Clé publique récupérée
- [ ] Clé secrète récupérée
- [ ] Webhook configuré
- [ ] Variables configurées dans Vercel (frontend)
- [ ] Variables configurées dans Vercel (backend)
- [ ] Test checkout réussi

### OpenAI
- [ ] Compte OpenAI créé
- [ ] Clé API créée
- [ ] Variable configurée dans Vercel (backend)
- [ ] Test génération réussi

---

## 🔗 Liens Utiles

- **Stripe Dashboard**: https://dashboard.stripe.com
- **OpenAI Platform**: https://platform.openai.com
- **Vercel Dashboard**: https://vercel.com/luneos-projects

---

**Dernière mise à jour**: 17 novembre 2025

