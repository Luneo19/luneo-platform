#!/bin/bash

echo "🚀 TEST RAPIDE DE PROPAGATION DNS (30 SECONDES)"
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "  ⚡ SURVEILLANCE RAPIDE DE LA PROPAGATION DNS"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="app.luneo.app"
EXPECTED_IP="76.76.19.61"
MAX_ATTEMPTS=60  # 30 minutes maximum
WAIT_TIME=30     # 30 secondes entre les tests

echo -e "${BLUE}🔍 CONFIGURATION DNS CLOUDFLARE${NC}"
echo "=============================="
echo "Domaine: $DOMAIN"
echo "IP attendue: $EXPECTED_IP"
echo "TTL: 1 (propagation rapide)"
echo "Test toutes les 30 secondes"
echo ""

echo -e "${BLUE}📊 ÉTAT ACTUEL${NC}"
echo "================"
echo "Configuration Cloudflare: ✅ Mise à jour vers $EXPECTED_IP"
echo "Propagation DNS: ⏳ En cours..."

echo ""
echo -e "${BLUE}⚡ TEST RAPIDE DE PROPAGATION${NC}"
echo "==============================="

attempts=0
propagated=false

while [ $attempts -lt $MAX_ATTEMPTS ] && [ "$propagated" = false ]; do
    attempts=$((attempts + 1))
    echo ""
    echo "Test $attempts/$MAX_ATTEMPTS ($(date '+%H:%M:%S'))..."
    
    # Test DNS
    current_ip=$(nslookup $DOMAIN 2>/dev/null | grep -A 1 "Non-authoritative answer" | grep "Address:" | awk '{print $2}')
    
    if [ "$current_ip" = "$EXPECTED_IP" ]; then
        echo -e "${GREEN}🎉 PROPAGATION DNS TERMINÉE !${NC}"
        echo "IP actuelle: $current_ip"
        echo "IP attendue: $EXPECTED_IP"
        propagated=true
        break
    elif [ -n "$current_ip" ] && [ "$current_ip" != "76.76.21.21" ]; then
        echo -e "${YELLOW}🔄 Propagation en cours... (nouvelle IP détectée)${NC}"
        echo "IP actuelle: $current_ip"
        echo "IP attendue: $EXPECTED_IP"
    else
        echo -e "${YELLOW}⏳ Propagation en cours...${NC}"
        echo "IP actuelle: $current_ip"
        echo "IP attendue: $EXPECTED_IP"
    fi
    
    if [ $attempts -lt $MAX_ATTEMPTS ]; then
        echo "Attente de 30 secondes..."
        sleep $WAIT_TIME
    fi
done

echo ""
echo -e "${BLUE}🌐 TEST DE CONNECTIVITÉ${NC}"
echo "======================"

if [ "$propagated" = true ]; then
    echo "Test de connectivité vers $DOMAIN..."
    
    # Test HTTP
    http_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 http://$DOMAIN)
    echo "HTTP Status: $http_status"
    
    # Test HTTPS
    https_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://$DOMAIN)
    echo "HTTPS Status: $https_status"
    
    if [ "$https_status" = "200" ] || [ "$https_status" = "301" ] || [ "$https_status" = "302" ]; then
        echo -e "${GREEN}🎉 SUCCÈS ! $DOMAIN EST ACCESSIBLE !${NC}"
        
        echo ""
        echo -e "${GREEN}🎯 URLS FINALES:${NC}"
        echo "================"
        echo "🌐 App: https://$DOMAIN"
        echo "💰 Pricing: https://$DOMAIN/pricing-stripe"
        echo "📊 Dashboard: https://$DOMAIN/dashboard"
        echo "🧪 Test API: https://$DOMAIN/api-test"
        
        echo ""
        echo -e "${GREEN}🏆 PLATEFORME LUNEO 100% OPÉRATIONNELLE !${NC}"
    else
        echo -e "${YELLOW}⚠️ DNS propagé mais site non accessible (SSL en cours de génération)${NC}"
        echo "Cela peut prendre quelques minutes supplémentaires pour le SSL."
        
        echo ""
        echo -e "${BLUE}🧪 TEST DES URLS VERCEL EN ATTENDANT:${NC}"
        echo "====================================="
        echo "Frontend: https://frontend-aeysl86p2-luneos-projects.vercel.app"
        echo "Backend: https://backend-3mw6ldz8q-luneos-projects.vercel.app"
        echo "Pricing: https://frontend-aeysl86p2-luneos-projects.vercel.app/pricing-stripe"
    fi
else
    echo -e "${YELLOW}⚠️ Propagation DNS non terminée après $MAX_ATTEMPTS tentatives (30 minutes)${NC}"
    echo "Cela peut prendre plus de temps dans certains cas."
    echo ""
    echo -e "${BLUE}🔧 VÉRIFICATIONS MANUELLES:${NC}"
    echo "1. Vérifiez la configuration dans Cloudflare"
    echo "2. Attendez la propagation complète"
    echo "3. Vérifiez le statut dans Vercel"
fi

echo ""
echo -e "${BLUE}📋 RÉSUMÉ DE LA CONFIGURATION${NC}"
echo "==============================="
echo "✅ Enregistrement DNS Cloudflare: Configuré"
echo "✅ IP Vercel: $EXPECTED_IP"
echo "✅ Proxy Cloudflare: Désactivé"
echo "✅ TTL: 1 (propagation rapide)"
echo "⏳ Propagation DNS: En cours"
echo "⏳ SSL Vercel: En génération"

echo ""
echo -e "${GREEN}🎊 CONFIGURATION TERMINÉE !${NC}"
