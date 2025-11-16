#!/bin/bash
# Script pour générer les commandes AWS CLI à partir du fichier JSON

JSON_FILE="policies-creation-data.json"

if [ ! -f "$JSON_FILE" ]; then
  echo "❌ Fichier $JSON_FILE non trouvé"
  exit 1
fi

echo "# =========================================="
echo "# Commandes AWS CLI pour créer les politiques IAM"
echo "# Générées depuis: $JSON_FILE"
echo "# =========================================="
echo ""
echo "cd $(dirname "$0")"
echo ""
echo "# =========================================="
echo "# ÉTAPE 1: Création des politiques"
echo "# =========================================="
echo ""

# Utiliser Python ou jq pour parser le JSON
if command -v python3 &> /dev/null; then
  python3 << 'PYTHON_SCRIPT'
import json
import sys

with open('policies-creation-data.json', 'r') as f:
    data = json.load(f)

policies = sorted(data['policies'], key=lambda x: x['order'])

for policy in policies:
    print(f"# {policy['order']}/10: {policy['name']}")
    print(f"# {policy['description']}")
    print(f"aws iam create-policy \\")
    print(f"  --policy-name {policy['name']} \\")
    print(f"  --policy-document file://{policy['json_file']} \\")
    print(f"  --description \"{policy['description']}\"")
    print("")
    print("if [ $? -eq 0 ]; then")
    print(f"  echo \"✅ Politique {policy['name']} créée\"")
    print("else")
    print(f"  echo \"❌ Erreur lors de la création de {policy['name']}\"")
    print("fi")
    print("")
    print("")
PYTHON_SCRIPT

elif command -v jq &> /dev/null; then
  # Alternative avec jq si Python n'est pas disponible
  jq -r '.policies | sort_by(.order)[] | 
    "# \(.order)/10: \(.name)\n# \(.description)\naws iam create-policy \\\n  --policy-name \(.name) \\\n  --policy-document file://\(.json_file) \\\n  --description \"\(.description)\"\n\necho \"✅ Politique \(.name) créée\"\necho \"\"\n"' "$JSON_FILE"
else
  echo "❌ Python3 ou jq requis pour parser le JSON"
  exit 1
fi

echo ""
echo "# =========================================="
echo "# ÉTAPE 2: Attacher les politiques à l'utilisateur"
echo "# =========================================="
echo ""

if command -v python3 &> /dev/null; then
  python3 << 'PYTHON_SCRIPT'
import json

with open('policies-creation-data.json', 'r') as f:
    data = json.load(f)

user_name = data['user_name']
policies = sorted(data['policies'], key=lambda x: x['order'])

for policy in policies:
    print(f"# Attacher: {policy['name']}")
    print(f"aws iam attach-user-policy \\")
    print(f"  --user-name {user_name} \\")
    print(f"  --policy-arn {policy['arn']}")
    print("")
    print("if [ $? -eq 0 ]; then")
    print(f"  echo \"✅ Politique {policy['name']} attachée\"")
    print("else")
    print(f"  echo \"❌ Erreur lors de l'attachement de {policy['name']}\"")
    print("fi")
    print("")
PYTHON_SCRIPT
fi

echo ""
echo "# =========================================="
echo "# ÉTAPE 3: Vérification"
echo "# =========================================="
echo ""
echo "echo \"📋 Vérification des politiques attachées:\""
echo "aws iam list-attached-user-policies --user-name $(python3 -c "import json; print(json.load(open('policies-creation-data.json'))['user_name'])" 2>/dev/null || echo "191197Em.") --output table"
echo ""
echo "echo \"\""
echo "echo \"✨ Terminé !\""
echo "echo \"💡 Attendez 1-2 minutes puis relancez: terraform apply tfplan\""

