# ⚡ Guide Rapide - Configuration Stripe en 2 minutes

## 🎯 Objectif
Créer automatiquement tous les produits et prix Stripe pour Luneo.

## 📋 Étapes

### 1. Obtenir votre clé Stripe (30 secondes)

**Option A : Clé de test (recommandé pour commencer)**
1. Allez sur https://dashboard.stripe.com/test/apikeys
2. Cliquez sur "Create secret key" ou copiez une clé existante
3. La clé commence par `sk_test_...`

**Option B : Clé de production**
1. Allez sur https://dashboard.stripe.com/apikeys
2. Cliquez sur "Create secret key" ou copiez une clé existante  
3. La clé commence par `sk_live_...`

### 2. Configurer la clé (10 secondes)

```bash
cd apps/frontend
echo "STRIPE_SECRET_KEY=sk_test_votre_cle_ici" >> .env.local
```

**OU** éditez `.env.local` et ajoutez :
```env
STRIPE_SECRET_KEY=sk_test_votre_cle_ici
```

### 3. Exécuter le script (1 minute)

```bash
cd apps/frontend
npx tsx scripts/setup-stripe-pricing-complete.ts
```

Le script va :
- ✅ Créer tous les produits Stripe
- ✅ Créer tous les prix (mensuels + annuels)
- ✅ Créer tous les add-ons
- ✅ Afficher toutes les variables à configurer

### 4. Copier les variables (30 secondes)

Le script affichera quelque chose comme :
```
STRIPE_PRODUCT_PROFESSIONAL=prod_...
STRIPE_PRICE_PROFESSIONAL_MONTHLY=price_...
...
```

**Ajoutez-les dans `.env.local`** ou **dans Vercel** (Settings > Environment Variables)

### 5. Tester ! 🎉

```bash
# Démarrer le serveur de dev
cd apps/frontend
npm run dev
```

Puis allez sur http://localhost:3000/pricing et testez !

---

## 🚀 Script Automatique (Alternative)

Si vous préférez un script interactif :

```bash
cd apps/frontend
./scripts/quick-setup-stripe.sh
```

Ce script vous guidera étape par étape.

---

## ❓ Besoin d'aide ?

- **Clé Stripe** : https://dashboard.stripe.com/apikeys
- **Documentation** : `apps/frontend/scripts/README_STRIPE_SETUP.md`
- **Carte de test** : `4242 4242 4242 4242` (n'importe quelle date/CVC)
