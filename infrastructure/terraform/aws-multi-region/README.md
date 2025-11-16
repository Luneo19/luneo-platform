# Terraform AWS Multi-Région — Plateforme Luneo

## 1. Objectifs
- Résilience **active/passive** entre `eu-west-1` (primaire) et `us-east-1` (secondaire).
- Provision EKS, Aurora Global Database, S3 cross-region, Route53 failover.
- Standardiser la configuration pour les déploiements GitOps (Argo CD) et les exercices DR trimestriels.

## 2. Architecture résumée
- **Réseau** : deux VPC /16, trois AZ chacun, NAT partagé, endpoints S3.
- **Clusters** : `module.eks_primary` et `module.eks_secondary` (Kubernetes `1.29`, IRSA, node groups on-demand + spot).
- **Base de données** : Aurora PostgreSQL global, écriture en primaire, lecture multi-région, chiffrement KMS dédié.
- **Stockage** : buckets S3 versionnés répliqués avec IAM dédié.
- **Routage** : Route53 failover, health checks HTTPS custom.
- **Observabilité** : alarmes CloudWatch sur lag de réplication Aurora et backlog S3.
- **Load Balancer Controller** : installé via Helm dans chaque cluster (IAM OIDC + service account managé par Terraform).

## 3. Prérequis
- Terraform `>= 1.5`, `awscli`, `kubectl`, `helm`.
- Backend S3 pour l’état (`luneo-terraform-state`) + table DynamoDB `luneo-terraform-locks`.
- Accès AWS avec droits `AdministratorAccess` ou policies granulaires (VPC, EKS, RDS, S3, Route53, IAM, CloudWatch).
- Domaine Route53 existant (zone publique) et certificats ACM provisionnés côté ingress (gérés hors de ce module).
- Secrets managés dans AWS Secrets Manager / Vault (ex : `db_master_password` injecté via `terraform.tfvars` ou `TF_VAR_db_master_password`).

## 4. Structure
- `main.tf` : providers, réseaux, EKS, Aurora, réplication S3, Route53, alarmes.
- `variables.tf` : paramètres (régions, tailles node groups, DB, health checks).
- `outputs.tf` : informations de connexion (clusters, endpoints Aurora, buckets, Route53).
- `terraform.tfvars.example` (à créer par environnement) : valeurs concrètes.

## 5. Démarrage rapide
```bash
cd infrastructure/terraform/aws-multi-region
cp terraform.tfvars.example terraform.tfvars  # éditer les valeurs critiques
terraform init
terraform plan -out plan.tfplan
terraform apply plan.tfplan
```

## 6. Paramètres essentiels
- `primary_region`, `secondary_region` : modifiables, vérifier compatibilité AZ & quotas.
- `primary_ingress_hostname`, `secondary_ingress_hostname` : DNS du LB créé par l’ingress NGINX / AWS ALB Controller (disponible après déploiement des manifests Kubernetes).
- `db_master_password` : secret sensible, ne jamais committer.
- `artifact_bucket_suffix` : suffixe commun garantissant l’unicité globale (ex: `artifacts`, `assets`).
- `db_primary_instance_class`, `db_secondary_instance_class` : tailles Aurora adaptées à la charge (par défaut `db.r6g.large`).
- `eks_*_instance_types` : mélange On-Demand / Spot, ajuster selon CPU/GPU (ex: ajouter `g5.xlarge` pour workloads GPU).

## 7. Flux DR & bascule
- Route53 bascule automatiquement sur la région secondaire si le health check `https://<secondary_health_check_domain><health_check_path>` renvoie erreur (>3 tentatives).
- Aurora Global Database autorise promotion manuelle de la région secondaire en `write` (playbook dans `docs/dr/DR_RUNBOOK.md`).
- Buckets S3 : réplication automatique, alerte si backlog > 500 Mo.
- Maintien applicatif : Argo CD déploie sur les deux clusters (appsets `luneo-api`, `luneo-frontend`, `luneo-worker-ia`) avec `preferred` = primaire, `standby` = secondaire.

## 8. Exercices recommandés
- **Mensuel** : `terraform plan` + `aws eks list-nodegroups` (vérifier drift).
- **Trimestriel** : Chaos test (couper NAT Gateway primaire, valider reroutage via VPN / failover).
- **Semestriel** : Promotion Aurora secondaire + retour en primaire (voir runbook).
- **Annuel** : Simulation perte totale `eu-west-1` (désactivation ALB primaire, injection latence 500ms, bascule DNS + Aurora promotion).

## 9. Observabilité & quotas
- `aws_cloudwatch_metric_alarm.aurora_replication_lag` : PagerDuty / Slack `#sre` en cas de lag.
- `aws_cloudwatch_metric_alarm.s3_replication_latency` : avertit si backlog important (souvent lié aux quotas PUT ou KMS).
- Rappels quotas : NAT Gateway (1 par AZ), Elastic IP, `Fargate pod execution role` (si activé), `EKS managed node count`.

## 10. Étapes post-apply
1. Récupérer kubeconfig :
   ```bash
   aws eks update-kubeconfig --name luneo-prod-eks-primary --region eu-west-1
   aws eks update-kubeconfig --name luneo-prod-eks-secondary --region us-east-1 --alias luneo-secondary
   ```
2. Appliquer les manifests `infrastructure/kubernetes/base/*.yaml` (namespaces, ingress, external-dns, cert-manager).
3. Installer Argo CD dans les deux clusters (`helmfile` ou `helm upgrade --install`).
4. Déployer la plateforme (`kubectl apply -k deploy/overlays/prod-primary` et `prod-secondary`).
5. Injecter les secrets via External Secrets Operator ou Vault Agent Injector (voir `docs/security/SECRET_ROTATION.md`).

## 11. Sécurité & bonnes pratiques
- KMS distinct par région (rotation annuelle activée).
- IAM IRSA pour les contrôleurs (load balancer). Ajouter policies spécifiques (external-dns, cert-manager) dans `iam.tf` si nécessaire.
- Activer GuardDuty / Security Hub sur les deux régions (géré ailleurs).
- Bloquer accès public S3 via CloudFront ou presigned URLs (politique S3 à ajuster selon cas).
- Mettre en place `aws_shield_protection` pour les ALBs (voir backlog sécurité).

## 12. Dépendances hébergées hors repo
- Certificats ACM wildcard (`*.luneo.app`), validés via DNS.
- Pipeline CI/CD qui applique Terraform (`terraform plan` sur PR + `terraform apply` via environnement protégé).
- Observabilité additionnelle : Prometheus, Loki, Tempo déployés via Helm (chart `kube-prometheus-stack`), non inclus ici.
- Backups logiques (pg_dump) orchestrés via Kubernetes CronJobs (voir `deploy/cronjobs/backup-postgres.yaml`).

## 13. Prochaines évolutions
- Activer **Global Accelerator** pour réduire la latence multi-région.
- Ajouter **Redis Global Datastore** (ElastiCache) pour cache multi-région.
- Intégrer **Karpenter** pour scaling intelligent (remplace managed node groups spot).
- Automatiser le runbook DR via `aws ssm automation` + Slack bot.
- Coupler avec `AWS Backup` plans pour snapshots S3, Aurora, DynamoDB (si ajouté).

## 14. Support & ownership
- Owner : `platform@sre.luneo.app`
- SLA Terraform : revue hebdomadaire + post-change review.
- Tickets incidents : `JIRA - OPS` avec tag `multi-region`.

