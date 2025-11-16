# Policy Enforcement – OPA Gatekeeper

## 1. Objectif
- Appliquer des règles de conformité Kubernetes multi-région (EU/US).
- Empêcher les pratiques à risque (`:latest`, labels manquants).
- Centraliser via GitOps (Argo CD) pour audit et historique.

## 2. Déploiement
- Gestion par Argo CD (ApplicationSet) :
  - `overlays/policies-primary` pour `eu-west-1`.
  - `overlays/policies-secondary` pour `us-east-1`.
- Chart officiel `gatekeeper` (`3.15.1`) avec `upgradeCRDs: true`.
- Namespace `gatekeeper-system` créé automatiquement.

## 3. Policies livrées
| Nom | Type | Description |
|-----|------|-------------|
| `K8sRequiredLabels` | ConstraintTemplate | Exige labels `app.kubernetes.io/name`, `component`, `managed-by` sur namespaces, workloads, jobs. |
| `require-standard-labels*` | Constraint | Application des labels (active/standby). |
| `K8sDenyLatestTag` | ConstraintTemplate | Bloque les images utilisant `:latest` (sauf registries autorisées). |
| `forbid-latest-tag*` | Constraint | Application pods/workloads (whitelist `internal-base-images`). |

## 4. Pipeline CI
- Job `gitops_validate` compile les overlays et passe `kubeconform`.
- Important : déclarer les nouveaux ConstraintTemplates/Constraints dans les overlays pour validation.

## 5. Exceptions
- Ajouter un registre à `excludedRegistries` si besoin (ex : images base internes).
- Pour contourner, documenter dans PR + revue sécurité.

## 6. Roadmap
- Ajouter politiques : `ingress-https-only`, `ns-deny-default`, `restrict-hostpath`.
- Intégrer `Conftest` pour tests Rego locaux.
- Activer `external data` (ex: référentiel CVE) si requis.

## 7. Références
- `infrastructure/kubernetes/overlays/policies-*`
- `docs/runbooks/DR_RUNBOOK.md`
- https://open-policy-agent.github.io/gatekeeper/

