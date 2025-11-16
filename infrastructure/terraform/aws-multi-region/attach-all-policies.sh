#!/bin/bash
# Script pour attacher toutes les politiques Terraform à l'utilisateur

set -e

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

echo "🔗 Attachement des politiques IAM à l'utilisateur $USER_NAME"
echo "=================================================="
echo ""

ATTACHED=()
ALREADY_ATTACHED=()
FAILED=()

for policy_name in "${POLICIES[@]}"; do
  policy_arn="arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}"
  
  echo "📎 Vérification de: $policy_name"
  
  # Vérifier si la politique existe
  if ! aws iam get-policy --policy-arn "$policy_arn" &>/dev/null; then
    echo "   ⚠️  La politique n'existe pas"
    FAILED+=("$policy_name")
    continue
  fi
  
  # Vérifier si elle est déjà attachée
  if aws iam list-attached-user-policies --user-name "$USER_NAME" --query "AttachedPolicies[?PolicyName=='${policy_name}'].PolicyName" --output text 2>/dev/null | grep -q "$policy_name"; then
    echo "   ✅ Déjà attachée"
    ALREADY_ATTACHED+=("$policy_name")
    continue
  fi
  
  # Attacher la politique
  if aws iam attach-user-policy \
    --user-name "$USER_NAME" \
    --policy-arn "$policy_arn" &>/dev/null; then
    echo "   ✅ Attachée avec succès"
    ATTACHED+=("$policy_name")
  else
    echo "   ❌ Erreur lors de l'attachement"
    FAILED+=("$policy_name")
  fi
done

echo ""
echo "=================================================="
echo "📊 Résumé"
echo "=================================================="
echo "✅ Politiques attachées maintenant: ${#ATTACHED[@]}"
for policy in "${ATTACHED[@]}"; do
  echo "   - $policy"
done

if [ ${#ALREADY_ATTACHED[@]} -gt 0 ]; then
  echo ""
  echo "✅ Politiques déjà attachées: ${#ALREADY_ATTACHED[@]}"
  for policy in "${ALREADY_ATTACHED[@]}"; do
    echo "   - $policy"
  done
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "❌ Politiques non attachées: ${#FAILED[@]}"
  for policy in "${FAILED[@]}"; do
    echo "   - $policy"
  done
fi

echo ""
echo "✨ Terminé !"
echo ""
echo "💡 Vérification:"
echo "   aws iam list-attached-user-policies --user-name $USER_NAME --output table"

