# 📊 GUIDE MONITORING PROMETHEUS - AGENTS IA

## ✅ CONFIGURATION

### 1. Endpoint Métriques

L'endpoint `/health/metrics` est déjà configuré dans `HealthController`.

**URL**: `https://your-backend.railway.app/health/metrics`

### 2. Métriques Agents IA Disponibles

#### Métriques Principales
- `agent_request_duration_seconds` - Durée des requêtes (Histogram)
- `agent_requests_total` - Total requêtes (Counter)
- `agent_tokens_total` - Total tokens utilisés (Counter)
- `agent_cost_total` - Total coûts en cents (Counter)
- `agent_errors_total` - Total erreurs (Counter)
- `agent_retries_total` - Total retries (Counter)
- `agent_circuit_breaker_state` - État circuit breaker (Gauge)
- `agent_cache_hits_total` - Cache hits (Counter)
- `agent_cache_misses_total` - Cache misses (Counter)

#### Labels Disponibles
- `agent`: luna, aria, nova
- `provider`: openai, anthropic, mistral
- `model`: gpt-3.5-turbo, claude-3-sonnet, etc.
- `intent`: analyze_sales, general_question, etc.
- `brandId`: ID du brand
- `status`: success, error

---

## 🔧 CONFIGURATION PROMETHEUS

### Scraping Configuration

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'luneo-backend-agents'
    scrape_interval: 15s
    scrape_timeout: 10s
    metrics_path: '/health/metrics'
    static_configs:
      - targets:
          - 'your-backend.railway.app'
        labels:
          service: 'luneo-backend'
          environment: 'production'
          component: 'agents-ia'
```

---

## 📈 REQUÊTES PROMQL UTILES

### Requêtes par Agent
```promql
# Requêtes totales par agent
sum(rate(agent_requests_total[5m])) by (agent)

# Latence moyenne par agent
histogram_quantile(0.95, rate(agent_request_duration_seconds_bucket[5m])) by (agent)

# Coûts par agent
sum(rate(agent_cost_total[1h])) by (agent)

# Taux d'erreur par agent
sum(rate(agent_errors_total[5m])) by (agent) / sum(rate(agent_requests_total[5m])) by (agent)
```

### Requêtes par Provider
```promql
# Requêtes par provider LLM
sum(rate(agent_requests_total[5m])) by (provider)

# Tokens utilisés par provider
sum(rate(agent_tokens_total[1h])) by (provider)

# Coûts par provider
sum(rate(agent_cost_total[1h])) by (provider)
```

### Cache Performance
```promql
# Cache hit rate
sum(rate(agent_cache_hits_total[5m])) / (sum(rate(agent_cache_hits_total[5m])) + sum(rate(agent_cache_misses_total[5m])))
```

### Circuit Breaker
```promql
# État circuit breaker par provider
agent_circuit_breaker_state
# 0 = CLOSED, 1 = OPEN, 2 = HALF_OPEN
```

---

## 🚨 ALERTES RECOMMANDÉES

### Alerte: Taux d'erreur élevé
```yaml
- alert: HighAgentErrorRate
  expr: |
    sum(rate(agent_errors_total[5m])) by (agent) / 
    sum(rate(agent_requests_total[5m])) by (agent) > 0.1
  for: 5m
  labels:
    severity: warning
  annotations:
    summary: "Taux d'erreur élevé pour {{ $labels.agent }}"
```

### Alerte: Coûts élevés
```yaml
- alert: HighAgentCosts
  expr: |
    sum(rate(agent_cost_total[1h])) > 1000
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "Coûts agents IA élevés: {{ $value }} cents/heure"
```

### Alerte: Circuit Breaker ouvert
```yaml
- alert: CircuitBreakerOpen
  expr: |
    agent_circuit_breaker_state == 1
  for: 1m
  labels:
    severity: critical
  annotations:
    summary: "Circuit breaker ouvert pour {{ $labels.provider }}"
```

---

## 📊 DASHBOARD GRAFANA (Optionnel)

### Panels Recommandés

1. **Vue d'ensemble**
   - Requêtes totales (tous agents)
   - Latence moyenne
   - Taux d'erreur
   - Coûts totaux

2. **Par Agent**
   - Requêtes par agent
   - Latence par agent
   - Erreurs par agent
   - Coûts par agent

3. **Par Provider LLM**
   - Requêtes par provider
   - Tokens par provider
   - Coûts par provider
   - État circuit breaker

4. **Performance Cache**
   - Cache hit rate
   - Cache hits/misses
   - Temps réponse avec/sans cache

---

## ✅ VÉRIFICATION

### Test Endpoint
```bash
curl https://your-backend.railway.app/health/metrics | grep agent
```

### Vérifier Métriques
```bash
# Voir toutes les métriques agents
curl https://your-backend.railway.app/health/metrics | grep "^agent_"
```

---

**Status**: ✅ **MONITORING CONFIGURÉ**
