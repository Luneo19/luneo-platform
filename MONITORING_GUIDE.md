# 📊 Guide Monitoring - Luneo Platform

**Documentation complète du système de monitoring**

---

## 🎯 Vue d'Ensemble

Le système de monitoring de Luneo Platform comprend:
- **Sentry** - Error tracking & Performance monitoring
- **Core Web Vitals** - Métriques de performance utilisateur
- **Vercel Analytics** - Web Analytics & Speed Insights
- **Business Analytics** - Événements métier

---

## 🔍 Sentry - Error Tracking & Performance

### Configuration

#### Client (`sentry.client.config.ts`)
```typescript
- DSN: process.env.NEXT_PUBLIC_SENTRY_DSN
- Performance: 10% sampling en production
- Session Replay: 10% sessions, 100% erreurs
- Browser Tracing: Activé
- Filtrage: Erreurs non critiques ignorées
```

#### Server (`sentry.server.config.ts`)
```typescript
- Performance: 10% sampling en production
- HTTP Integration: Activé
- Filtrage: Erreurs Next.js attendues ignorées
```

#### Edge (`sentry.edge.config.ts`)
```typescript
- Configuration pour edge runtime
```

### Utilisation

#### Capturer une erreur
```typescript
import { captureException } from '@/lib/sentry';

try {
  // Code qui peut échouer
} catch (error) {
  captureException(error, {
    tags: { component: 'MyComponent' },
    extra: { userId: user.id },
  });
}
```

#### Ajouter du contexte
```typescript
import { setUser, addBreadcrumb } from '@/lib/sentry';

// Définir l'utilisateur
setUser({
  id: user.id,
  email: user.email,
  name: user.name,
  plan: user.plan,
});

// Ajouter un breadcrumb
addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to dashboard',
  level: 'info',
});
```

#### Performance Monitoring
```typescript
import { withErrorTracking } from '@/lib/sentry';

const myFunction = withErrorTracking(async (data) => {
  // Code de la fonction
}, 'myFunction');
```

### Dashboard Sentry
- **URL:** https://sentry.io
- **Project ID:** Vérifier dans les variables d'environnement
- **Sections:**
  - Issues (erreurs)
  - Performance (métriques)
  - Releases (versions)
  - Users (utilisateurs affectés)

---

## 📈 Core Web Vitals Tracking

### Métriques Trackées

1. **LCP** (Largest Contentful Paint)
   - **Good:** < 2.5s
   - **Needs Improvement:** 2.5s - 4.0s
   - **Poor:** > 4.0s

2. **FID** (First Input Delay)
   - **Good:** < 100ms
   - **Needs Improvement:** 100ms - 300ms
   - **Poor:** > 300ms

3. **CLS** (Cumulative Layout Shift)
   - **Good:** < 0.1
   - **Needs Improvement:** 0.1 - 0.25
   - **Poor:** > 0.25

4. **FCP** (First Contentful Paint)
   - **Good:** < 1.8s
   - **Needs Improvement:** 1.8s - 3.0s
   - **Poor:** > 3.0s

5. **TTFB** (Time to First Byte)
   - **Good:** < 800ms
   - **Needs Improvement:** 800ms - 1.8s
   - **Poor:** > 1.8s

### Implémentation

#### Tracking Automatique
Les Web Vitals sont automatiquement trackés via:
- `src/lib/web-vitals.ts` - Utilise la librairie `web-vitals`
- `src/components/WebVitalsReporter.tsx` - Component React
- Intégré dans `layout.tsx`

#### Envoi des Données
Les métriques sont envoyées à:
1. **Vercel Analytics** (automatique via `@vercel/speed-insights`)
2. **API interne** (`/api/analytics/web-vitals`)
3. **Sentry** (pour performance monitoring)
4. **Google Analytics** (si configuré)

