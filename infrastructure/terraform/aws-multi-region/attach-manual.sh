#!/bin/bash
# Script pour attacher manuellement les politiques avec gestion d'erreurs

USER_NAME="191197Em."
ACCOUNT_ID="115849270532"

POLICIES=(
  "terraform-state-backend"
  "terraform-infrastructure-readonly"
  "terraform-vpc-networking"
  "terraform-eks-management"
  "terraform-rds-aurora"
  "terraform-s3-artifacts"
  "terraform-route53-dns"
  "terraform-cloudwatch-monitoring"
  "terraform-backup-management"
  "terraform-iam-management"
)

echo "🔗 Attachement des politiques IAM"
echo "=================================================="
echo ""

for policy_name in "${POLICIES[@]}"; do
  policy_arn="arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}"
  
  echo "📎 Tentative d'attachement: $policy_name"
  
  if output=$(aws iam attach-user-policy \
    --user-name "$USER_NAME" \
    --policy-arn "$policy_arn" 2>&1); then
    echo "   ✅ Attachée avec succès"
  else
    if echo "$output" | grep -q "NoSuchEntity"; then
      echo "   ⚠️  La politique n'existe pas avec ce nom"
    elif echo "$output" | grep -q "EntityAlreadyExists"; then
      echo "   ✅ Déjà attachée"
    else
      echo "   ❌ Erreur: $output"
    fi
  fi
done

echo ""
echo "✨ Terminé !"
