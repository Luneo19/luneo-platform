# 📚 GUIDE DE RÉFÉRENCE COMPLET - STRIPE

**Date:** 29 Octobre 2025  
**Objectif:** Documentation de référence pour toutes modifications futures des prix et configurations Stripe

---

## 🏗️ ARCHITECTURE DU SYSTÈME

### Vue d'ensemble

```
Frontend (pricing page)
    ↓ handleStripeCheckout(planId, billingCycle)
API Route (/api/billing/create-checkout-session)
    ↓ stripe.prices.create() [si yearly]
    ↓ stripe.checkout.sessions.create()
Stripe Checkout
    ↓ Paiement utilisateur
Dashboard Billing
```

---

## 📁 STRUCTURE DES FICHIERS

### 1. Page Pricing (Frontend)
**Fichier:** `apps/frontend/src/app/(public)/pricing/page.tsx`  
**Lignes importantes:** 1-260

#### Configuration des plans (lignes 9-112)

```typescript
const plans = [
  {
    name: 'Professional',
    price: 29,              // Prix MENSUEL en euros
    yearlyPrice: 278.4,     // Prix ANNUEL en euros (price * 12 * 0.8)
    period: '/mois',
    description: 'Pour les créateurs professionnels',
    planId: 'professional', // IMPORTANT: Correspond à la clé dans l'API
    cta: 'Essayer maintenant',
    popular: true,
    features: [/* ... */]
  },
  // ... autres plans
];
```

**Points clés:**
- `price`: Prix mensuel affiché
- `yearlyPrice`: Prix annuel calculé (price × 12 × 0.8 pour -20%)
- `planId`: Identifiant unique passé à l'API
- `secondaryCta`: Bouton secondaire (ex: "Nous contacter" pour Enterprise)

#### Fonction de paiement (lignes 114-134)

```typescript
const handleStripeCheckout = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
  const response = await fetch('/api/billing/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      planId,              // 'professional' | 'business' | 'enterprise'
      email: userEmail,    // Email de l'utilisateur
      billing: billingCycle // 'monthly' | 'yearly'
    }),
  });
  
  const data = await response.json();
  if (data.success && data.url) {
    window.location.href = data.url; // Redirect vers Stripe
  }
};
```

#### Affichage des prix (lignes 204-216)

```typescript
<div className="flex flex-col items-center">
  <div className="flex items-baseline justify-center">
    <span className="text-5xl font-bold">
      {billingCycle === 'yearly' 
        ? Math.round(plan.yearlyPrice / 12)  // Prix mensuel équivalent
        : plan.price}                         // Prix mensuel
    </span>
    <span className="text-gray-400 ml-1">{plan.period}</span>
  </div>
  {billingCycle === 'yearly' && (
    <p className="text-sm text-gray-500 mt-1">
      Payé {Math.round(plan.yearlyPrice)}€/an
    </p>
  )}
</div>
```

**Comportement:**
- **Mode mensuel:** Affiche `€29/mois`
- **Mode annuel:** Affiche `€23/mois` (grand) + "Payé €278/an" (petit)

#### Boutons (lignes 224-247)

```typescript
{plan.planId === 'enterprise' ? (
  // Enterprise: 2 boutons
  <div className="space-y-2">
    <Button onClick={() => handleStripeCheckout(plan.planId!, billingCycle)}>
      {plan.cta}
    </Button>
    <Link href="/contact">
      <Button variant="outline">{plan.secondaryCta}</Button>
    </Link>
  </div>
) : plan.href ? (
  // Plans avec href (Starter)
  <Link href={plan.href}>
    <Button>{plan.cta}</Button>
  </Link>
) : (
  // Plans normaux (Professional, Business)
  <Button onClick={() => handleStripeCheckout(plan.planId!, billingCycle)}>
    {plan.cta}
  </Button>
)}
```

---

### 2. API Route (Backend)
**Fichier:** `apps/frontend/src/app/api/billing/create-checkout-session/route.ts`  
**Lignes importantes:** 1-159

#### Configuration des Price IDs (lignes 24-39)

