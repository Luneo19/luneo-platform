#!/bin/bash
# Script d'analyse des logs Railway via API

set -e

PROJECT_ID="${RAILWAY_PROJECT_ID:-0e3eb9ba-6846-4e0e-81d2-bd7da54da971}"
RAILWAY_TOKEN="${RAILWAY_TOKEN:-98f816d7-42b1-4095-966e-81b2322482e0}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

RAILWAY_GRAPHQL="https://backboard.railway.app/graphql/v2"

echo -e "${BLUE}📊 Analyse des logs Railway${NC}"
echo "Project ID: $PROJECT_ID"
echo ""

# Fonction pour appeler l'API GraphQL
railway_graphql() {
    local query=$1
    curl -s -X POST "$RAILWAY_GRAPHQL" \
        -H "Authorization: Bearer $RAILWAY_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"$query\"}"
}

# Récupérer les services
echo -e "${BLUE}📋 Récupération des services...${NC}"
SERVICES_QUERY="query { project(id: \\\"$PROJECT_ID\\\") { id name services { edges { node { id name } } } } }"
SERVICES_RESPONSE=$(railway_graphql "$SERVICES_QUERY")

SERVICE_IDS=$(echo "$SERVICES_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    services = data.get('data', {}).get('project', {}).get('services', {}).get('edges', [])
    for edge in services:
        node = edge.get('node', {})
        print(f\"{node.get('id')}|{node.get('name')}\")
except:
    pass
" 2>/dev/null)

if [ -z "$SERVICE_IDS" ]; then
    echo -e "${RED}❌ Impossible de récupérer les services${NC}"
    echo "$SERVICES_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SERVICES_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Services trouvés${NC}"
echo "$SERVICE_IDS" | while IFS='|' read -r SERVICE_ID SERVICE_NAME; do
    echo "  - $SERVICE_NAME ($SERVICE_ID)"
done
echo ""

# Pour chaque service, récupérer les déploiements et logs
echo "$SERVICE_IDS" | while IFS='|' read -r SERVICE_ID SERVICE_NAME; do
    echo -e "${BLUE}📋 Analyse des logs pour: $SERVICE_NAME${NC}"
    
    # Récupérer les déploiements récents
    DEPLOYMENTS_QUERY="query { service(id: \\\"$SERVICE_ID\\\") { deployments(first: 3) { edges { node { id status createdAt buildLogs { data } deployLogs { data } } } } } }"
    DEPLOYMENTS_RESPONSE=$(railway_graphql "$DEPLOYMENTS_QUERY")
    
    echo "$DEPLOYMENTS_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    deployments = data.get('data', {}).get('service', {}).get('deployments', {}).get('edges', [])
    for edge in deployments:
        node = edge.get('node', {})
        status = node.get('status', 'UNKNOWN')
        created = node.get('createdAt', '')
        deploy_id = node.get('id', '')
        
        print(f\"\\n  Déploiement: {deploy_id}\")
        print(f\"  Status: {status}\")
        print(f\"  Créé: {created}\")
        
        build_logs = node.get('buildLogs', {}).get('data', '')
        if build_logs:
            print(f\"\\n  Build Logs (dernières lignes):\")
            lines = build_logs.split('\\n')[-20:]
            for line in lines:
                if line.strip():
                    print(f\"    {line}\")
        
        deploy_logs = node.get('deployLogs', {}).get('data', '')
        if deploy_logs:
            print(f\"\\n  Deploy Logs (dernières lignes):\")
            lines = deploy_logs.split('\\n')[-20:]
            for line in lines:
                if line.strip():
                    print(f\"    {line}\")
except Exception as e:
    print(f\"Erreur: {e}\")
    print(sys.stdin.read())
" 2>/dev/null || echo "$DEPLOYMENTS_RESPONSE"
    
    echo ""
done

# Essayer aussi via Railway CLI si disponible
if command -v railway &> /dev/null; then
    echo -e "${BLUE}📋 Tentative via Railway CLI...${NC}"
    mkdir -p ~/.railway
    cat > ~/.railway/config.json <<EOF
{"token":"$RAILWAY_TOKEN"}
EOF
    
    railway logs --tail 50 2>&1 | head -100 || echo "Railway CLI nécessite un login interactif"
fi