#### API Endpoint
```typescript
POST /api/analytics/web-vitals
{
  name: 'LCP',
  value: 1850,
  rating: 'good',
  delta: 50,
  id: 'lcp-123',
  url: '/dashboard',
  timestamp: 1234567890
}
```

#### Récupération des Données
```typescript
GET /api/analytics/web-vitals?name=LCP&startDate=2024-01-01&endDate=2024-01-31
```

---

## 📊 Vercel Analytics

### Intégration
- **`@vercel/analytics`** - Web Analytics
- **`@vercel/speed-insights`** - Speed Insights (Core Web Vitals)

### Composants
```tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

<Analytics />
<SpeedInsights />
```

### Dashboard
- **URL:** https://vercel.com/dashboard
- **Sections:**
  - Analytics (page views, events)
  - Speed Insights (Core Web Vitals)
  - Real User Monitoring (RUM)

---

## 💼 Business Analytics

### Service Analytics
- **`src/lib/analytics/AnalyticsService.ts`** - Service principal
- **`src/lib/hooks/useAnalytics.ts`** - Hook React

### Événements Trackés
```typescript
// Exemple d'utilisation
import { useAnalytics } from '@/lib/hooks/useAnalytics';

const { track } = useAnalytics();

track('conversion', 'purchase', {
  label: 'premium-plan',
  value: 99,
  metadata: { planId: 'premium' },
});
```

### API Endpoint
```typescript
POST /api/analytics/events
{
  events: [
    {
      category: 'conversion',
      action: 'purchase',
      label: 'premium-plan',
      value: 99,
      // ...
    }
  ]
}
```

---

## 📈 Dashboard Monitoring

### Page Monitoring
- **Route:** `/dashboard/monitoring`
- **Component:** `src/app/(dashboard)/dashboard/monitoring/page.tsx`

### Métriques Affichées
- Active users
- Requests per minute
- Error rate
- Average response time
- Service health (database, cache, storage, etc.)
- Core Web Vitals (LCP, FID, CLS, TTFB, FCP)

### Améliorations Futures
- [ ] Connexion à l'API réelle (actuellement mock data)
- [ ] Graphiques de tendances
- [ ] Alertes configurables
- [ ] Export des données
- [ ] Comparaison avec benchmarks

---

## 🔔 Alertes et Notifications

### Sentry Alerts
- Configurer dans le dashboard Sentry
- Alertes pour:
  - Nouveaux erreurs
  - Taux d'erreur élevé
  - Performance dégradée

### Web Vitals Alerts
- À implémenter
- Alertes si métriques dépassent seuils:
  - LCP > 4.0s
  - CLS > 0.25
  - FID > 300ms

---

## 📝 Configuration

### Variables d'Environnement

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_APP_VERSION=1.0.0

# Analytics
NEXT_PUBLIC_GA_ID=your-ga-id (optionnel)

# Vercel Analytics
# Automatiquement activé sur Vercel
```

### Initialisation

Sentry est initialisé automatiquement dans:
- `src/lib/monitoring/sentry-init.ts` (client)
- `sentry.server.config.ts` (server)
- `sentry.edge.config.ts` (edge)

Web Vitals sont initialisés dans:
- `src/components/WebVitalsReporter.tsx`
- Intégré dans `layout.tsx`

---

## 🔗 Ressources

- [Sentry Documentation](https://docs.sentry.io/)
- [Core Web Vitals](https://web.dev/vitals/)
- [Web Vitals Library](https://github.com/GoogleChrome/web-vitals)
- [Vercel Analytics](https://vercel.com/docs/analytics)
- [Vercel Speed Insights](https://vercel.com/docs/speed-insights)

---

## 🎯 Prochaines Étapes

1. ✅ Tracking Core Web Vitals amélioré
2. ✅ API endpoint pour Web Vitals créé
3. ⏳ Dashboard performance avec vraies données
4. ⏳ Alertes configurables
5. ⏳ Historique et tendances
6. ⏳ Export des données

