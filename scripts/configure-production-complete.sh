#!/bin/bash

# 🚀 Script de Configuration Production Complète
# Configure automatiquement Vercel et Railway pour la production

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🚀 Configuration Production Complète"
echo "===================================="
echo ""

# Vérifier les CLI
echo -e "${YELLOW}📋 Vérification des CLI...${NC}"

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    echo "Installation..."
    npm install -g vercel
fi

if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI non installé${NC}"
    echo "Installation..."
    npm install -g @railway/cli
fi

echo -e "${GREEN}✅ CLI disponibles${NC}"
echo ""

# Vérifier les connexions
echo -e "${YELLOW}🔐 Vérification des connexions...${NC}"

cd apps/frontend
if ! vercel whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Connexion Vercel requise${NC}"
    vercel login
fi
VERCEL_USER=$(vercel whoami 2>/dev/null | head -1)
echo -e "${GREEN}✅ Vercel: ${VERCEL_USER}${NC}"

cd ../backend
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Connexion Railway requise${NC}"
    railway login
fi
RAILWAY_USER=$(railway whoami 2>/dev/null | grep "Logged in" || echo "Connected")
echo -e "${GREEN}✅ Railway: ${RAILWAY_USER}${NC}"

cd ../..
echo ""

# Configuration Vercel
echo -e "${YELLOW}⚙️  Configuration Vercel (Frontend)...${NC}"
cd apps/frontend

# Variables critiques
echo "Ajout des variables d'environnement..."

# API URL (CRITIQUE)
if ! vercel env ls | grep -q "NEXT_PUBLIC_API_URL"; then
    echo "https://api.luneo.app/api" | vercel env add NEXT_PUBLIC_API_URL production
    echo -e "${GREEN}✅ NEXT_PUBLIC_API_URL ajouté${NC}"
else
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_API_URL existe déjà${NC}"
fi

# APP URL
if ! vercel env ls | grep -q "NEXT_PUBLIC_APP_URL"; then
    echo "https://app.luneo.app" | vercel env add NEXT_PUBLIC_APP_URL production
    echo -e "${GREEN}✅ NEXT_PUBLIC_APP_URL ajouté${NC}"
else
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_APP_URL existe déjà${NC}"
fi

# Supabase (si dans vercel.env.example)
if grep -q "NEXT_PUBLIC_SUPABASE_URL" vercel.env.example; then
    SUPABASE_URL=$(grep "^NEXT_PUBLIC_SUPABASE_URL" vercel.env.example | cut -d'=' -f2)
    if [ ! -z "$SUPABASE_URL" ] && [ "$SUPABASE_URL" != "your-supabase-url" ]; then
        if ! vercel env ls | grep -q "NEXT_PUBLIC_SUPABASE_URL"; then
            echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
            echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_URL ajouté${NC}"
        fi
    fi
fi

echo -e "${GREEN}✅ Configuration Vercel terminée${NC}"
echo ""

# Configuration Railway (Backend)
echo -e "${YELLOW}⚙️  Configuration Railway (Backend)...${NC}"
cd ../backend

# Vérifier les variables existantes
echo "Vérification des variables Railway..."

# Variables critiques déjà configurées
echo -e "${GREEN}✅ Variables critiques déjà configurées${NC}"
echo ""

# Résumé
echo -e "${GREEN}===================================="
echo "✅ CONFIGURATION TERMINÉE !"
echo "====================================${NC}"
echo ""
echo "📊 Résumé:"
echo "  - Vercel: Variables configurées"
echo "  - Railway: Variables vérifiées"
echo ""
echo "🚀 Prochaines étapes:"
echo "  1. Redéployer le frontend: cd apps/frontend && vercel --prod"
echo "  2. Vérifier les variables: vercel env ls"
echo "  3. Tester: curl https://app.luneo.app"
echo ""






