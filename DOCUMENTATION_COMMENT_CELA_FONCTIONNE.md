# 📚 DOCUMENTATION: COMMENT ÇA FONCTIONNE

**Date:** 29 Octobre 2025  
**Objectif:** Expliquer en détail comment le système de paiement Stripe fonctionne pour faciliter les futures corrections

---

## 🎯 ARCHITECTURE GLOBALE

### Flow complet
```
User → Page Pricing → Clique "Essayer maintenant" → API route → Stripe Checkout → Paiement
```

### Composants clés

1. **Frontend:** `apps/frontend/src/app/(public)/pricing/page.tsx`
2. **API:** `apps/frontend/src/app/api/billing/create-checkout-session/route.ts`
3. **Stripe:** Production API avec Price IDs configurés

---

## 🔧 COMPOSANT 1: PAGE PRICING

### Structure des données

**Fichier:** `apps/frontend/src/app/(public)/pricing/page.tsx`

```typescript
const plans = [
  {
    name: 'Professional',
    price: 29,              // Prix mensuel
    yearlyPrice: 278.4,      // Prix annuel (price * 12 * 0.8)
    planId: 'professional',  // Identifiant pour l'API
    cta: 'Essayer maintenant',
    // ...
  }
];
```

**Points importants:**
- `price`: Prix mensuel en euros
- `yearlyPrice`: Prix annuel calculé (mensuel * 12 * 0.8 pour -20%)
- `planId`: Correspond à la clé dans l'API Stripe

### Gestion du toggle mensuel/annuel

```typescript
const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

// Toggle UI
<button onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}>
```

**État:** `billingCycle` est passé à toutes les cartes de plans

### Affichage des prix

**Code actuel:**
```typescript
<span className="text-5xl font-bold">
  €{billingCycle === 'yearly' ? Math.round(plan.yearlyPrice) : plan.price}
</span>
{billingCycle === 'yearly' && (
  <p className="text-sm text-gray-500 mt-1">
    Soit {Math.round(plan.yearlyPrice / 12)}€/mois
  </p>
)}
```

**Comportement:**
- **Mensuel:** Affiche `€29` (grand)
- **Annuel:** Affiche `€278` (grand) + "Soit €23/mois" (petit)

**Modification demandée:** Inverser l'affichage annuel
- **Annuel:** Afficher `€23/mois` (grand) + "€278.40/an" (petit)

### Appel API

```typescript
const handleStripeCheckout = async (planId: string, billingCycle: 'monthly' | 'yearly') => {
  const response = await fetch('/api/billing/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ planId, email: userEmail, billing: billingCycle }),
  });
  const data = await response.json();
  if (data.success && data.url) {
    window.location.href = data.url; // Redirect vers Stripe
  }
};
```

**Données envoyées:**
- `planId`: 'professional' | 'business' | 'enterprise'
- `billing`: 'monthly' | 'yearly'
- `email`: Email de l'utilisateur

---

## 🔧 COMPOSANT 2: API ROUTE

### Fichier
`apps/frontend/src/app/api/billing/create-checkout-session/route.ts`

### Configuration des Price IDs

```typescript
const planPrices: Record<string, { monthly: string | null, yearly: string | null }> = {
  professional: { 
    monthly: 'price_1RvB1uKG9MsM6fdSnrGm2qIo',
    yearly: null // Pas encore configuré
  },
  business: { 
    monthly: 'price_1SH7SxKG9MsM6fdSetmxFnVl',
    yearly: null
  },
  enterprise: { 
    monthly: 'price_1SH7TMKG9MsM6fdSx4pebEXZ',
    yearly: null
  }
};
```

**Points importants:**
- Structure en objet avec `monthly` et `yearly`
- Chaque Price ID est unique dans Stripe
- `null` signifie "pas disponible" (ex: yearly pas encore créé)

### Sélection du Price ID

```typescript
const priceConfig = planPrices[planId];
const priceId = billing === 'yearly' ? priceConfig.yearly : priceConfig.monthly;
```

**Logique:**
1. Récupère la config pour le plan demandé
2. Sélectionne `yearly` si `billing === 'yearly'`, sinon `monthly`
3. Si `yearly` est `null`, ça échouera (validation en dessous)

### Validation

```typescript
if (!priceId && planId !== 'starter') {
  return NextResponse.json({
    success: false,
    error: `Plan ${planId} not configured`,
  }, { status: 400 });
}
```

**Comportement:**
- Si `priceId` est `null` pour starter: OK (gratuit)
- Si `priceId` est `null` pour les autres: Erreur 400

### Création de la session Stripe

```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  customer_email: email,
  success_url: 'https://app.luneo.app/dashboard/billing?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://app.luneo.app/pricing',
  metadata: { planId, billingCycle },
  subscription_data: { trial_period_days: 14 },
});
```

**Points clés:**
- `priceId`: Le Price ID sélectionné (unique par plan + cycle)
- `mode: 'subscription'`: Abonnement récurrent
- `trial_period_days: 14`: 14 jours d'essai gratuit
- URLs hardcodées (pas de variables env)

### Réponse

```typescript
return NextResponse.json({
  success: true,
  url: session.url, // URL Stripe Checkout
});
```

**Frontend utilise `session.url` pour rediriger l'utilisateur**

---

## 🔄 FLOW COMPLET DÉTAILLÉ

### Scénario: Utilisateur paie Professional Mensuel

