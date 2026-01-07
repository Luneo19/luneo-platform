#!/bin/bash

# Script pour ajouter rate limiting à une route API
# Usage: ./scripts/add-rate-limiting.sh <route-file>

set -e

ROUTE_FILE=$1

if [ -z "$ROUTE_FILE" ]; then
  echo "Usage: ./scripts/add-rate-limiting.sh <route-file>"
  exit 1
fi

if [ ! -f "$ROUTE_FILE" ]; then
  echo "Error: File not found: $ROUTE_FILE"
  exit 1
fi

# Vérifier si rate limiting est déjà présent
if grep -q "checkRateLimit\|getApiRateLimit" "$ROUTE_FILE"; then
  echo "✅ Rate limiting already present in $ROUTE_FILE"
  exit 0
fi

# Ajouter import si nécessaire
if ! grep -q "from '@/lib/rate-limit'" "$ROUTE_FILE"; then
  # Trouver la dernière ligne d'import
  LAST_IMPORT_LINE=$(grep -n "^import" "$ROUTE_FILE" | tail -1 | cut -d: -f1)
  
  if [ -n "$LAST_IMPORT_LINE" ]; then
    sed -i.bak "${LAST_IMPORT_LINE}a\\
import { checkRateLimit, getApiRateLimit, getClientIdentifier } from '@/lib/rate-limit';
" "$ROUTE_FILE"
    rm -f "${ROUTE_FILE}.bak"
  fi
fi

echo "✅ Rate limiting imports added to $ROUTE_FILE"
echo "⚠️  Manual step required: Add rate limiting check in route handlers"












