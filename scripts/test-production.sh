#!/bin/bash

# 🧪 LUNEO - Test de Production

set -e

echo "════════════════════════════════════════════════════════════════════════════"
echo "  🧪 TESTS DE PRODUCTION - VÉRIFICATION FONCTIONNALITÉS  🧪"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() { echo -e "${BLUE}▶${NC} $1"; }
print_success() { echo -e "${GREEN}✅${NC} $1"; }
print_error() { echo -e "${RED}❌${NC} $1"; }
print_warning() { echo -e "${YELLOW}⚠️${NC} $1"; }

# URLs à tester
FRONTEND_URL="https://app.luneo.app"
API_URL="https://api.luneo.app"
VERCEL_URL="https://frontend-7hqsmviqs-luneos-projects.vercel.app"

# Fonction de test HTTP
test_url() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    print_status "Test $name..."
    
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$name : OK ($status_code)"
        return 0
    else
        print_error "$name : ÉCHEC ($status_code)"
        return 1
    fi
}

# Tests principaux
echo "🔍 TESTS DES SERVICES PRINCIPAUX"
echo ""

# Test Frontend principal
test_url "$FRONTEND_URL" "Frontend principal"

# Test API Backend
test_url "$API_URL/health" "API Backend"

# Test Vercel deployment
test_url "$VERCEL_URL" "Déploiement Vercel"

echo ""
echo "🔍 TESTS DES PAGES FONCTIONNELLES"
echo ""

# Test des pages clés
test_url "$FRONTEND_URL/dashboard" "Dashboard"
test_url "$FRONTEND_URL/ai-studio" "AI Studio"
test_url "$FRONTEND_URL/ar-studio" "AR Studio"
test_url "$FRONTEND_URL/pricing" "Pricing"
test_url "$FRONTEND_URL/help/documentation" "Documentation"

echo ""
echo "🔍 TESTS DES PAGES DE NAVIGATION"
echo ""

# Test des pages de navigation
test_url "$FRONTEND_URL/about" "About"
test_url "$FRONTEND_URL/contact" "Contact"
test_url "$FRONTEND_URL/register" "Register"
test_url "$FRONTEND_URL/login" "Login"

echo ""
echo "🔍 TESTS DES ENDPOINTS API"
echo ""

# Test des endpoints API
test_url "$API_URL/api/health" "API Health"
test_url "$API_URL/api/auth/status" "Auth Status"

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "  📊 RÉSUMÉ DES TESTS  📊"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Test manuel des boutons
echo "🎯 VÉRIFICATION MANUELLE REQUISE :"
echo ""
echo "1. Ouvrez : $FRONTEND_URL"
echo "2. Connectez-vous au dashboard"
echo "3. Cliquez sur 'AI Studio' dans la sidebar"
echo "4. Cliquez sur 'AR Studio' dans la sidebar"
echo ""
echo "Si les boutons ne fonctionnent pas :"
echo "• Vérifiez la console du navigateur (F12)"
echo "• Vérifiez les erreurs réseau"
echo "• Essayez le déploiement Vercel : $VERCEL_URL"
echo ""

# Rapport final
echo "🌐 URLS DE PRODUCTION :"
echo "   • Frontend : $FRONTEND_URL"
echo "   • API : $API_URL"
echo "   • Vercel : $VERCEL_URL"
echo ""
echo "🔧 EN CAS DE PROBLÈME :"
echo "   1. Vérifier les logs : ssh root@116.203.31.129 'pm2 logs'"
echo "   2. Redéployer : ./scripts/deploy-existing.sh"
echo "   3. Tester localement : npm run dev"
echo ""
echo "🏆 TESTS TERMINÉS !"


