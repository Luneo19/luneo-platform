# 🔐 VARIABLES STRIPE À CONFIGURER DANS VERCEL

**Date:** 29 Octobre 2025  
**Action requise:** Ajouter ces variables dans Vercel Dashboard

---

## ✅ ACTION IMMÉDIATE

Allez sur: https://vercel.com/luneos-projects/frontend/settings/environment-variables

---

## 📋 VARIABLES À AJOUTER

### Environnement: Production

```
STRIPE_SECRET_KEY=sk_test_... (votre clé secrète Stripe)
STRIPE_PRICE_PRO=price_... (ID du prix Professional)
STRIPE_PRICE_BUSINESS=price_... (ID du prix Business)
STRIPE_PRICE_ENTERPRISE=price_... (ID du prix Enterprise)
NEXT_PUBLIC_APP_URL=https://app.luneo.app
```

---

## 🔧 COMMENT OBTENIR LES IDs STRIPE

1. **Aller sur:** https://dashboard.stripe.com/test/products
2. **Créer ou trouver vos produits:**
   - Professional Plan
   - Business Plan
   - Enterprise Plan
3. **Cliquer sur chaque produit** → Copier le "Price ID" (ex: `price_1ABC123...`)
4. **Copier votre clé secrète:** Settings → API keys → Copy "Secret key"

---

## 📝 EXEMPLE COMPLET

```
STRIPE_SECRET_KEY=sk_test_51ABC123def456...
STRIPE_PRICE_PRO=price_1DEF456ghi789...
STRIPE_PRICE_BUSINESS=price_1GHI789jkl012...
STRIPE_PRICE_ENTERPRISE=price_1JKL012mno345...
NEXT_PUBLIC_APP_URL=https://app.luneo.app
```

---

## ⚠️ IMPORTANT

**Après avoir ajouté les variables:**
1. **Redéployez** le frontend sur Vercel
2. Attendez 2-3 minutes
3. Testez sur https://app.luneo.app/pricing

---

**Une fois ces variables configurées, Stripe fonctionnera !** 🎉

