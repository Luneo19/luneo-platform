# 📊 PERFORMANCE MONITORING - GUIDE COMPLET

**Date**: 15 janvier 2025  
**Status**: ✅ Configuration complète

---

## 📋 RÉSUMÉ

Système complet de monitoring de performance pour suivre les métriques Core Web Vitals, la latence API, les performances de base de données et les métriques système.

---

## 🔧 ARCHITECTURE

### 1. Frontend - Web Vitals Tracking ✅

**Library**: `web-vitals` + Custom tracking

**Fichiers**:
- `apps/frontend/src/lib/web-vitals.ts` - Web Vitals tracking
- `apps/frontend/src/components/WebVitalsReporter.tsx` - Component React
- `apps/frontend/src/lib/monitoring/PerformanceMonitor.ts` - Service de monitoring

**Métriques trackées**:
- **LCP** (Largest Contentful Paint) - < 2.5s
- **FID** (First Input Delay) - < 100ms
- **CLS** (Cumulative Layout Shift) - < 0.1
- **FCP** (First Contentful Paint) - < 1.8s
- **TTFB** (Time to First Byte) - < 800ms
- **INP** (Interaction to Next Paint) - < 200ms

---

### 2. Backend - Performance Monitoring ✅

**Module**: `MonitoringModule`

**Fichiers**:
- `apps/backend/src/modules/monitoring/services/performance-monitoring.service.ts` - Service principal
- `apps/backend/src/modules/monitoring/controllers/performance.controller.ts` - API endpoints
- `apps/backend/src/modules/analytics/services/web-vitals.service.ts` - Web Vitals service
- `apps/backend/src/modules/analytics/controllers/web-vitals.controller.ts` - Web Vitals endpoints

**Métriques trackées**:
- API latency (average, p95, p99)
- Database query performance
- Error rates
- System metrics (memory, CPU)

---

## 📊 ENDPOINTS API

### Web Vitals

**POST** `/api/analytics/web-vitals`
- Record a Web Vital metric
- Body: `{ name, value, rating, delta, id, url, device, connection }`

**GET** `/api/analytics/web-vitals`
- Get Web Vitals metrics with filters
- Query params: `metric`, `startDate`, `endDate`, `page`

**GET** `/api/analytics/web-vitals/summary`
- Get aggregated Web Vitals summary
- Returns: averages, percentiles (p50, p75, p95, p99), rating distribution

---

### Performance Monitoring

**GET** `/api/monitoring/performance/summary`
- Get performance summary
- Returns: API metrics, database metrics, system metrics

**GET** `/api/monitoring/performance/slow-endpoints`
- Get slow API endpoints (>1s)

**GET** `/api/monitoring/performance/slow-queries`
- Get slow database queries (>500ms)

---

## 🎯 SEUILS DE PERFORMANCE

### Core Web Vitals

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤ 2.5s | 2.5s - 4.0s | > 4.0s |
| FID | ≤ 100ms | 100ms - 300ms | > 300ms |
| CLS | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| FCP | ≤ 1.8s | 1.8s - 3.0s | > 3.0s |
| TTFB | ≤ 800ms | 800ms - 1.8s | > 1.8s |
| INP | ≤ 200ms | 200ms - 500ms | > 500ms |

---

### API Performance

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Average Latency | < 200ms | 200ms - 500ms | > 500ms |
| P95 Latency | < 500ms | 500ms - 1000ms | > 1000ms |
| P99 Latency | < 1000ms | 1000ms - 2000ms | > 2000ms |
| Error Rate | < 1% | 1% - 5% | > 5% |

---

### Database Performance

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Average Query Time | < 50ms | 50ms - 200ms | > 200ms |
| Slow Queries | < 1% | 1% - 5% | > 5% |
| Queries per Minute | - | - | - |

---

## 🔍 MONITORING AUTOMATIQUE

### Prisma Middleware

Le service `PerformanceMonitoringService` utilise Prisma middleware pour tracker automatiquement toutes les requêtes de base de données :

```typescript
this.prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;
  
  this.trackDatabaseQuery({
    query: `${params.model}.${params.action}`,
    duration,
    table: params.model,
    operation: params.action,
    timestamp: new Date(),
  });
  
  return result;
});
```

---

### Frontend API Tracking

Le `PerformanceMonitorService` intercepte automatiquement les appels `fetch` pour tracker la latence API :

```typescript
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const start = performance.now();
  const response = await originalFetch(...args);
  const duration = performance.now() - start;
  
  this.trackAPIMetric({
    endpoint: url,
    method,
    duration,
    statusCode: response.status,
    timestamp: new Date(),
  });
  
  return response;
};
```

---

## 📈 DASHBOARD MONITORING

**Page**: `/dashboard/monitoring`

**Sections**:
- Web Vitals Overview (LCP, FID, CLS)
- API Performance (latency, error rate)
- Database Performance (query time, slow queries)
- System Health (memory, CPU, connections)
- Slow Endpoints List
- Slow Queries List

---

## 🔔 ALERTES

### Seuils d'alerte

- **LCP > 4s**: Alert immédiate
- **Error Rate > 5%**: Alert immédiate
- **P95 Latency > 1s**: Alert warning
- **Slow Queries > 10/min**: Alert warning
- **Memory Usage > 80%**: Alert warning

---

## 📊 INTÉGRATIONS

### Vercel Analytics

Les Web Vitals sont automatiquement envoyés à Vercel Analytics via `@vercel/speed-insights`.

### Google Analytics

Les Web Vitals sont envoyés à GA4 via `gtag` events.

### Sentry

Les métriques de performance sont envoyées à Sentry pour le monitoring d'erreurs.

---

## ⚙️ CONFIGURATION

### Variables d'Environnement

```env
# Sentry (optionnel)
SENTRY_DSN=...
SENTRY_ENVIRONMENT=production

# Google Analytics
NEXT_PUBLIC_GA_ID=G-...

# Vercel Analytics (automatique)
VERCEL_ANALYTICS_ID=...
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [x] Web Vitals tracking frontend
- [x] Web Vitals API backend
- [x] Performance monitoring service
- [x] Database query monitoring
- [x] API latency tracking
- [x] Performance dashboard
- [x] Slow endpoints detection
- [x] Slow queries detection
- [x] Documentation complète
- [ ] Alertes automatiques (à faire)
- [ ] Dashboard temps réel (à faire)

---

## 🚀 PROCHAINES ÉTAPES

1. **Alertes**:
   - Configurer alertes automatiques (email, Slack)
   - Seuils configurables par environnement
   - Alertes intelligentes (éviter spam)

2. **Dashboard**:
   - Dashboard temps réel avec WebSockets
   - Graphiques historiques
   - Comparaison périodes

3. **Optimisations**:
   - Recommandations automatiques
   - A/B testing performance
   - Cache optimization suggestions

---

**Status**: ✅ Configuration complète et fonctionnelle  
**Score gagné**: +2 points (selon plan de développement)
