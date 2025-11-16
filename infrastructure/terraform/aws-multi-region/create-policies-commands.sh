# ==========================================
# Commandes AWS CLI pour créer les politiques IAM
# Générées depuis: policies-creation-data.json
# ==========================================

cd .

# ==========================================
# ÉTAPE 1: Création des politiques
# ==========================================

# 1/10: terraform-state-backend
# Permissions pour le backend Terraform (S3 + DynamoDB)
aws iam create-policy \
  --policy-name terraform-state-backend \
  --policy-document file://iam-policies/01-terraform-state-backend.json \
  --description "Permissions pour le backend Terraform (S3 + DynamoDB)"

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-state-backend créée"
else
  echo "❌ Erreur lors de la création de terraform-state-backend"
fi


# 2/10: terraform-infrastructure-readonly
# Permissions en lecture seule pour découvrir les ressources AWS
aws iam create-policy \
  --policy-name terraform-infrastructure-readonly \
  --policy-document file://iam-policies/02-terraform-infrastructure-readonly.json \
  --description "Permissions en lecture seule pour découvrir les ressources AWS"

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-infrastructure-readonly créée"
else
  echo "❌ Erreur lors de la création de terraform-infrastructure-readonly"
fi


# 3/10: terraform-vpc-networking
# Permissions pour créer et gérer les VPC et réseaux
aws iam create-policy \
  --policy-name terraform-vpc-networking \
  --policy-document file://iam-policies/03-terraform-vpc-networking.json \
  --description "Permissions pour créer et gérer les VPC et réseaux"

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-vpc-networking créée"
else
  echo "❌ Erreur lors de la création de terraform-vpc-networking"
fi


# 4/10: terraform-eks-management
# Permissions pour créer et gérer les clusters EKS
aws iam create-policy \
  --policy-name terraform-eks-management \
  --policy-document file://iam-policies/04-terraform-eks-management.json \
  --description "Permissions pour créer et gérer les clusters EKS"

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-eks-management créée"
else
  echo "❌ Erreur lors de la création de terraform-eks-management"
fi


# 5/10: terraform-rds-aurora
# Permissions pour créer et gérer les clusters Aurora PostgreSQL
aws iam create-policy \
  --policy-name terraform-rds-aurora \
  --policy-document file://iam-policies/05-terraform-rds-aurora.json \
  --description "Permissions pour créer et gérer les clusters Aurora PostgreSQL"

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-rds-aurora créée"
else
  echo "❌ Erreur lors de la création de terraform-rds-aurora"
fi


# 6/10: terraform-s3-artifacts
# Permissions pour créer et gérer les buckets S3 d'artifacts
aws iam create-policy \
  --policy-name terraform-s3-artifacts \
  --policy-document file://iam-policies/06-terraform-s3-artifacts.json \
  --description "Permissions pour créer et gérer les buckets S3 d'artifacts"

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-s3-artifacts créée"
else
  echo "❌ Erreur lors de la création de terraform-s3-artifacts"
fi


# 7/10: terraform-route53-dns
# Permissions pour gérer les enregistrements DNS et health checks
aws iam create-policy \
  --policy-name terraform-route53-dns \
  --policy-document file://iam-policies/07-terraform-route53-dns.json \
  --description "Permissions pour gérer les enregistrements DNS et health checks"

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-route53-dns créée"
else
  echo "❌ Erreur lors de la création de terraform-route53-dns"
fi


# 8/10: terraform-cloudwatch-monitoring
# Permissions pour créer des alarmes et métriques CloudWatch
aws iam create-policy \
  --policy-name terraform-cloudwatch-monitoring \
  --policy-document file://iam-policies/08-terraform-cloudwatch-monitoring.json \
  --description "Permissions pour créer des alarmes et métriques CloudWatch"

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-cloudwatch-monitoring créée"
else
  echo "❌ Erreur lors de la création de terraform-cloudwatch-monitoring"
fi


# 9/10: terraform-backup-management
# Permissions pour créer et gérer les plans de sauvegarde AWS Backup
aws iam create-policy \
  --policy-name terraform-backup-management \
  --policy-document file://iam-policies/09-terraform-backup-management.json \
  --description "Permissions pour créer et gérer les plans de sauvegarde AWS Backup"

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-backup-management créée"
else
  echo "❌ Erreur lors de la création de terraform-backup-management"
fi


# 10/10: terraform-iam-management
# Permissions pour créer et gérer les rôles IAM nécessaires aux services AWS
aws iam create-policy \
  --policy-name terraform-iam-management \
  --policy-document file://iam-policies/10-terraform-iam-management.json \
  --description "Permissions pour créer et gérer les rôles IAM nécessaires aux services AWS"

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-iam-management créée"
else
  echo "❌ Erreur lors de la création de terraform-iam-management"
fi



# ==========================================
# ÉTAPE 2: Attacher les politiques à l'utilisateur
# ==========================================

# Attacher: terraform-state-backend
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-state-backend

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-state-backend attachée"
else
  echo "❌ Erreur lors de l'attachement de terraform-state-backend"
fi

# Attacher: terraform-infrastructure-readonly
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-infrastructure-readonly

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-infrastructure-readonly attachée"
else
  echo "❌ Erreur lors de l'attachement de terraform-infrastructure-readonly"
fi

# Attacher: terraform-vpc-networking
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-vpc-networking

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-vpc-networking attachée"
else
  echo "❌ Erreur lors de l'attachement de terraform-vpc-networking"
fi

# Attacher: terraform-eks-management
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-eks-management

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-eks-management attachée"
else
  echo "❌ Erreur lors de l'attachement de terraform-eks-management"
fi

# Attacher: terraform-rds-aurora
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-rds-aurora

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-rds-aurora attachée"
else
  echo "❌ Erreur lors de l'attachement de terraform-rds-aurora"
fi

# Attacher: terraform-s3-artifacts
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-s3-artifacts

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-s3-artifacts attachée"
else
  echo "❌ Erreur lors de l'attachement de terraform-s3-artifacts"
fi

# Attacher: terraform-route53-dns
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-route53-dns

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-route53-dns attachée"
else
  echo "❌ Erreur lors de l'attachement de terraform-route53-dns"
fi

# Attacher: terraform-cloudwatch-monitoring
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-cloudwatch-monitoring

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-cloudwatch-monitoring attachée"
else
  echo "❌ Erreur lors de l'attachement de terraform-cloudwatch-monitoring"
fi

# Attacher: terraform-backup-management
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-backup-management

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-backup-management attachée"
else
  echo "❌ Erreur lors de l'attachement de terraform-backup-management"
fi

# Attacher: terraform-iam-management
aws iam attach-user-policy \
  --user-name 191197Em. \
  --policy-arn arn:aws:iam::115849270532:policy/terraform-iam-management

if [ $? -eq 0 ]; then
  echo "✅ Politique terraform-iam-management attachée"
else
  echo "❌ Erreur lors de l'attachement de terraform-iam-management"
fi


# ==========================================
# ÉTAPE 3: Vérification
# ==========================================

echo "📋 Vérification des politiques attachées:"
aws iam list-attached-user-policies --user-name 191197Em. --output table

echo ""
echo "✨ Terminé !"
echo "💡 Attendez 1-2 minutes puis relancez: terraform apply tfplan"
