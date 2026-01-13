#!/bin/bash

# Script de déploiement production pour LUNEO Backend
# Usage: ./scripts/deploy-production.sh [--skip-migrations] [--skip-tests]

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Flags
SKIP_MIGRATIONS=false
SKIP_TESTS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-migrations)
      SKIP_MIGRATIONS=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}🚀 LUNEO Backend - Déploiement Production${NC}"
echo "=========================================="

# Step 1: Pre-flight checks
echo -e "\n${YELLOW}📋 Step 1: Pre-flight checks${NC}"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo -e "${RED}❌ Node.js 22+ required. Current: $(node --version)${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js version: $(node --version)${NC}"

# Check required commands
for cmd in npm npx git; do
  if ! command -v $cmd &> /dev/null; then
    echo -e "${RED}❌ $cmd not found${NC}"
    exit 1
  fi
done
echo -e "${GREEN}✅ Required commands available${NC}"

# Check environment variables
REQUIRED_VARS=("DATABASE_URL" "JWT_SECRET" "JWT_REFRESH_SECRET")
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${RED}❌ Missing required environment variables:${NC}"
  printf '%s\n' "${MISSING_VARS[@]}"
  exit 1
fi
echo -e "${GREEN}✅ Required environment variables set${NC}"

# Step 2: Backup
echo -e "\n${YELLOW}📦 Step 2: Creating backups${NC}"

mkdir -p "$BACKUP_DIR"

# Backup database
if command -v pg_dump &> /dev/null && [ -n "$DATABASE_URL" ]; then
  echo "Creating database backup..."
  pg_dump "$DATABASE_URL" > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql" 2>/dev/null || echo -e "${YELLOW}⚠️  Database backup skipped (pg_dump not available or connection failed)${NC}"
fi

# Backup current build
if [ -d "$PROJECT_DIR/dist" ]; then
  echo "Backing up current build..."
  tar -czf "$BACKUP_DIR/build_backup_$TIMESTAMP.tar.gz" -C "$PROJECT_DIR" dist/ 2>/dev/null || true
fi

echo -e "${GREEN}✅ Backups created${NC}"

# Step 3: Git pull
echo -e "\n${YELLOW}📥 Step 3: Updating code${NC}"

cd "$PROJECT_DIR"
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
  echo -e "${YELLOW}⚠️  Not on main/master branch. Continue? (y/n)${NC}"
  read -r response
  if [ "$response" != "y" ]; then
    exit 1
  fi
fi

git pull origin "$CURRENT_BRANCH"
echo -e "${GREEN}✅ Code updated${NC}"

# Step 4: Install dependencies
echo -e "\n${YELLOW}📦 Step 4: Installing dependencies${NC}"

npm ci --production=false
echo -e "${GREEN}✅ Dependencies installed${NC}"

# Step 5: Run tests (optional)
if [ "$SKIP_TESTS" = false ]; then
  echo -e "\n${YELLOW}🧪 Step 5: Running tests${NC}"
  
  if npm test -- --passWithNoTests 2>/dev/null; then
    echo -e "${GREEN}✅ Tests passed${NC}"
  else
    echo -e "${YELLOW}⚠️  Tests failed or no tests found. Continue? (y/n)${NC}"
    read -r response
    if [ "$response" != "y" ]; then
      exit 1
    fi
  fi
else
  echo -e "${YELLOW}⏭️  Step 5: Tests skipped${NC}"
fi

# Step 6: Database migrations
if [ "$SKIP_MIGRATIONS" = false ]; then
  echo -e "\n${YELLOW}🗄️  Step 6: Database migrations${NC}"
  
  # Check migration status
  echo "Checking migration status..."
  npx prisma migrate status
  
  echo -e "${YELLOW}Apply migrations? (y/n)${NC}"
  read -r response
  if [ "$response" = "y" ]; then
    echo "Applying migrations..."
    npx prisma migrate deploy
    echo -e "${GREEN}✅ Migrations applied${NC}"
  else
    echo -e "${YELLOW}⏭️  Migrations skipped${NC}"
  fi
else
  echo -e "${YELLOW}⏭️  Step 6: Migrations skipped${NC}"
fi

# Step 7: Generate Prisma client
echo -e "\n${YELLOW}🔧 Step 7: Generating Prisma client${NC}"
npx prisma generate
echo -e "${GREEN}✅ Prisma client generated${NC}"

# Step 8: Build
echo -e "\n${YELLOW}🏗️  Step 8: Building application${NC}"
npm run build

if [ ! -d "$PROJECT_DIR/dist" ]; then
  echo -e "${RED}❌ Build failed: dist/ directory not found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Build successful${NC}"

# Step 9: Health check (if app is running)
echo -e "\n${YELLOW}🏥 Step 9: Health check${NC}"

if [ -n "$HEALTH_CHECK_URL" ]; then
  echo "Checking health at $HEALTH_CHECK_URL..."
  if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
    echo -e "${GREEN}✅ Health check passed${NC}"
  else
    echo -e "${YELLOW}⚠️  Health check failed (app might not be running yet)${NC}"
  fi
else
  echo -e "${YELLOW}⏭️  Health check skipped (HEALTH_CHECK_URL not set)${NC}"
fi

# Step 10: Summary
echo -e "\n${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo "=========================================="
echo "Next steps:"
echo "1. Restart the application (pm2 restart, docker-compose up -d, etc.)"
echo "2. Verify health endpoint: curl $HEALTH_CHECK_URL"
echo "3. Check metrics: curl $HEALTH_CHECK_URL/metrics"
echo "4. Monitor logs for errors"
echo ""
echo "Backups saved in: $BACKUP_DIR"

































