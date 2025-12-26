#!/bin/bash
# 🔍 Script de vérification pré-déploiement Vercel
# Détecte les erreurs AVANT le déploiement

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo -e "${BLUE}🔍 Vérification pré-déploiement Vercel...${NC}"
echo "==========================================="

# ============================================
# FRONTEND CHECKS
# ============================================
echo -e "\n${BLUE}📦 FRONTEND${NC}"
echo "-------------------------------------------"

cd apps/frontend

# 1. Vérifier le build
echo -e "\n1️⃣  Test du build production..."
BUILD_OUTPUT=$(npm run build 2>&1 | tee /tmp/frontend-build.log)
if echo "$BUILD_OUTPUT" | grep -qE "Build error occurred|Failed to compile|error TS[0-9]+"; then
    echo -e "${RED}❌ Erreurs de build détectées${NC}"
    echo -e "${YELLOW}Logs: /tmp/frontend-build.log${NC}"
    ERRORS=$((ERRORS + 1))
elif echo "$BUILD_OUTPUT" | grep -qE "Compiled successfully|○.*Static|ƒ.*Dynamic"; then
    echo -e "${GREEN}✅ Build OK${NC}"
else
    # Si le build se termine sans erreur explicite, considérer comme OK
    if echo "$BUILD_OUTPUT" | tail -3 | grep -qE "Static|Dynamic"; then
        echo -e "${GREEN}✅ Build OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Build terminé, vérifier les logs${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# 2. Vérifier TypeScript
echo -e "\n2️⃣  Vérification TypeScript..."
if npx tsc --noEmit 2>&1 | grep -qE "error TS"; then
    echo -e "${RED}❌ Erreurs TypeScript${NC}"
    npx tsc --noEmit 2>&1 | grep "error TS" | head -5
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ TypeScript OK${NC}"
fi

# 3. Vérifier les imports Prisma
echo -e "\n3️⃣  Vérification Prisma Client..."
if ! grep -q "@prisma/client" package.json; then
    echo -e "${RED}❌ @prisma/client manquant dans package.json${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Prisma Client présent${NC}"
fi

# 4. Vérifier les exports critiques
echo -e "\n4️⃣  Vérification des exports..."
MISSING_EXPORTS=0
if ! grep -q "export.*AddDesignsModal" src/components/collections/AddDesignsModal.tsx 2>/dev/null; then
    echo -e "${YELLOW}⚠️  AddDesignsModal export manquant${NC}"
    MISSING_EXPORTS=$((MISSING_EXPORTS + 1))
fi
if ! grep -q "export.*VersionTimeline" src/components/versioning/VersionTimeline.tsx 2>/dev/null; then
    echo -e "${YELLOW}⚠️  VersionTimeline export manquant${NC}"
    MISSING_EXPORTS=$((MISSING_EXPORTS + 1))
fi
if [ $MISSING_EXPORTS -eq 0 ]; then
    echo -e "${GREEN}✅ Exports OK${NC}"
else
    WARNINGS=$((WARNINGS + MISSING_EXPORTS))
fi

# 5. Vérifier vercel.json
echo -e "\n5️⃣  Vérification vercel.json..."
if [ ! -f "vercel.json" ]; then
    echo -e "${YELLOW}⚠️  vercel.json manquant${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ vercel.json présent${NC}"
fi

cd ../..

# ============================================
# BACKEND CHECKS
# ============================================
echo -e "\n${BLUE}🔧 BACKEND${NC}"
echo "-------------------------------------------"

cd apps/backend

# 1. Vérifier le build
echo -e "\n1️⃣  Test du build production..."
if npm run build 2>&1 | tee /tmp/backend-build.log | grep -qE "error|Error|Failed"; then
    echo -e "${RED}❌ Erreurs de build détectées${NC}"
    echo -e "${YELLOW}Logs: /tmp/backend-build.log${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Build OK${NC}"
fi

# 2. Vérifier serverless.js
echo -e "\n2️⃣  Vérification serverless handler..."
if [ ! -f "dist/src/serverless.js" ] && [ ! -f "api/src/serverless.js" ]; then
    echo -e "${YELLOW}⚠️  serverless.js non trouvé${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ serverless.js présent${NC}"
fi

