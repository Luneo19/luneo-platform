#!/bin/bash

# Script de vérification pré-déploiement Railway
# Vérifie tous les points critiques avant de déployer

set -e

echo "🔍 Vérification pré-déploiement Railway..."
echo ""

ERRORS=0
WARNINGS=0

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅${NC} $1"
    else
        echo -e "${RED}❌${NC} $1"
        ERRORS=$((ERRORS + 1))
    fi
}

warn() {
    echo -e "${YELLOW}⚠️${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# 1. Vérifier Dockerfile à la racine
echo "1. Vérification Dockerfile..."
if [ -f "Dockerfile" ]; then
    check "Dockerfile existe à la racine"
else
    echo -e "${RED}❌${NC} Dockerfile n'existe pas à la racine"
    ERRORS=$((ERRORS + 1))
fi

# 2. Vérifier railway.json
echo ""
echo "2. Vérification railway.json..."
if [ -f "railway.json" ]; then
    check "railway.json existe"
    if grep -q '"dockerfilePath": "Dockerfile"' railway.json; then
        check "dockerfilePath pointe vers Dockerfile"
    else
        echo -e "${RED}❌${NC} dockerfilePath ne pointe pas vers Dockerfile"
        ERRORS=$((ERRORS + 1))
    fi
else
    warn "railway.json n'existe pas (optionnel si railway.toml existe)"
fi

# 3. Vérifier railway.toml
echo ""
echo "3. Vérification railway.toml..."
if [ -f "railway.toml" ]; then
    check "railway.toml existe"
    if grep -q 'dockerfilePath = "Dockerfile"' railway.toml; then
        check "dockerfilePath pointe vers Dockerfile dans railway.toml"
    else
        echo -e "${RED}❌${NC} dockerfilePath ne pointe pas vers Dockerfile dans railway.toml"
        ERRORS=$((ERRORS + 1))
    fi
fi

# 4. Vérifier pnpm-lock.yaml
echo ""
echo "4. Vérification pnpm-lock.yaml..."
if [ -f "pnpm-lock.yaml" ]; then
    check "pnpm-lock.yaml existe"
    if [ -s "pnpm-lock.yaml" ]; then
        check "pnpm-lock.yaml n'est pas vide"
    else
        echo -e "${RED}❌${NC} pnpm-lock.yaml est vide"
    ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌${NC} pnpm-lock.yaml n'existe pas"
    ERRORS=$((ERRORS + 1))
fi

# 5. Vérifier schema.prisma binaryTargets
echo ""
echo "5. Vérification Prisma schema..."
if [ -f "apps/backend/prisma/schema.prisma" ]; then
    check "schema.prisma existe"
    if grep -q 'binaryTargets = \["native", "linux-musl-openssl-3.0.x"\]' apps/backend/prisma/schema.prisma; then
        check "binaryTargets contient linux-musl-openssl-3.0.x"
    else
        echo -e "${RED}❌${NC} binaryTargets ne contient pas linux-musl-openssl-3.0.x"
        echo "   Ajoutez: binaryTargets = [\"native\", \"linux-musl-openssl-3.0.x\"]"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌${NC} schema.prisma n'existe pas"
    ERRORS=$((ERRORS + 1))
fi

# 6. Vérifier structure monorepo
echo ""
echo "6. Vérification structure monorepo..."
if [ -d "apps/backend" ]; then
    check "apps/backend existe"
    if [ -f "apps/backend/package.json" ]; then
        check "apps/backend/package.json existe"
    else
        echo -e "${RED}❌${NC} apps/backend/package.json n'existe pas"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${RED}❌${NC} apps/backend n'existe pas"
    ERRORS=$((ERRORS + 1))
fi

# 7. Vérifier .dockerignore
echo ""
echo "7. Vérification .dockerignore..."
if [ -f ".dockerignore" ]; then
    check ".dockerignore existe"
    if grep -q "node_modules" .dockerignore; then
        check ".dockerignore exclut node_modules"
    else
        warn ".dockerignore n'exclut pas node_modules (recommandé)"
    fi
else
    warn ".dockerignore n'existe pas (recommandé)"
fi

# 8. Vérifier que Dockerfile utilise multi-stage
echo ""
echo "8. Vérification Dockerfile multi-stage..."
if grep -q "FROM node:.* AS builder" Dockerfile; then
    check "Dockerfile utilise multi-stage build"
else
    warn "Dockerfile n'utilise pas multi-stage build (recommandé pour réduire taille)"
fi

# 9. Vérifier que Dockerfile copie pnpm-lock.yaml avant install
echo ""
echo "9. Vérification ordre COPY dans Dockerfile..."
if grep -A 5 "COPY package.json" Dockerfile | grep -q "pnpm-lock.yaml"; then
    check "Dockerfile copie pnpm-lock.yaml avant pnpm install"
else
    warn "Vérifiez que Dockerfile copie pnpm-lock.yaml avant pnpm install"
fi

# 10. Vérifier taille potentielle de l'image
echo ""
echo "10. Vérification taille image..."
if grep -q "rm -rf.*node_modules.*test" Dockerfile || grep -q "find.*node_modules.*test" Dockerfile; then
    check "Dockerfile nettoie fichiers inutiles"
else
    warn "Dockerfile ne nettoie pas explicitement les fichiers de test (recommandé)"
fi

# 11. Vérifier services optionnels utilisent get() au lieu de getOrThrow()
echo ""
echo "11. Vérification services optionnels..."
if grep -r "getOrThrow.*SHOPIFY\|getOrThrow.*MAILGUN\|getOrThrow.*SENDGRID" apps/backend/src --include="*.ts" > /dev/null 2>&1; then
    warn "Services optionnels utilisent getOrThrow() (devrait utiliser get() pour optionnel)"
else
    echo -e "${GREEN}✅${NC} Services optionnels n'utilisent pas getOrThrow()"
fi

# Résumé
echo ""
echo "=========================================="
echo "📊 Résumé des vérifications"
echo "=========================================="
echo -e "${GREEN}✅ Erreurs critiques:${NC} $ERRORS"
echo -e "${YELLOW}⚠️ Avertissements:${NC} $WARNINGS"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}❌ ÉCHEC: $ERRORS erreur(s) critique(s) détectée(s)${NC}"
    echo ""
    echo "Consultez RAILWAY_DEPLOYMENT_GUIDE.md pour les solutions"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️ ATTENTION: $WARNINGS avertissement(s)${NC}"
    echo ""
    echo "Le déploiement peut fonctionner mais des améliorations sont recommandées"
    exit 0
else
    echo -e "${GREEN}✅ TOUS LES CHECKS PASSÉS !${NC}"
    echo ""
    echo "Vous pouvez déployer en toute sécurité 🚀"
    exit 0
fi
