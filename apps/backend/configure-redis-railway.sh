#!/bin/bash

# Script pour configurer Redis sur Railway
# Ce script guide l'utilisateur pour ajouter Redis et configurer REDIS_URL

set -e

echo "🔧 Configuration Redis pour Railway"
echo "=================================="
echo ""

# Vérifier si Railway CLI est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé"
    echo "Installez-le avec: npm i -g @railway/cli"
    exit 1
fi

# Vérifier si on est connecté
if ! railway whoami &> /dev/null; then
    echo "⚠️  Vous n'êtes pas connecté à Railway"
    echo "Exécutez: railway login"
    exit 1
fi

echo "✅ Railway CLI détecté"
echo ""

# Afficher les variables actuelles
echo "📋 Variables d'environnement actuelles:"
railway variables | grep -E "(REDIS|redis)" || echo "  REDIS_URL: non configuré"
echo ""

# Option 1: Vérifier si Redis existe déjà dans le projet
echo "🔍 Vérification des services Redis..."
echo ""

echo "📝 Instructions pour ajouter Redis:"
echo ""
echo "1. Ouvrez le dashboard Railway:"
echo "   railway open"
echo ""
echo "2. Dans votre projet 'believable-learning':"
echo "   - Cliquez sur '+ New'"
echo "   - Sélectionnez 'Database' → 'Redis'"
echo "   - Railway créera automatiquement un service Redis"
echo ""
echo "3. Une fois Redis créé, configurez REDIS_URL dans le service backend:"
echo "   - Ouvrez le service 'backend'"
echo "   - Allez dans l'onglet 'Variables'"
echo "   - Ajoutez: REDIS_URL = \${{Redis.REDIS_URL}}"
echo "   - Utilisez EXACTEMENT cette syntaxe pour référencer Redis"
echo ""
echo "OU utilisez cette commande (après avoir créé Redis):"
echo "   railway variables set REDIS_URL='\${{Redis.REDIS_URL}}'"
echo ""

# Option 2: Utiliser Upstash (alternative)
echo "🔄 Alternative: Utiliser Upstash Redis"
echo ""
echo "Si vous préférez utiliser Upstash:"
echo "1. Créez un compte sur https://upstash.com"
echo "2. Créez une base Redis"
echo "3. Copiez l'URL Redis (format: rediss://...)"
echo "4. Configurez avec:"
echo "   railway variables set REDIS_URL='rediss://votre-url-upstash'"
echo ""

# Option 3: Mode dégradé
echo "⚠️  Mode dégradé (sans Redis)"
echo ""
echo "Le code a été modifié pour fonctionner sans Redis."
echo "L'application fonctionnera mais sans cache."
echo "Pour activer le cache, configurez Redis comme indiqué ci-dessus."
echo ""

echo "✅ Instructions complètes dans: apps/backend/CORRECTION_REDIS_RAILWAY.md"
echo ""

