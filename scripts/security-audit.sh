#!/bin/bash

# 🔒 Script d'Audit de Sécurité Automatisé
# Vérifie les vulnérabilités dans les dépendances

set -e

echo "🔒 AUDIT DE SÉCURITÉ AUTOMATISÉ"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

CRITICAL_FOUND=false
HIGH_FOUND=false

# Function to check vulnerabilities
check_vulnerabilities() {
    local dir=$1
    local name=$2
    
    echo -e "${YELLOW}📦 Vérification de $name...${NC}"
    cd "$dir"
    
    # Run audit
    if command -v pnpm &> /dev/null; then
        audit_output=$(pnpm audit --json 2>/dev/null || echo '{}')
    elif command -v npm &> /dev/null; then
        audit_output=$(npm audit --json 2>/dev/null || echo '{}')
    else
        echo -e "${RED}❌ pnpm ou npm non trouvé${NC}"
        return
    fi
    
    # Parse results
    critical=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.critical // 0' 2>/dev/null || echo "0")
    high=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.high // 0' 2>/dev/null || echo "0")
    moderate=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.moderate // 0' 2>/dev/null || echo "0")
    low=$(echo "$audit_output" | jq -r '.metadata.vulnerabilities.low // 0' 2>/dev/null || echo "0")
    
    echo "  Critical: $critical"
    echo "  High: $high"
    echo "  Moderate: $moderate"
    echo "  Low: $low"
    
    if [ "$critical" -gt 0 ]; then
        echo -e "${RED}❌ Vulnérabilités CRITIQUES trouvées dans $name!${NC}"
        CRITICAL_FOUND=true
    elif [ "$high" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Vulnérabilités HAUTES trouvées dans $name${NC}"
        HIGH_FOUND=true
    else
        echo -e "${GREEN}✅ Aucune vulnérabilité critique/haute dans $name${NC}"
    fi
    
    cd - > /dev/null
    echo ""
}

# Check backend
if [ -d "apps/backend" ]; then
    check_vulnerabilities "apps/backend" "Backend"
fi

# Check frontend
if [ -d "apps/frontend" ]; then
    check_vulnerabilities "apps/frontend" "Frontend"
fi

# Summary
echo "================================"
if [ "$CRITICAL_FOUND" = true ]; then
    echo -e "${RED}❌ AUDIT ÉCHOUÉ: Vulnérabilités CRITIQUES détectées!${NC}"
    exit 1
elif [ "$HIGH_FOUND" = true ]; then
    echo -e "${YELLOW}⚠️  AUDIT AVEC AVERTISSEMENTS: Vulnérabilités HAUTES détectées${NC}"
    exit 0
else
    echo -e "${GREEN}✅ AUDIT RÉUSSI: Aucune vulnérabilité critique/haute${NC}"
    exit 0
fi
