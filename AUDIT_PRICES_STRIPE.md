# 🔍 AUDIT DES PRICE IDs STRIPE

**Date:** 29 Octobre 2025  
**Problème:** Erreur "No such price: 'price_1SH7TMKG9MsM6fdSebEXZ'"

---

## 🎯 DIAGNOSTIC

### Erreur observée
```
Erreur: No such price: 'price_1SH7TMKG9MsM6fdSebEXZ'
```

Cela signifie que le Price ID configuré dans Vercel pour Enterprise n'existe pas dans Stripe.

---

## 📋 ACTIONS À FAIRE

### Option 1: Vérifier les Price IDs dans Vercel

**URL:** https://vercel.com/luneos-projects/frontend/settings/environment-variables

**Vérifier que les variables suivantes existent et sont CORRECTES:**

```
STRIPE_PRICE_PRO=price_1RvB1uKG9MsM6fdSnrGm2qIo
STRIPE_PRICE_BUSINESS=??? (à compléter)
STRIPE_PRICE_ENTERPRISE=price_1SH7TMKG9MsM6fdSebEXZ (❌ INCORRECT)
```

### Option 2: Créer les Price IDs dans Stripe

#### 2.1 Aller sur Stripe Dashboard
https://dashboard.stripe.com/products

#### 2.2 Créer les produits manquants

**Pour Business Plan:**
1. Cliquer "Add product"
2. Nom: "Business Plan"
3. Prix: €49/mois (ou €490/an)
4. Mode: Recurring
5. Billing period: Monthly (ou Yearly)
6. **Copier le Price ID** (commence par `price_`)

**Pour Enterprise Plan:**
1. Cliquer "Add product"
2. Nom: "Enterprise Plan"  
3. Prix: €99/mois (ou €990/an)
4. Mode: Recurring
5. Billing period: Monthly
6. **Copier le Price ID**

#### 2.3 Mettre à jour Vercel

Ajouter/mettre à jour les variables:

```
STRIPE_PRICE_PRO=price_1RvB1uKG9MsM6fdSnrGm2qIo
STRIPE_PRICE_BUSINESS=price_XXXXXXXXX (nouveau Price ID)
STRIPE_PRICE_ENTERPRISE=price_YYYYYYYYY (nouveau Price ID)
```

### Option 3: Utiliser des Price IDs de Test

Si vous voulez tester rapidement avec des Price IDs de test:

```bash
# Créer des prices via l'API Stripe Test
curl https://api.stripe.com/v1/prices \
  -u sk_test_...: \
  -d amount=4900 \
  -d currency=eur \
  -d recurring[interval]=month \
  -d product_data[name]="Business Plan" \
  -d product_data[description]="Business plan for teams"
```

---

## 🔧 CONFIGURATION RECOMMANDÉE

### Price IDs Minimum

Pour que TOUS les plans fonctionnent, il faut au minimum:

| Plan | Price ID | Status |
|------|----------|--------|
| Professional | `price_1RvB1uKG9MsM6fdSnrGm2qIo` | ✅ Confirmé |
| Business | ❌ Manquant | ⚠️ À créer |
| Enterprise | ❌ Incorrect | ⚠️ À corriger |

### Prix recommandés

Basé sur le code du backend (`plans.service.ts`):

```typescript
PROFESSIONAL: { name: 'Professional', price: 29, description: 'Pour les créateurs professionnels' },
BUSINESS: { name: 'Business', price: 59, description: 'Pour les équipes en croissance' },
ENTERPRISE: { name: 'Enterprise', price: 99, description: 'Pour les grandes équipes' },
```

**En cents (pour Stripe):**
- Professional: €29.00 → 2900 cents
- Business: €59.00 → 5900 cents  
- Enterprise: €99.00 → 9900 cents

---

## 📊 VÉRIFICATION DES LOGS

Après le déploiement avec le debug, vérifier les logs:

**URL:** https://vercel.com/luneos-projects/frontend/logs

**Chercher les lignes:**
```
🔍 Stripe Price IDs configured: {
  professional: 'price_...',
  business: 'price_...',
  enterprise: 'price_...',
  requestedPlan: 'enterprise',
  selectedPriceId: 'price_1SH7TMKG9MsM6fdSebEXZ'
}
```

Cela montrera quels Price IDs sont ACTUELLEMENT configurés.

---

## 🎯 SOLUTION RAPIDE

### 1. Vérifier les Price IDs actuels dans Vercel

### 2. Soit corriger, soit créer les Price IDs manquants

### 3. Redéployer (les variables d'environnement sont appliquées au déploiement)

### 4. Tester chaque plan

---

## ✅ CHECKLIST

- [ ] Ouvrir Stripe Dashboard
- [ ] Vérifier les produits existants
- [ ] Créer produit Business si manquant
- [ ] Créer produit Enterprise si manquant
- [ ] Copier les Price IDs
- [ ] Mettre à jour Vercel env vars
- [ ] Redéployer
- [ ] Tester Professional
- [ ] Tester Business
- [ ] Tester Enterprise

---

*Documentation créée le 29 Oct 2025*

