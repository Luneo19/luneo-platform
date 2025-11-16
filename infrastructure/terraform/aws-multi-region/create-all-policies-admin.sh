#!/bin/bash
# Script pour créer toutes les politiques IAM - À EXÉCUTER PAR UN ADMINISTRATEUR
# Ce script nécessite les permissions iam:CreatePolicy

set -e

ACCOUNT_ID="115849270532"
POLICIES_DIR="$(dirname "$0")/iam-policies"

echo "🚀 Création de toutes les politiques IAM pour Terraform"
echo "=================================================="
echo ""
echo "⚠️  Ce script nécessite les permissions iam:CreatePolicy"
echo ""

# Liste des politiques avec leurs descriptions
POLICIES=(
  "terraform-state-backend|01-terraform-state-backend.json|Permissions pour le backend Terraform (S3 + DynamoDB)"
  "terraform-infrastructure-readonly|02-terraform-infrastructure-readonly.json|Permissions en lecture seule pour découvrir les ressources AWS"
  "terraform-vpc-networking|03-terraform-vpc-networking.json|Permissions pour créer et gérer les VPC et réseaux"
  "terraform-eks-management|04-terraform-eks-management.json|Permissions pour créer et gérer les clusters EKS"
  "terraform-rds-aurora|05-terraform-rds-aurora.json|Permissions pour créer et gérer les clusters Aurora PostgreSQL"
  "terraform-s3-artifacts|06-terraform-s3-artifacts.json|Permissions pour créer et gérer les buckets S3 d'artifacts"
  "terraform-route53-dns|07-terraform-route53-dns.json|Permissions pour gérer les enregistrements DNS et health checks"
  "terraform-cloudwatch-monitoring|08-terraform-cloudwatch-monitoring.json|Permissions pour créer des alarmes et métriques CloudWatch"
  "terraform-backup-management|09-terraform-backup-management.json|Permissions pour créer et gérer les plans de sauvegarde AWS Backup"
  "terraform-iam-management|10-terraform-iam-management.json|Permissions pour créer et gérer les rôles IAM nécessaires aux services AWS"
)

CREATED=()
FAILED=()
EXISTS=()

for policy_entry in "${POLICIES[@]}"; do
  IFS='|' read -r policy_name policy_file description <<< "$policy_entry"
  policy_path="${POLICIES_DIR}/${policy_file}"
  policy_arn="arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}"
  
  echo "📝 Création de: $policy_name"
  echo "   Description: $description"
  
  if [ ! -f "$policy_path" ]; then
    echo "   ❌ Fichier non trouvé: $policy_path"
    FAILED+=("$policy_name")
    continue
  fi
  
  # Vérifier si la politique existe déjà
  if aws iam get-policy --policy-arn "$policy_arn" &>/dev/null 2>&1; then
    echo "   ⚠️  La politique existe déjà, passage à la suivante..."
    EXISTS+=("$policy_name")
    continue
  fi
  
  # Créer la politique
  if output=$(aws iam create-policy \
    --policy-name "$policy_name" \
    --policy-document "file://${policy_path}" \
    --description "$description" 2>&1); then
    echo "   ✅ Politique créée avec succès"
    CREATED+=("$policy_name")
  else
    echo "   ❌ Erreur: $output"
    FAILED+=("$policy_name")
  fi
  echo ""
done

# Résumé
echo "=================================================="
echo "📊 Résumé"
echo "=================================================="
echo "✅ Politiques créées: ${#CREATED[@]}"
for policy in "${CREATED[@]}"; do
  echo "   - $policy"
done

if [ ${#EXISTS[@]} -gt 0 ]; then
  echo ""
  echo "⚠️  Politiques déjà existantes: ${#EXISTS[@]}"
  for policy in "${EXISTS[@]}"; do
    echo "   - $policy"
  done
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "❌ Politiques en échec: ${#FAILED[@]}"
  for policy in "${FAILED[@]}"; do
    echo "   - $policy"
  done
fi

echo ""
echo "🔗 Attacher les politiques à l'utilisateur 191197Em."
echo "=================================================="

# Demander confirmation pour attacher les politiques
read -p "Voulez-vous attacher toutes ces politiques à l'utilisateur 191197Em. ? (o/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Oo]$ ]]; then
  USER_NAME="191197Em."
  ALL_POLICIES=("${CREATED[@]}" "${EXISTS[@]}")
  
  for policy_name in "${ALL_POLICIES[@]}"; do
    policy_arn="arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}"
    
    echo "📎 Attachement de: $policy_name"
    
    # Vérifier si déjà attachée
    if aws iam list-attached-user-policies --user-name "$USER_NAME" --query "AttachedPolicies[?PolicyName=='${policy_name}'].PolicyName" --output text 2>/dev/null | grep -q "$policy_name"; then
      echo "   ⚠️  Déjà attachée"
      continue
    fi
    
    # Attacher la politique
    if aws iam attach-user-policy \
      --user-name "$USER_NAME" \
      --policy-arn "$policy_arn" &>/dev/null; then
      echo "   ✅ Attachée avec succès"
    else
      echo "   ❌ Erreur lors de l'attachement"
    fi
  done
  
  echo ""
  echo "✅ Toutes les politiques ont été attachées à l'utilisateur $USER_NAME"
else
  echo "⏭️  Attachement ignoré"
  echo ""
  echo "Pour attacher manuellement:"
  echo "  aws iam attach-user-policy \\"
  echo "    --user-name 191197Em. \\"
  echo "    --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/<POLICY_NAME>"
fi

echo ""
echo "✨ Terminé !"

