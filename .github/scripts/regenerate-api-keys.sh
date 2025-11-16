#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SCRIPT AUTOMATISÉ DE RÉGÉNÉRATION DES CLÉS API
# À exécuter APRÈS la finalisation de la production
# ═══════════════════════════════════════════════════════════════

set -e

REPO="Luneo19/luneo-platform"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  🔄 RÉGÉNÉRATION AUTOMATIQUE DES CLÉS API                 ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Vérifier que la production est finalisée
echo -e "${YELLOW}⚠️  VÉRIFICATION PRÉALABLE${NC}"
echo ""
echo -e "${BLUE}Avant de continuer, confirmez que :${NC}"
echo "  ✅ La production est 100% finalisée"
echo "  ✅ Tous les déploiements sont terminés"
echo "  ✅ Tous les tests sont passés"
echo "  ✅ L'application est fonctionnelle"
echo ""
read -p "Confirmez-vous que la production est finalisée ? (oui/non): " confirmation

if [ "$confirmation" != "oui" ] && [ "$confirmation" != "OUI" ] && [ "$confirmation" != "o" ] && [ "$confirmation" != "O" ]; then
    echo -e "${RED}❌ Régénération annulée. Attendez la finalisation de la production.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Confirmation reçue. Démarrage de la régénération...${NC}"
echo ""

# Fonction pour configurer un secret GitHub
set_github_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ]; then
        echo -e "${YELLOW}⏭️  ${secret_name}: valeur vide, ignoré${NC}"
        return 1
    fi
    
    echo -e "${BLUE}📝 Configuration de ${secret_name} dans GitHub Secrets...${NC}"
    
    if echo -n "$secret_value" | gh secret set "$secret_name" --repo "$REPO" 2>/dev/null; then
        echo -e "${GREEN}✅ ${secret_name} configuré dans GitHub Secrets${NC}"
        return 0
    else
        echo -e "${RED}❌ Erreur lors de la configuration de ${secret_name}${NC}"
        return 1
    fi
}

# Fonction pour tester une clé API
test_sendgrid_key() {
    local api_key=$1
    echo -e "${BLUE}🧪 Test de la clé SendGrid...${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X GET "https://api.sendgrid.com/v3/user/profile" \
        -H "Authorization: Bearer ${api_key}" \
        -H "Content-Type: application/json" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Clé SendGrid valide${NC}"
        return 0
    else
        echo -e "${RED}❌ Clé SendGrid invalide (HTTP ${http_code})${NC}"
        return 1
    fi
}

test_openai_key() {
    local api_key=$1
    echo -e "${BLUE}🧪 Test de la clé OpenAI...${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X GET "https://api.openai.com/v1/models" \
        -H "Authorization: Bearer ${api_key}" 2>/dev/null)
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✅ Clé OpenAI valide${NC}"
        return 0
    else
        echo -e "${RED}❌ Clé OpenAI invalide (HTTP ${http_code})${NC}"
        return 1
    fi
}

