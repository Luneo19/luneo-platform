#!/bin/bash

##############################################################################
# SCRIPT DE VALIDATION DES OPTIMISATIONS VERCEL
# 
# Vérifie que toutes les optimisations sont en place avant déploiement
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✅ PASS${NC} $1"
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC} $1"
    ((WARNINGS++))
}

check_info() {
    echo -e "${BLUE}ℹ️  INFO${NC} $1"
}

echo ""
echo "================================================"
echo "  VALIDATION DES OPTIMISATIONS VERCEL"
echo "================================================"
echo ""

##############################################################################
# 1. Fichiers Critiques
##############################################################################

echo "🔍 Vérification des fichiers critiques..."
echo ""

# AppServerlessModule
if [ -f "src/app.serverless.module.ts" ]; then
    check_pass "AppServerlessModule existe"
    
    # Vérifier qu'il n'importe pas les modules lourds
    if grep -q "JobsModule" src/app.serverless.module.ts; then
        check_fail "AppServerlessModule importe encore JobsModule"
    else
        check_pass "JobsModule exclu du serverless module"
    fi
else
    check_fail "AppServerlessModule manquant (src/app.serverless.module.ts)"
fi

# Script de build optimisé
if [ -f "scripts/vercel-build-optimized.sh" ]; then
    check_pass "Script de build optimisé existe"
    
    # Vérifier les permissions
    if [ -x "scripts/vercel-build-optimized.sh" ]; then
        check_pass "Script de build est exécutable"
    else
        check_fail "Script de build n'est pas exécutable (chmod +x)"
    fi
else
    check_fail "Script de build optimisé manquant"
fi

# .npmrc
if [ -f ".npmrc" ]; then
    check_pass ".npmrc existe"
    
    # Vérifier les options critiques
    if grep -q "prefer-offline=true" .npmrc; then
        check_pass ".npmrc contient prefer-offline=true"
    else
        check_warn ".npmrc devrait contenir prefer-offline=true"
    fi
else
    check_warn ".npmrc manquant (recommandé)"
fi

# tsconfig.build.json
if [ -f "tsconfig.build.json" ]; then
    check_pass "tsconfig.build.json existe"
    
    # Vérifier incremental build
    if grep -q "\"incremental\": true" tsconfig.build.json; then
        check_pass "Build incrémental activé"
    else
        check_warn "Build incrémental devrait être activé"
    fi
else
    check_warn "tsconfig.build.json manquant (recommandé)"
fi

echo ""

##############################################################################
# 2. Configuration Vercel
##############################################################################

echo "🔍 Vérification de vercel.json..."
echo ""

if [ -f "vercel.json" ]; then
    check_pass "vercel.json existe"
    
    # Vérifier le cache
    if grep -q "\"cache\":" vercel.json; then
        check_pass "Configuration de cache présente"
    else
        check_fail "Configuration de cache manquante dans vercel.json"
    fi
    
    # Vérifier la mémoire
    if grep -q "\"memory\": 3008" vercel.json; then
        check_pass "Mémoire maximale configurée (3GB)"
    else
        check_warn "Mémoire devrait être à 3008MB (max)"
    fi
    
    # Vérifier runtime
    if grep -q "nodejs22" vercel.json; then
        check_pass "Runtime Node.js 22.x configuré"
    else
        check_warn "Runtime devrait être nodejs22.x"
    fi
else
    check_fail "vercel.json manquant"
fi

echo ""

##############################################################################
# 3. Configuration Prisma
##############################################################################

echo "🔍 Vérification de Prisma..."
echo ""

if [ -f "prisma/schema.prisma" ]; then
    check_pass "Schema Prisma existe"
    
    # Vérifier binaryTargets
    if grep -q "binaryTargets" prisma/schema.prisma; then
        check_pass "binaryTargets configuré"
    else
        check_warn "binaryTargets devrait être configuré pour Vercel"
    fi
    
    # Vérifier output
    if grep -q "output.*prisma" prisma/schema.prisma; then
        check_pass "Output directory personnalisé"
    else
        check_warn "Output directory devrait être personnalisé"
    fi
else
    check_fail "Schema Prisma manquant"
fi

echo ""

