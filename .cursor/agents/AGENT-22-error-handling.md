# AGENT-22: Error Handling & Logging

**Objectif**: Centraliser la gestion d'erreurs, remplacer console.error par logger, et implémenter les TODO actions frontend restantes

**Priorité**: P1 (Critique)  
**Complexité**: 2/5  
**Estimation**: 3-5 jours  
**Dépendances**: AGENT-01 (TypeScript)

---

## 📋 SCOPE

### Contexte Phase 16.1 + Phase 16.2 + Phase 16.3

Erreurs de logging non conformes, TODO actions non câblées, et quelques TODOs backend HIGH priority.

### Phase 16.1 - Replace console.error in Error Boundaries

7 fichiers `error.tsx` utilisent `console.error` au lieu de `logger.error` :

- `apps/frontend/src/app/(dashboard)/dashboard/error.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/products/error.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/orders/error.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/billing/error.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/analytics/error.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/settings/error.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/ai-studio/error.tsx`

6 pages admin utilisent `console.error` :
- Scanner `apps/frontend/src/app/admin/` pour console.error

**Action** : Remplacer par `import { logger } from '@/lib/logger'` + `logger.error(...)`

### Phase 16.2 - Frontend TODO Actions

- `apps/frontend/src/components/settings/DeleteAccountModal.tsx` : Wire to `/api/v1/security/gdpr/delete-account`
- `apps/frontend/src/components/settings/ExportModal.tsx` : Wire to backend export endpoint
- `apps/frontend/src/lib/hooks/useSubscription.ts` : Wire to `endpoints.billing.subscription()`
- `apps/frontend/src/components/settings/SecurityTab.tsx` : Wire session revocation
- `apps/frontend/src/components/settings/NotificationsTab.tsx` : Wire notification preferences
- `apps/frontend/src/components/templates/TemplatesPageClient.tsx` : Wire preview/download

### Phase 16.3 - Backend Remaining TODOs (5 HIGH)

- `apps/backend/src/modules/integrations/shopify/shopify.controller.ts:258` : Implement product sync webhook
- `apps/backend/src/modules/generation/image-processor.service.ts:33` : Complete image composition
- `apps/backend/src/libs/storage/asset-file.service.ts:204` : Verify Cloudinary delete
- `apps/backend/src/modules/agents/ai-monitor/services/alerts.service.ts:314/319` : Verify email/Slack alerts
- `apps/backend/src/modules/observability/services/tracing.service.ts:193` : Verify OpenTelemetry decorator

---

## ✅ TÂCHES

### Phase 1: Console.error → logger (1 jour)

- [ ] Créer script ou manuellement remplacer dans les 7 error.tsx :
  ```typescript
  // ❌ AVANT
  console.error(error);
  
  // ✅ APRÈS
  import { logger } from '@/lib/logger';
  logger.error('Page error', { error });
  ```
- [ ] Scanner et corriger les 6 pages admin
- [ ] Vérifier aucun `console.error` restant dans le code production

### Phase 2: Frontend TODO Actions (2 jours)

- [ ] Wire `DeleteAccountModal.tsx` → `api.delete('/api/v1/security/gdpr/delete-account')`
- [ ] Wire `ExportModal.tsx` → `api.get('/api/v1/security/gdpr/export')`
- [ ] Wire `useSubscription.ts` → `endpoints.billing.subscription()`
- [ ] Wire `SecurityTab.tsx` → session revocation endpoint
- [ ] Wire `NotificationsTab.tsx` → notification preferences endpoint
- [ ] Wire `TemplatesPageClient.tsx` → preview/download

### Phase 3: Backend HIGH TODOs (1-2 jours)

- [ ] Implement Shopify product sync webhook handler
- [ ] Complete image composition with zones
- [ ] Verify Cloudinary delete integration
- [ ] Verify email/Slack alert implementations
- [ ] Verify OpenTelemetry decorator integration

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 `console.error`** dans le code production frontend
- [ ] Tous les TODOs frontend câblés au backend
- [ ] 5 backend HIGH TODOs résolus
- [ ] Build réussit sans warning

---

## 🔗 RESSOURCES

- Logger : `apps/frontend/src/lib/logger.ts`
- Backend Security : `apps/backend/src/modules/security/`
- Backend Billing : `apps/backend/src/modules/billing/`
