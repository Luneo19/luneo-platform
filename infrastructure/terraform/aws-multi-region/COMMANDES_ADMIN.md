# Commandes pour créer toutes les politiques IAM

## ⚠️ Important

Ces commandes nécessitent les permissions `iam:CreatePolicy` et `iam:AttachUserPolicy`. 
**À exécuter par un administrateur AWS** ou un utilisateur avec les permissions appropriées.

## 🚀 Méthode 1 : Script automatique (recommandé)

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region
chmod +x create-all-policies-admin.sh
./create-all-policies-admin.sh
```

## 📋 Méthode 2 : Commandes individuelles

### 1. terraform-state-backend

```bash
aws iam create-policy \
  --policy-name terraform-state-backend \
  --policy-document file://iam-policies/01-terraform-state-backend.json \
  --description "Permissions pour le backend Terraform (S3 + DynamoDB)"

aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-state-backend
```

### 2. terraform-infrastructure-readonly

```bash
aws iam create-policy \
  --policy-name terraform-infrastructure-readonly \
  --policy-document file://iam-policies/02-terraform-infrastructure-readonly.json \
  --description "Permissions en lecture seule pour découvrir les ressources AWS"

aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-infrastructure-readonly
```

### 3. terraform-vpc-networking

```bash
aws iam create-policy \
  --policy-name terraform-vpc-networking \
  --policy-document file://iam-policies/03-terraform-vpc-networking.json \
  --description "Permissions pour créer et gérer les VPC et réseaux"

aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-vpc-networking
```

### 4. terraform-eks-management

```bash
aws iam create-policy \
  --policy-name terraform-eks-management \
  --policy-document file://iam-policies/04-terraform-eks-management.json \
  --description "Permissions pour créer et gérer les clusters EKS"

aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-eks-management
```

### 5. terraform-rds-aurora

```bash
aws iam create-policy \
  --policy-name terraform-rds-aurora \
  --policy-document file://iam-policies/05-terraform-rds-aurora.json \
  --description "Permissions pour créer et gérer les clusters Aurora PostgreSQL"

aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-rds-aurora
```

### 6. terraform-s3-artifacts

```bash
aws iam create-policy \
  --policy-name terraform-s3-artifacts \
  --policy-document file://iam-policies/06-terraform-s3-artifacts.json \
  --description "Permissions pour créer et gérer les buckets S3 d'artifacts"

aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-s3-artifacts
```

### 7. terraform-route53-dns

```bash
aws iam create-policy \
  --policy-name terraform-route53-dns \
  --policy-document file://iam-policies/07-terraform-route53-dns.json \
  --description "Permissions pour gérer les enregistrements DNS et health checks"

aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-route53-dns
```

### 8. terraform-cloudwatch-monitoring

```bash
aws iam create-policy \
  --policy-name terraform-cloudwatch-monitoring \
  --policy-document file://iam-policies/08-terraform-cloudwatch-monitoring.json \
  --description "Permissions pour créer des alarmes et métriques CloudWatch"

aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-cloudwatch-monitoring
```

### 9. terraform-backup-management

```bash
aws iam create-policy \
  --policy-name terraform-backup-management \
  --policy-document file://iam-policies/09-terraform-backup-management.json \
  --description "Permissions pour créer et gérer les plans de sauvegarde AWS Backup"

aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-backup-management
```

### 10. terraform-iam-management

```bash
aws iam create-policy \
  --policy-name terraform-iam-management \
  --policy-document file://iam-policies/10-terraform-iam-management.json \
  --description "Permissions pour créer et gérer les rôles IAM nécessaires aux services AWS"

aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-iam-management
```

## ✅ Vérification

Après création, vérifiez que toutes les politiques sont attachées :

```bash
aws iam list-attached-user-policies --user-name 191197Em. --output table
```

## 🚀 Après création

Une fois toutes les politiques créées et attachées, attendez 1-2 minutes puis :

```bash
cd /Users/emmanuelabougadous/luneo-platform/infrastructure/terraform/aws-multi-region
terraform plan -out tfplan
terraform apply tfplan
```

