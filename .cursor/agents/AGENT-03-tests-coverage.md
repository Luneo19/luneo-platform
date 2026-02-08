# AGENT-03: Tests & Coverage

**Objectif**: Nettoyer les tests cassés (Phase 13) et améliorer la couverture de tests

**Priorité**: P1 (Critique)  
**Complexité**: 3/5  
**Estimation**: 1-2 semaines  
**Dépendances**: AGENT-01 (TypeScript)

---

## 📋 SCOPE

### Contexte Phase 13 - Tests Cassés

6 fichiers de tests importent des routes API Next.js supprimées. Ces tests testaient des route handlers qui n'existent plus — le backend NestJS a ses propres tests pour ces endpoints.

### Fichiers à Supprimer/Réécrire

- `apps/frontend/tests/api/routes.test.ts` : 10 imports cassés
- `apps/frontend/__tests__/api/designs.test.ts` : 12 imports cassés
- `apps/frontend/__tests__/api/products.test.ts` : 5 imports cassés
- `apps/frontend/__tests__/api/billing.test.ts` : 5 imports cassés
- `apps/frontend/__tests__/api/auth.test.ts` : 5 imports cassés
- `apps/frontend/__tests__/api/webhooks.test.ts` : 2 imports cassés

### Stratégie

**Supprimer** les tests qui testaient les anciennes routes API Next.js (elles n'existent plus). Le backend a déjà ses propres tests dans `apps/backend/test/`.

Pour les remplacer, écrire des **tests d'intégration frontend** qui testent :
- Les hooks (`useProducts`, `useBilling`, etc.) avec des mocks du client API
- Les composants avec React Testing Library
- Les pages avec des tests E2E (Playwright)

---

## ✅ TÂCHES

### Phase 1: Cleanup Tests Cassés (1 jour)

- [ ] Supprimer `apps/frontend/tests/api/routes.test.ts`
- [ ] Supprimer `apps/frontend/__tests__/api/designs.test.ts`
- [ ] Supprimer `apps/frontend/__tests__/api/products.test.ts`
- [ ] Supprimer `apps/frontend/__tests__/api/billing.test.ts`
- [ ] Supprimer `apps/frontend/__tests__/api/auth.test.ts`
- [ ] Supprimer `apps/frontend/__tests__/api/webhooks.test.ts`
- [ ] Vérifier `npm run test` passe (plus d'erreurs d'import)

### Phase 2: Nouveaux Tests Hooks (3 jours)

- [ ] Test `useProducts` → mock `endpoints.products.*`
- [ ] Test `useBilling` → mock `endpoints.billing.*`
- [ ] Test `useCredits` → mock `endpoints.credits.*`
- [ ] Test `useAuth` (store) → mock `endpoints.auth.*`
- [ ] Test `useOrders` → mock `endpoints.orders.*`

### Phase 3: Tests Composants (3 jours)

- [ ] Tests React Testing Library pour composants critiques
- [ ] Tests pages principales (dashboard, products, orders)
- [ ] Tests formulaires (login, register, product create)

### Phase 4: Tests E2E (3 jours)

- [ ] Config Playwright pour frontend
- [ ] E2E : Login flow
- [ ] E2E : Products CRUD
- [ ] E2E : Orders list
- [ ] E2E : Billing page

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 test cassé** : `npm run test` passe à 100%
- [ ] Coverage hooks > 80%
- [ ] Coverage composants critiques > 60%
- [ ] Tests E2E pour les 5 flows principaux

---

## 🔗 RESSOURCES

- Tests frontend : `apps/frontend/tests/`, `apps/frontend/__tests__/`
- Tests backend (référence) : `apps/backend/test/`
- Config Vitest : `apps/frontend/vitest.config.ts`
