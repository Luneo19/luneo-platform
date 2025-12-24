#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION AUTOMATIQUE UPSTASH REDIS
# Guide interactif pour configurer Upstash Redis
# ═══════════════════════════════════════════════════════════════

set -e

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

FRONTEND_DIR="apps/frontend"
ENV_FILE="${FRONTEND_DIR}/.env.local"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  CONFIGURATION UPSTASH REDIS                                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Créer .env.local si n'existe pas
if [ ! -f "$ENV_FILE" ]; then
    touch "$ENV_FILE"
fi

# Fonction pour écrire une variable
write_env_var() {
    local var_name=$1
    local var_value=$2
    
    # Supprimer la ligne existante
    sed -i.bak "/^${var_name}=/d" "$ENV_FILE" 2>/dev/null || true
    
    # Ajouter la nouvelle ligne
    echo "${var_name}=\"${var_value}\"" >> "$ENV_FILE"
}

# Fonction pour lire une variable
read_env_var() {
    grep "^${1}=" "$ENV_FILE" 2>/dev/null | cut -d '=' -f2- | tr -d '"' || echo ""
}

# Vérifier si déjà configuré
current_url=$(read_env_var "UPSTASH_REDIS_REST_URL")
current_token=$(read_env_var "UPSTASH_REDIS_REST_TOKEN")

if [ -n "$current_url" ] && [ -n "$current_token" ]; then
    echo -e "${GREEN}✅ Upstash Redis est déjà configuré${NC}"
    echo -e "${CYAN}   URL: ${current_url:0:40}...${NC}"
    echo ""
    read -p "Voulez-vous le reconfigurer? (o/N): " reconfigure
    if [ "$reconfigure" != "o" ] && [ "$reconfigure" != "O" ]; then
        echo -e "${GREEN}Configuration conservée${NC}"
        exit 0
    fi
    echo ""
fi

echo -e "${BLUE}📋 Instructions pour obtenir les credentials Upstash Redis:${NC}"
echo ""
echo -e "${CYAN}1. Créer/Se connecter à Upstash:${NC}"
echo -e "   ${YELLOW}👉 Ouvrir: https://console.upstash.com${NC}"
echo ""
echo -e "${CYAN}2. Créer une nouvelle database Redis:${NC}"
echo -e "   ${YELLOW}- Cliquer sur 'Create Database'${NC}"
echo -e "   ${YELLOW}- Name: luneo-production-redis${NC}"
echo -e "   ${YELLOW}- Type: Regional (ou Global)${NC}"
echo -e "   ${YELLOW}- Region: Europe (Ireland) ou Europe (Frankfurt)${NC}"
echo -e "   ${YELLOW}- Eviction: allkeys-lru${NC}"
echo -e "   ${YELLOW}- Cliquer 'Create'${NC}"
echo ""
echo -e "${CYAN}3. Récupérer les credentials:${NC}"
echo -e "   ${YELLOW}- Dans la page de la database créée${NC}"
echo -e "   ${YELLOW}- Onglet 'REST API'${NC}"
echo -e "   ${YELLOW}- Copier 'UPSTASH_REDIS_REST_URL'${NC}"
echo -e "   ${YELLOW}- Copier 'UPSTASH_REDIS_REST_TOKEN'${NC}"
echo ""

# Ouvrir le navigateur si possible
if command -v open >/dev/null 2>&1; then
    echo -e "${BLUE}🌐 Ouverture de Upstash Console dans le navigateur...${NC}"
    open "https://console.upstash.com" 2>/dev/null || true
    echo ""
fi