# 3. Vérifier api/index.ts
echo -e "\n3️⃣  Vérification api/index.ts..."
if [ ! -f "api/index.ts" ]; then
    echo -e "${RED}❌ api/index.ts manquant${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ api/index.ts présent${NC}"
fi

# 4. Vérifier vercel.json
echo -e "\n4️⃣  Vérification vercel.json..."
if [ ! -f "vercel.json" ]; then
    echo -e "${YELLOW}⚠️  vercel.json manquant${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ vercel.json présent${NC}"
fi

cd ../..

# ============================================
# VARIABLES D'ENVIRONNEMENT
# ============================================
echo -e "\n${BLUE}🔐 VARIABLES D'ENVIRONNEMENT${NC}"
echo "-------------------------------------------"

REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
)

MISSING_VARS=0
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" apps/frontend/.env.local 2>/dev/null && \
       ! grep -q "^${var}=" apps/frontend/.env 2>/dev/null && \
       ! grep -q "^${var}=" apps/backend/.env.local 2>/dev/null && \
       ! grep -q "^${var}=" apps/backend/.env 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Variable manquante: ${var}${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
done

if [ $MISSING_VARS -eq 0 ]; then
    echo -e "${GREEN}✅ Variables critiques présentes (localement)${NC}"
    echo -e "${YELLOW}⚠️  Vérifiez aussi dans Vercel Dashboard${NC}"
else
    WARNINGS=$((WARNINGS + MISSING_VARS))
fi

# ============================================
# RÉSUMÉ
# ============================================
echo -e "\n==========================================="
echo -e "${BLUE}📊 RÉSUMÉ${NC}"
echo "-------------------------------------------"
echo -e "Erreurs: ${RED}${ERRORS}${NC}"
echo -e "Avertissements: ${YELLOW}${WARNINGS}${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "\n${GREEN}✅ Prêt pour le déploiement!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "\n${YELLOW}⚠️  Déploiement possible mais avec avertissements${NC}"
    exit 0
else
    echo -e "\n${RED}❌ ${ERRORS} erreur(s) à corriger avant le déploiement${NC}"
    exit 1
fi

#!/bin/bash
# 🔍 Script de vérification pré-déploiement Vercel
# Détecte les erreurs AVANT le déploiement

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo -e "${BLUE}🔍 Vérification pré-déploiement Vercel...${NC}"
echo "==========================================="

# ============================================
# FRONTEND CHECKS
# ============================================
echo -e "\n${BLUE}📦 FRONTEND${NC}"
echo "-------------------------------------------"

cd apps/frontend

# 1. Vérifier le build
echo -e "\n1️⃣  Test du build production..."
BUILD_OUTPUT=$(npm run build 2>&1 | tee /tmp/frontend-build.log)
if echo "$BUILD_OUTPUT" | grep -qE "Build error occurred|Failed to compile|error TS[0-9]+"; then
    echo -e "${RED}❌ Erreurs de build détectées${NC}"
    echo -e "${YELLOW}Logs: /tmp/frontend-build.log${NC}"
    ERRORS=$((ERRORS + 1))
elif echo "$BUILD_OUTPUT" | grep -qE "Compiled successfully|○.*Static|ƒ.*Dynamic"; then
    echo -e "${GREEN}✅ Build OK${NC}"
else
    # Si le build se termine sans erreur explicite, considérer comme OK
    if echo "$BUILD_OUTPUT" | tail -3 | grep -qE "Static|Dynamic"; then
        echo -e "${GREEN}✅ Build OK${NC}"
    else
        echo -e "${YELLOW}⚠️  Build terminé, vérifier les logs${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# 2. Vérifier TypeScript
echo -e "\n2️⃣  Vérification TypeScript..."
if npx tsc --noEmit 2>&1 | grep -qE "error TS"; then
    echo -e "${RED}❌ Erreurs TypeScript${NC}"
    npx tsc --noEmit 2>&1 | grep "error TS" | head -5
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ TypeScript OK${NC}"
fi

# 3. Vérifier les imports Prisma
echo -e "\n3️⃣  Vérification Prisma Client..."
if ! grep -q "@prisma/client" package.json; then
    echo -e "${RED}❌ @prisma/client manquant dans package.json${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Prisma Client présent${NC}"
fi

