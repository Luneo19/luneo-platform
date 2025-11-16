#!/bin/bash
# Script pour attacher toutes les politiques Terraform à l'utilisateur
# Utilisez ce script si les politiques ont déjà été créées par un administrateur

set -e

USER_NAME="191197Em."
ACCOUNT_ID="115849270532"

# Liste des noms de politiques
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
FAILED=()

for policy_name in "${POLICIES[@]}"; do
  policy_arn="arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}"
  
  echo "📎 Vérification de: $policy_name"
  
  # Vérifier si la politique existe
  if ! aws iam get-policy --policy-arn "$policy_arn" &>/dev/null; then
    echo "   ⚠️  La politique n'existe pas encore"
    FAILED+=("$policy_name")
    continue
  fi
  
  # Vérifier si elle est déjà attachée
  if aws iam list-attached-user-policies --user-name "$USER_NAME" --query "AttachedPolicies[?PolicyName=='${policy_name}'].PolicyName" --output text | grep -q "$policy_name"; then
    echo "   ✅ Déjà attachée"
    ATTACHED+=("$policy_name")
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
echo "✅ Politiques attachées/existantes: ${#ATTACHED[@]}"
for policy in "${ATTACHED[@]}"; do
  echo "   - $policy"
done

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "❌ Politiques non attachées: ${#FAILED[@]}"
  for policy in "${FAILED[@]}"; do
    echo "   - $policy"
  done
  echo ""
  echo "💡 Ces politiques doivent être créées d'abord via la console AWS"
  echo "   Voir GUIDE_CREATION_CONSOLE.md pour les instructions"
fi

echo ""
echo "✨ Terminé !"
echo ""
echo "💡 Vérification:"
echo "   aws iam list-attached-user-policies --user-name $USER_NAME"

