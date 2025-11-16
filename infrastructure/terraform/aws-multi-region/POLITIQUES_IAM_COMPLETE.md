# Guide complet : Toutes les politiques IAM à créer

## 📋 Vue d'ensemble

Ce guide liste **toutes les politiques IAM** nécessaires pour que Terraform puisse déployer votre infrastructure multi-région AWS.

**Utilisateur cible** : `191197Em.`

---

## 🔐 Politique 1 : Terraform State Backend (S3 + DynamoDB)

**Nom** : `terraform-state-backend`

**Description** : Permissions pour gérer le backend Terraform (S3 pour le state, DynamoDB pour le locking)

### JSON de la politique :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3StateBackend",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:GetBucketVersioning",
        "s3:PutBucketVersioning",
        "s3:GetBucketEncryption",
        "s3:PutBucketEncryption",
        "s3:GetBucketPublicAccessBlock",
        "s3:PutBucketPublicAccessBlock",
        "s3:GetBucketAcl",
        "s3:PutBucketAcl"
      ],
      "Resource": [
        "arn:aws:s3:::luneo-terraform-state",
        "arn:aws:s3:::luneo-terraform-state/*"
      ]
    },
    {
      "Sid": "DynamoDBStateLocking",
      "Effect": "Allow",
      "Action": [
        "dynamodb:DescribeTable",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:DeleteItem",
        "dynamodb:CreateTable",
        "dynamodb:UpdateTable"
      ],
      "Resource": "arn:aws:dynamodb:eu-west-1:115849270532:table/luneo-terraform-locks"
    }
  ]
}
```

---

## 🔐 Politique 2 : Infrastructure Terraform - Lecture seule (EC2, Route53)

**Nom** : `terraform-infrastructure-readonly`

**Description** : Permissions en lecture seule pour découvrir les ressources AWS existantes

### JSON de la politique :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2ReadOnly",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeAvailabilityZones",
        "ec2:DescribeRegions",
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeInternetGateways",
        "ec2:DescribeNatGateways",
        "ec2:DescribeRouteTables",
        "ec2:DescribeNetworkAcls",
        "ec2:DescribeVpcEndpoints",
        "ec2:DescribeAccountAttributes"
      ],
      "Resource": "*"
    },
    {
      "Sid": "Route53ReadOnly",
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:GetHostedZone",
        "route53:ListResourceRecordSets",
        "route53:GetHealthCheck",
        "route53:ListHealthChecks"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMReadOnly",
      "Effect": "Allow",
      "Action": [
        "iam:GetUser",
        "iam:GetRole",
        "iam:ListRoles",
        "iam:ListPolicies",
        "iam:GetPolicy",
        "iam:GetPolicyVersion",
        "iam:ListAttachedRolePolicies",
        "iam:ListRolePolicies",
        "iam:GetRolePolicy",
        "iam:ListInstanceProfiles",
        "iam:GetInstanceProfile"
      ],
      "Resource": "*"
    },
    {
      "Sid": "STSReadOnly",
      "Effect": "Allow",
      "Action": [
        "sts:GetCallerIdentity"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🔐 Politique 3 : VPC et Networking

**Nom** : `terraform-vpc-networking`

**Description** : Permissions pour créer et gérer les VPC, sous-réseaux, gateways, etc.

### JSON de la politique :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "VPCFullAccess",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateVpc",
        "ec2:DeleteVpc",
        "ec2:ModifyVpcAttribute",
        "ec2:DescribeVpcs",
        "ec2:CreateSubnet",
        "ec2:DeleteSubnet",
        "ec2:ModifySubnetAttribute",
        "ec2:DescribeSubnets",
        "ec2:CreateInternetGateway",
        "ec2:DeleteInternetGateway",
        "ec2:AttachInternetGateway",
        "ec2:DetachInternetGateway",
        "ec2:DescribeInternetGateways",
        "ec2:CreateNatGateway",
        "ec2:DeleteNatGateway",
        "ec2:DescribeNatGateways",
        "ec2:AllocateAddress",
        "ec2:ReleaseAddress",
        "ec2:DescribeAddresses",
        "ec2:AssociateAddress",
        "ec2:DisassociateAddress",
        "ec2:CreateRouteTable",
        "ec2:DeleteRouteTable",
        "ec2:DescribeRouteTables",
        "ec2:CreateRoute",
        "ec2:DeleteRoute",
        "ec2:ReplaceRoute",
        "ec2:AssociateRouteTable",
        "ec2:DisassociateRouteTable",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupEgress",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeSecurityGroupRules",
        "ec2:CreateTags",
        "ec2:DeleteTags",
        "ec2:DescribeTags",
        "ec2:CreateNetworkAcl",
        "ec2:DeleteNetworkAcl",
        "ec2:DescribeNetworkAcls",
        "ec2:CreateNetworkAclEntry",
        "ec2:DeleteNetworkAclEntry",
        "ec2:ReplaceNetworkAclEntry",
        "ec2:CreateVpcEndpoint",
        "ec2:DeleteVpcEndpoint",
        "ec2:DescribeVpcEndpoints",
        "ec2:ModifyVpcEndpoint",
        "ec2:CreateVpcPeeringConnection",
        "ec2:DeleteVpcPeeringConnection",
        "ec2:DescribeVpcPeeringConnections",
        "ec2:AcceptVpcPeeringConnection",
        "ec2:RejectVpcPeeringConnection"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🔐 Politique 4 : EKS (Elastic Kubernetes Service)

**Nom** : `terraform-eks-management`

**Description** : Permissions pour créer et gérer les clusters EKS

### JSON de la politique :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EKSFullAccess",
      "Effect": "Allow",
      "Action": [
        "eks:CreateCluster",
        "eks:DeleteCluster",
        "eks:DescribeCluster",
        "eks:ListClusters",
        "eks:UpdateClusterVersion",
        "eks:UpdateClusterConfig",
        "eks:CreateNodegroup",
        "eks:DeleteNodegroup",
        "eks:DescribeNodegroup",
        "eks:ListNodegroups",
        "eks:UpdateNodegroupVersion",
        "eks:UpdateNodegroupConfig",
        "eks:TagResource",
        "eks:UntagResource",
        "eks:ListTagsForResource",
        "eks:AssociateIdentityProviderConfig",
        "eks:DisassociateIdentityProviderConfig",
        "eks:ListIdentityProviderConfigs",
        "eks:DescribeIdentityProviderConfig",
        "eks:AssociateEncryptionConfig",
        "eks:DescribeUpdate",
        "eks:ListUpdates"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2ForEKS",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateLaunchTemplate",
        "ec2:DeleteLaunchTemplate",
        "ec2:DescribeLaunchTemplates",
        "ec2:DescribeLaunchTemplateVersions",
        "ec2:CreateLaunchTemplateVersion",
        "ec2:DeleteLaunchTemplateVersion",
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeImages",
        "ec2:DescribeSnapshots",
        "ec2:DescribeVolumes",
        "ec2:CreateVolume",
        "ec2:DeleteVolume",
        "ec2:AttachVolume",
        "ec2:DetachVolume",
        "ec2:ModifyInstanceAttribute",
        "ec2:DescribeSpotInstanceRequests",
        "ec2:RequestSpotInstances",
        "ec2:CancelSpotInstanceRequests"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ec2:ResourceTag/eks:cluster-name": "*"
        }
      }
    },
    {
      "Sid": "EC2ForEKSUnconditional",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceTypes",
        "ec2:DescribeImages",
        "ec2:DescribeSnapshots",
        "ec2:DescribeVolumes",
        "ec2:DescribeSpotInstanceRequests"
      ],
      "Resource": "*"
    },
    {
      "Sid": "IAMForEKS",
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
        "iam:PassRole"
      ],
      "Resource": [
        "arn:aws:iam::115849270532:role/luneo-prod-eks-*",
        "arn:aws:iam::115849270532:role/luneo-prod-eks-node-*",
        "arn:aws:iam::115849270532:role/luneo-prod-eks-cluster-*"
      ]
    },
    {
      "Sid": "KMSForEKS",
      "Effect": "Allow",
      "Action": [
        "kms:CreateKey",
        "kms:DeleteKey",
        "kms:DescribeKey",
        "kms:ListKeys",
        "kms:ListAliases",
        "kms:EnableKeyRotation",
        "kms:DisableKeyRotation",
        "kms:GetKeyRotationStatus",
        "kms:TagResource",
        "kms:UntagResource",
        "kms:ListResourceTags",
        "kms:CreateAlias",
        "kms:DeleteAlias",
        "kms:UpdateAlias",
        "kms:PutKeyPolicy",
        "kms:GetKeyPolicy"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🔐 Politique 5 : RDS Aurora

**Nom** : `terraform-rds-aurora`

**Description** : Permissions pour créer et gérer les clusters Aurora PostgreSQL

### JSON de la politique :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RDSFullAccess",
      "Effect": "Allow",
      "Action": [
        "rds:CreateDBCluster",
        "rds:DeleteDBCluster",
        "rds:DescribeDBClusters",
        "rds:ModifyDBCluster",
        "rds:StartDBCluster",
        "rds:StopDBCluster",
        "rds:CreateDBInstance",
        "rds:DeleteDBInstance",
        "rds:DescribeDBInstances",
        "rds:ModifyDBInstance",
        "rds:RebootDBInstance",
        "rds:StartDBInstance",
        "rds:StopDBInstance",
        "rds:CreateDBSubnetGroup",
        "rds:DeleteDBSubnetGroup",
        "rds:DescribeDBSubnetGroups",
        "rds:ModifyDBSubnetGroup",
        "rds:CreateDBParameterGroup",
        "rds:DeleteDBParameterGroup",
        "rds:DescribeDBParameterGroups",
        "rds:ModifyDBParameterGroup",
        "rds:DescribeDBParameters",
        "rds:CreateDBClusterParameterGroup",
        "rds:DeleteDBClusterParameterGroup",
        "rds:DescribeDBClusterParameterGroups",
        "rds:ModifyDBClusterParameterGroup",
        "rds:DescribeDBClusterParameters",
        "rds:CreateDBClusterSnapshot",
        "rds:DeleteDBClusterSnapshot",
        "rds:DescribeDBClusterSnapshots",
        "rds:CopyDBClusterSnapshot",
        "rds:RestoreDBClusterFromSnapshot",
        "rds:CreateGlobalCluster",
        "rds:DeleteGlobalCluster",
        "rds:DescribeGlobalClusters",
        "rds:ModifyGlobalCluster",
        "rds:RemoveFromGlobalCluster",
        "rds:FailoverGlobalCluster",
        "rds:AddTagsToResource",
        "rds:RemoveTagsFromResource",
        "rds:ListTagsForResource",
        "rds:DescribeDBEngineVersions",
        "rds:DescribeOrderableDBInstanceOptions"
      ],
      "Resource": "*"
    },
    {
      "Sid": "KMSForRDS",
      "Effect": "Allow",
      "Action": [
        "kms:CreateKey",
        "kms:DeleteKey",
        "kms:DescribeKey",
        "kms:ListKeys",
        "kms:ListAliases",
        "kms:EnableKeyRotation",
        "kms:DisableKeyRotation",
        "kms:GetKeyRotationStatus",
        "kms:TagResource",
        "kms:UntagResource",
        "kms:ListResourceTags",
        "kms:CreateAlias",
        "kms:DeleteAlias",
        "kms:UpdateAlias",
        "kms:PutKeyPolicy",
        "kms:GetKeyPolicy",
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:GenerateDataKey"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🔐 Politique 6 : S3 Artifacts et Réplication

**Nom** : `terraform-s3-artifacts`

**Description** : Permissions pour créer et gérer les buckets S3 d'artifacts avec réplication

### JSON de la politique :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3ArtifactsFullAccess",
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:DeleteBucket",
        "s3:ListBucket",
        "s3:GetBucketLocation",
        "s3:GetBucketVersioning",
        "s3:PutBucketVersioning",
        "s3:GetBucketEncryption",
        "s3:PutBucketEncryption",
        "s3:GetBucketPublicAccessBlock",
        "s3:PutBucketPublicAccessBlock",
        "s3:GetBucketAcl",
        "s3:PutBucketAcl",
        "s3:GetBucketPolicy",
        "s3:PutBucketPolicy",
        "s3:DeleteBucketPolicy",
        "s3:GetBucketTagging",
        "s3:PutBucketTagging",
        "s3:GetBucketLifecycleConfiguration",
        "s3:PutBucketLifecycleConfiguration",
        "s3:DeleteBucketLifecycleConfiguration",
        "s3:GetBucketReplication",
        "s3:PutBucketReplication",
        "s3:DeleteBucketReplication",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion",
        "s3:DeleteObjectVersion",
        "s3:GetObjectAcl",
        "s3:PutObjectAcl",
        "s3:GetObjectTagging",
        "s3:PutObjectTagging",
        "s3:DeleteObjectTagging"
      ],
      "Resource": [
        "arn:aws:s3:::luneo-prod-artifacts-*",
        "arn:aws:s3:::luneo-prod-artifacts-*/*"
      ]
    },
    {
      "Sid": "S3ReplicationRole",
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
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::115849270532:role/luneo-prod-s3-replication-*"
    }
  ]
}
```

