#!/bin/bash

# Script de rollback production pour LUNEO Backend
# Usage: ./scripts/rollback-production.sh [backup-timestamp]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"

echo -e "${RED}🔄 LUNEO Backend - Rollback Production${NC}"
echo "=========================================="

# List available backups
echo -e "\n${YELLOW}📦 Available backups:${NC}"
ls -lh "$BACKUP_DIR" | grep -E "backup_.*\.(sql|tar\.gz)" || echo "No backups found"

# Get backup timestamp
if [ -n "$1" ]; then
  BACKUP_TIMESTAMP=$1
else
  echo -e "\n${YELLOW}Enter backup timestamp (YYYYMMDD_HHMMSS) or 'latest':${NC}"
  read -r BACKUP_TIMESTAMP
fi

if [ "$BACKUP_TIMESTAMP" = "latest" ]; then
  DB_BACKUP=$(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | head -1)
  BUILD_BACKUP=$(ls -t "$BACKUP_DIR"/build_backup_*.tar.gz 2>/dev/null | head -1)
else
  DB_BACKUP="$BACKUP_DIR/db_backup_$BACKUP_TIMESTAMP.sql"
  BUILD_BACKUP="$BACKUP_DIR/build_backup_$BACKUP_TIMESTAMP.tar.gz"
fi

# Confirm rollback
echo -e "\n${RED}⚠️  WARNING: This will rollback to:${NC}"
echo "Database: $DB_BACKUP"
echo "Build: $BUILD_BACKUP"
echo -e "${RED}Are you sure? (yes/no)${NC}"
read -r response

if [ "$response" != "yes" ]; then
  echo "Rollback cancelled"
  exit 0
fi

# Rollback database
if [ -f "$DB_BACKUP" ] && [ -n "$DATABASE_URL" ]; then
  echo -e "\n${YELLOW}🗄️  Rolling back database...${NC}"
  echo -e "${RED}⚠️  This will overwrite the current database!${NC}"
  echo "Continue? (yes/no)"
  read -r db_response
  
  if [ "$db_response" = "yes" ]; then
    psql "$DATABASE_URL" < "$DB_BACKUP" || echo -e "${YELLOW}⚠️  Database rollback failed or skipped${NC}"
    echo -e "${GREEN}✅ Database rolled back${NC}"
  fi
else
  echo -e "${YELLOW}⏭️  Database rollback skipped (backup not found or DATABASE_URL not set)${NC}"
fi

# Rollback build
if [ -f "$BUILD_BACKUP" ]; then
  echo -e "\n${YELLOW}🏗️  Rolling back build...${NC}"
  tar -xzf "$BUILD_BACKUP" -C "$PROJECT_DIR"
  echo -e "${GREEN}✅ Build rolled back${NC}"
else
  echo -e "${YELLOW}⏭️  Build rollback skipped (backup not found)${NC}"
fi

echo -e "\n${GREEN}✅ Rollback completed${NC}"
echo "Next steps:"
echo "1. Restart the application"
echo "2. Verify health endpoint"
echo "3. Check logs for errors"





























