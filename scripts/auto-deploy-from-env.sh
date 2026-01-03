#!/bin/bash

# Script automatisé qui lit les fichiers .env et configure/déploie tout automatiquement
# Usage: ./scripts/auto-deploy-from-env.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Déploiement Automatique depuis .env${NC}"
echo "=========================================="
echo ""

# Fonction pour charger les variables d'un fichier .env
load_env_file() {
    local env_file=$1
    if [ -f "$env_file" ]; then
        echo -e "${GREEN}✅ Chargement: $env_file${NC}"
        # Source le fichier en ignorant les commentaires et lignes vides
        set -a
        source <(grep -v '^#' "$env_file" | grep -v '^$' | sed 's/^export //')
        set +a
        return 0
    else
        echo -e "${YELLOW}⚠️  Fichier non trouvé: $env_file${NC}"
        return 1
    fi
}

# Aller à la racine du projet
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# Charger les fichiers .env dans l'ordre de priorité
echo -e "${BLUE}📋 Chargement des variables d'environnement...${NC}"
echo ""

# Backend .env
BACKEND_ENV_FILES=(
    "$PROJECT_ROOT/apps/backend/.env.local"
    "$PROJECT_ROOT/apps/backend/.env"
    "$PROJECT_ROOT/.env"
)

BACKEND_ENV_LOADED=false
for env_file in "${BACKEND_ENV_FILES[@]}"; do
    if load_env_file "$env_file"; then
        BACKEND_ENV_LOADED=true
        break
    fi
done

# Frontend .env
FRONTEND_ENV_FILES=(
    "$PROJECT_ROOT/apps/frontend/.env.local"
    "$PROJECT_ROOT/apps/frontend/.env"
    "$PROJECT_ROOT/.env"
)

FRONTEND_ENV_LOADED=false
for env_file in "${FRONTEND_ENV_FILES[@]}"; do
    if load_env_file "$env_file"; then
        FRONTEND_ENV_LOADED=true
        break
    fi
done

if [ "$BACKEND_ENV_LOADED" = false ] && [ "$FRONTEND_ENV_LOADED" = false ]; then
    echo -e "${RED}❌ Aucun fichier .env trouvé${NC}"
    echo "   Créez un fichier .env ou .env.local dans apps/backend/ ou apps/frontend/"
    exit 1
fi

echo ""

# Vérifier les CLI tools
echo -e "${BLUE}🔧 Vérification des outils CLI...${NC}"
echo ""

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    echo "   Installation: npm i -g vercel"
    exit 1
fi
echo -e "${GREEN}✅ Vercel CLI disponible${NC}"

USE_RAILWAY=false
if command -v railway &> /dev/null; then
    echo -e "${GREEN}✅ Railway CLI disponible${NC}"
    USE_RAILWAY=true
else
    echo -e "${YELLOW}⚠️  Railway CLI non installé (backend sur Vercel)${NC}"
fi

# Vérifier les connexions
echo ""
echo -e "${BLUE}🔐 Vérification des connexions...${NC}"
echo ""

if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Non connecté à Vercel${NC}"
    echo "   Exécuter: vercel login"
    exit 1
fi
echo -e "${GREEN}✅ Connecté à Vercel: $(vercel whoami)${NC}"

if [ "$USE_RAILWAY" = true ]; then
    if ! railway whoami &> /dev/null; then
        echo -e "${YELLOW}⚠️  Non connecté à Railway${NC}"
        USE_RAILWAY=false
    else
        echo -e "${GREEN}✅ Connecté à Railway: $(railway whoami)${NC}"
    fi
fi

echo ""

# Fonction pour configurer une variable Vercel
configure_vercel_var() {
    local var_name=$1
    local var_value=$2
    local env=$3
    local project_dir=$4
    
    if [ -z "$var_value" ]; then
        return 0
    fi
    
    local current_dir=$(pwd)
    cd "$project_dir"
    # Vercel env add avec --force pour écraser si existe déjà
    echo "$var_value" | vercel env add "$var_name" "$env" --force 2>&1 | grep -vE "(Already exists|What's the value|Adding)" || true
    cd "$current_dir"
}

