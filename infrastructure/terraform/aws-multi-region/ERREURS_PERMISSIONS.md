# Erreurs de permissions détectées lors de terraform apply

## 📋 Résumé des erreurs

Lors de l'application du plan Terraform, plusieurs erreurs de permissions IAM ont été détectées. Voici les corrections nécessaires :

---

## 🔴 Erreur 1 : AWS Backup Vault

**Erreur** :
```
Insufficient privileges to create a backup vault. Creating a backup vault requires backup-storage and KMS permissions.
```

**Permissions manquantes** :
- `backup:CreateBackupVault` (déjà dans la politique)
- Permissions KMS pour les clés de backup (déjà dans la politique)
- **NOUVEAU** : `backup-storage:*` (permission de service AWS Backup)

**Solution** : Ajouter à la politique `terraform-backup-management` :

```json
{
  "Sid": "BackupStorageAccess",
  "Effect": "Allow",
  "Action": [
    "backup-storage:*"
  ],
  "Resource": "*"
}
```

---

## 🔴 Erreur 2 : RDS Global Cluster - Version du moteur

**Erreur** :
```
The requested engine version was not found or does not support global functionality
```

**Problème** : La version `15.3` d'Aurora PostgreSQL ne supporte peut-être pas les clusters globaux, ou n'est pas disponible dans toutes les régions.

**Solution** : Vérifier et mettre à jour la version du moteur dans `variables.tf` :

```hcl
variable "db_engine_version" {
  description = "Version du moteur Aurora PostgreSQL."
  type        = string
  default     = "15.4"  # ou une version qui supporte les clusters globaux
}
```

Ou vérifier les versions disponibles :
```bash
aws rds describe-db-engine-versions \
  --engine aurora-postgresql \
  --query 'DBEngineVersions[?SupportsGlobalDatabases==`true`].EngineVersion' \
  --output table
```

---

## 🔴 Erreur 3 : S3 GetBucketCORS

**Erreur** :
```
User is not authorized to perform: s3:GetBucketCORS
```

**Permissions manquantes** : Ajouter à la politique `terraform-s3-artifacts` :

```json
{
  "Sid": "S3CORSRead",
  "Effect": "Allow",
  "Action": [
    "s3:GetBucketCORS",
    "s3:PutBucketCORS",
    "s3:DeleteBucketCORS"
  ],
  "Resource": [
    "arn:aws:s3:::luneo-prod-artifacts-*"
  ]
}
```

---

## 🔴 Erreur 4 : CloudWatch Logs ListTagsForResource

**Erreur** :
```
User is not authorized to perform: logs:ListTagsForResource
```

**Permissions manquantes** : Ajouter à la politique `terraform-cloudwatch-monitoring` :

```json
{
  "Sid": "LogsTagManagement",
  "Effect": "Allow",
  "Action": [
    "logs:ListTagsForResource",
    "logs:TagResource",
    "logs:UntagResource"
  ],
  "Resource": "*"
}
```

---

## 🔴 Erreur 5 : EC2 DescribeVpcAttribute

**Erreur** :
```
User is not authorized to perform: ec2:DescribeVpcAttribute
```

**Permissions manquantes** : Ajouter à la politique `terraform-vpc-networking` :

```json
{
  "Sid": "VPCAttributes",
  "Effect": "Allow",
  "Action": [
    "ec2:DescribeVpcAttribute",
    "ec2:ModifyVpcAttribute",
    "ec2:DescribeVpcAttribute",
    "ec2:DescribeAccountAttributes"
  ],
  "Resource": "*"
}
```

---

## 🔴 Erreur 6 : IAM CreateRole avec noms dynamiques

**Erreur** :
```
User is not authorized to perform: iam:CreateRole on resource: arn:aws:iam::115849270532:role/primary-eks-node-group-*
```

**Problème** : La politique `terraform-iam-management` limite les rôles à `luneo-prod-*`, mais les rôles EKS sont créés avec des noms générés dynamiquement comme `primary-eks-node-group-*`.

**Solution** : Modifier la politique `terraform-iam-management` pour autoriser les patterns EKS :

```json
{
  "Sid": "IAMRoleManagement",
  "Effect": "Allow",
  "Action": [
    "iam:CreateRole",
    "iam:DeleteRole",
    "iam:GetRole",
    "iam:ListRoles",
    "iam:AttachRolePolicy",
    "iam:DetachRolePolicy",
    "iam:ListAttachedRolePolicies",
    "iam:PutRolePolicy",
    "iam:DeleteRolePolicy",
    "iam:GetRolePolicy",
    "iam:ListRolePolicies",
    "iam:TagRole",
    "iam:UntagRole",
    "iam:PassRole",
    "iam:UpdateRole",
    "iam:UpdateRoleDescription"
  ],
  "Resource": [
    "arn:aws:iam::115849270532:role/luneo-prod-*",
    "arn:aws:iam::115849270532:role/primary-*",
    "arn:aws:iam::115849270532:role/secondary-*",
    "arn:aws:iam::115849270532:role/primary_spot-*",
    "arn:aws:iam::115849270532:role/secondary_spot-*",
    "arn:aws:iam::115849270532:role/aws-service-role/*"
  ]
}
```

---

## 📝 Actions à prendre

1. **Mettre à jour les politiques IAM** avec les permissions manquantes ci-dessus
2. **Vérifier la version du moteur RDS** pour les clusters globaux
3. **Relancer terraform apply** après les corrections

---

## ⚠️ Note importante

Certaines ressources ont été créées avec succès avant les erreurs :
- ✅ Health checks Route53
- ✅ Enregistrements DNS
- ✅ Clés KMS
- ✅ Rôles IAM de base
- ✅ VPCs (partiellement créés)

Vous pouvez relancer `terraform apply` après avoir corrigé les permissions - Terraform reprendra là où il s'est arrêté.

