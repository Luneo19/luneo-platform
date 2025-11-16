# Infrastructure Multi‑région Luneo (Plan Directeur)

## 1. Objectifs

- **Disponibilité mondiale** (latence <150 ms EMEA + Amériques).  
- **Tolérance aux pannes régionales** (RPO ≤ 5 min, RTO ≤ 30 min).  
- **Mise à l’échelle horizontale** pour backend API, worker IA, rendu 3D.  
- **Gouvernance DevSecOps** : CI/CD GitHub Actions → Argo CD, secrets gérés (AWS Secrets Manager / Vault), observabilité unifiée.

## 2. Régions & Répartition

| Rôle | Région | Services clés |
|------|--------|---------------|
| **Primary** | `eu-west-1` (Irlande) | EKS, RDS Global Cluster writer, ElastiCache, S3, OpenSearch, Prometheus/Grafana |
| **Secondary** | `us-east-1` (Virginie) | EKS standby, RDS global reader (promotion auto), ElastiCache replica, S3 CRR |
| **Edge** | CloudFront + Route53 | DNS health checks, Anycast, WAF |

## 3. Réseau

- **VPC par région** (CIDR distinct, ex. 10.0.0.0/16 EU, 10.1.0.0/16 US).  
- Subnets publics (ingress/ALB, NAT) et privés (EKS nodes, DB).  
- Transit via **AWS Transit Gateway** pour réplication privée (ou VPN/VPC peering).  
- Security groups “zero trust” : ingress restreint par pool IP bastion.

## 4. Plateforme applicative

### Kubernetes
- EKS multi‐AZ (3 nodes groups : `api`, `workers-ia`, `render`).  
- Autoscaling (Cluster Autoscaler + Karpenter) basé métriques HPA (CPU, queue depth).  
- Add-ons : Nginx Ingress Controller (ou AWS ALB), cert-manager, ExternalDNS, Secrets Store CSI.

### CI/CD
- **GitHub Actions** : build, tests, image push (ECR), scan (Trivy, Snyk).  
- **Argo CD** (ou Flux) : déploiements GitOps, promotion canary/blue-green.  
- **Terragrunt/Terraform Cloud** : provision infra (modules par région).

## 5. Données & Stockage

- **RDS PostgreSQL** : Aurora Global Database, writer en EU, reader en US.  
- **Prisma** côté app : failover driver (endpoint `reader`/`writer`).  
- **Redis** : ElastiCache Multi-AZ (primary EU, réplica cross-region via Global Datastore).  
- **S3** : buckets versionnés + Cross Region Replication.  
- **Backups** : AWS Backup (DB + EBS). Ville de reprise testée trimestriellement (scripts `aws rds failover-db-cluster`).  
- **Data Lake** : Glue + Athena (dumps S3 journaliers).

## 6. Observabilité

- **Prometheus** (AMP) + Grafana (AGM) : dashboards latence, queues BullMQ, EKS.  
- **OpenTelemetry Collector** → AWS OTEL → CloudWatch + S3 cold storage.  
- **Sentry** multi projet (frontend/backend/workers).  
- Alerting (PagerDuty) : latence API, backlog queue, taux erreurs, réplication RDS.

## 7. Sécurité

- **Secrets** : AWS Secrets Manager + rotation (DB, API). Vault possible (variables terraform déjà présentes).  
- **IAM** : rôles par workload (least privilege), boundary policies.  
- **WAF + Shield Advanced** (CloudFront). Rate limiting Upstash fallback.  
- **Bastion** : Session Manager, IP safelist.  
- **Encryptions** : KMS multi-region (S3, EBS, RDS).  
- **Audit** : CloudTrail + GuardDuty + SecurityHub.

## 8. Routage & CDN

- Route53 Health Checks → failover DNS (Weighted 80/20 + failover).  
- CloudFront : cache assets, APIs via origin group (API Gateway/ALB). Multi edge TTL.  
- Load balancer : AWS ALB + WAF rules (OWASP top10).  
- Blue/Green : ALB target groups + header routing (feature flags).

## 9. Ops & Résilience

- **Runbooks** (docs/security/INCIDENT_RESPONSE.md + DR spécifique).  
- **Test DR** : failover programmé (RDS promote, update DNS).  
- **Chaos Engineering** : Litmus/ChaosMesh sur cluster staging (saturation CPU, coupure AZ).  
- **Tableau de bord SLO** : disponibilité API, temps réponse IA, pipeline AI queue.

## 10. Implémentation Terraform (Roadmap)

1. **Industrialisation Terraform** via `infrastructure/terraform/aws-multi-region` (modules VPC, EKS, Aurora, S3, Route53).  
2. Créer overlays `envs/prod` et `envs/staging` si besoin (dérivés du module principal).  
3. Providers aliasés (`aws.primary`, `aws.secondary`) et Helm provider pour installer les add-ons.  
4. `terraform.tfvars` versionné par environnement + pipeline GH Actions (`infra-plan`, `infra-apply`).  
5. Argo CD synchronisé sur les deux clusters (`apps/platform/overlays/{primary,secondary}`).  
6. Observabilité centralisée (Amazon Managed Prometheus/Grafana) + alertes sur lag de réplication.
7. GitOps Argo CD (`infrastructure/kubernetes`) pour workloads actifs/standby + observabilité.

## 11. Étapes suivantes

| Étape | Description | Owner | Échéance |
|-------|-------------|-------|----------|
| TF refactor | Modules multi‐région + Terragrunt | Platform | S1 |
| EKS + GitOps | Bootstrap clusters + Argo CD | Platform/DevOps | S1 |
| DR drill | Revue runbook, test failover RDS | SRE | S2 |
| Observabilité | Déploiement Prometheus/Grafana + alertes | SRE | S2 |
| FinOps | Budgets + Cost Explorer dashboards | Finance/Eng | S2 |

## 12. Références

- AWS Well Architected – Multi Region (SAO05).  
- AWS Aurora Global – rapid recovery.  
- CNCF landscape (Prometheus, Argo CD, OpenTelemetry).  
- Sécurité : CIS AWS Benchmark v1.4.  
- Terraform modules internes (à définir) + AWS solutions.

---

> Ce document sert de base pour itérer : versionner toute modification et lier les PR Terraform/Kubernetes correspondantes.

