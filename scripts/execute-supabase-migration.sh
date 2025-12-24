#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SCRIPT D'EXÉCUTION MIGRATION SUPABASE
# Exécute la migration SQL via l'API REST Supabase
# ═══════════════════════════════════════════════════════════════

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SUPABASE_PROJECT_ID="obrijgptqztacolemsbk"
MIGRATION_FILE="apps/frontend/supabase/migrations/ensure_ai_studio_tables.sql"
SUPABASE_API_URL="https://${SUPABASE_PROJECT_ID}.supabase.co"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         EXÉCUTION MIGRATION SQL SUPABASE                     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier fichier
if [ ! -f "$MIGRATION_FILE" ]; then
  echo -e "${RED}❌ Fichier de migration introuvable: $MIGRATION_FILE${NC}"
  exit 1
fi

# Demander Service Role Key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${YELLOW}⚠️  Service Role Key requise${NC}"
  echo -e "${BLUE}   Récupérez-la depuis: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/settings/api${NC}"
  echo ""
  read -sp "Entrez votre Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
  echo ""
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo -e "${RED}❌ Service Role Key requise${NC}"
  exit 1
fi

# Lire le contenu SQL
SQL_CONTENT=$(cat "$MIGRATION_FILE")

echo -e "${CYAN}📄 Contenu de la migration:${NC}"
echo -e "${BLUE}$(head -5 "$MIGRATION_FILE")${NC}..."
echo ""

# Méthode 1: Via psql (si disponible et si on a les credentials)
if command -v psql &> /dev/null; then
  echo -e "${CYAN}💡 Option disponible: Exécution directe via psql${NC}"
  echo -e "${YELLOW}   Si vous avez les credentials PostgreSQL, vous pouvez exécuter:${NC}"
  echo -e "${BLUE}   psql 'postgresql://postgres:[PASSWORD]@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres' -f ${MIGRATION_FILE}${NC}"
  echo ""
  read -p "Voulez-vous utiliser psql? (o/N): " use_psql
  
  if [ "$use_psql" = "o" ] || [ "$use_psql" = "O" ]; then
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
      read -sp "Entrez le mot de passe PostgreSQL: " SUPABASE_DB_PASSWORD
      echo ""
    fi
    
    DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"
    
    if psql "$DB_URL" -f "$MIGRATION_FILE" > /tmp/migration.log 2>&1; then
      echo -e "${GREEN}✅ Migration exécutée via psql${NC}"
      exit 0
    else
      echo -e "${RED}❌ Échec psql${NC}"
      cat /tmp/migration.log
      echo ""
    fi
  fi
fi

# Méthode 2: Via API REST (endpoint SQL Editor)
echo -e "${CYAN}📤 Exécution via API REST Supabase...${NC}"

# Utiliser l'endpoint SQL Editor de Supabase
# Note: Supabase n'expose pas directement un endpoint pour exécuter du SQL arbitraire
# On va utiliser l'approche recommandée: via le dashboard ou via psql

echo -e "${YELLOW}⚠️  L'API REST Supabase ne permet pas d'exécuter du SQL arbitraire directement${NC}"
echo -e "${CYAN}   Utilisation de la méthode recommandée:${NC}"
echo ""

# Créer un script temporaire avec les instructions
TEMP_SCRIPT="/tmp/supabase_migration_instructions.txt"
cat > "$TEMP_SCRIPT" << EOF
╔══════════════════════════════════════════════════════════════╗
║         INSTRUCTIONS POUR EXÉCUTER LA MIGRATION             ║
╚══════════════════════════════════════════════════════════════╝

MÉTHODE 1: Via Dashboard Supabase (Recommandé)
────────────────────────────────────────────────
1. Ouvrez: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new
2. Copiez le contenu du fichier: ${MIGRATION_FILE}
3. Collez dans l'éditeur SQL
4. Cliquez sur "Run" ou appuyez sur Cmd+Enter

MÉTHODE 2: Via psql (si vous avez les credentials)
───────────────────────────────────────────────────
psql 'postgresql://postgres:[PASSWORD]@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres' \\
  -f ${MIGRATION_FILE}

MÉTHODE 3: Via Supabase CLI
────────────────────────────
cd apps/frontend
supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"

EOF

cat "$TEMP_SCRIPT"
echo ""

# Afficher le contenu SQL pour copier-coller
echo -e "${CYAN}📋 Contenu SQL à copier:${NC}"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
cat "$MIGRATION_FILE"
echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"
echo ""

# Option: Ouvrir automatiquement le dashboard
read -p "Voulez-vous ouvrir le dashboard Supabase dans votre navigateur? (O/n): " open_dashboard

if [ "$open_dashboard" != "n" ] && [ "$open_dashboard" != "N" ]; then
  DASHBOARD_URL="https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new"
  
  if command -v open &> /dev/null; then
    open "$DASHBOARD_URL"
  elif command -v xdg-open &> /dev/null; then
    xdg-open "$DASHBOARD_URL"
  else
    echo -e "${YELLOW}   Ouvrez manuellement: ${DASHBOARD_URL}${NC}"
  fi
fi

echo ""
read -p "Appuyez sur Entrée une fois la migration exécutée dans le dashboard..."

echo ""
echo -e "${GREEN}✅ Migration supposée exécutée${NC}"
echo -e "${CYAN}   Vérifiez dans le dashboard que la migration a bien été appliquée${NC}"

