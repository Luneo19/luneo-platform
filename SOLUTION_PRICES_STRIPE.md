# ✅ SOLUTION - PRICE IDs STRIPE

**Date:** 29 Octobre 2025  
**Status:** Professional ✅ fonctionne | Business & Enterprise ❌ à corriger

---

## 🎯 PROBLÈME IDENTIFIÉ

D'après l'erreur:
```
Erreur: No such price: 'price_1SH7TMKG9MsM6fdSebEXZ'
```

Le Price ID pour Enterprise dans Vercel est **incorrect**.

---

## 📋 CE QUI FONCTIONNE

✅ **Professional Plan** - Fonctionne parfaitement  
- Price ID: Confirmé dans les tests
- Status: Opérationnel

---

## ⚠️ CE QUI NE FONCTIONNE PAS

❌ **Business Plan** - Pas de Price ID  
❌ **Enterprise Plan** - Price ID incorrect

---

## 🔧 SOLUTION - ÉTAPES DÉTAILLÉES

### Étape 1: Ouvrir Stripe Dashboard

**URL:** https://dashboard.stripe.com/products

### Étape 2: Vérifier les produits existants

Dans le Dashboard Stripe, vérifier si les produits suivants existent:
- ✅ Professional Plan (existe probablement)
- ❌ Business Plan (à créer)
- ⚠️ Enterprise Plan (peut exister mais avec mauvais Price ID)

### Étape 3: Créer Business Plan (si manquant)

**Option A: Via le Dashboard**

1. Cliquer **"+ Add product"**
2. Remplir:
   - **Name:** Business Plan
   - **Description:** Business plan for growing teams
   - **Pricing:**
     - Amount: 59.00
     - Currency: EUR
     - Billing: Monthly
     - **Recurring billing**
   - Trial: 14 days
3. Cliquer **"Save product"**
4. **COPIER LE PRICE ID** (commence par `price_`)

**Option B: Via API (si vous préférez)**

```bash
curl https://api.stripe.com/v1/prices \
  -u sk_live_YOUR_SECRET_KEY: \
  -d amount=5900 \
  -d currency=eur \
  -d recurring[interval]=month \
  -d product_data[name]="Business Plan" \
  -d product_data[description]="Business plan for growing teams"
```

Response contiendra le Price ID à copier.

### Étape 4: Créer/Corriger Enterprise Plan

**Via Dashboard:**

1. Si Enterprise existe déjà, cliquer dessus
2. Sinon, créer un nouveau produit
3. Configuration:
   - **Name:** Enterprise Plan
   - **Description:** Enterprise plan for large teams
   - **Pricing:**
     - Amount: 99.00
     - Currency: EUR
     - Billing: Monthly
     - **Recurring billing**
   - Trial: 14 days
4. **COPIER LE PRICE ID**

### Étape 5: Mettre à jour Vercel

**URL:** https://vercel.com/luneos-projects/frontend/settings/environment-variables

**Pour chaque plan, modifier/ajouter:**

```
STRIPE_PRICE_PRO=price_1RvB1uKG9MsM6fdSnrGm2qIo
STRIPE_PRICE_BUSINESS=price_NOUVEAU_BUSINESS_ID
STRIPE_PRICE_ENTERPRISE=price_NOUVEAU_ENTERPRISE_ID
```

**⚠️ IMPORTANT:**
- Copier-coller les Price IDs EXACTS de Stripe
- Ne pas laisser d'espaces avant/après
- Cliquer "Save" après chaque ajout

### Étape 6: Redéployer

**Option A: Via Vercel CLI**
```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
vercel --prod --force
```

**Option B: Via Vercel Dashboard**
1. Aller sur https://vercel.com/luneos-projects/frontend
2. Cliquer "Deployments"
3. Cliquer "..." sur le dernier deployment
4. Cliquer "Redeploy"
5. **Ne PAS cocher** "Use existing Build Cache"

### Étape 7: Tester

1. Aller sur https://app.luneo.app/pricing
2. Tester Business Plan:
   - Cliquer "Essayer maintenant"
   - ✅ Devrait rediriger vers Stripe Checkout
3. Tester Enterprise Plan:
   - Cliquer "Nous contacter" ou "Essayer maintenant"
   - ✅ Devrait rediriger vers Stripe Checkout

---

## 🔍 VÉRIFICATION SI ÇA NE MARCHE TOUJOURS PAS

### Vérifier les logs Vercel

**URL:** https://vercel.com/luneos-projects/frontend/logs

**Chercher:**
```
🔍 Stripe Price IDs configured: {
  professional: 'price_...',
  business: 'price_...',
  enterprise: 'price_...',
  requestedPlan: 'enterprise',
  selectedPriceId: 'price_...'
}
```

Si les Price IDs dans les logs sont différents de ceux dans Stripe, c'est que Vercel n'a pas les bonnes variables.

### Vérifier les variables Vercel

**URL:** https://vercel.com/luneos-projects/frontend/settings/environment-variables

**Contrôler:**
- Les noms sont exacts (pas de typo)
- Les valeurs commencent par `price_`
- Elles correspondent aux Price IDs dans Stripe

---

## 📊 PRIX RECOMMANDÉS

Basé sur le code backend (`plans.service.ts`):

| Plan | Prix | Price ID Exemple |
|------|------|------------------|
| Professional | €29/mois | price_XXXXXXXX |
| Business | €59/mois | price_YYYYYYYY |
| Enterprise | €99/mois | price_ZZZZZZZZ |

---

## ✅ CHECKLIST FINALE

- [ ] Business Plan créé dans Stripe
- [ ] Enterprise Plan créé/corrigé dans Stripe
- [ ] Price IDs copiés
- [ ] Variables Vercel mises à jour
- [ ] Frontend redéployé
- [ ] Business Plan testé ✅
- [ ] Enterprise Plan testé ✅

---

## 🎉 RÉSULTAT ATTENDU

Après correction, TOUS les plans devraient fonctionner:

```
✅ Professional Plan → Redirige vers Stripe Checkout
✅ Business Plan → Redirige vers Stripe Checkout
✅ Enterprise Plan → Redirige vers Stripe Checkout
```

---

*Solution créée le 29 Oct 2025 - Documentation complète*

