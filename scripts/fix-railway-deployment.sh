#!/bin/bash

# Script pour corriger et redéployer sur Railway

set -e

echo "🔧 Correction du déploiement Railway"
echo "======================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI non installé${NC}"
    exit 1
fi

# Vérifier la connexion
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Non connecté${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Connecté à Railway${NC}"

# Vérifier le projet
PROJECT_STATUS=$(railway status 2>&1)
if echo "$PROJECT_STATUS" | grep -q "No linked project"; then
    echo -e "${YELLOW}⚠️  Projet non lié${NC}"
    echo "Liaison au projet luneo-platform-backend..."
    # Le projet existe déjà, on doit le lier
    echo "Veuillez lier le projet manuellement via le dashboard Railway"
    exit 1
fi

echo -e "${GREEN}✅ Projet lié${NC}"
echo "$PROJECT_STATUS"

# Vérifier la configuration du build
echo ""
echo "🔍 Vérification de la configuration..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "apps/backend/package.json" ]; then
    echo -e "${RED}❌ apps/backend/package.json non trouvé${NC}"
    exit 1
fi

# Vérifier les fichiers de configuration Railway
if [ ! -f "railway.json" ] && [ ! -f "nixpacks.toml" ]; then
    echo -e "${YELLOW}⚠️  Fichiers de configuration Railway non trouvés${NC}"
    echo "Création de la configuration..."
    
    # Créer railway.json
    cat > railway.json << 'EOF'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd apps/backend && pnpm install && pnpm prisma generate && pnpm build"
  },
  "deploy": {
    "startCommand": "cd apps/backend && pnpm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
    
    echo -e "${GREEN}✅ railway.json créé${NC}"
fi

# Vérifier PostgreSQL
echo ""
echo "🗄️  Vérification de PostgreSQL..."
if railway variables get DATABASE_URL &> /dev/null; then
    echo -e "${GREEN}✅ DATABASE_URL configuré${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL non configuré${NC}"
    echo "Ajoutez PostgreSQL via le dashboard Railway :"
    echo "  Dashboard → + New → Database → PostgreSQL"
fi

# Vérifier les variables essentielles
echo ""
echo "📝 Vérification des variables d'environnement..."

if ! railway variables get NODE_ENV &> /dev/null; then
    echo "Configuration de NODE_ENV..."
    railway variables --set "NODE_ENV=production" 2>&1 || echo "Erreur (peut nécessiter le dashboard)"
fi

if ! railway variables get JWT_SECRET &> /dev/null; then
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-me-$(date +%s)")
    echo "Configuration de JWT_SECRET..."
    railway variables --set "JWT_SECRET=$JWT_SECRET" 2>&1 || echo "Erreur (peut nécessiter le dashboard)"
    echo -e "${GREEN}✅ JWT_SECRET: $JWT_SECRET${NC}"
fi

# Build local pour tester
echo ""
echo "🔨 Build local de test..."
cd apps/backend

if [ -f "package.json" ]; then
    echo "Installation des dépendances..."
    pnpm install --frozen-lockfile || pnpm install
    
    echo "Génération de Prisma Client..."
    pnpm prisma generate || echo "Erreur Prisma (peut être normal si DATABASE_URL non configuré)"
    
    echo "Build..."
    pnpm build || {
        echo -e "${RED}❌ Erreur de build local${NC}"
        echo "Vérifiez les erreurs ci-dessus"
        cd ../..
        exit 1
    }
    
    echo -e "${GREEN}✅ Build local réussi${NC}"
else
    echo -e "${RED}❌ package.json non trouvé${NC}"
    cd ../..
    exit 1
fi

cd ../..

# Redéployer
echo ""
echo "🚀 Redéploiement sur Railway..."
railway up --detach || railway deploy

echo ""
echo -e "${GREEN}✅ Déploiement lancé !${NC}"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Vérifier les logs : railway logs"
echo "   2. Vérifier le statut : railway status"
echo "   3. Tester le health check une fois déployé"
echo ""






