#!/bin/bash

# Script de vérification complète pour production
# Vérifie tous les points critiques d'une plateforme SaaS mondiale

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 VÉRIFICATION COMPLÈTE PRODUCTION - LUNEO PLATFORM${NC}"
echo "=================================================="
echo ""

# Compteurs
PASSED=0
FAILED=0
WARNINGS=0

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ $1${NC}"
        ((FAILED++))
        return 1
    fi
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

# 1. Vérifier les builds
echo -e "${BLUE}📦 1. VÉRIFICATION DES BUILDS${NC}"
echo "-----------------------------------"

echo -n "Build backend... "
cd apps/backend
if npm run build > /dev/null 2>&1; then
    check "Build backend réussi"
else
    check "Build backend échoué"
fi

echo -n "Build frontend... "
cd ../frontend
if npm run build > /dev/null 2>&1; then
    check "Build frontend réussi"
else
    check "Build frontend échoué"
fi

# 2. Vérifier les tests
echo ""
echo -e "${BLUE}🧪 2. VÉRIFICATION DES TESTS${NC}"
echo "-----------------------------------"

cd ../backend
echo -n "Tests backend... "
if npm run test -- --passWithNoTests > /dev/null 2>&1; then
    check "Tests backend passent"
else
    check "Tests backend échouent"
fi

# 3. Vérifier le déploiement
echo ""
echo -e "${BLUE}🚀 3. VÉRIFICATION DU DÉPLOIEMENT${NC}"
echo "-----------------------------------"

echo -n "Health check... "
HEALTH=$(curl -s https://luneo.app/api/health 2>/dev/null)
if echo "$HEALTH" | grep -q "healthy"; then
    check "Health check OK"
else
    check "Health check échoué"
    warn "Réponse: $HEALTH"
fi

echo -n "Site accessible... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://luneo.app 2>/dev/null)
if [ "$STATUS" = "200" ]; then
    check "Site accessible (HTTP $STATUS)"
else
    check "Site inaccessible (HTTP $STATUS)"
fi

# 4. Vérifier les variables d'environnement
echo ""
echo -e "${BLUE}🔐 4. VÉRIFICATION DES VARIABLES D'ENVIRONNEMENT${NC}"
echo "-----------------------------------"

cd ../frontend

# Variables critiques
CRITICAL_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_APP_URL"
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "CLOUDINARY_CLOUD_NAME"
    "CLOUDINARY_API_KEY"
    "CLOUDINARY_API_SECRET"
)

for var in "${CRITICAL_VARS[@]}"; do
    if vercel env ls --scope luneos-projects 2>/dev/null | grep -q "$var"; then
        check "$var configurée"
    else
        warn "$var manquante"
    fi
done

# 5. Résumé
echo ""
echo -e "${BLUE}📊 RÉSUMÉ${NC}"
echo "-----------------------------------"
echo -e "${GREEN}✅ Réussis: $PASSED${NC}"
echo -e "${RED}❌ Échoués: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Avertissements: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUT EST OPÉRATIONNEL !${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Des corrections sont nécessaires${NC}"
    exit 1
fi

