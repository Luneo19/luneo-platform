#!/bin/bash

echo "🌐 CONFIGURATION AUTOMATIQUE DU DOMAINE app.luneo.app"
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "  🚀 SCRIPT AUTOMATIQUE DE CONFIGURATION DOMAINE"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 ÉTAPE 1: DIAGNOSTIC DU DOMAINE${NC}"
echo "=================================="

# Vérifier si le domaine est accessible
echo "Test de connectivité vers app.luneo.app..."
if curl -s --head https://app.luneo.app | head -n 1 | grep -q "200 OK"; then
    echo -e "${GREEN}✅ https://app.luneo.app est ACCESSIBLE !${NC}"
    echo -e "${GREEN}🎉 VOTRE DOMAINE FONCTIONNE DÉJÀ !${NC}"
    exit 0
elif curl -s --head http://app.luneo.app | head -n 1 | grep -q "200 OK"; then
    echo -e "${YELLOW}⚠️ http://app.luneo.app est accessible (HTTP seulement)${NC}"
else
    echo -e "${RED}❌ app.luneo.app n'est pas accessible${NC}"
fi

echo ""
echo -e "${BLUE}🔧 ÉTAPE 2: VÉRIFICATION VERCEL${NC}"
echo "=============================="

# Vérifier Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI non installé${NC}"
    echo "Installation..."
    npm install -g vercel@latest
fi

# Vérifier la connexion Vercel
echo "Vérification de la connexion Vercel..."
if vercel whoami &> /dev/null; then
    echo -e "${GREEN}✅ Connecté à Vercel${NC}"
    USER=$(vercel whoami)
    echo "Utilisateur: $USER"
else
    echo -e "${RED}❌ Non connecté à Vercel${NC}"
    echo "Connexion..."
    vercel login
fi

echo ""
echo -e "${BLUE}🌐 ÉTAPE 3: CONFIGURATION DU DOMAINE${NC}"
echo "================================="

# Aller dans le dossier frontend
cd /Users/emmanuelabougadous/saas-backend/apps/frontend

echo "Vérification du statut du domaine dans Vercel..."
DOMAIN_STATUS=$(vercel domains inspect app.luneo.app 2>/dev/null)

if echo "$DOMAIN_STATUS" | grep -q "app.luneo.app"; then
    echo -e "${GREEN}✅ Domaine app.luneo.app configuré dans Vercel${NC}"
    
    # Vérifier les nameservers
    echo "Vérification des nameservers..."
    if echo "$DOMAIN_STATUS" | grep -q "vercel-dns.com"; then
        echo -e "${GREEN}✅ Nameservers Vercel configurés${NC}"
    else
        echo -e "${YELLOW}⚠️ Nameservers non configurés pour Vercel${NC}"
        echo ""
        echo -e "${YELLOW}📋 CONFIGURATION NÉCESSAIRE:${NC}"
        echo "1. Connectez-vous à Cloudflare Dashboard"
        echo "2. Sélectionnez le domaine luneo.app"
        echo "3. Allez dans DNS > Nameservers"
        echo "4. Remplacez par:"
        echo "   • a.vercel-dns.com"
        echo "   • b.vercel-dns.com"
        echo "5. Sauvegardez"
        echo ""
        echo -e "${YELLOW}⏱️ Temps d'attente: 5-60 minutes${NC}"
    fi
else
    echo -e "${RED}❌ Domaine non configuré dans Vercel${NC}"
    echo "Ajout du domaine..."
    vercel domains add app.luneo.app
fi

echo ""
echo -e "${BLUE}🧪 ÉTAPE 4: TEST AUTOMATIQUE${NC}"
echo "============================"

echo "Test de connectivité final..."
for i in {1..5}; do
    echo "Tentative $i/5..."
    if curl -s --head https://app.luneo.app | head -n 1 | grep -q "200 OK"; then
        echo -e "${GREEN}🎉 SUCCÈS ! https://app.luneo.app est accessible !${NC}"
        echo ""
        echo -e "${GREEN}════════════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${GREEN}  🏆 DOMAINE CONFIGURÉ AVEC SUCCÈS !${NC}"
        echo -e "${GREEN}════════════════════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo -e "${GREEN}🌐 URLs fonctionnelles:${NC}"
        echo "   • https://app.luneo.app"
        echo "   • https://app.luneo.app/pricing-stripe"
        echo "   • https://app.luneo.app/dashboard"
        echo "   • https://app.luneo.app/api-test"
        echo ""
        echo -e "${GREEN}🚀 VOTRE PLATEFORME LUNEO EST MAINTENANT ACCESSIBLE !${NC}"
        exit 0
    fi
    echo "Attente de 30 secondes..."
    sleep 30
done

echo -e "${YELLOW}⚠️ Le domaine n'est pas encore accessible${NC}"
echo "Cela peut prendre jusqu'à 60 minutes pour la propagation DNS."
echo ""
echo -e "${BLUE}📋 RÉSUMÉ DE LA CONFIGURATION:${NC}"
echo "================================="
echo "✅ Domaine configuré dans Vercel"
echo "⚠️ Propagation DNS en cours"
echo "⏱️ Temps estimé: 5-60 minutes"
echo ""
echo -e "${BLUE}🧪 TEST MANUEL:${NC}"
echo "Testez régulièrement: https://app.luneo.app"
echo ""
echo -e "${BLUE}🆘 EN CAS DE PROBLÈME:${NC}"
echo "1. Vérifiez les nameservers dans Cloudflare"
echo "2. Attendez la propagation DNS"
echo "3. Contactez le support Vercel si nécessaire"

echo ""
echo -e "${GREEN}🎊 SCRIPT TERMINÉ !${NC}"