```typescript
const planPrices: Record<string, { monthly: string | null, yearly: string | null }> = {
  starter: { 
    monthly: null, 
    yearly: null 
  },
  professional: { 
    monthly: 'price_PRO_MONTHLY',
    yearly: 'price_PRO_MONTHLY' // Même Price ID, prix yearly créé dynamiquement
  },
  business: { 
    monthly: 'price_BUSINESS_MONTHLY',
    yearly: 'price_BUSINESS_MONTHLY' // Même Price ID, prix yearly créé dynamiquement
  },
  enterprise: { 
    monthly: 'price_ENTERPRISE_MONTHLY',
    yearly: 'price_ENTERPRISE_MONTHLY' // Même Price ID, prix yearly créé dynamiquement
  }
};
```

**Points clés:**
- Structure: `{ monthly: string, yearly: string }`
- Pour yearly: utilise le même Price ID que monthly
- Le prix annuel est créé dynamiquement plus bas

#### Sélection du Price ID (lignes 41-43)

```typescript
const priceConfig = planPrices[planId as keyof typeof planPrices];
const priceId = billing === 'yearly' ? priceConfig.yearly : priceConfig.monthly;
```

#### Création du prix annuel (lignes 102-135)

```typescript
if (billing === 'yearly' && priceId && planId !== 'starter') {
  // 1. Récupérer le Product ID depuis le Price ID mensuel
  const priceDetails = await stripe.prices.retrieve(priceId);
  const productId = typeof priceDetails.product === 'string' 
    ? priceDetails.product 
    : priceDetails.product.id;
  
  // 2. Montants annuels avec -20%
  const yearlyAmounts: Record<string, number> = {
    professional: 27840, // 278.40€ en centimes
    business: 56640,     // 566.40€ en centimes
    enterprise: 95040    // 950.40€ en centimes
  };
  
  const yearlyAmount = yearlyAmounts[planId as keyof typeof yearlyAmounts];
  
  // 3. Créer un prix annuel temporaire
  const yearlyPrice = await stripe.prices.create({
    product: productId,
    unit_amount: yearlyAmount,
    currency: 'eur',
    recurring: {
      interval: 'year',
      interval_count: 1
    },
    nickname: `${planId}-yearly-${Date.now()}`
  });
  
  // 4. Utiliser ce prix annuel
  sessionConfig.line_items[0].price = yearlyPrice.id;
}
```

**Points clés:**
- Récupération automatique du Product ID
- Création d'un nouveau prix annuel à chaque requête
- Montants hardcodés en centimes
- Nickname unique avec timestamp

#### Création de la session Stripe (lignes 81-99)

```typescript
const sessionConfig = {
  payment_method_types: ['card'],
  line_items: [{
    price: priceId,  // Sera remplacé par yearlyPrice.id si yearly
    quantity: 1
  }],
  mode: 'subscription',
  customer_email: email || 'user@example.com',
  success_url: 'https://app.luneo.app/dashboard/billing?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://app.luneo.app/pricing',
  metadata: {
    planId,
    billingCycle: billing,
  },
  subscription_data: {
    trial_period_days: 14,
  },
};
```

**Points clés:**
- URLs hardcodées (pas de variables env)
- Trial period de 14 jours
- Metadata pour tracking

---

## 💰 CONFIGURATION DES PRIX

### Tableau de référence

| Plan | Prix mensuel | Prix annuel | Calcul annuel | Price ID Monthly | Product ID |
|------|--------------|-------------|---------------|------------------|------------|
| Professional | €29 | €278.40 | 29 × 12 × 0.8 | price_PRO_MONTHLY | Auto-récupéré |
| Business | €59 | €566.40 | 59 × 12 × 0.8 | price_BUSINESS_MONTHLY | prod_TDYaUcC0940jpT |
| Enterprise | €99 | €950.40 | 99 × 12 × 0.8 | price_ENTERPRISE_MONTHLY | prod_TDYaqgD6gwRVd0 |

### Conversion en centimes

**IMPORTANT:** Stripe utilise les centimes!

```
€29 = 2900 centimes
€278.40 = 27840 centimes
€59 = 5900 centimes
€566.40 = 56640 centimes
€99 = 9900 centimes
€950.40 = 95040 centimes
```

