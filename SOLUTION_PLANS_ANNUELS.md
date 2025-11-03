# 🔧 SOLUTION PLANS ANNUELS

**Problème:** Les plans annuels échouent car le coupon `YEARLY20` n'existe pas dans Stripe.

---

## 🎯 SOLUTION IMMÉDIATE

**Option 1: Créer le coupon dans Stripe** (RECOMMANDÉ)

**URL:** https://dashboard.stripe.com/coupons

1. Cliquer **"Create coupon"**
2. Remplir:
   - **Coupon ID:** `YEARLY20`
   - **Name:** "Annual Subscription - 20% Off"
   - **Type:** Percentage
   - **Percent off:** 20%
   - **Duration:** Forever
3. Cliquer **"Create coupon"**

**Option 2: Désactiver le coupon et utiliser le prix sans réduction**

Modifier `create-checkout-session/route.ts`:

```typescript
// Pour annuel, on n'applique PAS de coupon
// L'utilisateur paiera le prix mensuel * 12 (sans réduction)
```

---

## 💡 SOLUTION PROPOSÉE

**Utiliser les prix mensuels avec multiplier pour l'annuel:**

```typescript
// Pour annuel, multiplier le prix mensuel par 12
if (billing === 'yearly' && priceId && planId !== 'starter') {
  sessionConfig.line_items = [{
    price: priceId,
    quantity: 12, // Payer pour 12 mois
  }];
}
```

**Cette solution fonctionne SANS coupon!**

---

## 📊 CALCULS

### Business Plan
- Mensuel: €59 × 1 = €59
- Annuel avec coupon: €59 × 1 × 0.8 × 12 = €566.40
- Annuel avec quantity: €59 × 12 = €708 (sans réduction)

### Enterprise Plan
- Mensuel: €99 × 1 = €99
- Annuel avec coupon: €99 × 1 × 0.8 × 12 = €950.40
- Annuel avec quantity: €99 × 12 = €1188 (sans réduction)

---

*Documentation créée le 29 Oct 2025*