##############################################################################
# 4. Package.json
##############################################################################

echo "🔍 Vérification de package.json..."
echo ""

if [ -f "package.json" ]; then
    check_pass "package.json existe"
    
    # Vérifier vercel-build script
    if grep -q "vercel-build" package.json; then
        check_pass "Script vercel-build configuré"
        
        # Vérifier qu'il utilise le script optimisé
        if grep -q "vercel-build-optimized.sh" package.json; then
            check_pass "Utilise le script de build optimisé"
        else
            check_warn "Devrait utiliser vercel-build-optimized.sh"
        fi
    else
        check_fail "Script vercel-build manquant"
    fi
    
    # Vérifier Node.js version
    if grep -q "\"node\": \"22" package.json; then
        check_pass "Node.js 22.x dans engines"
    else
        check_warn "Node.js 22.x recommandé dans engines"
    fi
else
    check_fail "package.json manquant"
fi

echo ""

##############################################################################
# 5. Serverless Handler
##############################################################################

echo "🔍 Vérification du serverless handler..."
echo ""

if [ -f "src/serverless.ts" ]; then
    check_pass "serverless.ts existe"
    
    # Vérifier qu'il utilise AppServerlessModule
    if grep -q "AppServerlessModule" src/serverless.ts; then
        check_pass "Utilise AppServerlessModule"
    else
        check_fail "Devrait utiliser AppServerlessModule au lieu de AppModule"
    fi
else
    check_fail "serverless.ts manquant"
fi

if [ -f "api/index.ts" ]; then
    check_pass "api/index.ts existe (entrypoint Vercel)"
else
    check_fail "api/index.ts manquant"
fi

echo ""

##############################################################################
# 6. Build Test
##############################################################################

echo "🔍 Test de build (optionnel)..."
echo ""

read -p "Voulez-vous tester le build maintenant? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    check_info "Lancement du build test..."
    
    start_time=$(date +%s)
    
    if npm run vercel-build 2>&1 | tee /tmp/build-test.log; then
        end_time=$(date +%s)
        duration=$((end_time - start_time))
        
        check_pass "Build réussi en ${duration}s"
        
        if [ $duration -lt 300 ]; then
            check_pass "Build time < 5min - EXCELLENT !"
        elif [ $duration -lt 600 ]; then
            check_pass "Build time < 10min - BON"
        else
            check_warn "Build time > 10min - Peut nécessiter optimisation"
        fi
        
        # Vérifier la taille du bundle
        if [ -d "dist" ]; then
            DIST_SIZE=$(du -sm dist | cut -f1)
            check_info "Taille du bundle: ${DIST_SIZE}MB"
            
            if [ $DIST_SIZE -lt 20 ]; then
                check_pass "Bundle size < 20MB - EXCELLENT !"
            elif [ $DIST_SIZE -lt 50 ]; then
                check_warn "Bundle size < 50MB - Acceptable mais peut être optimisé"
            else
                check_warn "Bundle size > 50MB - Nécessite optimisation"
            fi
        fi
    else
        check_fail "Build échoué - Vérifier les logs dans /tmp/build-test.log"
    fi
else
    check_info "Build test ignoré"
fi

echo ""

##############################################################################
# 7. Résumé
##############################################################################

echo ""
echo "================================================"
echo "  RÉSUMÉ DE LA VALIDATION"
echo "================================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ TOUT EST PARFAIT !${NC}"
    echo ""
    echo "Toutes les optimisations sont en place."
    echo "Vous pouvez déployer sur Vercel en toute confiance."
    echo ""
    echo "Commande de déploiement:"
    echo "  vercel --prod"
    echo ""
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
    echo ""
    echo "Les optimisations de base sont en place."
    echo "Il y a quelques warnings non-critiques."
    echo ""
    echo "Vous pouvez déployer, mais considérez les warnings."
    echo ""
    exit 0
else
    echo -e "${RED}❌ ERREURS: $ERRORS${NC}"
    echo -e "${YELLOW}⚠️  WARNINGS: $WARNINGS${NC}"
    echo ""
    echo "Certaines optimisations critiques sont manquantes."
    echo "Veuillez corriger les erreurs avant de déployer."
    echo ""
    exit 1
fi