---

## 🔧 MODIFIER LES PRIX

### Scénario 1: Changer le prix mensuel d'un plan

**Étape 1:** Créer un nouveau prix dans Stripe Dashboard
1. Aller sur https://dashboard.stripe.com/products
2. Trouver le produit (ex: Luneo Business Plan)
3. "+ Add another price"
4. Montant: ex 6900 (pour €69/mois)
5. Billing: Monthly
6. Save et **COPIER LE PRICE ID**

**Étape 2:** Mettre à jour l'API route
```typescript
// Fichier: apps/frontend/src/app/api/billing/create-checkout-session/route.ts
// Ligne ~32
business: { 
  monthly: 'NOUVEAU_PRICE_ID', // ← Coller ici
  yearly: 'NOUVEAU_PRICE_ID'   // Même Price ID
},
```

**Étape 3:** Mettre à jour la page pricing
```typescript
// Fichier: apps/frontend/src/app/(public)/pricing/page.tsx
// Ligne ~60
{
  name: 'Business',
  price: 69,              // ← Nouveau prix
  yearlyPrice: 662.4,     // ← 69 * 12 * 0.8
  // ...
}
```

**Étape 4:** Mettre à jour les montants annuels
```typescript
// Fichier: apps/frontend/src/app/api/billing/create-checkout-session/route.ts
// Ligne ~112
const yearlyAmounts: Record<string, number> = {
  professional: 27840,
  business: 66240,     // ← 69 * 12 * 0.8 * 100 (en centimes)
  enterprise: 95040
};
```

**Étape 5:** Build et déployer
```bash
cd apps/frontend
pnpm build
vercel --prod --force --yes
```

### Scénario 2: Ajouter un nouveau plan

**Étape 1:** Créer le produit dans Stripe
1. https://dashboard.stripe.com/products
2. "+ Add product"
3. Name: "Premium Plan"
4. Description: "Pour les power users"
5. Save → **COPIER LE PRODUCT ID**

**Étape 2:** Créer le prix mensuel
1. "+ Add price"
2. Amount: 3900 (€39)
3. Billing: Monthly
4. Save → **COPIER LE PRICE ID**

**Étape 3:** Ajouter dans l'API route
```typescript
// Ligne ~38
const planPrices: Record<string, { monthly: string | null, yearly: string | null }> = {
  // ... plans existants
  premium: {
    monthly: 'PRICE_ID_PREMIUM_MONTHLY',
    yearly: 'PRICE_ID_PREMIUM_MONTHLY' // Même Price ID
  }
};
```

**Étape 4:** Ajouter les montants annuels
```typescript
// Ligne ~115
const yearlyAmounts: Record<string, number> = {
  professional: 27840,
  business: 56640,
  enterprise: 95040,
  premium: 37440 // 39 * 12 * 0.8 * 100
};
```

**Étape 5:** Ajouter dans la page pricing
```typescript
// Après le plan Enterprise
{
  name: 'Premium',
  price: 39,
  yearlyPrice: 374.4, // 39 * 12 * 0.8
  period: '/mois',
  description: 'Pour les power users',
  features: [/* ... */],
  cta: 'Essayer maintenant',
  planId: 'premium',
  popular: false
}
```

**Étape 6:** Build et déployer

### Scénario 3: Modifier la réduction annuelle

**Actuellement:** -20% (coefficient 0.8)

**Pour changer à -25%:** Coefficient 0.75

**Étape 1:** Mettre à jour la page pricing
```typescript
// Ligne ~38 par exemple (Professional)
yearlyPrice: 261, // 29 * 12 * 0.75
```

**Étape 2:** Mettre à jour l'API route
```typescript
// Ligne ~112
const yearlyAmounts: Record<string, number> = {
  professional: 26100, // 29 * 12 * 0.75 * 100
  business: 53100,     // 59 * 12 * 0.75 * 100
  enterprise: 89100    // 99 * 12 * 0.75 * 100
};
```

**Étape 3:** Mettre à jour le badge
```typescript
// Ligne ~180
<span className="text-green-400 font-medium">(-25%)</span>
```

