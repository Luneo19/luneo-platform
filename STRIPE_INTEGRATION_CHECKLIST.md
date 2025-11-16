# ✅ Stripe Integration Checklist - Luneo

## Variables d'environnement requises

```bash
# .env.local (frontend)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Prod
STRIPE_PRICE_PRO=price_PRO_MONTHLY # Professional Monthly
```

## Price IDs configurés

### Professional
- **Monthly:** `price_PRO_MONTHLY` - 29€/mois
- **Yearly:** Créé dynamiquement à 278.40€/an (-20%)

### Business
- **Monthly:** `price_BUSINESS_MONTHLY` - 59€/mois
- **Yearly:** Créé dynamiquement à 566.40€/an (-20%)

### Enterprise
- **Monthly:** `price_ENTERPRISE_MONTHLY` - 99€/mois
- **Yearly:** Créé dynamiquement à 950.40€/an (-20%)

## API Route : `/api/billing/create-checkout-session`

✅ **Implémenté correctement :**
- Vérification STRIPE_SECRET_KEY
- Support billing monthly/yearly
- Création dynamique prix annuel avec -20%
- Trial 14 jours
- Success URL: `/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`
- Cancel URL: `/pricing`
- Error handling complet

## Tests à effectuer

### 1. Test Plan Professional (Monthly)
```bash
curl -X POST http://localhost:3000/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId":"professional","email":"test@example.com","billing":"monthly"}'
```

### 2. Test Plan Professional (Yearly)
```bash
curl -X POST http://localhost:3000/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId":"professional","email":"test@example.com","billing":"yearly"}'
```

### 3. Test Plan Starter (doit fail)
```bash
curl -X POST http://localhost:3000/api/billing/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"planId":"starter","email":"test@example.com"}'
# Expected: Error "Le plan Starter est gratuit"
```

## Actions requises

### 🔴 Avant mise en production :
1. Créer les Price IDs annuels dans Stripe Dashboard (ou garder création dynamique)
2. Configurer les webhooks Stripe :
   - `checkout.session.completed`
   - `invoice.paid`
   - `customer.subscription.deleted`
3. Tester avec vraies cartes test Stripe
4. Configurer Stripe en mode production
5. Ajouter tests automatisés

### ✅ Déjà OK :
- Code route API fonctionnel
- Logique pricing annuel/mensuel
- Error handling
- Trial 14 jours inclus
- Success/Cancel URLs



