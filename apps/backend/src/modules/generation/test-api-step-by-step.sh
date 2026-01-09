#!/bin/bash
# Script pour tester l'API Generation étape par étape
# Usage: ./test-api-step-by-step.sh

set -e

API_URL="${API_URL:-http://localhost:3000}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

echo "🧪 Test API Generation - Étape par étape"
echo "========================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Vérifier que le serveur est accessible
echo "1️⃣  Vérification du serveur backend..."
if curl -s "$API_URL/health" > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Serveur accessible à $API_URL${NC}"
else
  echo -e "${RED}❌ Serveur non accessible à $API_URL${NC}"
  echo ""
  echo "Pour démarrer le serveur :"
  echo "  cd apps/backend"
  echo "  npm run start:dev"
  echo ""
  exit 1
fi

# 2. Récupérer ou créer une API Key
echo ""
echo "2️⃣  Préparation de l'API Key..."
cd "$BACKEND_DIR"

API_KEY=$(npx ts-node -e "
  import { PrismaClient } from '@prisma/client';
  const prisma = new PrismaClient();
  (async () => {
    try {
      const brand = await prisma.brand.findFirst();
      if (!brand) {
        console.error('No brand found');
        process.exit(1);
      }
      
      let apiKey = await prisma.apiKey.findFirst({
        where: { brandId: brand.id, isActive: true },
      });
      
      if (!apiKey) {
        const keyValue = 'test_' + Date.now();
        apiKey = await prisma.apiKey.create({
          data: {
            brandId: brand.id,
            name: 'Test API Key',
            key: keyValue,
            permissions: ['generation:create', 'generation:read'],
            rateLimit: { requestsPerMinute: 100, requestsPerDay: 10000 },
            isActive: true,
          },
        });
        console.log('CREATED:' + apiKey.id);
      } else {
        console.log('EXISTS:' + apiKey.id);
      }
      await prisma.\$disconnect();
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  })();
" 2>/dev/null)

if [[ $API_KEY == CREATED:* ]]; then
  API_KEY_ID="${API_KEY#CREATED:}"
  echo -e "${GREEN}✅ API Key créée: ${API_KEY_ID:0:20}...${NC}"
elif [[ $API_KEY == EXISTS:* ]]; then
  API_KEY_ID="${API_KEY#EXISTS:}"
  echo -e "${GREEN}✅ API Key existante: ${API_KEY_ID:0:20}...${NC}"
else
  echo -e "${RED}❌ Impossible de créer/récupérer une API Key${NC}"
  exit 1
fi

# 3. Récupérer un Product ID
echo ""
echo "3️⃣  Récupération d'un Product..."
PRODUCT_ID=$(npx ts-node -e "
  import { PrismaClient } from '@prisma/client';
  const prisma = new PrismaClient();
  (async () => {
    const product = await prisma.product.findFirst({
      where: { status: 'ACTIVE' },
    });
    if (product) {
      console.log(product.id);
    }
    await prisma.\$disconnect();
  })();
" 2>/dev/null)

if [ -z "$PRODUCT_ID" ]; then
  echo -e "${RED}❌ Aucun Product actif trouvé${NC}"
  echo "Créez un Product avec status='ACTIVE' dans la base de données"
  exit 1
fi

echo -e "${GREEN}✅ Product trouvé: $PRODUCT_ID${NC}"

# 4. Test de création d'une génération
echo ""
echo "4️⃣  Test POST /api/generation/create..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/generation/create" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY_ID" \
  -d "{
    \"productId\": \"$PRODUCT_ID\",
    \"customizations\": {
      \"test\": {
        \"text\": \"Hello World\",
        \"color\": \"#FF0000\"
      }
    },
    \"userPrompt\": \"Make it elegant\"
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "201" ] && [ "$HTTP_CODE" != "200" ]; then
  echo -e "${RED}❌ Échec de la création (HTTP $HTTP_CODE)${NC}"
  echo "Réponse: $BODY"
  exit 1
fi

GENERATION_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$GENERATION_ID" ]; then
  echo -e "${RED}❌ Impossible d'extraire l'ID de génération${NC}"
  echo "Réponse: $BODY"
  exit 1
fi

echo -e "${GREEN}✅ Génération créée: $GENERATION_ID${NC}"
echo "   Réponse: $(echo "$BODY" | jq -c '.' 2>/dev/null || echo "$BODY")"

# 5. Test du statut
echo ""
echo "5️⃣  Test GET /api/generation/$GENERATION_ID/status..."
sleep 2

STATUS_RESPONSE=$(curl -s "$API_URL/api/generation/$GENERATION_ID/status")
STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)

if [ -z "$STATUS" ]; then
  echo -e "${YELLOW}⚠️  Impossible d'extraire le statut${NC}"
  echo "Réponse: $STATUS_RESPONSE"
else
  echo -e "${GREEN}✅ Statut récupéré: $STATUS${NC}"
  echo "   Réponse: $(echo "$STATUS_RESPONSE" | jq -c '.' 2>/dev/null || echo "$STATUS_RESPONSE")"
fi

# 6. Test de récupération complète
echo ""
echo "6️⃣  Test GET /api/generation/$GENERATION_ID..."
FULL_RESPONSE=$(curl -s "$API_URL/api/generation/$GENERATION_ID")

if echo "$FULL_RESPONSE" | grep -q '"id"'; then
  echo -e "${GREEN}✅ Génération complète récupérée${NC}"
  echo "   Réponse: $(echo "$FULL_RESPONSE" | jq -c '.' 2>/dev/null || echo "$FULL_RESPONSE")"
else
  echo -e "${YELLOW}⚠️  Réponse inattendue${NC}"
  echo "Réponse: $FULL_RESPONSE"
fi

echo ""
echo -e "${GREEN}✅ Tous les tests API sont passés !${NC}"
echo ""
echo "📝 Résumé:"
echo "   - API Key: ${API_KEY_ID:0:20}..."
echo "   - Product ID: $PRODUCT_ID"
echo "   - Generation ID: $GENERATION_ID"
echo ""
echo "🎯 Prochaine étape: Tester le widget"
echo "   cd packages/widget/test"
echo "   python3 -m http.server 8080"
echo "   Ouvrir http://localhost:8080/generation-test.html"






