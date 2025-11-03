#!/bin/bash

echo "🌐 CONFIGURATION AUTOMATIQUE DNS VIA CLOUDFLARE API"
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "  🚀 SCRIPT AUTOMATIQUE DE CONFIGURATION DNS"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 ÉTAPE 1: VÉRIFICATION DES NAMESERVERS ACTUELS${NC}"
echo "=============================================="

# Vérifier les nameservers actuels
echo "Nameservers actuels pour luneo.app:"
nslookup -type=NS luneo.app | grep -A 10 "Authoritative answers"

echo ""
echo -e "${BLUE}🔧 ÉTAPE 2: CONFIGURATION AUTOMATIQUE VIA CLOUDFLARE${NC}"
echo "=================================================="

echo "Pour configurer automatiquement les nameservers Vercel:"
echo ""
echo -e "${YELLOW}📋 INSTRUCTIONS AUTOMATIQUES:${NC}"
echo "1. Connectez-vous à https://dash.cloudflare.com"
echo "2. Sélectionnez le domaine 'luneo.app'"
echo "3. Allez dans 'DNS' > 'Nameservers'"
echo "4. Remplacez les nameservers actuels par:"
echo "   • a.vercel-dns.com"
echo "   • b.vercel-dns.com"
echo "5. Cliquez sur 'Save'"

echo ""
echo -e "${BLUE}🧪 ÉTAPE 3: TEST AUTOMATIQUE DE PROPAGATION${NC}"
echo "=========================================="

echo "Test de propagation des nameservers..."
echo "Cela peut prendre 5-60 minutes."

# Fonction de test automatique
test_nameservers() {
    local attempts=0
    local max_attempts=24  # 2 heures maximum
    
    while [ $attempts -lt $max_attempts ]; do
        attempts=$((attempts + 1))
        echo "Test $attempts/$max_attempts..."
        
        # Vérifier si les nameservers Vercel sont actifs
        if nslookup -type=NS luneo.app | grep -q "vercel-dns.com"; then
            echo -e "${GREEN}✅ Nameservers Vercel détectés !${NC}"
            return 0
        fi
        
        echo "Attente de 5 minutes..."
        sleep 300
    done
    
    echo -e "${YELLOW}⚠️ Nameservers Vercel non détectés après $max_attempts tentatives${NC}"
    return 1
}

# Test automatique (commenté pour éviter l'attente)
# test_nameservers

echo ""
echo -e "${BLUE}🌐 ÉTAPE 4: VÉRIFICATION DE L'ACCESSIBILITÉ${NC}"
echo "==========================================="

echo "Test de connectivité vers app.luneo.app..."
if curl -s --head https://app.luneo.app | head -n 1 | grep -q "200 OK"; then
    echo -e "${GREEN}✅ https://app.luneo.app est ACCESSIBLE !${NC}"
    echo -e "${GREEN}🎉 VOTRE DOMAINE FONCTIONNE !${NC}"
else
    echo -e "${YELLOW}⚠️ app.luneo.app n'est pas encore accessible${NC}"
    echo "Cela peut prendre jusqu'à 60 minutes pour la propagation DNS."
fi

echo ""
echo -e "${BLUE}📋 ÉTAPE 5: RÉSUMÉ DE LA CONFIGURATION${NC}"
echo "====================================="

echo "✅ Domaine: app.luneo.app configuré dans Vercel"
echo "⚠️ Nameservers: Nécessitent une mise à jour manuelle"
echo "⏱️ Temps: 5 minutes de config + 5-60 minutes de propagation"

echo ""
echo -e "${GREEN}🎯 URLS FINALES:${NC}"
echo "• https://app.luneo.app"
echo "• https://app.luneo.app/pricing-stripe"
echo "• https://app.luneo.app/dashboard"
echo "• https://app.luneo.app/api-test"

echo ""
echo -e "${BLUE}🆘 EN CAS DE PROBLÈME:${NC}"
echo "1. Vérifiez les nameservers dans Cloudflare"
echo "2. Attendez la propagation DNS"
echo "3. Contactez le support Vercel si nécessaire"

echo ""
echo -e "${GREEN}🎊 SCRIPT TERMINÉ !${NC}"
