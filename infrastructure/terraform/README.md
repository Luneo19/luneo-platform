# Terraform Monorepo – Luneo

## Structure cible

```
infrastructure/terraform/
├── modules/
│   ├── network/          # VPC, subnets, TGW
│   ├── eks/              # Control plane + node groups
│   ├── rds-global/       # Aurora Global Database
│   ├── elasticache-global/
│   ├── cloudfront/
│   └── observability/
├── envs/
│   ├── prod/
│   │   ├── main.tf       # Appel des modules + providers alias
│   │   └── terragrunt.hcl (optionnel)
│   └── staging/
├── backend.hcl           # remote state (S3 + DynamoDB)
└── ci/
    └── plan-apply.yaml   # workflow GitHub Actions
```

## Bonnes pratiques

- **Remote state** : S3 (encryption, versioning) + table DynamoDB pour verrous.  
- **Providers aliasés** pour multi-région :

```hcl
provider "aws" {
  region = var.primary_region
}

provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}
```

- **Terragrunt** recommandé pour DRY (variables partagées, dépendances).  
- **Lock** `terraform.required_version >= 1.5`, `aws >= 5.0`.

## Pipeline CI/CD

1. `terraform fmt -check`  
2. `terraform init -backend-config=...`  
3. `terraform validate`  
4. `terraform plan -out plan.tfplan` (push artefact)  
5. `terraform apply plan.tfplan` (après review manuelle)

Secrets via GitHub OIDC → IAM role pour `plan/apply`.

## Sécurité

- Variables sensibles (`postgres_password`, `redis_password`) via Secrets Manager + `data "aws_secretsmanager_secret_version"`.  
- IAM least privilege (policies par module).  
- Audit : CloudTrail + Config activés par module `observability`.  
- Tests `terraform-compliance` pour garantir tagging (`Project`, `Environment`, `CostCenter`).

## Étapes en cours

- [ ] Découper `main.tf` existant en `modules`.  
- [ ] Implémenter réseau primaire + secondaire.  
- [ ] Ajouter module `route53` (failover, healthcheck).  
- [ ] Déployer `aws_backup_plan` (DB & EBS).  
- [ ] Générer docs automatiques (`terraform-docs`).  
- [ ] Intégrer tests `tflint`, `tfsec`.

---

> Toute PR infra doit référencer la checklist : plan attaché, mise à jour des docs, runbook DR vérifié.

