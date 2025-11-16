# Observabilité temps réel – Grafana & Prometheus

## 1. Objectifs
- Offrir une visibilité quasi temps réel sur les queues IA/rendu et l'API backend.
- Définir des alertes opérationnelles alignées sur nos SLO (latence, taux d'erreur, saturation GPU).
- Standardiser les dashboards Grafana déployés via GitOps.

## 2. Déploiement
- Dashboards et règles Prometheus sont gérés par Kustomize :
  - `infrastructure/kubernetes/overlays/observability-primary/dashboards/*.yaml`
  - `infrastructure/kubernetes/overlays/observability-primary/alerts/prometheus-rules.yaml`
  - Équivalent pour le cluster secondaire (`observability-secondary`).
- Chaque dashboard est un `ConfigMap` avec la clé `grafana_dashboard: "1"` (Grafana side-car).
- Les règles d’alerting sont regroupées dans un `PrometheusRule`.

## 3. Dashboards livrés
1. **AI & Render Queues**  
   - Jobs en attente (global et par queue AI/render).  
   - Latence P95 de traitement.  
   - Compteur d’échecs sur 15 minutes.  
   - Utilisation GPU moyenne (promql `node_gpu_utilization`).  
   - Actualisation toutes les 30 secondes.

2. **API Backend – Latence & Erreurs**  
   - Stat P95 globale (ms).  
   - Timeseries erreur 5xx par route.  
   - Débit global req/s.  
  - Table top 10 routes par latence.  
   - Refresh 30 secondes.

3. **Dashboards Standby** (cluster secondaire)  
   - Vue simplifiée (latence + backlog) pour détecter un trafic inattendu.  
   - Période plus longue (12 h) pour surveiller les pics ponctuels.

## 4. Alertes Prometheus
### Production (primary)
- `ApiLatencyHigh` : P95 > 600 ms sur 5 minutes (severity *warning*).  
- `ApiErrorRate` : taux d’erreur 5xx > 5 % (severity *critical*).  
- `QueueWaitThreshold` : > 40 jobs/minute en attente sur IA/render.  
- `RenderGpuSaturation` : utilisation GPU moyenne > 90 % pendant 15 minutes.

### Standby (secondary)
- `StandbyApiUnavailable` : aucune requête observée depuis 30 minutes (veille disponibilité).  
- `StandbyQueueGrowth` : backlog > 5 jobs/minute (dysfonctionnement routage).

## 5. Notifications recommandées
- Configurer Alertmanager (cf. `kube-prometheus-stack` values) pour :
  - Slack `#sre` (warning) et `#incident` (critical).
  - PagerDuty pour `severity=critical`.
- Ajouter *silences automatiques* lors des tests DR (tag `dr_mode=true`).

## 6. Personnalisation
- Ajouter de nouvelles métriques en enrichissant les exporters (ex: `bullmq` côté backend).  
- Étendre les dashboards avec panels BigNumber ou heatmaps via PR.  
- Pour les GPU, prévoir un mixin `nvidia-dcgm-exporter` si besoin de metrics fines (températures, mémoire).

## 7. Diagnostics rapides
1. **Queue saturée**  
   - Vérifier `QueueWaitThreshold`, analyser latence.  
   - Scaler workers (`Application luneo-worker-ia`).  
   - Inspecter logs (Loki) via label `app=luneo-worker-ia`.
2. **API en erreur**  
   - `ApiErrorRate` déclenchée : consulter table top routes.  
   - Corréler avec logs et traces (Tempo).  
   - Vérifier dépendances (DB/Redis) via Prometheus `up{service="..."}`.
3. **GPU saturés**  
   - Monitorer panel GPU.  
   - Lancer scale-up (AWS AutoScaling/EKS).  
   - Prioriser jobs critiques via bull queue.

## 8. Maintenance
- Toute modification dashboard/alert → PR + validation `kustomize build`.  
- Déploiement via GitOps (`gitops-sync.yml` ou Argo CD).  
- Garder la taille des JSON raisonnable (compression possible).  
- Documenter nouvelles alertes dans cette page + `docs/runbooks`.

