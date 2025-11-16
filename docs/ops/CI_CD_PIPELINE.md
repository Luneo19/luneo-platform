# CI/CD Pipeline – Luneo Platform

## 1. Objectifs
- Garantir une qualité constante (lint, type-check, tests, builds).
- Valider l'infrastructure déclarative (Terraform & GitOps) sur chaque PR.
- Assurer une surveillance continue des vulnérabilités.
- Produire des artefacts prêts au déploiement (Next.js, NestJS, packages).

## 2. Workflow `CI`
- Localisation : `.github/workflows/ci.yml`.
- Déclenché sur `push` / `pull_request` (`main`, `develop`) + `workflow_dispatch`.
- Concurrency : un run actif par ref (`ci-${ref}`).

### 2.1 Jobs
| Job | Description | Points clés |
|-----|-------------|-------------|
| `lint_typecheck` | `pnpm lint` & `pnpm type-check` | Node 20 + pnpm 10.20.0 |
| `unit_tests` | `pnpm test -- --watch=false` | turborepo orchestré |
| `build` | `pnpm build` + upload artefacts | dépend de lint/tests |
| `security_scan` | `pnpm security:audit` + Trivy SARIF | SARIF publié à GitHub |
| `terraform_validate` | `terraform fmt -check`, `init -backend=false`, `validate` | path `infrastructure/terraform/aws-multi-region` |
| `gitops_validate` | `kustomize build` + `kubeconform` sur base/overlays | installe `kubectl`, `kustomize`, `kubeconform` |

### 2.2 Artefacts
- `build-outputs` : dist /.next packages (utile pour analyse bundle ou déploiement manuel).
- `trivy-results.sarif` : consultable dans l'onglet Security.

## 3. Workflows complémentaires
- **`infra-plan.yml`** : Terraform plan sur PR + déclenchement manuel.  
  *Secrets requis* : `AWS_TERRAFORM_ROLE_ARN`.
- **`infra-apply.yml`** : déploiement Terraform sur environnement protégé `production` via `workflow_dispatch` (confirmation `APPLY`).  
  *Secrets requis* : identiques à infra-plan.
- **`gitops-sync.yml`** : synchronisation Argo CD (`all` ou application ciblée).  
  *Secrets requis* : `ARGOCD_SERVER`, `ARGOCD_USERNAME`, `ARGOCD_PASSWORD`.

## 4. Secrets & variables
- Pas de secret obligatoire pour la CI.
- `security_scan` peut exploiter `GITHUB_TOKEN` (SARIF upload).
- Pour `OWASP` (workflow séparé) utiliser `OWASP_BASE_URL`.

## 5. Ajouts recommandés
- Déploiement automatique (jobs `deploy-*`) après succès + approbation manuelle.
- Intégration Slack via `workflow_run`.
- Ajout check `bundle-size` (plugin Lighthouse) si besoin.

## 6. Bonnes pratiques
- Tenir `pnpm` synchronisé (`packageManager` root).
- Lors de nouvelles stacks Terraform ou overlays GitOps, étendre les jobs `terraform_validate` / `gitops_validate`.
- Examiner les rapports SARIF et corriger les vulnérabilités avant merge.
- Nettoyer les artefacts via rétention GitHub pour limiter les coûts.

## 7. Références
- `docs/infrastructure/GITOPS_MULTI_CLUSTER.md`
- `docs/security/SECRET_ROTATION.md`
- `docs/runbooks/DR_RUNBOOK.md`

