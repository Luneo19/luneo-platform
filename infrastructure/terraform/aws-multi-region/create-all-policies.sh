#!/bin/bash
# Script pour créer toutes les politiques IAM nécessaires pour Terraform

set -e

USER_NAME="191197Em."
ACCOUNT_ID="115849270532"
POLICIES_DIR="$(dirname "$0")/iam-policies"

echo "🚀 Création de toutes les politiques IAM pour Terraform"
echo "=================================================="
echo ""

# Liste des politiques avec leurs descriptions (format: fichier|description)
POLICIES=(
  "01-terraform-state-backend.json|Permissions pour le backend Terraform (S3 + DynamoDB)"
  "02-terraform-infrastructure-readonly.json|Permissions en lecture seule pour découvrir les ressources AWS"
  "03-terraform-vpc-networking.json|Permissions pour créer et gérer les VPC et réseaux"
  "04-terraform-eks-management.json|Permissions pour créer et gérer les clusters EKS"
  "05-terraform-rds-aurora.json|Permissions pour créer et gérer les clusters Aurora PostgreSQL"
  "06-terraform-s3-artifacts.json|Permissions pour créer et gérer les buckets S3 d'artifacts"
  "07-terraform-route53-dns.json|Permissions pour gérer les enregistrements DNS et health checks"
  "08-terraform-cloudwatch-monitoring.json|Permissions pour créer des alarmes et métriques CloudWatch"
  "09-terraform-backup-management.json|Permissions pour créer et gérer les plans de sauvegarde AWS Backup"
  "10-terraform-iam-management.json|Permissions pour créer et gérer les rôles IAM nécessaires aux services AWS"
)

# Fonction pour extraire le nom de la politique depuis le nom de fichier
get_policy_name() {
  local filename="$1"
  # Enlève le préfixe numérique et l'extension .json
  echo "$filename" | sed 's/^[0-9]*-//' | sed 's/\.json$//'
}

# Créer toutes les politiques
CREATED_POLICIES=()
FAILED_POLICIES=()

for policy_entry in "${POLICIES[@]}"; do
  IFS='|' read -r policy_file description <<< "$policy_entry"
  policy_path="${POLICIES_DIR}/${policy_file}"
  policy_name=$(get_policy_name "$policy_file")
  
  if [ ! -f "$policy_path" ]; then
    echo "❌ Fichier non trouvé: $policy_path"
    FAILED_POLICIES+=("$policy_file")
    continue
  fi
  
  echo "📝 Création de la politique: $policy_name"
  echo "   Description: $description"
  
  # Vérifier si la politique existe déjà
  if aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}" &>/dev/null; then
    echo "   ⚠️  La politique existe déjà, passage à la suivante..."
    CREATED_POLICIES+=("$policy_name")
    continue
  fi
  
  # Créer la politique
  if output=$(aws iam create-policy \
    --policy-name "$policy_name" \
    --policy-document "file://${policy_path}" \
    --description "$description" 2>&1); then
    echo "   ✅ Politique créée avec succès"
    CREATED_POLICIES+=("$policy_name")
  else
    echo "   ❌ Erreur lors de la création: $output"
    FAILED_POLICIES+=("$policy_file")
  fi
  echo ""
done

# Résumé
echo "=================================================="
echo "📊 Résumé"
echo "=================================================="
echo "✅ Politiques créées/existantes: ${#CREATED_POLICIES[@]}"
for policy in "${CREATED_POLICIES[@]}"; do
  echo "   - $policy"
done

  if [ ${#FAILED_POLICIES[@]} -gt 0 ]; then
    echo ""
    echo "❌ Politiques en échec: ${#FAILED_POLICIES[@]}"
    for policy_file in "${FAILED_POLICIES[@]}"; do
      echo "   - $policy_file"
    done
  fi

echo ""
echo "🔗 Attacher les politiques à l'utilisateur $USER_NAME"
echo "=================================================="

# Demander confirmation pour attacher les politiques
read -p "Voulez-vous attacher toutes ces politiques à l'utilisateur $USER_NAME ? (o/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
  for policy_name in "${CREATED_POLICIES[@]}"; do
    echo "📎 Attachement de: $policy_name"
    
    # Vérifier si la politique est déjà attachée
    if aws iam list-attached-user-policies --user-name "$USER_NAME" --query "AttachedPolicies[?PolicyName=='${policy_name}'].PolicyName" --output text | grep -q "$policy_name"; then
      echo "   ⚠️  Déjà attachée, passage à la suivante..."
      continue
    fi
    
    # Attacher la politique
    if aws iam attach-user-policy \
      --user-name "$USER_NAME" \
      --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}" &>/dev/null; then
      echo "   ✅ Attachée avec succès"
    else
      echo "   ❌ Erreur lors de l'attachement"
    fi
  done
  
  echo ""
  echo "✅ Toutes les politiques ont été attachées à l'utilisateur $USER_NAME"
else
  echo "⏭️  Attachement des politiques ignoré"
  echo ""
  echo "Pour attacher manuellement, utilisez:"
  echo "  aws iam attach-user-policy \\"
  echo "    --user-name $USER_NAME \\"
  echo "    --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/<POLICY_NAME>"
fi

echo ""
echo "✨ Terminé !"
echo ""
echo "💡 Vérification:"
echo "   aws iam list-attached-user-policies --user-name $USER_NAME"