---

## 🔐 Politique 7 : Route53 et Health Checks

**Nom** : `terraform-route53-dns`

**Description** : Permissions pour gérer les enregistrements DNS et health checks

### JSON de la politique :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Route53FullAccess",
      "Effect": "Allow",
      "Action": [
        "route53:ListHostedZones",
        "route53:GetHostedZone",
        "route53:CreateHostedZone",
        "route53:DeleteHostedZone",
        "route53:ChangeResourceRecordSets",
        "route53:ListResourceRecordSets",
        "route53:GetChange",
        "route53:ListChanges",
        "route53:CreateHealthCheck",
        "route53:DeleteHealthCheck",
        "route53:GetHealthCheck",
        "route53:ListHealthChecks",
        "route53:UpdateHealthCheck",
        "route53:GetHealthCheckStatus",
        "route53:GetHealthCheckLastFailureReason",
        "route53:ChangeTagsForResource",
        "route53:ListTagsForResource",
        "route53:ListTagsForResources"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🔐 Politique 8 : CloudWatch et Monitoring

**Nom** : `terraform-cloudwatch-monitoring`

**Description** : Permissions pour créer des alarmes et métriques CloudWatch

### JSON de la politique :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchFullAccess",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:DeleteAlarms",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:DescribeAlarmHistory",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:GetMetricData",
        "cloudwatch:ListMetrics",
        "cloudwatch:PutMetricData",
        "cloudwatch:TagResource",
        "cloudwatch:UntagResource",
        "cloudwatch:ListTagsForResource"
      ],
      "Resource": "*"
    },
    {
      "Sid": "LogsFullAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:DeleteLogGroup",
        "logs:DescribeLogGroups",
        "logs:PutRetentionPolicy",
        "logs:CreateLogStream",
        "logs:DeleteLogStream",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents",
        "logs:TagLogGroup",
        "logs:UntagLogGroup",
        "logs:ListTagsLogGroup"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## 🔐 Politique 9 : AWS Backup

**Nom** : `terraform-backup-management`

**Description** : Permissions pour créer et gérer les plans de sauvegarde AWS Backup

### JSON de la politique :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BackupFullAccess",
      "Effect": "Allow",
      "Action": [
        "backup:CreateBackupVault",
        "backup:DeleteBackupVault",
        "backup:DescribeBackupVault",
        "backup:ListBackupVaults",
        "backup:CreateBackupPlan",
        "backup:DeleteBackupPlan",
        "backup:GetBackupPlan",
        "backup:ListBackupPlans",
        "backup:UpdateBackupPlan",
        "backup:CreateBackupSelection",
        "backup:DeleteBackupSelection",
        "backup:GetBackupSelection",
        "backup:ListBackupSelections",
        "backup:StartBackupJob",
        "backup:StopBackupJob",
        "backup:DescribeBackupJob",
        "backup:ListBackupJobs",
        "backup:GetBackupVaultAccessPolicy",
        "backup:PutBackupVaultAccessPolicy",
        "backup:DeleteBackupVaultAccessPolicy",
        "backup:GetBackupVaultNotifications",
        "backup:PutBackupVaultNotifications",
        "backup:TagResource",
        "backup:UntagResource",
        "backup:ListTags"
      ],
      "Resource": "*"
    },
    {
      "Sid": "BackupIAMRole",
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
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::115849270532:role/luneo-prod-backup-*"
    }
  ]
}
```

---

## 🔐 Politique 10 : IAM Management (pour les rôles créés par Terraform)

**Nom** : `terraform-iam-management`

**Description** : Permissions pour créer et gérer les rôles IAM nécessaires aux services AWS

### JSON de la politique :

```json
{
  "Version": "2012-10-17",
  "Statement": [
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
        "iam:UpdateRoleDescription",
        "iam:GetRolePolicy",
        "iam:ListRolePolicies",
        "iam:CreateServiceLinkedRole",
        "iam:DeleteServiceLinkedRole",
        "iam:GetServiceLinkedRoleDeletionStatus"
      ],
      "Resource": [
        "arn:aws:iam::115849270532:role/luneo-prod-*",
        "arn:aws:iam::115849270532:role/aws-service-role/*"
      ]
    },
    {
      "Sid": "IAMPolicyManagement",
      "Effect": "Allow",
      "Action": [
        "iam:CreatePolicy",
        "iam:DeletePolicy",
        "iam:GetPolicy",
        "iam:ListPolicies",
        "iam:ListPolicyVersions",
        "iam:GetPolicyVersion",
        "iam:CreatePolicyVersion",
        "iam:DeletePolicyVersion",
        "iam:SetDefaultPolicyVersion",
        "iam:TagPolicy",
        "iam:UntagPolicy",
        "iam:ListPolicyTags"
      ],
      "Resource": "arn:aws:iam::115849270532:policy/luneo-prod-*"
    }
  ]
}
```

---

## 📝 Instructions pour créer les politiques

### Méthode 1 : Via la console AWS (recommandé)

1. **Connectez-vous à AWS Console** : https://console.aws.amazon.com/
2. **Allez dans IAM** → **"Politiques"** (Policies) → **"Créer une politique"** (Create policy)
3. **Cliquez sur l'onglet "JSON"**
4. **Copiez-collez le JSON** de la politique souhaitée
5. **Cliquez sur "Suivant"**
6. **Nommez la politique** (ex: `terraform-state-backend`)
7. **Ajoutez une description** (ex: "Permissions pour le backend Terraform")
8. **Cliquez sur "Créer une politique"**
9. **Répétez pour chaque politique**

### Méthode 2 : Via AWS CLI

Pour chaque politique, exécutez :

```bash
# Remplacez POLICY_NAME et POLICY_FILE.json
aws iam create-policy \
  --policy-name POLICY_NAME \
  --policy-document file://POLICY_FILE.json \
  --description "Description de la politique"