# Configuration Vercel Backend
echo -e "${BLUE}📦 Configuration Vercel Backend...${NC}"
echo ""

BACKEND_DIR="$PROJECT_ROOT/apps/backend"
cd "$BACKEND_DIR"

# Vérifier que le projet est lié
if [ ! -f .vercel/project.json ]; then
    echo -e "${YELLOW}⚠️  Projet Vercel non lié, liaison automatique...${NC}"
    vercel link --yes || {
        echo -e "${RED}❌ Échec de la liaison${NC}"
        exit 1
    }
fi

ENVIRONMENT="production"

# Variables Backend
if [ -n "$DATABASE_URL" ]; then
    configure_vercel_var "DATABASE_URL" "$DATABASE_URL" "$ENVIRONMENT" "$BACKEND_DIR"
    echo -e "${GREEN}✅ DATABASE_URL configuré${NC}"
fi

if [ -n "$REDIS_URL" ]; then
    configure_vercel_var "REDIS_URL" "$REDIS_URL" "$ENVIRONMENT" "$BACKEND_DIR"
    echo -e "${GREEN}✅ REDIS_URL configuré${NC}"
elif [ -n "$REDIS_HOST" ]; then
    configure_vercel_var "REDIS_HOST" "$REDIS_HOST" "$ENVIRONMENT" "$BACKEND_DIR"
    configure_vercel_var "REDIS_PORT" "${REDIS_PORT:-6379}" "$ENVIRONMENT" "$BACKEND_DIR"
    echo -e "${GREEN}✅ REDIS_HOST configuré${NC}"
fi

# JWT (générer si manquant)
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
fi
if [ -z "$JWT_REFRESH_SECRET" ]; then
    JWT_REFRESH_SECRET=$(openssl rand -base64 64 | tr -d '\n')
fi

configure_vercel_var "JWT_SECRET" "$JWT_SECRET" "$ENVIRONMENT" "$BACKEND_DIR"
configure_vercel_var "JWT_REFRESH_SECRET" "$JWT_REFRESH_SECRET" "$ENVIRONMENT" "$BACKEND_DIR"
configure_vercel_var "JWT_EXPIRES_IN" "${JWT_EXPIRES_IN:-15m}" "$ENVIRONMENT" "$BACKEND_DIR"
configure_vercel_var "JWT_REFRESH_EXPIRES_IN" "${JWT_REFRESH_EXPIRES_IN:-7d}" "$ENVIRONMENT" "$BACKEND_DIR"
echo -e "${GREEN}✅ JWT configuré${NC}"

# AWS S3
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    configure_vercel_var "AWS_ACCESS_KEY_ID" "$AWS_ACCESS_KEY_ID" "$ENVIRONMENT" "$BACKEND_DIR"
    configure_vercel_var "AWS_SECRET_ACCESS_KEY" "$AWS_SECRET_ACCESS_KEY" "$ENVIRONMENT" "$BACKEND_DIR"
    configure_vercel_var "AWS_REGION" "${AWS_REGION:-eu-west-1}" "$ENVIRONMENT" "$BACKEND_DIR"
    configure_vercel_var "AWS_S3_BUCKET" "$AWS_S3_BUCKET" "$ENVIRONMENT" "$BACKEND_DIR"
    echo -e "${GREEN}✅ AWS S3 configuré${NC}"
fi

# App
configure_vercel_var "NODE_ENV" "${NODE_ENV:-production}" "$ENVIRONMENT" "$BACKEND_DIR"
configure_vercel_var "PORT" "${PORT:-3001}" "$ENVIRONMENT" "$BACKEND_DIR"
configure_vercel_var "FRONTEND_URL" "${FRONTEND_URL:-https://app.luneo.app}" "$ENVIRONMENT" "$BACKEND_DIR"
configure_vercel_var "CORS_ORIGIN" "${CORS_ORIGIN:-https://app.luneo.app}" "$ENVIRONMENT" "$BACKEND_DIR"

