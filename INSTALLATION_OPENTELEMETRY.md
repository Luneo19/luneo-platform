# 📦 INSTALLATION OPENTELEMETRY
**Date:** 2025-12-18

---

## 🚀 INSTALLATION

### 1. Installer dépendances
```bash
cd apps/backend
npm install @opentelemetry/sdk-node @opentelemetry/exporter-jaeger @opentelemetry/exporter-zipkin @opentelemetry/exporter-otlp-http @opentelemetry/instrumentation-http @opentelemetry/instrumentation-express @opentelemetry/resources @opentelemetry/semantic-conventions
```

### 2. Configurer variables d'environnement
```env
# .env
MONITORING_OPENTELEMETRY_ENABLED=true
MONITORING_OPENTELEMETRY_EXPORTER=jaeger
MONITORING_OPENTELEMETRY_ENDPOINT=http://localhost:14268/api/traces
```

### 3. Options d'exporters

#### Jaeger (Recommandé)
```env
MONITORING_OPENTELEMETRY_EXPORTER=jaeger
MONITORING_OPENTELEMETRY_ENDPOINT=http://localhost:14268/api/traces
```

#### Zipkin
```env
MONITORING_OPENTELEMETRY_EXPORTER=zipkin
MONITORING_OPENTELEMETRY_ENDPOINT=http://localhost:9411/api/v2/spans
```

#### OTLP (OpenTelemetry Protocol)
```env
MONITORING_OPENTELEMETRY_EXPORTER=otlp
MONITORING_OPENTELEMETRY_ENDPOINT=http://localhost:4318/v1/traces
```

---

## ✅ VÉRIFICATION

### 1. Démarrer Jaeger (si exporter Jaeger)
```bash
docker run -d --name jaeger \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14268:14268 \
  -p 14250:14250 \
  -p 9411:9411 \
  jaegertracing/all-in-one:latest
```

### 2. Démarrer l'application
```bash
npm run start:dev
```

### 3. Vérifier traces dans Jaeger
- Accéder à `http://localhost:16686`
- Sélectionner service: `luneo-backend`
- Voir traces en temps réel

---

## 🎯 USAGE

### Tracing Automatique
Toutes les requêtes HTTP sont automatiquement tracées.

### Tracing Manuel
```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('luneo-backend');

async processOrder(orderId: string) {
  const span = tracer.startSpan('processOrder');
  span.setAttribute('orderId', orderId);
  
  try {
    // ... processing
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.recordException(error);
    throw error;
  } finally {
    span.end();
  }
}
```

---

## 📊 TRACES DISPONIBLES

### HTTP Traces (Automatique)
- Toutes les requêtes HTTP
- Durée, status, headers
- Route, méthode

### Custom Spans (Manuel)
- Opérations business
- Appels externes
- Traitements asynchrones

---

**Status:** ✅ **PRÊT POUR UTILISATION**




















