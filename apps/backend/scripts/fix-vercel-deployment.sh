#!/bin/bash

# ==============================================
# CORRECTION DÉPLOIEMENT VERCEL
# Corrige les problèmes de déploiement
# ==============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  CORRECTION DÉPLOIEMENT VERCEL - LUNEO                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$BACKEND_DIR"

# ==============================================
# 1. VÉRIFIER VERCEL.JSON
# ==============================================
echo -e "${YELLOW}🔍 Vérification de vercel.json...${NC}"

if [ ! -f "vercel.json" ]; then
    echo -e "${YELLOW}📝 Création de vercel.json...${NC}"
    cat > vercel.json << 'EOF'
{
  "version": 2,
  "buildCommand": "cd apps/backend && npx prisma generate && npm run build",
  "outputDirectory": "apps/backend/dist",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    },
    {
      "source": "/(.*)",
      "destination": "/api/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF
    echo -e "${GREEN}✅ vercel.json créé${NC}"
else
    echo -e "${GREEN}✅ vercel.json existe${NC}"
    
    # Vérifier si buildCommand est correct
    if ! grep -q "npx prisma generate" vercel.json; then
        echo -e "${YELLOW}⚠️  Mise à jour de vercel.json...${NC}"
        # Mettre à jour le buildCommand
        node -e "
        const fs = require('fs');
        const config = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
        config.buildCommand = 'cd apps/backend && npx prisma generate && npm run build';
        config.outputDirectory = 'apps/backend/dist';
        fs.writeFileSync('vercel.json', JSON.stringify(config, null, 2));
        "
        echo -e "${GREEN}✅ vercel.json mis à jour${NC}"
    fi
fi

# ==============================================
# 2. VÉRIFIER PACKAGE.JSON
# ==============================================
echo -e "${YELLOW}🔍 Vérification de package.json...${NC}"

# S'assurer que le script vercel-build existe
if ! grep -q '"vercel-build"' package.json; then
    echo -e "${YELLOW}📝 Ajout du script vercel-build...${NC}"
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['vercel-build'] = 'npx prisma generate && npm run build';
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    echo -e "${GREEN}✅ Script vercel-build ajouté${NC}"
fi

# ==============================================
# 3. VÉRIFIER PRISMA
# ==============================================
echo -e "${YELLOW}🔍 Vérification Prisma...${NC}"

if npx prisma validate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Schema Prisma valide${NC}"
else
    echo -e "${RED}❌ Erreur dans le schema Prisma${NC}"
    npx prisma validate
    exit 1
fi

# ==============================================
# 4. GÉNÉRATION PRISMA
# ==============================================
echo -e "${YELLOW}⚙️  Génération du client Prisma...${NC}"
npx prisma generate
echo -e "${GREEN}✅ Client Prisma généré${NC}"

# ==============================================
# 5. BUILD LOCAL
# ==============================================
echo -e "${YELLOW}🔨 Build local de test...${NC}"
npm run build
echo -e "${GREEN}✅ Build local réussi${NC}"

# ==============================================
# 6. VÉRIFIER VARIABLES VERCEL
# ==============================================
echo -e "${YELLOW}🔍 Vérification des variables Vercel...${NC}"

if vercel whoami > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connecté à Vercel: $(vercel whoami)${NC}"
    
    # Vérifier DATABASE_URL
    DB_URL=$(vercel env get DATABASE_URL production 2>/dev/null || echo "")
    if [ -z "$DB_URL" ] || [[ "$DB_URL" == *"PASSWORD"* ]] || [[ "$DB_URL" == *"placeholder"* ]]; then
        echo -e "${RED}❌ DATABASE_URL non configurée ou invalide${NC}"
        echo -e "${YELLOW}   Configurez-la dans Vercel Dashboard:${NC}"
        echo -e "${YELLOW}   https://vercel.com/luneos-projects/backend/settings/environment-variables${NC}"
        echo -e "${YELLOW}   Format: postgresql://postgres:[PASSWORD]@db.obrijgptqztacolemsbk.supabase.co:5432/postgres${NC}"
    else
        echo -e "${GREEN}✅ DATABASE_URL configurée${NC}"
    fi
    
    # Vérifier JWT_SECRET
    JWT=$(vercel env get JWT_SECRET production 2>/dev/null || echo "")
    if [ -z "$JWT" ] || [[ "$JWT" == *"your-super-secure"* ]]; then
        echo -e "${RED}❌ JWT_SECRET non configurée ou invalide${NC}"
        echo -e "${YELLOW}   Génération d'un nouveau secret...${NC}"
        NEW_JWT=$(openssl rand -base64 64 | tr -d '\n' | head -c 64)
        echo "$NEW_JWT" | vercel env add JWT_SECRET production --yes 2>/dev/null || {
            echo "$NEW_JWT" | vercel env rm JWT_SECRET production --yes 2>/dev/null || true
            echo "$NEW_JWT" | vercel env add JWT_SECRET production --yes
        }
        echo -e "${GREEN}✅ JWT_SECRET configuré${NC}"
    else
        echo -e "${GREEN}✅ JWT_SECRET configurée${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Non connecté à Vercel${NC}"
fi

echo ""
echo -e "${GREEN}✅ Corrections appliquées!${NC}"
echo ""
echo -e "${YELLOW}📋 Prochaine étape:${NC}"
echo "   vercel --prod"
echo ""




























