#!/bin/bash

# 🚀 SCRIPT DE CONFIGURATION DÉPLOIEMENT AUTOMATIQUE
# Configure Railway et Vercel pour le déploiement automatique

set -e

echo "🚀 CONFIGURATION DÉPLOIEMENT AUTOMATIQUE"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 1. RAILWAY CONFIGURATION
echo -e "${BLUE}📦 CONFIGURATION RAILWAY (Backend)${NC}"
echo ""

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Railway CLI non installé${NC}"
    echo "Installation: npm i -g @railway/cli"
    read -p "Installer maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm i -g @railway/cli
    else
        echo "Skipping Railway setup..."
    fi
fi

if command -v railway &> /dev/null; then
    echo -e "${GREEN}✅ Railway CLI détecté${NC}"
    
    # Vérifier connexion
    if railway whoami &> /dev/null; then
        echo -e "${GREEN}✅ Connecté à Railway${NC}"
        
        # Générer token Railway pour GitHub Actions
        echo ""
        echo -e "${YELLOW}📝 Pour configurer Railway dans GitHub Actions:${NC}"
        echo "1. Allez sur: https://railway.app/account/tokens"
        echo "2. Créez un nouveau token"
        echo "3. Ajoutez-le dans GitHub Secrets comme: RAILWAY_TOKEN"
        echo "4. Ajoutez votre SERVICE_ID comme: RAILWAY_SERVICE_ID"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Non connecté à Railway${NC}"
        echo "Connexion: railway login"
    fi
else
    echo -e "${YELLOW}⚠️  Railway CLI non disponible${NC}"
fi

echo ""
echo -e "${BLUE}📦 CONFIGURATION VERCEL (Frontend)${NC}"
echo ""

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI non installé${NC}"
    echo "Installation: npm i -g vercel"
    read -p "Installer maintenant? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npm i -g vercel
    else
        echo "Skipping Vercel setup..."
    fi
fi

if command -v vercel &> /dev/null; then
    echo -e "${GREEN}✅ Vercel CLI détecté${NC}"
    
    # Vérifier connexion
    if vercel whoami &> /dev/null; then
        echo -e "${GREEN}✅ Connecté à Vercel${NC}"
        
        # Récupérer les IDs du projet
        if [ -f "apps/frontend/.vercel/project.json" ]; then
            echo -e "${GREEN}✅ Projet Vercel détecté${NC}"
            echo ""
            echo -e "${YELLOW}📝 Pour configurer Vercel dans GitHub Actions:${NC}"
            echo "1. Allez sur: https://vercel.com/account/tokens"
            echo "2. Créez un nouveau token"
            echo "3. Ajoutez-le dans GitHub Secrets comme: VERCEL_TOKEN"
            echo "4. Récupérez ORG_ID et PROJECT_ID depuis .vercel/project.json"
            echo "5. Ajoutez-les dans GitHub Secrets"
        else
            echo -e "${YELLOW}⚠️  Projet Vercel non lié${NC}"
            echo "Liaison: cd apps/frontend && vercel link"
        fi
    else
        echo -e "${YELLOW}⚠️  Non connecté à Vercel${NC}"
        echo "Connexion: vercel login"
    fi
else
    echo -e "${YELLOW}⚠️  Vercel CLI non disponible${NC}"
fi

echo ""
echo -e "${BLUE}📋 GITHUB SECRETS REQUIS${NC}"
echo ""
echo "Pour activer le déploiement automatique, ajoutez ces secrets dans GitHub:"
echo ""
echo "RAILWAY_TOKEN=<votre_token_railway>"
echo "RAILWAY_SERVICE_ID=<votre_service_id>"
echo "VERCEL_TOKEN=<votre_token_vercel>"
echo "VERCEL_ORG_ID=<votre_org_id>"
echo "VERCEL_PROJECT_ID=<votre_project_id>"
echo ""
echo "URL: https://github.com/Luneo19/luneo-platform/settings/secrets/actions"
echo ""

echo -e "${GREEN}✅ Configuration terminée !${NC}"
echo ""
echo "Les workflows GitHub Actions sont prêts:"
echo "- .github/workflows/deploy-railway-backend.yml"
echo "- .github/workflows/deploy-vercel-frontend.yml"
echo ""
echo "Ils se déclencheront automatiquement à chaque push sur main !"
