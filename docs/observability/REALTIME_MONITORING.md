# Observabilité Temps Réel

## 1. Architecture

- **Gateway WebSocket** (`ObservabilityGateway`) publie un snapshot toutes les 5s :
  - Agrégats BullMQ (waiting, delayed, active, failed, completed).
  - Santé par queue (thresholds configurables via `MONITORING_QUEUE_*`).
  - Ressources système (load average, mémoire RSS, uptime).
  - **Flux quotas** : chaque `usage.quota.summary` est mis en cache puis diffusé (`quota:bootstrap` + `quota:update`) → section “Quotas en tension (Live)” du dashboard.
- **Front** (`ObservabilityDashboard`) se connecte via `socket.io-client` (`/observability` namespace) et met à jour la page `/monitoring`.
- **Feature flag** : `realtime_monitoring` (permet d'activer/désactiver la page et la navigation).

## 2. Déploiement

- Env vars :
  - `MONITORING_QUEUE_WAIT_THRESHOLD` → seuil backlog (par défaut 100).
  - `MONITORING_QUEUE_OLDEST_SECONDS` → seuil âge job (120s).  
  - `FEATURE_FLAGS={"realtime_monitoring":true}` pour activer la page.
- UI accessible via `https://app.luneo.app/monitoring` (section « Gestion » → Monitoring).

## 3. Alerting

- `QueueHealthAlertService` conserve un historique minimal et alerte via logs + Sentry si :
  - backlog `waiting + delayed` dépasse `MONITORING_QUEUE_ALERT_WAIT_THRESHOLD` (250).
  - job en file > `MONITORING_QUEUE_ALERT_OLDEST_SECONDS` (300s).
- Intégrer avec PagerDuty/Slack en exploitant Sentry ou en branchant un `Webhook` sur le service d’alertes.

## 4. Extensibilité

- Ajouter d'autres métriques (temps de traitement moyen, throughput) via `QueueMetricsService.getRealtimeSnapshot()`.
- Brancher Grafana en parallèle via endpoint `/metrics` (Prometheus).
- Pour la prod, définir `NEXT_PUBLIC_OBSERVABILITY_WS` si la gateway est exposée sur un domaine séparé (ex. `wss://monitoring.luneo.app/observability`).

## 5. Roadmap

- Historisation : stocker les snapshots dans ClickHouse pour analyses longues.  
- Alertes synthétiques (débit IA vs quota).  
- Multi-tenant : filtrer par brand/queue custom.

