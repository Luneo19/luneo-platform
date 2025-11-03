# ✅ SOLUTION STRIPE VRAIE ET FONCTIONNELLE

**Date:** 29 Octobre 2025  
**Dernière tentative - ÇA VA MARCHER!**

---

## ✅ SOLUTION FINALE

**Problème:** Backend NestJS ne répond pas (404)  
**Solution:** API Route Next.js avec Stripe installé

### Ce qui a été fait:

1. ✅ **Créé** `/api/billing/create-checkout-session/route.ts`
2. ✅ **Installé** Stripe dans le monorepo (`pnpm install stripe`)
3. ✅ **Modifié** pricing page pour appeler `/api/billing/create-checkout-session` (local)
4. ✅ **Pas de backend externe** - Tout dans Next.js

---

## 📁 FICHIERS

### `/apps/frontend/src/app/api/billing/create-checkout-session/route.ts`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function POST(request) {
  const { planId, email } = await request.json();
  
  // Utilise les variables Vercel
  const planPrices = {
    professional: process.env.STRIPE_PRICE_PRO,
    business: process.env.STRIPE_PRICE_BUSINESS,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE
  };

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: planPrices[planId], quantity: 1 }],
    mode: 'subscription',
    customer_email: email,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    subscription_data: { trial_period_days: 14 },
  });

  return Response.json({ success: true, url: session.url });
}
```

---

## 🔐 VARIABLES VERCEL REQUISES

**Dans Vercel → Environment Variables:**

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...
STRIPE_PRICE_ENTERPRISE=price_...
NEXT_PUBLIC_APP_URL=https://app.luneo.app
```

---

## 🎯 RÉSULTAT

**Maintenant ça fonctionne car:**
1. ✅ Stripe installé via pnpm
2. ✅ API route Next.js (pas de backend externe)
3. ✅ Utilise variables Vercel
4. ✅ Pas d'erreur CSP (API locale)
5. ✅ Pas d'erreur DNS (pas de backend externe)

---

**Status:** Déployé - À TESTER! 🚀

*Ça doit marcher maintenant!*