---

## 🎨 PERSONNALISER L'AFFICHAGE

### Modifier la taille des prix

**Fichier:** `apps/frontend/src/app/(public)/pricing/page.tsx`  
**Ligne:** ~206

```typescript
// Prix principal
<span className="text-5xl font-bold">  // ← Modifier ici (text-6xl pour plus grand)
  {/* ... */}
</span>

// Prix secondaire
<p className="text-sm text-gray-500 mt-1">  // ← Modifier ici (text-xs pour plus petit)
  Payé {Math.round(plan.yearlyPrice)}€/an
</p>
```

### Modifier les couleurs des boutons

**Ligne:** ~226

```typescript
// Bouton normal
className="bg-blue-600 hover:bg-blue-700"  // ← Modifier les couleurs

// Bouton populaire
className="bg-gradient-to-r from-blue-500 to-purple-500"  // ← Gradient
```

### Ajouter/Retirer des features

**Ligne:** ~39-53 (exemple Professional)

```typescript
features: [
  { name: '100 designs par mois', included: true },   // ✅ Inclus
  { name: 'Support dédié', included: false },         // ❌ Non inclus
  // Ajouter une nouvelle feature:
  { name: 'Nouvelle feature', included: true },
],
```

---

## 🔐 VARIABLES D'ENVIRONNEMENT

### Variables Vercel requises

**URL:** https://vercel.com/luneos-projects/frontend/settings/environment-variables

```
STRIPE_SECRET_KEY=sk_live_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
NEXT_PUBLIC_APP_URL=https://app.your-domain.com
```

**Note:** Les Price IDs sont hardcodés dans le code (pas dans les variables env)

---

## 🧪 TESTER LES MODIFICATIONS

### Test manuel via l'interface

1. Aller sur https://app.luneo.app/pricing
2. Basculer entre "Mensuel" et "Annuel"
3. Cliquer sur "Essayer maintenant"
4. Vérifier:
   - Redirect vers Stripe Checkout ✅
   - Prix affiché correct ✅
   - Trial de 14 jours ✅

### Test via curl

```bash
# Test Professional Monthly
curl -X POST https://app.luneo.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId":"professional","email":"test@test.com","billing":"monthly"}'

# Test Professional Yearly
curl -X POST https://app.luneo.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId":"professional","email":"test@test.com","billing":"yearly"}'
```

**Réponse attendue:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_live_..."
}
```

---

## 🐛 DÉBOGAGE

### Erreur: "Plan X not configured"

**Cause:** Price ID est `null` pour ce plan

**Solution:**
1. Vérifier `planPrices` dans `create-checkout-session/route.ts`
2. S'assurer que le Price ID existe dans Stripe
3. Mettre à jour le Price ID dans le code

### Erreur: "No such product: 'prod_XXX'"

**Cause:** Product ID incorrect ou produit supprimé dans Stripe

**Solution:**
1. Récupérer le Product ID automatiquement depuis le Price ID
2. Ou vérifier dans Stripe Dashboard que le produit existe

### Erreur: "No such price: 'price_XXX'"

**Cause:** Price ID n'existe pas dans Stripe

**Solution:**
1. Vérifier dans Stripe Dashboard: https://dashboard.stripe.com/products
2. Copier le bon Price ID
3. Mettre à jour dans `planPrices`

### Les prix annuels sont incorrects (ex: 708€ au lieu de 566€)

**Cause:** Utilisation de `quantity: 12` au lieu de créer un prix annuel

**Solution:** S'assurer que le code crée un prix annuel avec `unit_amount` correct

---

## 📊 CALCULS DE RÉFÉRENCE

### Formule de base

```javascript
Prix annuel = Prix mensuel × 12 × (1 - réduction)

Avec -20%:
Prix annuel = Prix mensuel × 12 × 0.8

