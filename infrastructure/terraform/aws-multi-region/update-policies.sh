#!/bin/bash
# Script pour mettre à jour les politiques IAM existantes avec les nouvelles versions

set -e

ACCOUNT_ID="115849270532"
POLICIES_DIR="$(dirname "$0")/iam-policies"

echo "🔄 Mise à jour des politiques IAM"
echo "=================================================="
echo ""

# Liste des politiques à mettre à jour (format: nom|fichier)
POLICIES=(
  "terraform-backup-management|09-terraform-backup-management.json"
  "terraform-s3-artifacts|06-terraform-s3-artifacts.json"
  "terraform-cloudwatch-monitoring|08-terraform-cloudwatch-monitoring.json"
  "terraform-vpc-networking|03-terraform-vpc-networking.json"
  "terraform-iam-management|10-terraform-iam-management.json"
)

UPDATED=()
FAILED=()

for policy_entry in "${POLICIES[@]}"; do
  IFS='|' read -r policy_name policy_file <<< "$policy_entry"
  policy_path="${POLICIES_DIR}/${policy_file}"
  policy_arn="arn:aws:iam::${ACCOUNT_ID}:policy/${policy_name}"
  
  echo "📝 Mise à jour de: $policy_name"
  
  if [ ! -f "$policy_path" ]; then
    echo "   ❌ Fichier non trouvé: $policy_path"
    FAILED+=("$policy_name")
    continue
  fi
  
  # Vérifier si la politique existe
  if ! aws iam get-policy --policy-arn "$policy_arn" &>/dev/null; then
    echo "   ⚠️  La politique n'existe pas encore"
    FAILED+=("$policy_name")
    continue
  fi
  
  # Créer une nouvelle version de la politique
  echo "   📄 Création d'une nouvelle version..."
  if output=$(aws iam create-policy-version \
    --policy-arn "$policy_arn" \
    --policy-document "file://${policy_path}" \
    --set-as-default 2>&1); then
    echo "   ✅ Politique mise à jour avec succès"
    UPDATED+=("$policy_name")
  else
    if echo "$output" | grep -q "MalformedPolicyDocument"; then
      echo "   ❌ Erreur: Document JSON malformé"
      echo "      $output"
    elif echo "$output" | grep -q "LimitExceeded"; then
      echo "   ⚠️  Limite de versions atteinte, suppression de l'ancienne version..."
      # Récupérer la version par défaut actuelle
      current_version=$(aws iam get-policy --policy-arn "$policy_arn" --query 'Policy.DefaultVersionId' --output text)
      # Lister toutes les versions
      versions=$(aws iam list-policy-versions --policy-arn "$policy_arn" --query 'Versions[?IsDefaultVersion==`false`].VersionId' --output text)
      # Supprimer une ancienne version si possible
      if [ -n "$versions" ]; then
        old_version=$(echo "$versions" | awk '{print $1}')
        aws iam delete-policy-version --policy-arn "$policy_arn" --version-id "$old_version" &>/dev/null
        echo "   🔄 Nouvelle tentative..."
        if aws iam create-policy-version \
          --policy-arn "$policy_arn" \
          --policy-document "file://${policy_path}" \
          --set-as-default &>/dev/null; then
          echo "   ✅ Politique mise à jour avec succès"
          UPDATED+=("$policy_name")
        else
          echo "   ❌ Échec de la mise à jour"
          FAILED+=("$policy_name")
        fi
      else
        echo "   ❌ Impossible de supprimer une version (toutes sont nécessaires)"
        FAILED+=("$policy_name")
      fi
    else
      echo "   ❌ Erreur: $output"
      FAILED+=("$policy_name")
    fi
  fi
  echo ""
done

echo "=================================================="
echo "📊 Résumé"
echo "=================================================="
echo "✅ Politiques mises à jour: ${#UPDATED[@]}"
for policy in "${UPDATED[@]}"; do
  echo "   - $policy"
done

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo "❌ Politiques en échec: ${#FAILED[@]}"
  for policy in "${FAILED[@]}"; do
    echo "   - $policy"
  done
fi

echo ""
echo "✨ Terminé !"
echo ""
echo "💡 Les politiques mises à jour sont maintenant actives."
echo "   Vous pouvez relancer terraform apply."

