# 📦 INSTALLATION PROMETHEUS
**Date:** 2025-12-18

---

## 🚀 INSTALLATION

### 1. Installer prom-client
```bash
cd apps/backend
npm install prom-client
```

### 2. Vérifier l'installation
```bash
npm list prom-client
```

---

## ✅ VÉRIFICATION

### 1. Démarrer l'application
```bash
npm run start:dev
```

### 2. Tester l'endpoint /metrics
```bash
curl http://localhost:3000/health/metrics
```

Vous devriez voir les métriques au format Prometheus :
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status="200",brandId="unknown"} 1

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/health",status="200",le="0.1"} 1
...
```

---

## 📊 CONFIGURATION PROMETHEUS

### prometheus.yml
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'luneo-backend'
    scrape_interval: 15s
    metrics_path: '/health/metrics'
    static_configs:
      - targets: ['localhost:3000']
        labels:
          environment: 'development'
```

---

## 🎯 MÉTRIQUES DISPONIBLES

### HTTP Metrics (Automatique)
- `http_requests_total` - Total requêtes HTTP
- `http_request_duration_seconds` - Durée requêtes
- `http_request_size_bytes` - Taille requêtes
- `http_response_size_bytes` - Taille réponses

### Business Metrics (Manuel)
- `designs_created_total` - Designs créés
- `ai_generations_total` - Générations AI
- `ai_costs_cents_total` - Coûts AI
- `orders_created_total` - Commandes créées
- `render_requests_total` - Requêtes render

### System Metrics (Manuel)
- `active_connections` - Connexions actives
- `queue_size` - Taille queues
- `cache_hit_rate` - Taux cache hit

---

**Status:** ✅ **PRÊT POUR UTILISATION**




