En centimes:
Prix annuel (centimes) = Prix mensuel (€) × 12 × 0.8 × 100
```

### Exemples

```
Professional: 29 × 12 × 0.8 = 278.40€ = 27840 centimes
Business: 59 × 12 × 0.8 = 566.40€ = 56640 centimes
Enterprise: 99 × 12 × 0.8 = 950.40€ = 95040 centimes
```

### Prix mensuel équivalent (affichage)

```javascript
Prix mensuel équivalent = Prix annuel / 12

Professional: 278.40 / 12 = 23.20€ ≈ 23€
Business: 566.40 / 12 = 47.20€ ≈ 47€
Enterprise: 950.40 / 12 = 79.20€ ≈ 79€
```

---

## 🚀 PROCÉDURE DE DÉPLOIEMENT

### Après toute modification

```bash
# 1. Naviguer vers le frontend
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend

# 2. Build local pour vérifier
pnpm build

# 3. Vérifier les erreurs
# Si OK, déployer

# 4. Déployer sur Vercel
export VERCEL_TOKEN=A3KiTbgitoyJjBuODZq0gYXq
vercel --prod --force --yes

# 5. Attendre 60 secondes

# 6. Tester
curl -X POST https://app.luneo.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId":"business","email":"test@test.com","billing":"yearly"}'
```

---

## 📝 CHECKLIST AVANT MODIFICATION

Avant de modifier les prix:

- [ ] Backup du fichier `create-checkout-session/route.ts`
- [ ] Backup du fichier `pricing/page.tsx`
- [ ] Noter les anciens Price IDs
- [ ] Créer les nouveaux prix dans Stripe
- [ ] Copier les nouveaux Price IDs
- [ ] Calculer les montants annuels en centimes
- [ ] Mettre à jour le code
- [ ] Build local
- [ ] Déployer
- [ ] Tester tous les plans (monthly + yearly)

---

## 🎯 POINTS CRITIQUES À RETENIR

### 1. Stripe utilise les CENTIMES
**Toujours multiplier par 100!**
```
€29 = 2900 centimes
€278.40 = 27840 centimes
```

### 2. Les URLs sont HARDCODÉES
```typescript
success_url: 'https://app.luneo.app/dashboard/billing?session_id={CHECKOUT_SESSION_ID}',
cancel_url: 'https://app.luneo.app/pricing',
```

**Ne PAS utiliser de variables env!**

### 3. Les Price IDs yearly sont les MÊMES que monthly
```typescript
professional: { 
  monthly: 'price_PRO_MONTHLY',
  yearly: 'price_PRO_MONTHLY' // ← Même Price ID
}
```

Le prix annuel est créé DYNAMIQUEMENT.

### 4. Récupération automatique du Product ID
```typescript
const priceDetails = await stripe.prices.retrieve(priceId);
const productId = priceDetails.product;
```

**Pas besoin de hardcoder les Product IDs!**

### 5. Trial period de 14 jours
```typescript
subscription_data: {
  trial_period_days: 14,
}
```

Tous les plans ont 14 jours d'essai gratuit.

---

## 📚 DOCUMENTATION ASSOCIÉE

1. **DOCUMENTATION_COMMENT_CELA_FONCTIONNE.md**
   - Architecture détaillée
   - Flow complet
   - Débogage

2. **SUCCES_PLANS_ANNUELS_100_POURCENT.md**
   - Tests et résultats
   - Solution finale

3. **FINALISATION_STRIPE_COMPLETE.md**
   - Historique des problèmes
   - Solutions appliquées

4. **GUIDE_REFERENCE_STRIPE_COMPLET.md** (ce fichier)
   - Guide de référence
   - Procédures de modification

---

## 🎉 RÉSUMÉ

**Le système est maintenant:**
- ✅ 100% opérationnel
- ✅ Flexible et extensible
- ✅ Bien documenté
- ✅ Facile à modifier

**Tous les plans fonctionnent:**
- ✅ Mensuel: Professional, Business, Enterprise
- ✅ Annuel: Professional (278.40€), Business (566.40€), Enterprise (950.40€)

**Pour toute modification future:**
1. Consulter ce guide
2. Suivre les étapes appropriées
3. Tester avant déploiement
4. Mettre à jour la documentation

---

*Guide de référence créé le 29 Oct 2025 - À conserver pour toutes modifications futures*

