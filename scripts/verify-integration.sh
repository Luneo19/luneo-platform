#!/bin/bash

# 🔍 Script de Vérification de l'Intégration
# Vérifie que tous les fichiers sont correctement connectés

set -e

echo "🔍 VÉRIFICATION DE L'INTÉGRATION"
echo "================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

ERRORS=0

# Fonction pour vérifier un fichier
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✅ $1${NC}"
  else
    echo -e "${RED}❌ $1 manquant${NC}"
    ERRORS=$((ERRORS + 1))
  fi
}

# Fonction pour vérifier un import
check_import() {
  if grep -q "$2" "$1" 2>/dev/null; then
    echo -e "${GREEN}✅ Import $2 trouvé dans $1${NC}"
  else
    echo -e "${RED}❌ Import $2 manquant dans $1${NC}"
    ERRORS=$((ERRORS + 1))
  fi
}

echo -e "${YELLOW}📁 Vérification des fichiers backend...${NC}"

# Backend - Webhooks
check_file "apps/backend/src/modules/public-api/webhooks/webhooks.controller.ts"
check_file "apps/backend/src/modules/public-api/webhooks/webhooks.service.ts"
check_file "apps/backend/src/modules/public-api/webhooks/webhooks.module.ts"
check_file "apps/backend/src/modules/public-api/webhooks/dto/create-webhook.dto.ts"
check_file "apps/backend/src/modules/public-api/webhooks/dto/update-webhook.dto.ts"

# Vérifier que WebhooksModule est importé dans PublicApiModule
check_import "apps/backend/src/modules/public-api/public-api.module.ts" "WebhooksModule"

# Vérifier que PublicApiModule est importé dans AppModule
check_import "apps/backend/src/app.module.ts" "PublicApiModule"

echo -e "\n${YELLOW}📁 Vérification des fichiers frontend...${NC}"

# Frontend - Webhooks Dashboard
check_file "apps/frontend/src/app/(dashboard)/dashboard/webhooks/page.tsx"
check_file "apps/frontend/src/app/(dashboard)/dashboard/webhooks/components/CreateWebhookModal.tsx"
check_file "apps/frontend/src/app/(dashboard)/dashboard/webhooks/components/EditWebhookModal.tsx"
check_file "apps/frontend/src/app/(dashboard)/dashboard/webhooks/components/WebhookLogsModal.tsx"
check_file "apps/frontend/src/app/(dashboard)/dashboard/webhooks/components/TestWebhookModal.tsx"

# Vérifier que Webhook est dans la navigation
check_import "apps/frontend/src/components/dashboard/Sidebar.tsx" "Webhook"

# Vérifier que les endpoints webhooks sont dans le client API
check_import "apps/frontend/src/lib/api/client.ts" "webhooks:"

echo -e "\n${YELLOW}📁 Vérification des SDKs...${NC}"

# SDK TypeScript
check_file "sdk/typescript/package.json"
check_file "sdk/typescript/src/index.ts"
check_file "sdk/typescript/src/client.ts"

# SDK Python
check_file "sdk/python/setup.py"
check_file "sdk/python/luneo/__init__.py"
check_file "sdk/python/luneo/client.py"

# Postman Collection
check_file "postman/Luneo-API.postman_collection.json"

echo -e "\n${YELLOW}📁 Vérification i18n...${NC}"

# i18n
check_file "apps/frontend/src/i18n/index.ts"
check_file "apps/frontend/src/i18n/config.ts"
check_file "apps/frontend/src/i18n/server.ts"
check_file "apps/frontend/src/i18n/locales/de.ts"
check_file "apps/frontend/src/i18n/locales/es.ts"
check_file "apps/frontend/src/i18n/locales/it.ts"

echo -e "\n${YELLOW}📁 Vérification des tests...${NC}"

# Tests Performance
check_file "tests/performance/k6-load-test.js"
check_file "tests/performance/artillery-config.yml"
check_file ".github/workflows/performance-tests.yml"

# Tests A11y
check_file "apps/frontend/tests/a11y/a11y.spec.ts"
check_file ".github/workflows/a11y-tests.yml"

# Security
check_file ".github/dependabot.yml"
check_file ".github/workflows/security-scan.yml"

# Monitoring
check_file "monitoring/alerts.yml"
check_file "monitoring/alert-rules.ts"

# Documentation
check_file "docs/api/public-api.md"

echo ""
if [ $ERRORS -eq 0 ]; then
  echo -e "${GREEN}✅ Tous les fichiers sont présents et correctement intégrés !${NC}"
  exit 0
else
  echo -e "${RED}❌ $ERRORS erreur(s) détectée(s)${NC}"
  exit 1
fi
