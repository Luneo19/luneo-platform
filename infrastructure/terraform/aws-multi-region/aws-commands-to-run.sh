📋 Génération des commandes AWS CLI pour mettre à jour les politiques
==================================================

# Commandes AWS CLI pour mettre à jour les politiques IAM
# Copiez-collez ces commandes une par une dans votre terminal

cd .

# ==========================================
# Politique: terraform-backup-management
# ==========================================

# Vérifier que la politique existe
aws iam get-policy --policy-arn "arn:aws:iam::115849270532:policy/terraform-backup-management"

# Créer une nouvelle version de la politique
aws iam create-policy-version \
  --policy-arn "arn:aws:iam::115849270532:policy/terraform-backup-management" \
  --policy-document file://iam-policies/09-terraform-backup-management.json \
  --set-as-default

# Si erreur 'LimitExceeded', lister les versions puis supprimer une ancienne:
# aws iam list-policy-versions --policy-arn "arn:aws:iam::115849270532:policy/terraform-backup-management"
# aws iam delete-policy-version --policy-arn "arn:aws:iam::115849270532:policy/terraform-backup-management" --version-id vX

echo "✅ Politique terraform-backup-management mise à jour"
echo ""

# ==========================================
# Politique: terraform-s3-artifacts
# ==========================================

# Vérifier que la politique existe
aws iam get-policy --policy-arn "arn:aws:iam::115849270532:policy/terraform-s3-artifacts"

# Créer une nouvelle version de la politique
aws iam create-policy-version \
  --policy-arn "arn:aws:iam::115849270532:policy/terraform-s3-artifacts" \
  --policy-document file://iam-policies/06-terraform-s3-artifacts.json \
  --set-as-default

# Si erreur 'LimitExceeded', lister les versions puis supprimer une ancienne:
# aws iam list-policy-versions --policy-arn "arn:aws:iam::115849270532:policy/terraform-s3-artifacts"
# aws iam delete-policy-version --policy-arn "arn:aws:iam::115849270532:policy/terraform-s3-artifacts" --version-id vX

echo "✅ Politique terraform-s3-artifacts mise à jour"
echo ""

# ==========================================
# Politique: terraform-cloudwatch-monitoring
# ==========================================

# Vérifier que la politique existe
aws iam get-policy --policy-arn "arn:aws:iam::115849270532:policy/terraform-cloudwatch-monitoring"

# Créer une nouvelle version de la politique
aws iam create-policy-version \
  --policy-arn "arn:aws:iam::115849270532:policy/terraform-cloudwatch-monitoring" \
  --policy-document file://iam-policies/08-terraform-cloudwatch-monitoring.json \
  --set-as-default

# Si erreur 'LimitExceeded', lister les versions puis supprimer une ancienne:
# aws iam list-policy-versions --policy-arn "arn:aws:iam::115849270532:policy/terraform-cloudwatch-monitoring"
# aws iam delete-policy-version --policy-arn "arn:aws:iam::115849270532:policy/terraform-cloudwatch-monitoring" --version-id vX

echo "✅ Politique terraform-cloudwatch-monitoring mise à jour"
echo ""

# ==========================================
# Politique: terraform-vpc-networking
# ==========================================

# Vérifier que la politique existe
aws iam get-policy --policy-arn "arn:aws:iam::115849270532:policy/terraform-vpc-networking"

# Créer une nouvelle version de la politique
aws iam create-policy-version \
  --policy-arn "arn:aws:iam::115849270532:policy/terraform-vpc-networking" \
  --policy-document file://iam-policies/03-terraform-vpc-networking.json \
  --set-as-default

# Si erreur 'LimitExceeded', lister les versions puis supprimer une ancienne:
# aws iam list-policy-versions --policy-arn "arn:aws:iam::115849270532:policy/terraform-vpc-networking"
# aws iam delete-policy-version --policy-arn "arn:aws:iam::115849270532:policy/terraform-vpc-networking" --version-id vX

echo "✅ Politique terraform-vpc-networking mise à jour"
echo ""

# ==========================================
# Politique: terraform-iam-management
# ==========================================

# Vérifier que la politique existe
aws iam get-policy --policy-arn "arn:aws:iam::115849270532:policy/terraform-iam-management"

# Créer une nouvelle version de la politique
aws iam create-policy-version \
  --policy-arn "arn:aws:iam::115849270532:policy/terraform-iam-management" \
  --policy-document file://iam-policies/10-terraform-iam-management.json \
  --set-as-default

# Si erreur 'LimitExceeded', lister les versions puis supprimer une ancienne:
# aws iam list-policy-versions --policy-arn "arn:aws:iam::115849270532:policy/terraform-iam-management"
# aws iam delete-policy-version --policy-arn "arn:aws:iam::115849270532:policy/terraform-iam-management" --version-id vX

echo "✅ Politique terraform-iam-management mise à jour"
echo ""

# ==========================================
# Vérification finale
# ==========================================

echo "📋 Vérification des versions par défaut:"
echo "terraform-backup-management:"
aws iam get-policy --policy-arn "arn:aws:iam::115849270532:policy/terraform-backup-management" --query 'Policy.DefaultVersionId' --output text
echo "terraform-s3-artifacts:"
aws iam get-policy --policy-arn "arn:aws:iam::115849270532:policy/terraform-s3-artifacts" --query 'Policy.DefaultVersionId' --output text
echo "terraform-cloudwatch-monitoring:"
aws iam get-policy --policy-arn "arn:aws:iam::115849270532:policy/terraform-cloudwatch-monitoring" --query 'Policy.DefaultVersionId' --output text
echo "terraform-vpc-networking:"
aws iam get-policy --policy-arn "arn:aws:iam::115849270532:policy/terraform-vpc-networking" --query 'Policy.DefaultVersionId' --output text
echo "terraform-iam-management:"
aws iam get-policy --policy-arn "arn:aws:iam::115849270532:policy/terraform-iam-management" --query 'Policy.DefaultVersionId' --output text

echo ""
echo "✨ Toutes les politiques ont été mises à jour !"
echo "💡 Attendez 1-2 minutes puis relancez: terraform apply tfplan"