```

### Attacher les politiques à l'utilisateur

1. **IAM** → **"Personnes"** (Users) → **`191197Em.`**
2. **"Ajouter des autorisations"** (Add permissions)
3. **"Attacher directement des politiques"** (Attach policies directly)
4. **Recherchez et cochez toutes les politiques** créées ci-dessus
5. **"Suivant"** → **"Ajouter des autorisations"**

---

## ✅ Vérification

Après avoir créé et attaché toutes les politiques, testez :

```bash
# Test EC2
aws ec2 describe-availability-zones --region eu-west-1

# Test Route53
aws route53 list-hosted-zones

# Test S3
aws s3 ls s3://luneo-terraform-state/

# Test DynamoDB
aws dynamodb describe-table --table-name luneo-terraform-locks --region eu-west-1

# Test Terraform
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region
terraform plan -out tfplan
```

---

## 📊 Résumé des politiques

| # | Nom | Description |
|---|-----|-------------|
| 1 | `terraform-state-backend` | S3 + DynamoDB pour le state Terraform |
| 2 | `terraform-infrastructure-readonly` | Lecture seule EC2, Route53, IAM |
| 3 | `terraform-vpc-networking` | VPC, sous-réseaux, gateways |
| 4 | `terraform-eks-management` | Clusters EKS et node groups |
| 5 | `terraform-rds-aurora` | Clusters Aurora PostgreSQL |
| 6 | `terraform-s3-artifacts` | Buckets S3 et réplication |
| 7 | `terraform-route53-dns` | DNS et health checks |
| 8 | `terraform-cloudwatch-monitoring` | Alarmes et métriques |
| 9 | `terraform-backup-management` | Plans de sauvegarde AWS Backup |
| 10 | `terraform-iam-management` | Rôles IAM pour les services |

**Total : 10 politiques**

---

## ⚠️ Notes importantes

1. **Sécurité** : Ces politiques sont conçues pour un environnement de production. Ajustez les `Resource` ARNs selon vos besoins.

2. **Régions** : Certaines politiques incluent des ARNs spécifiques à `eu-west-1`. Adaptez-les si nécessaire.

3. **Propagation** : Après création/attachement, attendez 1-2 minutes pour la propagation.

4. **Test progressif** : Créez d'abord les politiques 1 et 2, testez, puis ajoutez les autres progressivement.

5. **IAM PassRole** : Les politiques incluent `iam:PassRole` pour permettre à Terraform de créer des rôles pour les services AWS (EKS, Backup, etc.).

