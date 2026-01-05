#!/bin/bash

# Script complet de déploiement Railway avec toutes les étapes

set -e

echo "🚀 Déploiement Railway Complet"
echo "=============================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Vérifier Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}⚠️  Installation de Railway CLI...${NC}"
    npm install -g @railway/cli
fi

# Vérifier la connexion
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Non connecté à Railway${NC}"
    railway login
fi

echo -e "${GREEN}✅ Connecté à Railway${NC}"
railway whoami

# Vérifier le projet
PROJECT_STATUS=$(railway status 2>&1)
if echo "$PROJECT_STATUS" | grep -q "No linked project"; then
    echo -e "${YELLOW}⚠️  Projet non lié${NC}"
    echo "Le projet 'luneo-platform-backend' existe déjà"
    echo "Liaison via le dashboard Railway nécessaire"
    echo ""
    echo "OU créer un nouveau service :"
    echo "  railway up"
    exit 1
fi

echo -e "${GREEN}✅ Projet lié${NC}"

# Étape 1 : Créer un service si nécessaire
echo ""
echo "📦 ÉTAPE 1 : Création du service backend..."
if echo "$PROJECT_STATUS" | grep -q "Service: None"; then
    echo "Création d'un nouveau service..."
    # Railway créera automatiquement un service lors du premier déploiement
    echo -e "${YELLOW}⚠️  Le service sera créé lors du déploiement${NC}"
else
    echo -e "${GREEN}✅ Service existant${NC}"
fi

# Étape 2 : Ajouter PostgreSQL
echo ""
echo "🗄️  ÉTAPE 2 : Configuration PostgreSQL..."
echo -e "${YELLOW}⚠️  PostgreSQL doit être ajouté via le dashboard Railway${NC}"
echo "Instructions :"
echo "  1. Aller sur https://railway.com/project/fb66d02e-2862-4a62-af66-f97430983d0b"
echo "  2. Cliquer sur '+ New' → 'Database' → 'PostgreSQL'"
echo "  3. Railway créera automatiquement DATABASE_URL"
echo ""
read -p "Appuyez sur Entrée une fois PostgreSQL ajouté..." || echo "Continuez..."

# Étape 3 : Configurer les variables d'environnement
echo ""
echo "📝 ÉTAPE 3 : Configuration des variables d'environnement..."

# Générer JWT_SECRET
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-me-$(date +%s)")

echo "Variables à configurer dans Railway Dashboard :"
echo ""
echo "NODE_ENV=production"
echo "JWT_SECRET=$JWT_SECRET"
echo ""
echo "Instructions :"
echo "  1. Dashboard → Variables"
echo "  2. Ajouter les variables ci-dessus"
echo ""
read -p "Appuyez sur Entrée une fois les variables configurées..." || echo "Continuez..."

# Étape 4 : Vérifier la configuration
echo ""
echo "🔍 ÉTAPE 4 : Vérification de la configuration..."

# Vérifier railway.json
if [ -f "railway.json" ]; then
    echo -e "${GREEN}✅ railway.json présent${NC}"
else
    echo -e "${RED}❌ railway.json manquant${NC}"
    exit 1
fi

# Vérifier nixpacks.toml
if [ -f "nixpacks.toml" ]; then
    echo -e "${GREEN}✅ nixpacks.toml présent${NC}"
    # Vérifier Node.js version
    if grep -q "nodejs-22_x" nixpacks.toml; then
        echo -e "${GREEN}✅ Node.js 22 configuré${NC}"
    else
        echo -e "${YELLOW}⚠️  Node.js 22 non configuré dans nixpacks.toml${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  nixpacks.toml manquant (optionnel)${NC}"
fi

# Étape 5 : Build local de test
echo ""
echo "🔨 ÉTAPE 5 : Build local de test..."

cd apps/backend

if [ -f "package.json" ]; then
    echo "Installation des dépendances..."
    # Utiliser Node 22 si disponible, sinon continuer
    pnpm install --frozen-lockfile 2>&1 | grep -v "ERR_PNPM_UNSUPPORTED_ENGINE" || pnpm install || {
        echo -e "${YELLOW}⚠️  Erreur d'installation (peut être normal en local)${NC}"
    }
    
    echo "Génération de Prisma Client..."
    pnpm prisma generate 2>&1 || echo -e "${YELLOW}⚠️  Erreur Prisma (normal si DATABASE_URL non configuré)${NC}"
    
    echo "Build..."
    pnpm build 2>&1 || {
        echo -e "${RED}❌ Erreur de build${NC}"
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

# Étape 6 : Déployer
echo ""
echo "🚀 ÉTAPE 6 : Déploiement sur Railway..."

# Définir le root directory si nécessaire
echo "Déploiement en cours..."
railway up --detach 2>&1 || railway deploy 2>&1

echo ""
echo -e "${GREEN}✅ Déploiement lancé !${NC}"

# Étape 7 : Vérifier les logs
echo ""
echo "📋 ÉTAPE 7 : Vérification des logs..."
echo "Attente de 10 secondes pour le démarrage..."
sleep 10

railway logs --tail 50 2>&1 | head -50 || echo "Logs non disponibles (déploiement en cours)"

echo ""
echo "📊 RÉSUMÉ :"
echo ""
echo "✅ Déploiement lancé"
echo "✅ Configuration vérifiée"
echo ""
echo "📋 Prochaines étapes :"
echo "   1. Vérifier les logs : railway logs"
echo "   2. Vérifier le statut : railway status"
echo "   3. Obtenir l'URL : railway domain"
echo "   4. Tester le health check : curl \$(railway domain)/health"
echo ""
echo "🔗 Dashboard : https://railway.com/project/fb66d02e-2862-4a62-af66-f97430983d0b"
echo ""