# Demander les credentials
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}Entrez les credentials Upstash Redis:${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

read -p "UPSTASH_REDIS_REST_URL (ex: https://xxx.upstash.io): " redis_url

if [ -z "$redis_url" ]; then
    echo -e "${RED}❌ URL non fournie. Configuration annulée.${NC}"
    exit 1
fi

# Valider le format de l'URL
if [[ ! "$redis_url" =~ ^https://.*\.upstash\.io$ ]]; then
    echo -e "${YELLOW}⚠️  Format d'URL suspect. Continuer quand même? (O/n): ${NC}"
    read confirm
    if [ "$confirm" = "n" ] || [ "$confirm" = "N" ]; then
        exit 1
    fi
fi

read -sp "UPSTASH_REDIS_REST_TOKEN: " redis_token
echo ""

if [ -z "$redis_token" ]; then
    echo -e "${RED}❌ Token non fourni. Configuration annulée.${NC}"
    exit 1
fi

# Valider le format du token (commence généralement par AXX ou AXXX)
if [[ ! "$redis_token" =~ ^A[A-Z0-9]+ ]]; then
    echo -e "${YELLOW}⚠️  Format de token suspect. Continuer quand même? (O/n): ${NC}"
    read confirm
    if [ "$confirm" = "n" ] || [ "$confirm" = "N" ]; then
        exit 1
    fi
fi

# Configurer
echo ""
echo -e "${BLUE}🔧 Configuration en cours...${NC}"

write_env_var "UPSTASH_REDIS_REST_URL" "$redis_url"
write_env_var "UPSTASH_REDIS_REST_TOKEN" "$redis_token"

# Nettoyer le fichier de backup
rm -f "${ENV_FILE}.bak" 2>/dev/null || true

echo -e "${GREEN}✅ Upstash Redis configuré avec succès!${NC}"
echo ""

# Tester la connexion
echo -e "${BLUE}🔍 Test de connexion...${NC}"

if command -v node >/dev/null 2>&1; then
    # Créer un script de test temporaire
    cat > /tmp/test-redis.js << 'EOF'
const https = require('https');

const url = process.argv[2];
const token = process.argv[3];

if (!url || !token) {
    console.log('❌ Paramètres manquants');
    process.exit(1);
}

const testUrl = new URL(url);
const options = {
    hostname: testUrl.hostname,
    path: '/ping',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
    },
    timeout: 5000,
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => { body += chunk; });
    res.on('end', () => {
        if (res.statusCode === 200) {
            console.log('✅ Connexion réussie!');
            process.exit(0);
        } else {
            console.log(`❌ Erreur: HTTP ${res.statusCode}`);
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.log(`❌ Erreur de connexion: ${error.message}`);
    process.exit(1);
});

req.on('timeout', () => {
    console.log('❌ Timeout de connexion');
    req.destroy();
    process.exit(1);
});

req.end();
EOF

    if node /tmp/test-redis.js "$redis_url" "$redis_token" 2>/dev/null; then
        echo -e "${GREEN}✅ Connexion testée avec succès!${NC}"
    else
        echo -e "${YELLOW}⚠️  Impossible de tester la connexion (peut être normal si la database vient d'être créée)${NC}"
    fi
    
    rm -f /tmp/test-redis.js
else
    echo -e "${YELLOW}⚠️  Node.js non trouvé, impossible de tester la connexion${NC}"
fi

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  CONFIGURATION TERMINÉE                                    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Variables ajoutées dans: ${ENV_FILE}${NC}"
echo ""
echo -e "${BLUE}📋 PROCHAINES ÉTAPES:${NC}"
echo ""
echo -e "${YELLOW}1. Copier ces variables sur Vercel:${NC}"
echo -e "${CYAN}   https://vercel.com/luneos-projects/frontend/settings/environment-variables${NC}"
echo ""
echo -e "${YELLOW}2. Ajouter les variables:${NC}"
echo -e "${CYAN}   - UPSTASH_REDIS_REST_URL${NC}"
echo -e "${CYAN}   - UPSTASH_REDIS_REST_TOKEN${NC}"
echo ""
echo -e "${YELLOW}3. Sélectionner: Production, Preview, Development${NC}"
echo ""
echo -e "${YELLOW}4. Redéployer l'application${NC}"
echo ""
echo -e "${GREEN}🎉 Configuration locale terminée!${NC}"
echo ""

