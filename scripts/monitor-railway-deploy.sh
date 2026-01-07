#!/bin/bash
# Script de monitoring du déploiement Railway en temps réel

set -e

RAILWAY_TOKEN="${RAILWAY_TOKEN:-98f816d7-42b1-4095-966e-81b2322482e0}"
SERVICE="${RAILWAY_SERVICE:-backend}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Monitoring Déploiement Railway${NC}"
echo "Service: $SERVICE"
echo ""

# Configurer le token
mkdir -p ~/.railway
cat > ~/.railway/config.json <<EOF
{"token":"$RAILWAY_TOKEN"}
EOF

# Fonction pour récupérer les logs de build
get_build_logs() {
    railway logs --build --tail 500 --service "$SERVICE" 2>&1
}

# Fonction pour analyser les erreurs
analyze_errors() {
    local logs="$1"
    local errors_found=0
    
    # Chercher les erreurs TypeScript
    if echo "$logs" | grep -qE "TS[0-9]+|Found.*error.*TS"; then
        echo -e "${RED}❌ Erreurs TypeScript détectées:${NC}"
        echo "$logs" | grep -E "TS[0-9]+|Found.*error.*TS" | head -30
        errors_found=1
    fi
    
    # Chercher les erreurs de build
    if echo "$logs" | grep -qiE "error:|failed|fail|ELIFECYCLE"; then
        echo -e "${RED}❌ Erreurs de build détectées:${NC}"
        echo "$logs" | grep -iE "error:|failed|fail|ELIFECYCLE" | tail -30
        errors_found=1
    fi
    
    # Chercher les erreurs de module
    if echo "$logs" | grep -qiE "Cannot find module|Module not found"; then
        echo -e "${RED}❌ Erreurs de module détectées:${NC}"
        echo "$logs" | grep -iE "Cannot find module|Module not found" | head -20
        errors_found=1
    fi
    
    return $errors_found
}

# Attendre que le build démarre
echo -e "${BLUE}⏳ Attente du démarrage du build...${NC}"
sleep 15

# Surveiller les logs toutes les 10 secondes
MAX_ITERATIONS=60
ITERATION=0
BUILD_STARTED=false
BUILD_COMPLETE=false

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    
    echo -e "${BLUE}[$(date +%H:%M:%S)] Vérification des logs (itération $ITERATION/$MAX_ITERATIONS)...${NC}"
    
    BUILD_LOGS=$(get_build_logs)
    
    # Vérifier si le build a démarré
    if echo "$BUILD_LOGS" | grep -qiE "RUN pnpm build|nest build"; then
        if [ "$BUILD_STARTED" = false ]; then
            echo -e "${GREEN}✅ Build démarré!${NC}"
            BUILD_STARTED=true
        fi
    fi
    
    # Vérifier si le build est terminé
    if echo "$BUILD_LOGS" | grep -qiE "Build time:|Healthcheck succeeded|Deploy failed|exporting to docker"; then
        if [ "$BUILD_COMPLETE" = false ]; then
            echo -e "${GREEN}✅ Build terminé!${NC}"
            BUILD_COMPLETE=true
            
            # Afficher les dernières lignes
            echo ""
            echo -e "${BLUE}📋 Dernières lignes du build:${NC}"
            echo "$BUILD_LOGS" | tail -30
            
            # Analyser les erreurs
            echo ""
            echo -e "${BLUE}📊 Analyse des erreurs...${NC}"
            if analyze_errors "$BUILD_LOGS"; then
                echo -e "${GREEN}✅ Aucune erreur détectée!${NC}"
                
                # Vérifier le healthcheck
                if echo "$BUILD_LOGS" | grep -qi "Healthcheck succeeded"; then
                    echo -e "${GREEN}✅ Healthcheck réussi!${NC}"
                    echo ""
                    echo -e "${GREEN}🎉 Déploiement réussi!${NC}"
                    exit 0
                else
                    echo -e "${YELLOW}⚠️  Healthcheck en cours...${NC}"
                fi
            else
                echo -e "${RED}❌ Erreurs détectées dans le build${NC}"
                echo ""
                echo -e "${YELLOW}📝 Logs complets sauvegardés dans /tmp/railway-build-errors.log${NC}"
                echo "$BUILD_LOGS" > /tmp/railway-build-errors.log
                exit 1
            fi
            
            # Si le build est terminé, sortir après quelques vérifications supplémentaires
            sleep 5
            break
        fi
    fi
    
    # Afficher les dernières lignes pour suivre la progression
    if [ "$BUILD_STARTED" = true ]; then
        echo "$BUILD_LOGS" | tail -5
    fi
    
    sleep 10
done

if [ "$BUILD_COMPLETE" = false ]; then
    echo -e "${YELLOW}⚠️  Timeout: Le build prend plus de temps que prévu${NC}"
    echo -e "${BLUE}📋 Derniers logs:${NC}"
    get_build_logs | tail -50
fi

