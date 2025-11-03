# 🎯 CRÉER LES PRIX ANNUELS DANS STRIPE

**Action requise:** Créer les Price IDs annuels dans Stripe Dashboard

---

## 📋 STEPS DÉTAILLÉES

### 1. Aller sur Stripe Dashboard

**URL:** https://dashboard.stripe.com/products

### 2. Créer Business Annual Price

1. **Trouver** "Luneo Business Plan" (Product ID: `prod_TDYaUcC0940jpT`)
2. Cliquer sur **"+ Add another price"**
3. Remplir:
   - **Price:** `56640` (en centimes, donc 566.40€)
   - **Billing:** `Per year` (récurrent)
   - **Name:** `business-annual`
4. Cliquer **"Save price"**
5. **COPIER LE PRICE ID** (commence par `price_`)

### 3. Créer Enterprise Annual Price

1. **Trouver** "Luneo Enterprise Plan" (Product ID: `prod_TDYaqgD6gwRVd0`)
2. Cliquer sur **"+ Add another price"**
3. Remplir:
   - **Price:** `95040` (en centimes, donc 950.40€)
   - **Billing:** `Per year` (récurrent)
   - **Name:** `enterprise-annual`
4. Cliquer **"Save price"**
5. **COPIER LE PRICE ID** (commence par `price_`)

---

## 📝 PRICES À CRÉER

| Plan | Prix annuel | Product ID | Nom du prix |
|------|-------------|------------|-------------|
| Business | €566.40/an | prod_TDYaUcC0940jpT | business-annual |
| Enterprise | €950.40/an | prod_TDYaqgD6gwRVd0 | enterprise-annual |

---

## 🔧 MISE À JOUR DU CODE

Après avoir copié les Price IDs, mettre à jour:

**Fichier:** `apps/frontend/src/app/api/billing/create-checkout-session/route.ts`

**Ligne ~31-38:**

```typescript
business: { 
  monthly: 'price_1SH7SxKG9MsM6fdSetmxFnVl',
  yearly: 'PRICE_ID_BUSINESS_ANNUAL' // ← Copier depuis Stripe
},
enterprise: { 
  monthly: 'price_1SH7TMKG9MsM6fdSx4pebEXZ',
  yearly: 'PRICE_ID_ENTERPRISE_ANNUAL' // ← Copier depuis Stripe
}
```

---

## ✅ APRÈS CRÉATION

1. ✅ Copier les Price IDs annuels
2. ✅ Mettre à jour le code
3. ✅ Redéployer
4. ✅ Tester les plans annuels

---

*Documentation créée le 29 Oct 2025*