# 4. Vérifier les exports critiques
echo -e "\n4️⃣  Vérification des exports..."
MISSING_EXPORTS=0
if ! grep -q "export.*AddDesignsModal" src/components/collections/AddDesignsModal.tsx 2>/dev/null; then
    echo -e "${YELLOW}⚠️  AddDesignsModal export manquant${NC}"
    MISSING_EXPORTS=$((MISSING_EXPORTS + 1))
fi
if ! grep -q "export.*VersionTimeline" src/components/versioning/VersionTimeline.tsx 2>/dev/null; then
    echo -e "${YELLOW}⚠️  VersionTimeline export manquant${NC}"
    MISSING_EXPORTS=$((MISSING_EXPORTS + 1))
fi
if [ $MISSING_EXPORTS -eq 0 ]; then
    echo -e "${GREEN}✅ Exports OK${NC}"
else
    WARNINGS=$((WARNINGS + MISSING_EXPORTS))
fi

# 5. Vérifier vercel.json
echo -e "\n5️⃣  Vérification vercel.json..."
if [ ! -f "vercel.json" ]; then
    echo -e "${YELLOW}⚠️  vercel.json manquant${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ vercel.json présent${NC}"
fi

cd ../..

# ============================================
# BACKEND CHECKS
# ============================================
echo -e "\n${BLUE}🔧 BACKEND${NC}"
echo "-------------------------------------------"

cd apps/backend

# 1. Vérifier le build
echo -e "\n1️⃣  Test du build production..."
if npm run build 2>&1 | tee /tmp/backend-build.log | grep -qE "error|Error|Failed"; then
    echo -e "${RED}❌ Erreurs de build détectées${NC}"
    echo -e "${YELLOW}Logs: /tmp/backend-build.log${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Build OK${NC}"
fi

# 2. Vérifier serverless.js
echo -e "\n2️⃣  Vérification serverless handler..."
if [ ! -f "dist/src/serverless.js" ] && [ ! -f "api/src/serverless.js" ]; then
    echo -e "${YELLOW}⚠️  serverless.js non trouvé${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ serverless.js présent${NC}"
fi

# 3. Vérifier api/index.ts
echo -e "\n3️⃣  Vérification api/index.ts..."
if [ ! -f "api/index.ts" ]; then
    echo -e "${RED}❌ api/index.ts manquant${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ api/index.ts présent${NC}"
fi

# 4. Vérifier vercel.json
echo -e "\n4️⃣  Vérification vercel.json..."
if [ ! -f "vercel.json" ]; then
    echo -e "${YELLOW}⚠️  vercel.json manquant${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ vercel.json présent${NC}"
fi

cd ../..

# ============================================
# VARIABLES D'ENVIRONNEMENT
# ============================================
echo -e "\n${BLUE}🔐 VARIABLES D'ENVIRONNEMENT${NC}"
echo "-------------------------------------------"

REQUIRED_VARS=(
    "DATABASE_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
)

MISSING_VARS=0
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" apps/frontend/.env.local 2>/dev/null && \
       ! grep -q "^${var}=" apps/frontend/.env 2>/dev/null && \
       ! grep -q "^${var}=" apps/backend/.env.local 2>/dev/null && \
       ! grep -q "^${var}=" apps/backend/.env 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Variable manquante: ${var}${NC}"
        MISSING_VARS=$((MISSING_VARS + 1))
    fi
done

if [ $MISSING_VARS -eq 0 ]; then
    echo -e "${GREEN}✅ Variables critiques présentes (localement)${NC}"
    echo -e "${YELLOW}⚠️  Vérifiez aussi dans Vercel Dashboard${NC}"
else
    WARNINGS=$((WARNINGS + MISSING_VARS))
fi

# ============================================
# RÉSUMÉ
# ============================================
echo -e "\n==========================================="
echo -e "${BLUE}📊 RÉSUMÉ${NC}"
echo "-------------------------------------------"
echo -e "Erreurs: ${RED}${ERRORS}${NC}"
echo -e "Avertissements: ${YELLOW}${WARNINGS}${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "\n${GREEN}✅ Prêt pour le déploiement!${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "\n${YELLOW}⚠️  Déploiement possible mais avec avertissements${NC}"
    exit 0
else
    echo -e "\n${RED}❌ ${ERRORS} erreur(s) à corriger avant le déploiement${NC}"
    exit 1
fi















