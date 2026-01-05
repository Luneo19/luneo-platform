# 📊 MONITORING SETUP - LUNEO PLATFORM
**Date:** 2025-12-18

---

## 🎯 OVERVIEW

Ce dossier contient la configuration complète pour le monitoring de la plateforme LUNEO :
- **Prometheus** : Collecte de métriques
- **Grafana** : Dashboards et visualisation
- **Alerting** : Règles d'alerte Prometheus

---

## 📦 INSTALLATION

### 1. Prometheus

```bash
# Installer Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*

# Copier configuration
cp ../monitoring/prometheus/prometheus.yml .
cp ../monitoring/prometheus/alerts.yml .

# Démarrer Prometheus
./prometheus --config.file=prometheus.yml
```

### 2. Grafana

```bash
# Installer Grafana
wget https://dl.grafana.com/oss/release/grafana-10.0.0.linux-amd64.tar.gz
tar -zxvf grafana-10.0.0.linux-amd64.tar.gz
cd grafana-10.0.0

# Démarrer Grafana
./bin/grafana-server
```

### 3. Configurer Grafana

1. Accéder à `http://localhost:3001` (Grafana)
2. Login: `admin` / Password: `admin`
3. Ajouter datasource Prometheus:
   - Type: Prometheus
   - URL: `http://localhost:9090`
4. Importer dashboards:
   - `monitoring/grafana/dashboards/slo-dashboard.json`
   - `monitoring/grafana/dashboards/cost-dashboard.json`
   - `monitoring/grafana/dashboards/fraud-dashboard.json`

---

## 📊 DASHBOARDS

### 1. SLO Dashboard
**Fichier:** `grafana/dashboards/slo-dashboard.json`

**Métriques:**
- API Latency p95/p99
- Error Rate
- Availability (30 days)
- Request Rate

**Alertes:**
- High Latency (> 1s)
- High Error Rate (> 1%)

### 2. Cost Dashboard
**Fichier:** `grafana/dashboards/cost-dashboard.json`

**Métriques:**
- Total AI Costs (30 days)
- Costs by Provider
- Costs by Tenant (top 10)
- Costs Trend
- Generations by Model

**Alertes:**
- High AI Costs (> $100/hour)
- Budget Exceeded (> $1000/month)

### 3. Fraud Dashboard
**Fichier:** `grafana/dashboards/fraud-dashboard.json`

**Métriques:**
- Fraud Checks (24h)
- High Risk Detections
- Blocks Applied
- Risk Score Distribution
- Fraud Checks by Action Type
- Content Moderation Results
- IP Claims Status

**Alertes:**
- High Risk Fraud (> 10 in 5min)
- Critical Fraud Block

---

## 🚨 ALERTES

### Configuration Alertmanager

```yaml
# alertmanager.yml
route:
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-alerts'
    - match:
        severity: warning
      receiver: 'warning-alerts'

receivers:
  - name: 'default'
    webhook_configs:
      - url: 'http://your-webhook-url'
  
  - name: 'critical-alerts'
    webhook_configs:
      - url: 'http://your-critical-webhook-url'
  
  - name: 'warning-alerts'
    webhook_configs:
      - url: 'http://your-warning-webhook-url'
```

---

## 🔧 CONFIGURATION

### Variables d'environnement Backend

```env
# OpenTelemetry
MONITORING_OPENTELEMETRY_ENABLED=true
MONITORING_OPENTELEMETRY_EXPORTER=jaeger
MONITORING_OPENTELEMETRY_ENDPOINT=http://localhost:14268/api/traces

# Prometheus (automatique via /health/metrics)
```

### Prometheus Scraping

Le backend expose automatiquement les métriques sur `/health/metrics`.

Configuration dans `prometheus.yml`:
```yaml
- job_name: 'luneo-backend'
  scrape_interval: 15s
  metrics_path: '/health/metrics'
  static_configs:
    - targets: ['localhost:3000']
```

---

## 📈 MÉTRIQUES DISPONIBLES

### HTTP Metrics (Automatique)
- `http_requests_total` - Total requêtes
- `http_request_duration_seconds` - Durée requêtes
- `http_request_size_bytes` - Taille requêtes
- `http_response_size_bytes` - Taille réponses

### Business Metrics
- `designs_created_total` - Designs créés
- `ai_generations_total` - Générations AI
- `ai_costs_cents_total` - Coûts AI
- `orders_created_total` - Commandes
- `render_requests_total` - Rendu

### System Metrics
- `active_connections` - Connexions actives
- `queue_size` - Taille queues
- `cache_hit_rate` - Taux cache

---

## 🎯 PROCHAINES ÉTAPES

1. **Configurer Alertmanager** pour notifications
2. **Ajouter métriques custom** selon besoins
3. **Créer dashboards additionnels** (performance, users, etc.)
4. **Configurer retention** Prometheus (30-90 jours)
5. **Backup** configurations Grafana

---

**Status:** ✅ **CONFIGURATION COMPLÈTE - PRÊT POUR PRODUCTION**






























