# AGENT-11: Billing & Subscriptions

**Objectif**: Rendre le module Billing/Credits production-ready en corrigeant toutes les routes API cassées vers le backend NestJS

**Priorité**: P1 (Critique)  
**Complexité**: 3/5  
**Estimation**: 1 semaine  
**Dépendances**: AGENT-01 (TypeScript), AGENT-05 (Auth)

---

## 📋 SCOPE

### Contexte Phase 12.3

Les hooks et composants billing/credits appellent encore des routes `/api/billing/*` et `/api/credits/*` supprimées. Tout doit passer par `endpoints.billing.*` et `endpoints.credits.*`.

### Fichiers à Corriger

#### Billing Hooks

- `apps/frontend/src/lib/hooks/useBilling.ts`
  - `/api/billing/subscription` → `endpoints.billing.subscription()`
  - `/api/billing/invoices` → `endpoints.billing.invoices()`
- `apps/frontend/src/app/(dashboard)/dashboard/billing/hooks/usePaymentMethods.ts`
  - `/api/billing/payment-methods` → `endpoints.billing.paymentMethods()`
- `apps/frontend/src/app/(dashboard)/dashboard/billing/hooks/useInvoices.ts`
  - `/api/billing/invoices` → `endpoints.billing.invoices()`

#### Credits Hooks & Components

- `apps/frontend/src/hooks/useCredits.ts`
  - `/api/credits/balance` → `endpoints.credits.balance()`
- `apps/frontend/src/components/credits/UpsellModal.tsx`
  - `/api/credits/packs` → `endpoints.credits.packs()`
  - `/api/credits/buy` → `endpoints.credits.buy(data)`
- `apps/frontend/src/components/credits/CreditsDisplay.tsx`
  - `/api/credits/balance` → `endpoints.credits.balance()`
- `apps/frontend/src/components/credits/CreditPacksSection.tsx`
  - `/api/credits/packs` → `endpoints.credits.packs()`
  - `/api/credits/buy` → `endpoints.credits.buy(data)`
- `apps/frontend/src/app/(dashboard)/dashboard/credits/page.tsx`
  - `/api/credits/buy` → `endpoints.credits.buy(data)`

#### Phase 14 - Supabase Removal (Billing pages)

- `apps/frontend/src/app/(dashboard)/dashboard/billing/page.tsx` : supprimer Supabase auth
- Toute page billing avec `createClient` Supabase

#### Phase 16.2 - TODO Actions

- `apps/frontend/src/lib/hooks/useSubscription.ts` : Wire to `endpoints.billing.subscription()`

### API Endpoints Backend (déjà existants)

```
endpoints.billing.subscription()          // GET /api/v1/billing/subscription
endpoints.billing.plans()                 // GET /api/v1/plans
endpoints.billing.subscribe(planId)       // POST /api/v1/billing/create-checkout-session
endpoints.billing.cancel()                // POST /api/v1/billing/cancel-downgrade
endpoints.billing.invoices()              // GET /api/v1/billing/invoices
endpoints.billing.paymentMethods()        // GET /api/v1/billing/payment-methods
endpoints.billing.addPaymentMethod(id)    // POST /api/v1/billing/payment-methods
endpoints.billing.removePaymentMethod()   // DELETE /api/v1/billing/payment-methods
endpoints.billing.customerPortal()        // GET /api/v1/billing/customer-portal
endpoints.billing.changePlan(data)        // POST /api/v1/billing/change-plan
endpoints.billing.previewPlanChange(id)   // GET /api/v1/billing/preview-plan-change

endpoints.credits.balance()               // GET /api/v1/credits/balance
endpoints.credits.packs()                 // GET /api/v1/credits/packs
endpoints.credits.buy(data)               // POST /api/v1/credits/buy
endpoints.credits.transactions(params)    // GET /api/v1/credits/transactions
```

---

## ✅ TÂCHES

### Phase 1: Billing Hooks (1 jour)

- [ ] Migrer `useBilling.ts` → `endpoints.billing.*`
- [ ] Migrer `usePaymentMethods.ts` → `endpoints.billing.paymentMethods()`
- [ ] Migrer `useInvoices.ts` → `endpoints.billing.invoices()`
- [ ] Migrer `useSubscription.ts` → `endpoints.billing.subscription()`

### Phase 2: Credits Hooks & Components (1 jour)

- [ ] Migrer `useCredits.ts` → `endpoints.credits.balance()`
- [ ] Migrer `UpsellModal.tsx` → `endpoints.credits.packs()` + `endpoints.credits.buy()`
- [ ] Migrer `CreditsDisplay.tsx` → `endpoints.credits.balance()`
- [ ] Migrer `CreditPacksSection.tsx` → `endpoints.credits.packs()` + `endpoints.credits.buy()`
- [ ] Migrer `credits/page.tsx` → `endpoints.credits.buy()`

### Phase 3: Supabase Removal (0.5 jour)

- [ ] Supprimer imports `@/lib/supabase` des pages billing
- [ ] Utiliser auth cookie-based

### Phase 4: Testing (1 jour)

- [ ] Tester affichage subscription status
- [ ] Tester affichage invoices
- [ ] Tester affichage crédits balance
- [ ] Tester achat crédits (flow Stripe)
- [ ] Tester changement de plan
- [ ] Build sans erreur

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 appel `fetch('/api/billing/...')`** ou `fetch('/api/credits/...')`
- [ ] **0 import `@/lib/supabase`** dans les fichiers billing/credits
- [ ] Stripe checkout flow fonctionne
- [ ] Affichage crédits/subscription correct
- [ ] Build réussit

---

## 🔗 RESSOURCES

- API Client : `apps/frontend/src/lib/api/client.ts` (endpoints.billing.*, endpoints.credits.*)
- Backend Billing : `apps/backend/src/modules/billing/`
- Backend Plans : `apps/backend/src/modules/plans/`
