# AGENT-12: Analytics Dashboard

**Objectif**: Rendre le module Analytics/Dashboard production-ready en corrigeant toutes les routes API cassées

**Priorité**: P2 (Important)  
**Complexité**: 3/5  
**Estimation**: 1 semaine  
**Dépendances**: AGENT-01 (TypeScript), AGENT-05 (Auth)

---

## 📋 SCOPE

### Contexte Phase 12.4

Les hooks et composants dashboard/analytics/monitoring appellent des routes `/api/dashboard/*`, `/api/analytics/*` supprimées. Tout doit passer par `endpoints.analytics.*` ou des appels directs au backend NestJS.

### Fichiers à Corriger

#### Dashboard Hooks

- `apps/frontend/src/lib/hooks/api/useDashboard.ts`
  - `/api/dashboard/stats` → `api.get('/api/v1/admin/metrics')` ou créer `endpoints.dashboard.stats()`
  - `/api/dashboard/chart-data` → `endpoints.analytics.overview()`
- `apps/frontend/src/lib/hooks/useChartData.ts`
  - `/api/dashboard/chart-data` → `endpoints.analytics.overview()`
- `apps/frontend/src/lib/hooks/useNotifications.ts`
  - `/api/dashboard/notifications` → `endpoints.notifications.list()`

#### Analytics

- `apps/frontend/src/components/dashboard/AnalyticsDashboard.tsx`
  - `/api/analytics/dashboard` → `endpoints.analytics.overview()`
- `apps/frontend/src/lib/analytics/AnalyticsService.ts`
  - `/api/analytics/events` → `api.post('/api/v1/analytics/events', data)`
- `apps/frontend/src/lib/hooks/useAnalyticsData.ts`
  - `/api/analytics/realtime-users` → `api.get('/api/v1/analytics/realtime')`
- `apps/frontend/src/lib/web-vitals.ts`
  - `/api/analytics/web-vitals` → `api.post('/api/v1/analytics/web-vitals', data)`
- `apps/frontend/src/lib/monitoring/PerformanceMonitor.ts`
  - `/api/analytics/web-vitals` → `api.post('/api/v1/analytics/web-vitals', data)`
  - `/api/analytics/api-metrics` → `api.post('/api/v1/analytics/api-metrics', data)`

#### Monitoring

- `apps/frontend/src/app/(dashboard)/dashboard/monitoring/components/MonitoringDashboardClient.tsx`
  - `/api/monitoring/dashboard` → `api.get('/api/v1/observability/dashboard')`

#### Audit

- `apps/frontend/src/lib/audit.ts`
  - `/api/audit/logs` → `api.get('/api/v1/admin/audit-logs')`

#### Phase 14 - Supabase Removal

- `apps/frontend/src/app/(dashboard)/dashboard/analytics/page.tsx` : supprimer Supabase
- `apps/frontend/src/app/(dashboard)/dashboard/analytics-advanced/page.tsx` : supprimer Supabase

### API Endpoints Backend (existants)

```
endpoints.analytics.overview()           // GET /api/v1/analytics/overview
endpoints.analytics.designs(params)      // GET /api/v1/analytics/designs
endpoints.analytics.orders(params)       // GET /api/v1/analytics/orders
endpoints.analytics.revenue(params)      // GET /api/v1/analytics/revenue
endpoints.analytics.export.csv(params)   // GET /api/v1/analytics/export/csv

endpoints.notifications.list(params)     // GET /api/v1/notifications
endpoints.notifications.markAsRead(id)   // POST /api/v1/notifications/:id/read
endpoints.notifications.markAllAsRead()  // POST /api/v1/notifications/read-all

endpoints.admin.metrics()                // GET /api/v1/admin/metrics
```

---

## ✅ TÂCHES

### Phase 1: Dashboard Hooks (1 jour)

- [ ] Migrer `useDashboard.ts` → `endpoints.analytics.overview()` / `endpoints.admin.metrics()`
- [ ] Migrer `useChartData.ts` → `endpoints.analytics.*`
- [ ] Migrer `useNotifications.ts` → `endpoints.notifications.list()`

### Phase 2: Analytics Services (1 jour)

- [ ] Migrer `AnalyticsDashboard.tsx` → `endpoints.analytics.overview()`
- [ ] Migrer `AnalyticsService.ts` → backend direct
- [ ] Migrer `useAnalyticsData.ts` → backend direct
- [ ] Migrer `web-vitals.ts` → backend direct
- [ ] Migrer `PerformanceMonitor.ts` → backend direct

### Phase 3: Monitoring & Audit (1 jour)

- [ ] Migrer `MonitoringDashboardClient.tsx` → backend observability endpoint
- [ ] Migrer `audit.ts` → backend admin audit-logs endpoint

### Phase 4: Supabase Removal (0.5 jour)

- [ ] Supprimer imports `@/lib/supabase` des pages analytics
- [ ] Utiliser auth cookie-based

### Phase 5: Testing (1 jour)

- [ ] Tester dashboard principal (stats, charts)
- [ ] Tester notifications
- [ ] Tester analytics overview/designs/orders/revenue
- [ ] Build sans erreur

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 appel `fetch('/api/dashboard/...')`** ou `fetch('/api/analytics/...')`
- [ ] **0 import `@/lib/supabase`** dans les fichiers analytics
- [ ] Dashboard affiche stats correctement
- [ ] Notifications fonctionnent
- [ ] Build réussit

---

## 🔗 RESSOURCES

- API Client : `apps/frontend/src/lib/api/client.ts`
- Backend Analytics : `apps/backend/src/modules/analytics/`
- Backend Observability : `apps/backend/src/modules/observability/`
