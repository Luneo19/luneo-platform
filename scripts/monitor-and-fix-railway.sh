#!/bin/bash
# Script de monitoring et correction automatique Railway

set -e

PROJECT_ID="${RAILWAY_PROJECT_ID:-0e3eb9ba-6846-4e0e-81d2-bd7da54da971}"
RAILWAY_TOKEN="${RAILWAY_TOKEN:-98f816d7-42b1-4095-966e-81b2322482e0}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Monitoring et Correction Automatique Railway${NC}"
echo "Project ID: $PROJECT_ID"
echo ""

# Configurer le token
mkdir -p ~/.railway
cat > ~/.railway/config.json <<EOF
{"token":"$RAILWAY_TOKEN"}
EOF

# Fonction pour récupérer les logs de build
get_build_logs() {
    railway logs --build --tail 500 2>&1
}

# Fonction pour analyser les erreurs
analyze_errors() {
    local logs="$1"
    
    # Chercher les erreurs TypeScript
    if echo "$logs" | grep -q "TS[0-9]"; then
        echo -e "${RED}❌ Erreurs TypeScript détectées${NC}"
        echo "$logs" | grep -E "TS[0-9]+|error TS" | head -20
        return 1
    fi
    
    # Chercher les erreurs de build
    if echo "$logs" | grep -qi "error\|failed\|fail"; then
        echo -e "${RED}❌ Erreurs de build détectées${NC}"
        echo "$logs" | grep -iE "error|failed|fail" | tail -30
        return 1
    fi
    
    return 0
}

# Fonction pour corriger les erreurs automatiquement
fix_errors() {
    local error_log="$1"
    
    echo -e "${YELLOW}🔧 Tentative de correction automatique...${NC}"
    
    # Erreurs TypeScript communes
    if echo "$error_log" | grep -q "Cannot find module"; then
        echo -e "${BLUE}📝 Erreur: Module manquant${NC}"
        # À implémenter selon l'erreur spécifique
    fi
    
    if echo "$error_log" | grep -q "Property.*does not exist"; then
        echo -e "${BLUE}📝 Erreur: Propriété inexistante${NC}"
        # À implémenter selon l'erreur spécifique
    fi
    
    if echo "$error_log" | grep -q "is not assignable"; then
        echo -e "${BLUE}📝 Erreur: Type incompatible${NC}"
        # À implémenter selon l'erreur spécifique
    fi
}

# Récupérer les logs actuels
echo -e "${BLUE}📋 Récupération des logs de build...${NC}"
BUILD_LOGS=$(get_build_logs)

# Afficher les dernières lignes
echo "$BUILD_LOGS" | tail -50

# Analyser les erreurs
echo ""
echo -e "${BLUE}📊 Analyse des erreurs...${NC}"
if analyze_errors "$BUILD_LOGS"; then
    echo -e "${GREEN}✅ Aucune erreur détectée dans les logs${NC}"
else
    echo -e "${RED}❌ Erreurs détectées${NC}"
    
    # Extraire les erreurs spécifiques
    ERRORS=$(echo "$BUILD_LOGS" | grep -iE "error TS|Found.*error|error:" | head -20)
    
    echo ""
    echo -e "${YELLOW}📝 Erreurs trouvées:${NC}"
    echo "$ERRORS"
    
    # Essayer de corriger automatiquement
    fix_errors "$ERRORS"
fi

# Vérifier le statut du déploiement
echo ""
echo -e "${BLUE}📊 Statut du déploiement...${NC}"
railway status 2>&1 || true

# Attendre et surveiller les nouveaux logs
echo ""
echo -e "${BLUE}⏳ Surveillance des nouveaux logs (Ctrl+C pour arrêter)...${NC}"
echo ""

LAST_LOG_LINE=""
while true; do
    sleep 5
    
    CURRENT_LOGS=$(railway logs --tail 10 2>&1 | tail -5)
    
    if [ "$CURRENT_LOGS" != "$LAST_LOG_LINE" ]; then
        echo -e "${GREEN}[$(date +%H:%M:%S)] Nouveaux logs:${NC}"
        echo "$CURRENT_LOGS"
        echo ""
        
        # Vérifier s'il y a des erreurs dans les nouveaux logs
        if echo "$CURRENT_LOGS" | grep -qiE "error|failed|fail|exception"; then
            echo -e "${RED}⚠️  Erreur détectée dans les nouveaux logs!${NC}"
            analyze_errors "$CURRENT_LOGS"
        fi
        
        LAST_LOG_LINE="$CURRENT_LOGS"
    fi
done