# Compteurs
SUCCESS_COUNT=0
ERROR_COUNT=0

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  PHASE 1 : CRÉATION DES NOUVELLES CLÉS API${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

# SendGrid
echo -e "${BLUE}📧 SendGrid (Twilio)${NC}"
echo ""
echo "1. Allez sur : https://app.sendgrid.com/settings/api_keys"
echo "2. Cliquez sur 'Create API Key'"
echo "3. Nom : 'luneo-platform-production-$(date +%Y-%m-%d)'"
echo "4. Permissions : 'Full Access'"
echo "5. Copiez la clé (format: SG.xxxxx)"
echo ""
read -p "Entrez la nouvelle clé SendGrid (ou appuyez sur Entrée pour ignorer): " sendgrid_key

if [ -n "$sendgrid_key" ]; then
    if test_sendgrid_key "$sendgrid_key"; then
        if set_github_secret "SENDGRID_API_KEY" "$sendgrid_key"; then
            ((SUCCESS_COUNT++))
        else
            ((ERROR_COUNT++))
        fi
    else
        echo -e "${RED}❌ Clé SendGrid invalide, ignorée${NC}"
        ((ERROR_COUNT++))
    fi
fi

echo ""

# OpenAI
echo -e "${BLUE}🤖 OpenAI${NC}"
echo ""
echo "1. Allez sur : https://platform.openai.com/api-keys"
echo "2. Cliquez sur 'Create new secret key'"
echo "3. Nom : 'luneo-platform-production'"
echo "4. Copiez la clé (format: sk-proj-xxxxx)"
echo ""
read -p "Entrez la nouvelle clé OpenAI (ou appuyez sur Entrée pour ignorer): " openai_key

if [ -n "$openai_key" ]; then
    if test_openai_key "$openai_key"; then
        if set_github_secret "OPENAI_API_KEY" "$openai_key"; then
            ((SUCCESS_COUNT++))
        else
            ((ERROR_COUNT++))
        fi
    else
        echo -e "${RED}❌ Clé OpenAI invalide, ignorée${NC}"
        ((ERROR_COUNT++))
    fi
fi

echo ""

# Mailgun (optionnel)
echo -e "${BLUE}📮 Mailgun (optionnel)${NC}"
echo ""
read -p "Utilisez-vous Mailgun ? (oui/non): " use_mailgun

if [ "$use_mailgun" = "oui" ] || [ "$use_mailgun" = "OUI" ] || [ "$use_mailgun" = "o" ] || [ "$use_mailgun" = "O" ]; then
    echo ""
    echo "1. Allez sur : https://app.mailgun.com/app/account/security/api_keys"
    echo "2. Cliquez sur 'Create API Key'"
    echo "3. Nom : 'luneo-platform-production'"
    echo "4. Copiez la clé"
    echo ""
    read -p "Entrez la nouvelle clé Mailgun: " mailgun_key
    
    if [ -n "$mailgun_key" ]; then
        if set_github_secret "MAILGUN_API_KEY" "$mailgun_key"; then
            ((SUCCESS_COUNT++))
        else
            ((ERROR_COUNT++))
        fi
    fi
fi

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  PHASE 2 : CONFIGURATION VERCEL${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}⚠️  Configuration Vercel requise manuellement${NC}"
echo ""
echo "Allez sur : https://vercel.com/dashboard"
echo "Sélectionnez votre projet → Settings → Environment Variables"
echo ""
echo "Variables à ajouter :"
if [ -n "$sendgrid_key" ]; then
    echo "  - SENDGRID_API_KEY = ${sendgrid_key}"
fi
if [ -n "$openai_key" ]; then
    echo "  - OPENAI_API_KEY = ${openai_key}"
fi
if [ -n "$mailgun_key" ]; then
    echo "  - MAILGUN_API_KEY = ${mailgun_key}"
fi
echo ""
read -p "Appuyez sur Entrée une fois les variables Vercel configurées..."

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  RÉSUMÉ${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}✅ Secrets configurés avec succès: ${SUCCESS_COUNT}${NC}"
echo -e "${RED}❌ Erreurs: ${ERROR_COUNT}${NC}"
echo ""

# Afficher la liste des secrets GitHub configurés
echo -e "${BLUE}📋 Secrets GitHub configurés:${NC}"
gh secret list --repo "$REPO" | grep -E "SENDGRID_API_KEY|OPENAI_API_KEY|MAILGUN_API_KEY" || echo "Aucun secret trouvé"

echo ""
echo -e "${GREEN}✅ Régénération terminée !${NC}"
echo ""
echo -e "${YELLOW}📝 PROCHAINES ÉTAPES:${NC}"
echo "  1. Supprimer les anciennes clés des comptes respectifs"
echo "  2. Vérifier que les nouvelles clés fonctionnent en production"
echo "  3. Tester l'envoi d'emails (SendGrid/Mailgun)"
echo "  4. Tester les appels API OpenAI"
echo ""
echo -e "${BLUE}🔗 Liens utiles:${NC}"
echo "  - GitHub Secrets: https://github.com/${REPO}/settings/secrets/actions"
echo "  - Vercel Environment Variables: https://vercel.com/dashboard"
echo ""

