#!/bin/bash

##############################################################################
# LUNEO - Script de Déploiement Vercel
# Déploie le frontend sur Vercel avec vérifications
##############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

##############################################################################
# Helper Functions
##############################################################################

print_header() {
  echo ""
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo -e "${BLUE}  $1${NC}"
  echo "═══════════════════════════════════════════════════════════════════════════"
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

##############################################################################
# 1. Vérifications Pré-Déploiement
##############################################################################

print_header "🔍 VÉRIFICATIONS PRÉ-DÉPLOIEMENT"

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "package.json" ]; then
  print_error "package.json non trouvé. Êtes-vous dans apps/frontend ?"
  exit 1
fi

print_success "Répertoire correct"

# Vérifier que Node.js est installé
if ! command -v node &> /dev/null; then
  print_error "Node.js n'est pas installé"
  exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js installé: $NODE_VERSION"

# Vérifier que npm est installé
if ! command -v npm &> /dev/null; then
  print_error "npm n'est pas installé"
  exit 1
fi

print_success "npm installé"

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
  print_warning "Vercel CLI n'est pas installé"
  print_info "Installation de Vercel CLI..."
  npm install -g vercel
  print_success "Vercel CLI installé"
else
  VERCEL_VERSION=$(vercel --version)
  print_success "Vercel CLI installé: $VERCEL_VERSION"
fi

##############################################################################
# 2. Installation Dépendances
##############################################################################

print_header "📦 INSTALLATION DES DÉPENDANCES"

if [ -d "node_modules" ]; then
  print_info "node_modules existe, vérification des dépendances..."
else
  print_info "Installation des dépendances..."
fi

npm install

print_success "Dépendances installées"

##############################################################################
# 3. Vérifications Code
##############################################################################

print_header "🔍 VÉRIFICATIONS CODE"

# Linting
print_info "Vérification linting..."
if npm run lint:check; then
  print_success "Linting OK"
else
  print_warning "Problèmes de linting détectés (continuation)"
fi

# Type checking
print_info "Vérification types..."
if npm run type-check; then
  print_success "Type checking OK"
else
  print_error "Erreurs de type détectées"
  exit 1
fi

##############################################################################
# 4. Build de Test
##############################################################################

print_header "🏗️  BUILD DE TEST"

print_info "Build de l'application..."
if npm run build; then
  print_success "Build réussi"
else
  print_error "Build échoué"
  exit 1
fi

##############################################################################
# 5. Vérification Variables d'Environnement
##############################################################################

print_header "🔐 VÉRIFICATION VARIABLES D'ENVIRONNEMENT"

print_warning "Vérifiez que les variables suivantes sont configurées dans Vercel:"
echo ""
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - NEXT_PUBLIC_API_URL"
echo "  - NEXT_PUBLIC_APP_URL"
echo "  - NEXT_PUBLIC_GOOGLE_CLIENT_ID"
echo "  - GOOGLE_CLIENT_SECRET"
echo "  - NEXT_PUBLIC_GITHUB_CLIENT_ID"
echo "  - GITHUB_CLIENT_SECRET"
echo "  - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
echo "  - STRIPE_SECRET_KEY"
echo ""

read -p "Les variables sont-elles configurées dans Vercel ? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  print_error "Configurez les variables d'environnement dans Vercel Dashboard avant de continuer"
  print_info "URL: https://vercel.com/dashboard → Settings → Environment Variables"
  exit 1
fi

print_success "Variables d'environnement vérifiées"

##############################################################################
# 6. Déploiement
##############################################################################

print_header "🚀 DÉPLOIEMENT VERCEL"

# Vérifier si on est connecté à Vercel
if ! vercel whoami &> /dev/null; then
  print_warning "Non connecté à Vercel"
  print_info "Connexion à Vercel..."
  vercel login
fi

# Demander type de déploiement
echo ""
echo "Type de déploiement:"
echo "  1) Preview (développement)"
echo "  2) Production"
read -p "Choix (1 ou 2): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[1]$ ]]; then
  DEPLOY_TYPE="preview"
  print_info "Déploiement Preview..."
  vercel
elif [[ $REPLY =~ ^[2]$ ]]; then
  DEPLOY_TYPE="production"
  print_info "Déploiement Production..."
  vercel --prod
else
  print_error "Choix invalide"
  exit 1
fi

##############################################################################
# 7. Vérification Post-Déploiement
##############################################################################

print_header "✅ VÉRIFICATION POST-DÉPLOIEMENT"

print_success "Déploiement terminé !"
echo ""
print_info "Prochaines étapes:"
echo "  1. Vérifier l'URL de déploiement dans Vercel Dashboard"
echo "  2. Tester l'application"
echo "  3. Vérifier les logs dans Vercel Dashboard"
echo "  4. Vérifier les métriques Analytics"
echo ""

print_success "Script terminé avec succès ! 🎉"




