#!/bin/bash

echo "🌐 CONFIGURATION CORRECTE DNS CLOUDFLARE"
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo "  🔧 SCRIPT CORRECT POUR CLOUDFLARE DNS"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 ÉTAPE 1: DIAGNOSTIC ACTUEL${NC}"
echo "============================"

echo "Vérification de app.luneo.app..."
nslookup app.luneo.app | grep -A 5 "Non-authoritative answer"

echo ""
echo -e "${BLUE}🔧 ÉTAPE 2: CONFIGURATION CLOUDFLARE CORRECTE${NC}"
echo "==========================================="

echo -e "${YELLOW}📋 SOLUTION CORRECTE - PAS DE CHANGEMENT DE NAMESERVERS${NC}"
echo ""
echo "1. Garder les nameservers Cloudflare actuels:"
echo "   • aron.ns.cloudflare.com ✅"
echo "   • miguel.ns.cloudflare.com ✅"
echo ""
echo "2. Ajouter un enregistrement DNS dans Cloudflare:"
echo ""
echo -e "${GREEN}   OPTION A - CNAME (Recommandé):${NC}"
echo "   Type: CNAME"
echo "   Name: app"
echo "   Target: cname.vercel-dns.com"
echo "   TTL: Auto"
echo "   Proxy: Désactivé (nuage gris)"
echo ""
echo -e "${GREEN}   OPTION B - A Record:${NC}"
echo "   Type: A"
echo "   Name: app"
echo "   Target: 76.76.19.61"
echo "   TTL: Auto"
echo "   Proxy: Désactivé (nuage gris)"

echo ""
echo -e "${BLUE}🌐 ÉTAPE 3: INSTRUCTIONS DÉTAILLÉES${NC}"
echo "================================="

echo "1. Connectez-vous à https://dash.cloudflare.com"
echo "2. Sélectionnez le domaine 'luneo.app'"
echo "3. Allez dans l'onglet 'DNS'"
echo "4. Cliquez sur 'Ajouter un enregistrement'"
echo "5. Configurez l'un des enregistrements ci-dessus"
echo "6. Assurez-vous que le proxy est DÉSACTIVÉ (nuage gris)"
echo "7. Sauvegardez"

echo ""
echo -e "${BLUE}🧪 ÉTAPE 4: SCRIPT AUTOMATIQUE VIA API${NC}"
echo "===================================="

echo "Pour automatiser via API Cloudflare, j'aurais besoin de:"
echo "1. Votre API Token Cloudflare"
echo "2. Zone ID du domaine luneo.app"
echo ""
echo "Voulez-vous que je configure cela automatiquement ?"
echo "Si oui, fournissez-moi ces informations."

echo ""
echo -e "${BLUE}🔍 ÉTAPE 5: VÉRIFICATION ACTUELLE${NC}"
echo "================================="

echo "Vérification des enregistrements DNS existants..."
echo "Recherche d'enregistrements pour app.luneo.app..."

# Vérifier si des enregistrements existent déjà
if nslookup app.luneo.app | grep -q "76.76.21.21"; then
    echo -e "${YELLOW}⚠️ app.luneo.app pointe vers 76.76.21.21${NC}"
    echo "Cela pourrait être un enregistrement existant ou un redirect."
fi

echo ""
echo -e "${BLUE}🎯 ÉTAPE 6: RÉSULTAT ATTENDU${NC}"
echo "============================="

echo "Après configuration correcte:"
echo "• app.luneo.app → cname.vercel-dns.com (ou IP Vercel)"
echo "• SSL automatique généré par Vercel"
echo "• Toutes les pages accessibles via https://app.luneo.app"

echo ""
echo -e "${GREEN}✅ AVANTAGES DE CETTE APPROCHE:${NC}"
echo "• Garde les nameservers Cloudflare (sécurité)"
echo "• Utilise les services Cloudflare (performance)"
echo "• SSL automatique via Vercel"
echo "• Configuration simple et fiable"

echo ""
echo -e "${BLUE}🆘 EN CAS DE PROBLÈME:${NC}"
echo "======================="
echo "1. Vérifiez que le proxy est désactivé"
echo "2. Attendez la propagation DNS (5-60 minutes)"
echo "3. Vérifiez dans Vercel que le domaine est validé"

echo ""
echo -e "${GREEN}🎊 CONFIGURATION CORRECTE TERMINÉE !${NC}"