# Stripe (optionnel)
if [ -n "$STRIPE_SECRET_KEY" ]; then
    configure_vercel_var "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY" "$ENVIRONMENT" "$BACKEND_DIR"
fi

cd "$PROJECT_ROOT"

echo ""

# Configuration Vercel Frontend
echo -e "${BLUE}📦 Configuration Vercel Frontend...${NC}"
echo ""

FRONTEND_DIR="$PROJECT_ROOT/apps/frontend"
cd "$FRONTEND_DIR"

# Vérifier que le projet est lié
if [ ! -f .vercel/project.json ]; then
    echo -e "${YELLOW}⚠️  Projet Vercel non lié, liaison automatique...${NC}"
    vercel link --yes || {
        echo -e "${RED}❌ Échec de la liaison${NC}"
        exit 1
    }
fi

# Variables Frontend
configure_vercel_var "NEXT_PUBLIC_API_URL" "${NEXT_PUBLIC_API_URL:-https://api.luneo.app}" "$ENVIRONMENT" "$FRONTEND_DIR"
configure_vercel_var "NEXT_PUBLIC_WIDGET_URL" "${NEXT_PUBLIC_WIDGET_URL:-https://cdn.luneo.app/widget/v1/luneo-widget.iife.js}" "$ENVIRONMENT" "$FRONTEND_DIR"
configure_vercel_var "NEXT_PUBLIC_APP_URL" "${NEXT_PUBLIC_APP_URL:-https://app.luneo.app}" "$ENVIRONMENT" "$FRONTEND_DIR"

echo -e "${GREEN}✅ Frontend configuré${NC}"

cd "$PROJECT_ROOT"

echo ""

