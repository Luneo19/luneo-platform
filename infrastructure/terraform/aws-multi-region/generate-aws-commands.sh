#!/bin/bash
# Script pour générer les commandes AWS CLI à partir du fichier JSON

JSON_FILE="policies-update-commands.json"
BASE_DIR="$(dirname "$0")"

if [ ! -f "$JSON_FILE" ]; then
  echo "❌ Fichier $JSON_FILE non trouvé"
  exit 1
fi

echo "📋 Génération des commandes AWS CLI pour mettre à jour les politiques"
echo "=================================================="
echo ""

# Extraire les politiques depuis le JSON
policies=$(cat "$JSON_FILE" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for policy in data['policies']:
    print(f\"{policy['name']}|{policy['arn']}|{policy['json_file']}\")
" 2>/dev/null)

if [ -z "$policies" ]; then
  echo "⚠️  Python3 non disponible, utilisation de jq..."
  if ! command -v jq &> /dev/null; then
    echo "❌ jq non disponible non plus. Veuillez installer python3 ou jq"
    exit 1
  fi
  policies=$(cat "$JSON_FILE" | jq -r '.policies[] | "\(.name)|\(.arn)|\(.json_file)"')
fi

echo "# Commandes AWS CLI pour mettre à jour les politiques IAM"
echo "# Copiez-collez ces commandes une par une dans votre terminal"
echo ""
echo "cd $BASE_DIR"
echo ""

for policy_entry in $policies; do
  IFS='|' read -r name arn json_file <<< "$policy_entry"
  
  echo "# =========================================="
  echo "# Politique: $name"
  echo "# =========================================="
  echo ""
  echo "# Vérifier que la politique existe"
  echo "aws iam get-policy --policy-arn \"$arn\""
  echo ""
  echo "# Créer une nouvelle version de la politique"
  echo "aws iam create-policy-version \\"
  echo "  --policy-arn \"$arn\" \\"
  echo "  --policy-document file://$json_file \\"
  echo "  --set-as-default"
  echo ""
  echo "# Si erreur 'LimitExceeded', lister les versions puis supprimer une ancienne:"
  echo "# aws iam list-policy-versions --policy-arn \"$arn\""
  echo "# aws iam delete-policy-version --policy-arn \"$arn\" --version-id vX"
  echo ""
  echo "echo \"✅ Politique $name mise à jour\""
  echo "echo \"\""
  echo ""
done

echo "# =========================================="
echo "# Vérification finale"
echo "# =========================================="
echo ""
echo "echo \"📋 Vérification des versions par défaut:\""
for policy_entry in $policies; do
  IFS='|' read -r name arn json_file <<< "$policy_entry"
  echo "echo \"$name:\""
  echo "aws iam get-policy --policy-arn \"$arn\" --query 'Policy.DefaultVersionId' --output text"
done
echo ""
echo "echo \"\""
echo "echo \"✨ Toutes les politiques ont été mises à jour !\""
echo "echo \"💡 Attendez 1-2 minutes puis relancez: terraform apply tfplan\""

