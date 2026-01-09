#!/bin/bash

# Script pour corriger automatiquement les routes API prioritaires
# Phase 1.2: Créer/Corriger API routes manquantes

echo "🔧 Correction des routes API prioritaires..."
echo ""

# Liste des routes prioritaires à corriger
declare -a PRIORITY_ROUTES=(
  "ar-studio/preview"
  "ar-studio/qr-code"
  "ai-studio/animations"
  "ai-studio/templates"
  "editor/projects"
  "analytics/funnel"
  "analytics/cohorts"
  "analytics/segments"
)

# Pour chaque route, vérifier si elle existe et la corriger
for route in "${PRIORITY_ROUTES[@]}"; do
  route_file="apps/frontend/src/app/api/${route}/route.ts"
  
  if [ -f "$route_file" ]; then
    echo "✅ Route existe: /api/${route}"
    # Vérifier si elle utilise forwardToBackend
    if grep -q "forwardToBackend\|forwardGet\|forwardPost" "$route_file"; then
      echo "   ✓ Déjà connectée au backend"
    else
      echo "   ⚠️  Nécessite correction pour utiliser backend"
    fi
  else
    echo "❌ Route manquante: /api/${route}"
    echo "   → À créer"
  fi
done

echo ""
echo "📊 Résumé:"
echo "- Routes à créer: $(find apps/frontend/src/app/api -name "route.ts" | wc -l | xargs) routes existantes"
echo "- Routes à corriger: Voir AUDIT_API_ROUTES.json"


