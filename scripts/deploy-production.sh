#!/bin/bash

# Script de déploiement production
# Guide l'utilisateur à travers le processus de déploiement

set -e

echo "🚀 Déploiement Production - Luneo Platform"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -d "apps/frontend" ]; then
  echo -e "${RED}❌ Répertoire incorrect. Exécutez depuis la racine du projet.${NC}"
  exit 1
fi

# Vérifier Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo -e "${RED}❌ Pas un repository Git${NC}"
  exit 1
fi

# Vérifier branche
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo -e "${YELLOW}⚠️  Vous n'êtes pas sur la branche 'main' (actuellement: $BRANCH)${NC}"
  read -p "Voulez-vous continuer quand même? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Déploiement annulé."
    exit 1
  fi
fi

# Vérifier changements non commités
if [ -n "$(git status --porcelain)" ]; then
  echo -e "${YELLOW}⚠️  Changements non commités détectés${NC}"
  git status --short
  echo ""
  read -p "Voulez-vous continuer quand même? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Déploiement annulé. Commitez vos changements d'abord."
    exit 1
  fi
fi

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
  echo -e "${YELLOW}⚠️  Vercel CLI non installé${NC}"
  read -p "Voulez-vous installer Vercel CLI? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm i -g vercel
  else
    echo -e "${BLUE}💡 Option 1: Installer Vercel CLI et utiliser déploiement manuel${NC}"
    echo -e "${BLUE}💡 Option 2: Push sur 'main' pour déploiement automatique via CI/CD${NC}"
    exit 0
  fi
fi

# Vérifier login Vercel
if ! vercel whoami &> /dev/null; then
  echo -e "${YELLOW}⚠️  Non connecté à Vercel${NC}"
  echo "Connexion à Vercel..."
  vercel login
fi

# Afficher options
echo ""
echo -e "${BLUE}Options de déploiement:${NC}"
echo "1. Déploiement automatique (via CI/CD - Push sur main)"
echo "2. Déploiement manuel (via Vercel CLI)"
echo ""
read -p "Choisissez une option (1 ou 2): " -n 1 -r
echo ""

if [[ $REPLY == "1" ]]; then
  # Option 1: Automatique
  echo -e "${GREEN}✅ Déploiement automatique sélectionné${NC}"
  echo ""
  echo "Pour déployer automatiquement:"
  echo "1. Assurez-vous que tous les changements sont commités"
  echo "2. Push sur 'main':"
  echo "   ${BLUE}git push origin main${NC}"
  echo ""
  echo "Le CI/CD s'exécutera automatiquement et déploiera en production."
  echo ""
  read -p "Voulez-vous push maintenant? (y/N): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Push vers origin main..."
    git push origin main
    echo ""
    echo -e "${GREEN}✅ Push effectué!${NC}"
    echo "Le CI/CD va maintenant s'exécuter automatiquement."
    echo "Vérifiez le déploiement sur:"
    echo "  - GitHub Actions: https://github.com/[org]/[repo]/actions"
    echo "  - Vercel Dashboard: https://vercel.com/dashboard"
    echo "  - Application: https://app.luneo.app"
  else
    echo "Déploiement annulé. Vous pouvez push manuellement plus tard."
  fi
elif [[ $REPLY == "2" ]]; then
  # Option 2: Manuel
  echo -e "${GREEN}✅ Déploiement manuel sélectionné${NC}"
  echo ""
  echo "Déploiement en production via Vercel CLI..."
  echo ""
  cd apps/frontend
  vercel --prod
  echo ""
  echo -e "${GREEN}✅ Déploiement terminé!${NC}"
  echo "Vérifiez l'application sur: https://app.luneo.app"
else
  echo -e "${RED}❌ Option invalide${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}✅ Déploiement production complété!${NC}"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Vérifier application: https://app.luneo.app"
echo "  2. Vérifier health check: curl https://app.luneo.app/api/health"
echo "  3. Vérifier Sentry (erreurs)"
echo "  4. Vérifier Vercel Analytics (performance)"
echo "  5. Tester fonctionnalités critiques"
echo ""
echo "📚 Documentation:"
echo "  - Post-déploiement: docs/POST_DEPLOYMENT.md"
echo "  - Rollback: docs/ROLLBACK_GUIDE.md"
