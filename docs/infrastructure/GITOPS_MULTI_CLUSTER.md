# GitOps Multi-Cluster Luneo (Argo CD)

## 1. Vision
- Gestion déclarative de tous les workloads Kubernetes via Argo CD ApplicationSet.
- Synchronisation automatique des clusters `eu-west-1` (actif) et `us-east-1` (standby).
- Observabilité managée via helm charts officiels (Prometheus/Loki/Tempo/Grafana Agent).
- Séparation claire entre **infra Terraform** (EKS, réseaux, RDS) et **GitOps** (workloads).

## 2. Repositories
- `luneo-platform` (monorepo) → contient `infrastructure/kubernetes`.
- `platform-helm` → chart Helm par service.
- `platform-releases` (optionnel) → tags images & manifest locks (SRE).

## 3. Flux CI/CD
1. Build images (GitHub Actions) → push ECR (`latest` + tag versionné).
2. Mettre à jour `values.yaml` ou `imageVersion` via PR GitOps.
3. Pipeline `infra-gitops-validate` :
   - `kustomize build overlays/*`
   - `kubeconform` avec schémas Kubernetes 1.29.
4. Merge PR ⇒ Argo CD détecte commit (`auto sync`).
5. Notification Slack/Teams via Argo CD Notifications.

## 4. ApplicationSet
- Source : `base/argocd-applicationset.yaml`.
- Générateur `list` définissant 4 entrées (primary, secondary, observability-primary, observability-secondary).
- `syncPolicy.automated` activée (prune + selfHeal).
- `ServerSideApply` pour compatibilité CRDs (External Secrets, Argo).

## 5. Overlays Workloads
### Primary
- Réplicas plus élevés.
- ALB ingress publics `api.luneo.app`, `app.luneo.app`.
- ServiceMonitor activés pour Prometheus principal.
- External Secrets vers Secrets Manager `/luneo/prod/backend`.

### Secondary
- Réplicas réduits (mode chaud standby).
- Ingress isolés (`app-secondary`, `api-secondary`) pour tests DR.
- Metrics + logs envoyés vers observabilité secondaire (retention courte).
- Secrets Manager `/luneo/prod/backend-secondary`.

### Observabilité
- `kube-prometheus-stack` : retention 15d (primary) / 7d (secondary), remote write vers AMP.
- `loki-distributed` + `tempo` : stockage S3 dédup, retention 7d/3d/2d.
- `grafana-agent` : collecte logs/metrics/traces (mode Flow), envoie vers Loki/Tempo/AMP.
- Dashboards Grafana (`dashboards/*.yaml`) et règles Prometheus (`alerts/prometheus-rules.yaml`) provisionnées via Kustomize.

### Policies (Gatekeeper)
- Helm chart `gatekeeper` déployé sur chaque cluster.
- ConstraintTemplates :
  - `K8sRequiredLabels` (labels standard).
  - `K8sDenyLatestTag` (ban `:latest`).
- Constraints spécifiques `require-standard-labels*`, `forbid-latest-tag*`.
- Namespace `gatekeeper-system` géré via GitOps.

## 6. Secrets & Vault
- External Secrets Operator requis (déployé via helm).
- Authentification : JWT IRSA (`external-secrets-controller`).
- Secrets regroupés par scope (`/luneo/prod/backend`, `/luneo/prod/backend-secondary`).
- Rotation automatisée : voir `docs/security/SECRET_ROTATION.md`.

## 7. Observabilité et Alerting
- Prometheus → Alertmanager → Slack (`#sre`) + PagerDuty (critique).
- Loki : dashboards préconfigurés (app, ingress, kubelet).
- Tempo : traçabilité API (OTLP). Intégration via Grafana Agent.
- Metrics custom : `bullmq_waiting_jobs`, `render_queue_latency`, `stripe_webhook_latency`.

## 8. DR Drill
- Voir `docs/runbooks/DR_RUNBOOK.md`.
- Step bascule : promouvoir Aurora + patch overlay secondaire (`replicas`).
- Argo CD garde l'état via `kustomization` (commits documentent la bascule).

## 9. Checklist déploiement initial
1. Installer Argo CD (namespace `argocd`).
2. Appliquer `base/` puis `overlays/*` via Argo.
3. Créer secret repo Argo (`argocd repo add`).
4. Déployer External Secrets Operator.
5. Vérifier sync statuses (Argo UI) & tests smoke.

## 10. Roadmap
- Ajouter `Argo Rollouts` (progressive delivery) + metrics Prometheus.
- Intégrer policy Gatekeeper/OPA (conformité).
- Incorporer `Flux` mirroring (fallback GitOps controller).
- Automatismes `terraform output -> overlay` (reduire duplication ARNs).

