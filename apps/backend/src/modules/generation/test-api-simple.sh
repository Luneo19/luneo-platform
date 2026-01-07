#!/bin/bash
# Script simple pour tester l'API Generation
# Usage: ./test-api-simple.sh

API_URL="${API_URL:-http://localhost:3000}"
API_KEY="${API_KEY:-}"

echo "🧪 Test API Generation"
echo "📍 API URL: $API_URL"
echo ""

# 1. Vérifier que le serveur répond
echo "1️⃣ Vérification du serveur..."
if curl -s "$API_URL/health" > /dev/null 2>&1; then
  echo "✅ Serveur accessible"
else
  echo "❌ Serveur non accessible à $API_URL"
  echo "   Veuillez démarrer le serveur avec: npm run start:dev"
  exit 1
fi

# 2. Si pas d'API Key, on essaie de la récupérer depuis la DB
if [ -z "$API_KEY" ]; then
  echo "2️⃣ Récupération de l'API Key depuis la base de données..."
  API_KEY=$(cd /Users/emmanuelabougadous/luneo-platform/apps/backend && npx ts-node -e "
    import { PrismaClient } from '@prisma/client';
    const prisma = new PrismaClient();
    (async () => {
      const key = await prisma.apiKey.findFirst({ where: { isActive: true, revokedAt: null } });
      if (key) {
        console.log(key.id);
      }
      await prisma.\$disconnect();
    })();
  " 2>/dev/null)
  
  if [ -z "$API_KEY" ]; then
    echo "❌ Aucune API Key trouvée. Création d'une API Key de test..."
    API_KEY=$(cd /Users/emmanuelabougadous/luneo-platform/apps/backend && npx ts-node -e "
      import { PrismaClient } from '@prisma/client';
      const prisma = new PrismaClient();
      (async () => {
        const brand = await prisma.brand.findFirst();
        if (!brand) {
          console.error('No brand found');
          process.exit(1);
        }
        const key = await prisma.apiKey.create({
          data: {
            brandId: brand.id,
            name: 'Test API Key',
            keyHash: 'test',
            permissions: ['generation:create', 'generation:read'],
            rateLimit: 100,
            isActive: true,
          },
        });
        console.log(key.id);
        await prisma.\$disconnect();
      })();
    " 2>/dev/null)
  fi
  
  if [ -z "$API_KEY" ]; then
    echo "❌ Impossible de créer/récupérer une API Key"
    exit 1
  fi
  
  echo "✅ API Key: ${API_KEY:0:20}..."
fi

# 3. Récupérer un Product ID
echo ""
echo "3️⃣ Récupération d'un Product ID..."
PRODUCT_ID=$(cd /Users/emmanuelabougadous/luneo-platform/apps/backend && npx ts-node -e "
  import { PrismaClient } from '@prisma/client';
  const prisma = new PrismaClient();
  (async () => {
    const product = await prisma.product.findFirst({ where: { status: 'ACTIVE' } });
    if (product) {
      console.log(product.id);
    }
    await prisma.\$disconnect();
  })();
" 2>/dev/null)

if [ -z "$PRODUCT_ID" ]; then
  echo "❌ Aucun Product trouvé"
  exit 1
fi

echo "✅ Product ID: $PRODUCT_ID"

# 4. Test de création d'une génération
echo ""
echo "4️⃣ Test POST /api/generation/create..."
RESPONSE=$(curl -s -X POST "$API_URL/api/generation/create" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
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

echo "Réponse: $RESPONSE"

GENERATION_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$GENERATION_ID" ]; then
  echo "❌ Échec de la création de génération"
  echo "Réponse complète: $RESPONSE"
  exit 1
fi

echo "✅ Génération créée: $GENERATION_ID"

# 5. Test du statut
echo ""
echo "5️⃣ Test GET /api/generation/$GENERATION_ID/status..."
sleep 2
STATUS_RESPONSE=$(curl -s "$API_URL/api/generation/$GENERATION_ID/status")
echo "Statut: $STATUS_RESPONSE"

echo ""
echo "✅ Tests terminés avec succès!"