# Configuration Railway (si disponible)
if [ "$USE_RAILWAY" = true ]; then
    echo -e "${BLUE}📦 Configuration Railway...${NC}"
    echo ""
    
    cd "$PROJECT_ROOT/apps/backend"
    
    # Vérifier que le projet est lié
    if ! railway status &> /dev/null; then
        echo -e "${YELLOW}⚠️  Projet Railway non lié${NC}"
        echo "   Lier manuellement: railway link"
    else
        # Configurer les variables Railway (utiliser --set)
        RAILWAY_VARS=()
        
        if [ -n "$DATABASE_URL" ]; then
            RAILWAY_VARS+=("--set" "DATABASE_URL=$DATABASE_URL")
        fi
        
        if [ -n "$REDIS_URL" ]; then
            RAILWAY_VARS+=("--set" "REDIS_URL=$REDIS_URL")
        elif [ -n "$REDIS_HOST" ]; then
            RAILWAY_VARS+=("--set" "REDIS_HOST=$REDIS_HOST")
            RAILWAY_VARS+=("--set" "REDIS_PORT=${REDIS_PORT:-6379}")
        fi
        
        if [ -n "$JWT_SECRET" ]; then
            RAILWAY_VARS+=("--set" "JWT_SECRET=$JWT_SECRET")
        fi
        
        if [ -n "$JWT_REFRESH_SECRET" ]; then
            RAILWAY_VARS+=("--set" "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET")
        fi
        
        if [ -n "$AWS_ACCESS_KEY_ID" ]; then
            RAILWAY_VARS+=("--set" "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID")
            RAILWAY_VARS+=("--set" "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY")
            RAILWAY_VARS+=("--set" "AWS_REGION=${AWS_REGION:-eu-west-1}")
            RAILWAY_VARS+=("--set" "AWS_S3_BUCKET=$AWS_S3_BUCKET")
        fi
        
        RAILWAY_VARS+=("--set" "NODE_ENV=${NODE_ENV:-production}")
        RAILWAY_VARS+=("--set" "PORT=${PORT:-3001}")
        RAILWAY_VARS+=("--set" "FRONTEND_URL=${FRONTEND_URL:-https://app.luneo.app}")
        RAILWAY_VARS+=("--set" "CORS_ORIGIN=${CORS_ORIGIN:-https://app.luneo.app}")
        
        if [ ${#RAILWAY_VARS[@]} -gt 0 ]; then
            railway variables "${RAILWAY_VARS[@]}" --skip-deploys 2>&1 | grep -vE "(Error|Warning)" || true
        fi
        
        echo -e "${GREEN}✅ Railway configuré${NC}"
    fi
    
    cd "$PROJECT_ROOT"
    echo ""
fi

# Vérification Redis
echo -e "${BLUE}🔍 Vérification Redis...${NC}"
echo ""

if [ -n "$REDIS_URL" ]; then
    "$PROJECT_ROOT/scripts/verify-redis.sh" "$REDIS_URL" || echo -e "${YELLOW}⚠️  Redis non accessible (peut être normal si non démarré)${NC}"
elif [ -n "$REDIS_HOST" ]; then
    "$PROJECT_ROOT/scripts/verify-redis.sh" "redis://${REDIS_HOST}:${REDIS_PORT:-6379}" || echo -e "${YELLOW}⚠️  Redis non accessible${NC}"
else
    echo -e "${YELLOW}⚠️  REDIS_URL/REDIS_HOST non défini, vérification ignorée${NC}"
fi

echo ""

# Configuration S3 (si AWS configuré)
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
    echo -e "${BLUE}☁️  Configuration S3...${NC}"
    echo ""
    
    # Test rapide S3
    if command -v aws &> /dev/null && [ -n "$AWS_S3_BUCKET" ]; then
        export AWS_ACCESS_KEY_ID
        export AWS_SECRET_ACCESS_KEY
        export AWS_DEFAULT_REGION="${AWS_REGION:-eu-west-1}"
        
        if aws s3 ls "s3://$AWS_S3_BUCKET" &> /dev/null; then
            echo -e "${GREEN}✅ S3 bucket accessible: $AWS_S3_BUCKET${NC}"
        else
            echo -e "${YELLOW}⚠️  S3 bucket non accessible ou n'existe pas${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  AWS CLI non installé ou bucket non défini${NC}"
    fi
    echo ""
fi

# Déploiement
echo -e "${BLUE}🚀 Déploiement...${NC}"
echo ""

# Backend
if [ "$USE_RAILWAY" = true ]; then
    echo "Déploiement Backend sur Railway..."
    cd "$PROJECT_ROOT/apps/backend"
    railway up --detach || echo -e "${YELLOW}⚠️  Erreur Railway (vérifiez: railway logs)${NC}"
    echo -e "${GREEN}✅ Backend déployé sur Railway${NC}"
    cd "$PROJECT_ROOT"
else
    echo "Déploiement Backend sur Vercel..."
    cd "$PROJECT_ROOT/apps/backend"
    vercel --prod || echo -e "${YELLOW}⚠️  Erreur Vercel (vérifiez: vercel logs)${NC}"
    echo -e "${GREEN}✅ Backend déployé sur Vercel${NC}"
    cd "$PROJECT_ROOT"
fi

echo ""

# Frontend
echo "Déploiement Frontend sur Vercel..."
cd "$PROJECT_ROOT/apps/frontend"
vercel --prod || echo -e "${YELLOW}⚠️  Erreur Vercel (vérifiez: vercel logs)${NC}"
echo -e "${GREEN}✅ Frontend déployé sur Vercel${NC}"
cd "$PROJECT_ROOT"

echo ""

# Résumé final
echo "=========================================="
echo -e "${GREEN}✅ Déploiement Automatique Terminé${NC}"
echo "=========================================="
echo ""
echo "📋 Résumé:"
echo "  ✅ Variables Vercel Backend configurées"
echo "  ✅ Variables Vercel Frontend configurées"
if [ "$USE_RAILWAY" = true ]; then
    echo "  ✅ Variables Railway configurées"
fi
echo "  ✅ Backend déployé"
echo "  ✅ Frontend déployé"
echo ""
echo "🧪 Pour tester:"
echo "  - Vérifier les URLs: vercel ls (frontend) et railway open (backend)"
echo "  - Health check: curl <BACKEND_URL>/api/v1/health"
echo ""

