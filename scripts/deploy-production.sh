#!/bin/bash

# Script de déploiement production automatisé
# Usage: ./scripts/deploy-production.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Déploiement Production Luneo${NC}"
echo "=========================================="
echo ""

# Vérifications préalables
echo -e "${BLUE}📋 Vérifications préalables...${NC}"
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    echo "   Installation: npm i -g vercel"
    exit 1
fi

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI non installé${NC}"
    echo "   Installation: npm i -g @railway/cli"
    echo "   Ou continuer sans Railway (backend sur Vercel)"
    read -p "Continuer sans Railway? (oui/non): " continue_without_railway
    if [ "$continue_without_railway" != "oui" ]; then
        exit 1
    fi
    USE_RAILWAY=false
else
    USE_RAILWAY=true
fi

echo -e "${GREEN}✅ CLI tools vérifiés${NC}"
echo ""

# Vérifier connexions
echo -e "${BLUE}🔐 Vérification des connexions...${NC}"
echo ""

if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Non connecté à Vercel${NC}"
    echo "   Exécuter: vercel login"
    exit 1
fi
echo -e "${GREEN}✅ Connecté à Vercel: $(vercel whoami)${NC}"

if [ "$USE_RAILWAY" = true ]; then
    if ! railway whoami &> /dev/null; then
        echo -e "${YELLOW}⚠️  Non connecté à Railway${NC}"
        echo "   Exécuter: railway login"
        USE_RAILWAY=false
    else
        echo -e "${GREEN}✅ Connecté à Railway: $(railway whoami)${NC}"
    fi
fi

echo ""

# Résumé de la configuration
echo -e "${BLUE}📊 Configuration de déploiement:${NC}"
echo "  - Frontend: Vercel"
if [ "$USE_RAILWAY" = true ]; then
    echo "  - Backend: Railway (recommandé)"
else
    echo "  - Backend: Vercel"
fi
echo ""

read -p "Continuer avec le déploiement? (oui/non): " confirm_deploy
if [ "$confirm_deploy" != "oui" ]; then
    echo "Déploiement annulé"
    exit 0
fi

echo ""

# Déploiement Backend
echo -e "${BLUE}🚀 Déploiement Backend...${NC}"
echo ""

if [ "$USE_RAILWAY" = true ]; then
    echo "Déploiement sur Railway..."
    cd apps/backend
    
    # Vérifier que le projet est lié
    if ! railway status &> /dev/null; then
        echo -e "${YELLOW}⚠️  Projet Railway non lié${NC}"
        echo "   Lier le projet: railway link"
        read -p "Voulez-vous lier le projet maintenant? (oui/non): " link_railway
        if [ "$link_railway" = "oui" ]; then
            railway link
        else
            echo -e "${RED}❌ Déploiement Railway annulé${NC}"
            USE_RAILWAY=false
        fi
    fi
    
    if [ "$USE_RAILWAY" = true ]; then
        echo "Déploiement en cours..."
        railway up --detach || {
            echo -e "${YELLOW}⚠️  Erreur lors du déploiement Railway${NC}"
            echo "   Vérifiez les logs: railway logs"
        }
        echo -e "${GREEN}✅ Backend déployé sur Railway${NC}"
    fi
    
    cd ../..
else
    echo "Déploiement sur Vercel..."
    cd apps/backend
    
    # Vérifier que le projet est lié
    if [ ! -f .vercel/project.json ]; then
        echo -e "${YELLOW}⚠️  Projet Vercel non lié${NC}"
        echo "   Lier le projet: vercel link"
        read -p "Voulez-vous lier le projet maintenant? (oui/non): " link_vercel
        if [ "$link_vercel" = "oui" ]; then
            vercel link
        else
            echo -e "${RED}❌ Déploiement Vercel annulé${NC}"
            exit 1
        fi
    fi
    
    echo "Déploiement en cours..."
    vercel --prod || {
        echo -e "${YELLOW}⚠️  Erreur lors du déploiement Vercel${NC}"
        echo "   Vérifiez les logs: vercel logs"
    }
    echo -e "${GREEN}✅ Backend déployé sur Vercel${NC}"
    
    cd ../..
fi

echo ""

# Déploiement Frontend
echo -e "${BLUE}🚀 Déploiement Frontend...${NC}"
echo ""

cd apps/frontend

# Vérifier que le projet est lié
if [ ! -f .vercel/project.json ]; then
    echo -e "${YELLOW}⚠️  Projet Vercel non lié${NC}"
    echo "   Lier le projet: vercel link"
    read -p "Voulez-vous lier le projet maintenant? (oui/non): " link_vercel_frontend
    if [ "$link_vercel_frontend" = "oui" ]; then
        vercel link
    else
        echo -e "${RED}❌ Déploiement Frontend annulé${NC}"
        exit 1
    fi
fi

echo "Déploiement en cours..."
vercel --prod || {
    echo -e "${YELLOW}⚠️  Erreur lors du déploiement Frontend${NC}"
    echo "   Vérifiez les logs: vercel logs"
}

echo -e "${GREEN}✅ Frontend déployé sur Vercel${NC}"

cd ../..

echo ""

# Résumé final
echo "=========================================="
echo -e "${GREEN}✅ Déploiement Terminé${NC}"
echo "=========================================="
echo ""
echo "📋 URLs de déploiement:"
if [ "$USE_RAILWAY" = true ]; then
    echo "  - Backend: Vérifiez dans Railway Dashboard"
    echo "    Commande: railway open"
fi
echo "  - Frontend: Vérifiez dans Vercel Dashboard"
echo "    Commande: vercel ls"
echo ""
echo "🧪 Pour tester:"
echo "  - Health check: curl <BACKEND_URL>/api/v1/health"
echo "  - Frontend: Ouvrir <FRONTEND_URL>"
echo ""
