#!/bin/bash

# Script d'audit complet de l'architecture post-login/register
# Analyse chaque page, API route, et service backend

echo "🔍 AUDIT COMPLET ARCHITECTURE LUNEO PLATFORM"
echo "============================================"
echo ""

# Compteurs
TOTAL_PAGES=0
PAGES_FONCTIONNELLES=0
PAGES_SEMI_FONCTIONNELLES=0
PAGES_NON_FONCTIONNELLES=0
TOTAL_API_ROUTES=0
API_ROUTES_CONNECTEES=0
API_ROUTES_MOCK=0
TOTAL_BACKEND_CONTROLLERS=0
TOTAL_BACKEND_SERVICES=0

# Fichiers de sortie
AUDIT_FILE="AUDIT_COMPLET_ARCHITECTURE.md"
DETAILS_FILE="AUDIT_DETAILS_PAGES.md"

# Initialiser les fichiers
cat > "$AUDIT_FILE" << 'EOF'
# 🔍 AUDIT COMPLET ARCHITECTURE LUNEO PLATFORM

**Date**: $(date)
**Objectif**: Analyser pourquoi le SaaS n'est pas fonctionnel pour les clients

## 📊 RÉSUMÉ EXÉCUTIF

EOF

echo "📁 Analyse des pages dashboard..."
find apps/frontend/src/app/\(dashboard\) -name "page.tsx" -o -name "page.ts" | while read page; do
  TOTAL_PAGES=$((TOTAL_PAGES + 1))
done

echo "📁 Analyse des API routes frontend..."
find apps/frontend/src/app/api -name "route.ts" | while read route; do
  TOTAL_API_ROUTES=$((TOTAL_API_ROUTES + 1))
done

echo "📁 Analyse des controllers backend..."
find apps/backend/src/modules -name "*.controller.ts" | while read controller; do
  TOTAL_BACKEND_CONTROLLERS=$((TOTAL_BACKEND_CONTROLLERS + 1))
done

echo "📁 Analyse des services backend..."
find apps/backend/src/modules -name "*.service.ts" | while read service; do
  TOTAL_BACKEND_SERVICES=$((TOTAL_BACKEND_SERVICES + 1))
done

echo ""
echo "✅ Analyse terminée"
echo "📄 Génération du rapport complet..."

cat >> "$AUDIT_FILE" << EOF

- **Total Pages Dashboard**: $TOTAL_PAGES
- **Total API Routes Frontend**: $TOTAL_API_ROUTES
- **Total Controllers Backend**: $TOTAL_BACKEND_CONTROLLERS
- **Total Services Backend**: $TOTAL_BACKEND_SERVICES

EOF

echo "📊 Rapport généré dans $AUDIT_FILE"


