#!/bin/bash

# ★★★ SCRIPT DE DÉPLOIEMENT VERCEL ★★★
# Déploie le frontend Luneo sur Vercel

set -e

echo "🚀 Déploiement Vercel - Frontend Luneo"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "apps/frontend/package.json" ]; then
    echo -e "${RED}❌ Erreur: Ce script doit être exécuté depuis la racine du projet${NC}"
    exit 1
fi

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI n'est pas installé${NC}"
    echo "Installation de Vercel CLI..."
    npm install -g vercel
fi

echo "📋 Vérification de la configuration..."
echo ""

# Vérifier les variables d'environnement critiques
echo "🔍 Variables d'environnement requises:"
echo "   - NEXT_PUBLIC_APP_URL (ex: https://luneo.app)"
echo "   - NEXT_PUBLIC_API_URL (ex: https://api.luneo.app)"
echo ""

read -p "Voulez-vous continuer avec le déploiement? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Déploiement annulé."
    exit 0
fi

echo ""
echo "📦 Préparation du déploiement..."
echo ""

# Aller dans le répertoire frontend
cd apps/frontend

# Vérifier que le build fonctionne localement (optionnel)
read -p "Voulez-vous tester le build localement avant de déployer? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔨 Test du build local..."
    pnpm install
    pnpm run build
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Le build a échoué. Corrigez les erreurs avant de déployer.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Build réussi!${NC}"
    echo ""
fi

# Déployer sur Vercel
echo "🚀 Déploiement sur Vercel..."
echo ""

# Option: production ou preview
read -p "Déployer en production? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Déploiement en production..."
    vercel --prod
else
    echo "🧪 Déploiement en preview..."
    vercel
fi

echo ""
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Vérifier le déploiement sur https://vercel.com"
echo "   2. Tester les routes principales:"
echo "      - https://luneo.app/"
echo "      - https://luneo.app/login"
echo "      - https://luneo.app/admin (après login)"
echo "   3. Vérifier les logs en cas d'erreur"
echo ""
