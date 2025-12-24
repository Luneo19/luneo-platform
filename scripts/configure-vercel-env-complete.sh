#!/bin/bash

# Script pour configurer toutes les variables d'environnement Vercel
# Guide interactif professionnel

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔐 CONFIGURATION VARIABLES D'ENVIRONNEMENT VERCEL${NC}"
echo "=================================================="
echo ""

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI n'est pas installé${NC}"
    echo "Installez-le avec: npm i -g vercel"
    exit 1
fi

# Vérifier l'authentification
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non authentifié${NC}"
    echo "Exécutez: vercel login"
    exit 1
fi

echo -e "${GREEN}✅ Vercel CLI configuré${NC}"
echo ""

# Variables critiques
declare -A VARS=(
    ["NEXT_PUBLIC_SUPABASE_URL"]="URL Supabase (ex: https://xxx.supabase.co)"
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]="Clé anonyme Supabase"
    ["NEXT_PUBLIC_APP_URL"]="URL de l'application (https://luneo.app)"
    ["STRIPE_SECRET_KEY"]="Clé secrète Stripe (sk_live_...)"
    ["STRIPE_PUBLISHABLE_KEY"]="Clé publique Stripe (pk_live_...)"
    ["STRIPE_WEBHOOK_SECRET"]="Secret webhook Stripe (whsec_...)"
    ["CLOUDINARY_CLOUD_NAME"]="Nom du cloud Cloudinary"
    ["CLOUDINARY_API_KEY"]="Clé API Cloudinary"
    ["CLOUDINARY_API_SECRET"]="Secret API Cloudinary"
    ["NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"]="Nom du cloud Cloudinary (public)"
    ["NEXT_PUBLIC_CLOUDINARY_API_KEY"]="Clé API Cloudinary (public)"
    ["UPSTASH_REDIS_REST_URL"]="URL REST Upstash Redis"
    ["UPSTASH_REDIS_REST_TOKEN"]="Token Upstash Redis"
    ["NEXT_PUBLIC_SENTRY_DSN"]="DSN Sentry (optionnel)"
)

echo -e "${YELLOW}📝 Configuration des variables d'environnement${NC}"
echo "Appuyez sur Entrée pour ignorer une variable (déjà configurée)"
echo ""

for var in "${!VARS[@]}"; do
    desc="${VARS[$var]}"
    
    # Vérifier si déjà configurée
    if vercel env ls --scope luneos-projects 2>/dev/null | grep -q "$var"; then
        echo -e "${GREEN}✅ $var${NC} (déjà configurée)"
        read -p "  Modifier? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            continue
        fi
    fi
    
    echo -e "${BLUE}📌 $var${NC}"
    echo "  Description: $desc"
    read -p "  Valeur: " value
    
    if [ -n "$value" ]; then
        # Déterminer si c'est une variable publique
        if [[ $var == NEXT_PUBLIC_* ]]; then
            ENVS="production preview development"
        else
            ENVS="production preview development"
        fi
        
        for env in $ENVS; do
            echo -n "  Configuration pour $env... "
            if echo "$value" | vercel env add "$var" "$env" --scope luneos-projects 2>/dev/null; then
                echo -e "${GREEN}✅${NC}"
            else
                echo -e "${YELLOW}⚠️  (peut-être déjà configurée)${NC}"
            fi
        done
        echo ""
    fi
done

echo ""
echo -e "${GREEN}🎉 Configuration terminée !${NC}"
echo ""
echo -e "${YELLOW}📋 Prochaines étapes:${NC}"
echo "1. Redéployer: cd apps/frontend && vercel --prod"
echo "2. Vérifier les logs: vercel logs"
echo "3. Tester: https://luneo.app/api/health"

