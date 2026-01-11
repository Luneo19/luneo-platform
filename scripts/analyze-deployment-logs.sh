#!/bin/bash

# Script d'analyse des logs de déploiement
# Usage: ./scripts/analyze-deployment-logs.sh

set -e

echo "📊 ANALYSE LOGS DÉPLOIEMENT"
echo "============================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Analyser logs Railway
echo "🔍 Analyse logs Railway..."
cd apps/backend

if railway logs --tail 100 2>&1 | grep -i "error\|fail\|exception" > /tmp/railway-errors.log; then
    ERROR_COUNT=$(wc -l < /tmp/railway-errors.log)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $ERROR_COUNT erreurs trouvées dans les logs Railway${NC}"
        echo "Dernières erreurs:"
        tail -10 /tmp/railway-errors.log
    else
        echo -e "${GREEN}✅ Aucune erreur critique dans les logs Railway${NC}"
    fi
else
    echo -e "${GREEN}✅ Aucune erreur trouvée${NC}"
fi

# Vérifier health check
echo ""
echo "🏥 Vérification health check..."
BACKEND_URL=$(railway status 2>&1 | grep -oP 'https?://[^\s]+' | head -1 || railway domain 2>&1 | grep -oP 'https?://[^\s]+' | head -1 || echo "")

if [ -z "$BACKEND_URL" ]; then
    # Essayer de récupérer depuis les variables
    BACKEND_URL=$(railway variables get RAILWAY_PUBLIC_DOMAIN 2>&1 | grep -v "not found" | awk '{print $NF}' || echo "")
fi

if [ -n "$BACKEND_URL" ]; then
    echo "Backend URL: $BACKEND_URL"
    
    # Test health check
    HEALTH=$(curl -s "$BACKEND_URL/health" 2>&1 || echo "FAILED")
    if [[ "$HEALTH" == *"ok"* ]] || [[ "$HEALTH" == *"status"* ]]; then
        echo -e "${GREEN}✅ Health check OK${NC}"
        echo "$HEALTH" | head -5
    else
        echo -e "${RED}❌ Health check échoué${NC}"
        echo "Response: $HEALTH"
    fi
    
    # Test metrics
    METRICS=$(curl -s "$BACKEND_URL/health/metrics" 2>&1 | head -10 || echo "FAILED")
    if [[ "$METRICS" == *"agent_"* ]] || [[ "$METRICS" == *"http_"* ]]; then
        echo -e "${GREEN}✅ Endpoint metrics accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Endpoint metrics non accessible ou vide${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  URL backend non disponible${NC}"
fi

# Analyser logs Vercel
echo ""
echo "🔍 Analyse logs Vercel..."
cd ../frontend

FRONTEND_URL=$(vercel ls --json 2>&1 | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['url'] if isinstance(data, list) and len(data) > 0 else '')" 2>/dev/null || echo "")

if [ -z "$FRONTEND_URL" ]; then
    FRONTEND_URL="https://frontend-2rtl4wtam-luneos-projects.vercel.app"
fi

if [ -n "$FRONTEND_URL" ]; then
    echo "Frontend URL: $FRONTEND_URL"
    
    # Test frontend
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>&1 || echo "000")
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Frontend accessible (HTTP $FRONTEND_RESPONSE)${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend retourne HTTP $FRONTEND_RESPONSE${NC}"
    fi
fi

# Résumé
echo ""
echo "============================"
echo "📊 RÉSUMÉ ANALYSE"
echo "============================"
echo ""
echo "Backend Railway:"
echo "  - URL: ${BACKEND_URL:-Non disponible}"
echo "  - Health: $(if [ -n "$BACKEND_URL" ] && curl -s "$BACKEND_URL/health" | grep -q "ok"; then echo "✅ OK"; else echo "❌ Échec"; fi)"
echo ""
echo "Frontend Vercel:"
echo "  - URL: ${FRONTEND_URL:-Non disponible}"
echo "  - Status: $(if [ -n "$FRONTEND_URL" ] && [ "$FRONTEND_RESPONSE" = "200" ]; then echo "✅ OK"; else echo "⚠️  À vérifier"; fi)"
echo ""
