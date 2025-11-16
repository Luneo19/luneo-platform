#!/bin/bash
# Script pour rendre le repository public (nécessaire pour la protection des branches gratuite)
# Usage: ./scripts/make-repo-public.sh

set -e

REPO="Luneo19/luneo-platform"

echo "⚠️  ATTENTION: Rendre le repository public expose le code publiquement"
echo "Assurez-vous qu'aucun secret n'est dans le code avant de continuer !"
echo ""
read -p "Rendre ${REPO} public? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Annulé"
    exit 0
fi

# Vérifier qu'aucun secret n'est présent
echo "🔒 Vérification des secrets..."
if ./scripts/check-secrets.sh 2>&1 | grep -q "❌"; then
    echo "❌ Des secrets ont été détectés. Ne rendez PAS le repository public !"
    exit 1
fi

# Rendre le repository public
gh repo edit "$REPO" --visibility public

echo "✅ Repository rendu public"
echo "Vous pouvez maintenant configurer les branches protégées via l'interface GitHub ou le script setup-branch-protection.sh"