1. **Page Pricing:**
   - Toggle sur "Mensuel"
   - Clique sur "Essayer maintenant" (Professional)

2. **Frontend:**
   - Appelle `handleStripeCheckout('professional', 'monthly')`
   - Fetch POST vers `/api/billing/create-checkout-session`
   - Body: `{ planId: 'professional', email: 'user@example.com', billing: 'monthly' }`

3. **API Route:**
   - Reçoit la requête
   - Sélectionne `planPrices.professional.monthly`
   - Price ID: `price_1RvB1uKG9MsM6fdSnrGm2qIo`
   - Crée session Stripe

4. **Stripe:**
   - Crée la session checkout
   - Retourne URL: `https://checkout.stripe.com/c/pay/cs_...`

5. **API Route:**
   - Retourne `{ success: true, url: 'https://...' }`

6. **Frontend:**
   - Reçoit la réponse
   - `window.location.href = url`
   - Redirect vers Stripe Checkout

7. **Utilisateur:**
   - Complète le paiement sur Stripe
   - Redirect vers `/dashboard/billing?session_id=xxx`

---

## 🐛 GESTION DES ERREURS

### Erreur 1: Plan non configuré

**Cause:** `yearly` est `null` mais l'utilisateur sélectionne "Annuel"

**Exemple:**
```typescript
business: { yearly: null }
// User clique sur Business + Annuel
// → priceId = null
// → Erreur: "Plan business not configured"
```

**Solution:** Ajouter le Price ID annuel dans `planPrices` ou désactiver le toggle pour ce plan

### Erreur 2: Price ID invalide dans Stripe

**Cause:** Price ID n'existe pas dans Stripe

**Exemple:**
```
Price ID: price_1INVALID
Stripe erreur: "No such price: price_1INVALID"
```

**Solution:** Vérifier dans Stripe Dashboard que le Price ID existe

### Erreur 3: Coupon YEARLY20 manquant

**Note:** Le coupon n'est plus utilisé, mais si besoin:

**Cause:** `discounts: [{ coupon: 'YEARLY20' }]` mais le coupon n'existe pas

**Solution:** Désactiver le coupon ou créer le coupon dans Stripe

---

## 🔍 DÉBOGAGE

### Logs utiles

**Dans l'API route:**
```typescript
console.log('🔍 Stripe Price IDs configured:', {
  requestedPlan: planId,
  billingCycle: billing,
  selectedPriceId: priceId,
  availableConfigs: priceConfig
});
```

**Vérifier:**
- `requestedPlan`: Plan demandé (correct?)
- `billingCycle`: monthly ou yearly (correct?)
- `selectedPriceId`: Price ID sélectionné (existe dans Stripe?)

### Endpoint de test

```bash
curl -X POST https://app.luneo.app/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId":"professional","email":"test@test.com","billing":"monthly"}'
```

**Résultat attendu:**
```json
{
  "success": true,
  "url": "https://checkout.stripe.com/c/pay/cs_..."
}
```

---

## ⚙️ CONFIGURATION VERCEL

### Variables requises

```
STRIPE_SECRET_KEY=sk_live_51DzUA1KG9MsM6fdSiwvX8rMM...
```

**Note:** Les Price IDs sont hardcodés dans le code maintenant (plus besoin de variables env)

### Redéploiement

Après modification du code:
```bash
cd apps/frontend
pnpm build
vercel --prod --force --yes
```

---

## 📋 CHECKLIST POUR MODIFICATIONS FUTURES

### Ajouter un nouveau plan

1. **Stripe Dashboard:**
   - Créer le produit
   - Créer le prix mensuel
   - Créer le prix annuel (optionnel)

2. **Page Pricing:**
   - Ajouter l'objet plan dans `plans[]`
   - Définir `name`, `price`, `yearlyPrice`, `planId`, etc.

3. **API Route:**
   - Ajouter l'entrée dans `planPrices`
   - Définir `monthly` et `yearly` Price IDs

4. **Tester:**
   - Cliquer sur le plan
   - Vérifier redirect vers Stripe
   - Vérifier le prix affiché

### Modifier l'affichage des prix

**Fichier:** `apps/frontend/src/app/(public)/pricing/page.tsx`

**Ligne:** ~206-212

**Modifier:**
- Taille: `text-5xl` (grand) vs `text-sm` (petit)
- Afficher `plan.yearlyPrice` vs `plan.price`
- Calcul: `plan.yearlyPrice / 12` pour équivalent

### Ajouter un bouton custom

**Fichier:** `apps/frontend/src/app/(public)/pricing/page.tsx`

**Ligne:** ~224-247

**Modifier:**
- Ajouter condition: `plan.planId === 'custom' ? (...) : (...)`
- Créer les boutons dans le nouveau bloc

---

## 🎯 RÉSUMÉ TECHNIQUE

**Points clés à retenir:**
1. Price IDs sont hardcodés dans l'API route (pas de variables env)
2. Structure `{ monthly: string | null, yearly: string | null }`
3. Sélection basée sur `billing` paramètre
4. Validation: starter peut avoir `null`, les autres non
5. Session Stripe créée avec `trial_period_days: 14`
6. URLs hardcodées pour success/cancel

**En cas de bug:**
1. Vérifier les logs API route (console.log)
2. Vérifier Price IDs dans Stripe Dashboard
3. Tester avec curl l'endpoint API
4. Vérifier que `billing` est 'monthly' ou 'yearly'

---

*Documentation créée le 29 Oct 2025 - Référence pour futures modifications*

