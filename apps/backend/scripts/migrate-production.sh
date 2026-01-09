#!/bin/bash

# Script de migration Prisma en production
# Usage: ./scripts/migrate-production.sh [--dry-run] [--backup]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

DRY_RUN=false
CREATE_BACKUP=true

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --no-backup)
      CREATE_BACKUP=false
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${YELLOW}🗄️  LUNEO Backend - Migration Production${NC}"
echo "=========================================="

# Check DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}❌ DATABASE_URL not set${NC}"
  exit 1
fi

# Step 1: Backup
if [ "$CREATE_BACKUP" = true ]; then
  echo -e "\n${YELLOW}📦 Step 1: Creating database backup${NC}"
  
  mkdir -p "$BACKUP_DIR"
  
  if command -v pg_dump &> /dev/null; then
    BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
    echo "Backing up to: $BACKUP_FILE"
    pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
  else
    echo -e "${YELLOW}⚠️  pg_dump not found. Backup skipped.${NC}"
    echo -e "${RED}⚠️  WARNING: Proceeding without backup!${NC}"
    echo "Continue? (yes/no)"
    read -r response
    if [ "$response" != "yes" ]; then
      exit 1
    fi
  fi
fi

# Step 2: Check migration status
echo -e "\n${YELLOW}📊 Step 2: Checking migration status${NC}"
cd "$PROJECT_DIR"

# Generate Prisma client first
npx prisma generate

# Check status
npx prisma migrate status

# Step 3: Preview migrations
echo -e "\n${YELLOW}👀 Step 3: Previewing migrations${NC}"

# Get pending migrations
PENDING=$(npx prisma migrate status 2>&1 | grep -i "pending" || echo "")

if [ -n "$PENDING" ]; then
  echo -e "${YELLOW}Pending migrations detected${NC}"
  echo "$PENDING"
else
  echo -e "${GREEN}✅ No pending migrations${NC}"
  exit 0
fi

# Step 4: Dry run (if requested)
if [ "$DRY_RUN" = true ]; then
  echo -e "\n${YELLOW}🔍 Step 4: Dry run (preview only)${NC}"
  echo "This would apply the following migrations:"
  npx prisma migrate diff \
    --from-schema-datamodel prisma/schema.prisma \
    --to-schema-datasource prisma/schema.prisma \
    --script || echo "No differences found"
  echo -e "${GREEN}✅ Dry run completed${NC}"
  exit 0
fi

# Step 5: Confirm
echo -e "\n${RED}⚠️  WARNING: This will apply migrations to production database!${NC}"
echo "Continue? (yes/no)"
read -r response

if [ "$response" != "yes" ]; then
  echo "Migration cancelled"
  exit 0
fi

# Step 6: Apply migrations
echo -e "\n${YELLOW}🚀 Step 6: Applying migrations${NC}"

# Option 1: Automatic (recommended for most cases)
npx prisma migrate deploy

# Option 2: Manual (if you need more control)
# 1. Generate SQL
# npx prisma migrate diff \
#   --from-schema-datamodel prisma/schema.prisma \
#   --to-schema-datasource prisma/schema.prisma \
#   --script > migration_$TIMESTAMP.sql
# 
# 2. Review SQL
# cat migration_$TIMESTAMP.sql
# 
# 3. Apply manually
# psql "$DATABASE_URL" -f migration_$TIMESTAMP.sql

echo -e "${GREEN}✅ Migrations applied${NC}"

# Step 7: Verify
echo -e "\n${YELLOW}✅ Step 7: Verifying migrations${NC}"
npx prisma migrate status

echo -e "\n${GREEN}✅ Migration completed successfully!${NC}"

































