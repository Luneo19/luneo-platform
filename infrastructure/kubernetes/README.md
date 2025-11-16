# Kubernetes GitOps – Clusters multi-région

## 1. Structure
- `base/` : ressources communes (namespaces, ConfigMap GitOps, ApplicationSet multi-cluster).
- `overlays/primary/` : workloads actifs (API, frontend, workers, render) pour `eu-west-1`.
- `overlays/secondary/` : workloads standby (réplication chaude) pour `us-east-1`.
- `overlays/observability-primary/` : monitoring/logging/tracing primaire.
- `overlays/observability-secondary/` : observabilité miroir (réduit) secondaire.
- `overlays/policies-primary/` & `overlays/policies-secondary/` : moteur OPA Gatekeeper + contraintes.

## 2. Bootstrap
```bash
# Depuis infra repo
cd infrastructure/kubernetes
kubectl apply -f base/namespaces.yaml --context arn:aws:eks:eu-west-1:...:cluster/luneo-prod-eks-primary
kubectl apply -k base --context arn:aws:eks:eu-west-1:...:cluster/luneo-prod-eks-primary
# Installer Argo CD (helm ou manifests officiels) puis laisser ApplicationSet créer les Applications
```

## 3. ApplicationSet
- `applicationset` liste quatre entrées : `primary`, `secondary`, `observability-primary`, `observability-secondary`.
- Chaque entrée pointe vers un overlay dédié et alimente Argo CD avec `syncPolicy.automated`.
- Mise à jour du scope ou de nouveaux clusters : éditer `base/argocd-applicationset.yaml`.

## 4. Helm repositories
- Workloads (`luneo-backend`, `luneo-frontend`, `luneo-worker-ia`, `luneo-render`) sont packagés dans `platform-helm`.
- Observabilité s'appuie sur charts officiels (`kube-prometheus-stack`, `loki-distributed`, `tempo`, `grafana-agent`).

## 5. Secrets
- External Secrets Operator consomme AWS Secrets Manager (`external-secrets-controller` requis).
- Les paths Secrets Manager sont versionnés (`/luneo/prod/backend`, `/luneo/prod/backend-secondary`).

## 6. DR & bascule
- Les overlays secondaires tournent en mode `standby` (replicas réduits, DR flag `dr_mode=true` via ConfigMap).
- Promotion manuelle : augmenter les replicas via patch Argo ou HPA, mettre à jour Route53 (voir `docs/runbooks/DR_RUNBOOK.md`).

## 7. Observabilité
- Primary : retention 15d (Prometheus), 7d (Loki), 3d (Tempo), ingress exposés (`grafana.luneo.app`, `logs.luneo.app`, `traces.luneo.app`).
- Secondary : retention réduite, sans ingress publics (utilisé pour redonder les flux).
- Grafana Agent collecte logs/metrics/traces et forward vers AMP/Tempo.
- Gatekeeper : labels obligatoires + interdiction `:latest` (voir `docs/security/POLICY_ENFORCEMENT.md`).
- Dashboards Grafana & alertes Prometheus définis dans `dashboards/` et `alerts/` (voir `docs/observability/REALTIME_DASHBOARDS.md`).

## 8. Pipelines
- Ajouter job GitHub Actions `infra-gitops-validate`: `kubectl kustomize overlays/primary` + `kubeconform`.
- Argo CD notifications (webhook Slack #sre) recommandées pour drifts.

