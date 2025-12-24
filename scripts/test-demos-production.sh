#!/bin/bash

# scripts/test-demos-production.sh
# Test des démos en production

echo "🧪 TESTS DES DÉMOS EN PRODUCTION"
echo "=================================================="

# Get production URL from Vercel
PROD_URL=$(vercel inspect --prod --token="$VERCEL_TOKEN" 2>/dev/null | grep -oP 'https://[^\s]+' | head -1)

if [ -z "$PROD_URL" ]; then
    # Try to get from vercel.json or default
    PROD_URL="https://app.luneo.app"
fi

echo "ℹ️  URL de production: $PROD_URL"
echo ""

TEST_FAILED=0

# Function to test a demo page
test_demo() {
    local name="$1"
    local path="$2"
    local url="${PROD_URL}${path}"
    
    echo -n "Test: $name... "
    
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$http_code" -eq 200 ]; then
        echo "✅ OK (HTTP $http_code)"
    else
        echo "❌ Échec (HTTP $http_code)"
        TEST_FAILED=1
    fi
}

echo "📋 1. PAGES DE DÉMOS"
test_demo "Hub Démo" "/demo"
test_demo "Virtual Try-On" "/demo/virtual-try-on"
test_demo "3D Configurator" "/demo/3d-configurator"
test_demo "Customizer" "/demo/customizer"
test_demo "Asset Hub" "/demo/asset-hub"
test_demo "Bulk Generation" "/demo/bulk-generation"
test_demo "AR Export" "/demo/ar-export"
test_demo "Playground" "/demo/playground"

echo ""
echo "📋 2. PAGES SOLUTIONS (avec démos intégrées)"
test_demo "Solutions Virtual Try-On" "/solutions/virtual-try-on"
test_demo "Solutions Configurator 3D" "/solutions/configurator-3d"
test_demo "Solutions Customizer" "/solutions/customizer"

echo ""
echo "=================================================="

if [ "$TEST_FAILED" -eq 1 ]; then
    echo "❌ Certains tests ont échoué."
    exit 1
else
    echo "✅ Toutes les démos sont accessibles en production."
    exit 0
fi

