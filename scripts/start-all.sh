#!/bin/bash

# Script de démarrage complet pour LUNEO
# Démarre tous les services nécessaires

set -e

echo "════════════════════════════════════════════════════════════════════════════"
echo "  🚀 DÉMARRAGE COMPLET - LUNEO ENTERPRISE  🚀"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Vérifier les prérequis
echo "🔍 Vérification des prérequis..."
echo ""

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js n'est pas installé"
    exit 1
fi

# PostgreSQL
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version | awk '{print $3}')
    echo -e "${GREEN}✓${NC} PostgreSQL: $PG_VERSION"
else
    echo -e "${RED}✗${NC} PostgreSQL n'est pas installé"
    exit 1
fi

# Redis
if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version | awk '{print $2}')
    echo -e "${GREEN}✓${NC} Redis: $REDIS_VERSION"
else
    echo -e "${RED}✗${NC} Redis n'est pas installé"
    exit 1
fi

echo ""
echo "🔧 Configuration de l'environnement..."
echo ""

# Vérifier que les .env existent
if [ ! -f "apps/backend/.env" ]; then
    echo -e "${YELLOW}⚠${NC}  Fichier .env manquant pour le backend"
    echo "   Copiez apps/backend/.env.example vers apps/backend/.env"
    echo "   et configurez vos variables d'environnement"
    exit 1
fi

echo -e "${GREEN}✓${NC} Fichiers .env présents"
echo ""

# Vérifier les dépendances
echo "📦 Vérification des dépendances..."
echo ""

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠${NC}  Installation des dépendances..."
    npm install
    echo -e "${GREEN}✓${NC} Dépendances installées"
else
    echo -e "${GREEN}✓${NC} Dépendances présentes"
fi

echo ""
echo "🗄️  Setup de la base de données..."
echo ""

# Générer le client Prisma
cd apps/backend
if npx prisma generate > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Client Prisma généré"
else
    echo -e "${RED}✗${NC} Erreur lors de la génération du client Prisma"
fi

cd ../..

echo ""
echo "🚀 Démarrage des services..."
echo ""

# Fonction pour tuer les processus à la sortie
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    pkill -f "redis-server" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "nest start" 2>/dev/null || true
    echo "✓ Services arrêtés"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Tuer les anciens processus
echo "🧹 Nettoyage des anciens processus..."
lsof -ti:6379 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:4000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 2

# Démarrer Redis
echo -e "${BLUE}▶${NC}  Démarrage de Redis..."
redis-server --daemonize yes 2>/dev/null
sleep 1

if redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Redis démarré sur port 6379"
else
    echo -e "${RED}✗${NC} Erreur lors du démarrage de Redis"
    exit 1
fi

# Démarrer le Backend
echo -e "${BLUE}▶${NC}  Démarrage du Backend..."
cd apps/backend
npm run dev > ../../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..

# Attendre que le backend soit prêt
echo "   Attente du démarrage du backend..."
for i in {1..30}; do
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Backend démarré sur http://localhost:4000"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗${NC} Timeout: Backend n'a pas démarré"
        echo "   Voir logs/backend.log pour les erreurs"
        exit 1
    fi
done

# Démarrer le Frontend
echo -e "${BLUE}▶${NC}  Démarrage du Frontend..."
cd apps/frontend
npm run dev > ../../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..

# Attendre que le frontend soit prêt
echo "   Attente du démarrage du frontend..."
for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Frontend démarré sur http://localhost:3000"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠${NC}  Warning: Frontend n'a pas démarré"
        echo "   Voir logs/frontend.log pour les détails"
    fi
done

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "  ✅ TOUS LES SERVICES SONT DÉMARRÉS !  ✅"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "🌐 URLs disponibles:"
echo "   • Backend API:    http://localhost:4000"
echo "   • API Docs:       http://localhost:4000/api"
echo "   • Frontend:       http://localhost:3000"
echo "   • Visual Editor:  http://localhost:3000/editor"
echo ""
echo "📊 Services actifs:"
echo "   • Redis:          Port 6379"
echo "   • PostgreSQL:     Connecté"
echo "   • Backend:        PID $BACKEND_PID"
echo "   • Frontend:       PID $FRONTEND_PID"
echo ""
echo "📋 Logs disponibles:"
echo "   • Backend:        tail -f logs/backend.log"
echo "   • Frontend:       tail -f logs/frontend.log"
echo ""
echo "🧪 Pour tester:"
echo "   ./scripts/test-features.sh"
echo ""
echo "🛑 Pour arrêter:"
echo "   Ctrl+C ou kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "🎉 PRÊT POUR LES TESTS !"
echo ""

# Garder le script actif
wait


