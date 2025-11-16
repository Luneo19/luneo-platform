# 🔐 VARIABLES STRIPE À AJOUTER DANS VERCEL

**POUR PRODUCTION LIVE:** 

## ✅ VARIABLES À VÉRIFIER DANS VERCEL

**URL:** https://vercel.com/luneos-projects/frontend/settings/environment-variables

---

## 📋 LISTE COMPLÈTE DES VARIABLES

### 1. STRIPE_SECRET_KEY (DÉJÀ PRÉSENTE)
```
sk_live_your_secret_key
```
✅ **DÉJÀ PRÉSENTE** - Vérifiez qu'elle est complète!

### 2. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
pk_live_your_publishable_key
```
✅ **DÉJÀ PRÉSENTE** dans votre screenshot

### 3. STRIPE_PRICE_PRO
```
price_PRO_MONTHLY
```

### 4. STRIPE_PRICE_BUSINESS
**À VÉRIFIER** - Doit être un price_xxx complet

### 5. STRIPE_PRICE_ENTERPRISE
```
price_ENTERPRISE_MONTHLY
```

### 6. NEXT_PUBLIC_APP_URL
```
https://app.luneo.app
```

---

## 🎯 ACTION: VÉRIFIER LES PRICE IDs

**Allez sur Stripe Dashboard:**
1. https://dashboard.stripe.com/products
2. Cliquez sur chaque produit (Professional, Business, Enterprise)
3. Copiez le "Price ID" complet

**Ajoutez-les dans Vercel:**
- Vérifiez que STRIPE_PRICE_BUSINESS est complet
- S'il manque ou est incomplet, ajoutez-le

---

## ⚠️ PROBLÈME ACTUEL

Le `StripeConnectionError` peut venir de:
1. ✅ STRIPE_SECRET_KEY complète (vous l'avez)
2. ❓ STRIPE_PRICE_BUSINESS incomplet?
3. ❓ Mauvaise configuration timeout?

**Vérifiez les logs Vercel pour voir l'erreur exacte!**

