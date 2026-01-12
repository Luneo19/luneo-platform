# 📊 Grafana Monitoring - Guide Complet

## 📋 Vue d'ensemble

Grafana permet de visualiser les métriques de performance et de santé de l'application Luneo.

## 🛠️ Configuration

### Installation Grafana

```bash
# Docker
docker run -d -p 3000:3000 grafana/grafana

# Ou utiliser Grafana Cloud (recommandé)
```

### Configuration Datasource

1. Se connecter à Grafana (http://localhost:3000)
2. Configuration → Data Sources → Add data source
3. Sélectionner "Generic HTTP API"
4. URL : `https://api.luneo.app/api/monitoring/grafana`
5. Authentication : API Key (configurer dans backend)

## 📊 Métriques Disponibles

### Time Series Metrics

- **requests_per_second** : Requêtes par seconde
- **response_time** : Temps de réponse (ms)
- **error_rate** : Taux d'erreur (%)
- **active_users** : Utilisateurs actifs
- **database_queries** : Requêtes base de données
- **cache_hit_rate** : Taux de hit cache (%)

### Table Metrics

- Total Users
- Total Orders
- Total Designs
- Total Products

## 🎨 Dashboard

Un dashboard pré-configuré est disponible dans `apps/backend/grafana-dashboard.json`.

### Importer le Dashboard

1. Grafana → Dashboards → Import
2. Upload `grafana-dashboard.json`
3. Sélectionner le datasource configuré

## 🔧 Endpoints API

### Query Metrics

```bash
GET /api/monitoring/grafana/query?target=requests_per_second&from=1234567890&to=1234567890
```

### Search Metrics

```bash
GET /api/monitoring/grafana/search
```

### Table Metrics

```bash
GET /api/monitoring/grafana/table
```

## 🔐 Sécurité

⚠️ **Important** : Les endpoints Grafana sont actuellement publics pour le développement. En production :

1. Ajouter authentification API Key
2. Configurer CORS
3. Rate limiting spécifique

## 📈 Alertes

### Configuration d'Alertes

1. Grafana → Alerting → Alert Rules
2. Créer des règles pour :
   - Error rate > 5%
   - Response time > 1000ms
   - Cache hit rate < 80%
   - Database queries > 1000/s

### Notifications

- Email
- Slack
- PagerDuty
- Webhook

## 🚀 Améliorations Futures

- [ ] Métriques Prometheus
- [ ] Métriques personnalisées
- [ ] Alertes avancées
- [ ] Dashboards par module
