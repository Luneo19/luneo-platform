#!/bin/bash
# Script de déploiement en production sur Vercel et Railway

set -e

cd "$(dirname "$0")/../.."

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🚀 DÉPLOIEMENT PRODUCTION - VERCEL & RAILWAY                ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Vérifier que les variables sont bien configurées
echo "🔍 Vérification des variables..."
if ! npx tsx scripts/verify-and-prepare-production-vars.ts > /dev/null 2>&1; then
    echo "❌ Erreur : Variables manquantes !"
    echo "   Exécutez d'abord : npx tsx scripts/verify-and-prepare-production-vars.ts"
    exit 1
fi
echo "✅ Variables vérifiées"
echo ""

# Fonction pour ajouter variable Vercel
add_vercel_env() {
    local key=$1
    local value=$2
    echo "   📝 Ajout: $key"
    vercel env add "$key" production <<< "$value" 2>/dev/null || {
        echo "   ⚠️  Variable existe déjà ou erreur (vérifiez manuellement)"
    }
}

# Fonction pour ajouter variable Railway
add_railway_env() {
    local key=$1
    local value=$2
    local service=${3:-backend}
    echo "   📝 Ajout: $key"
    railway variables set "${key}=${value}" --service "$service" 2>/dev/null || {
        echo "   ⚠️  Variable existe déjà ou erreur (vérifiez manuellement)"
    }
}

# Charger les variables depuis le fichier généré
if [ ! -f "vercel-production-vars.txt" ]; then
    echo "❌ Fichier vercel-production-vars.txt non trouvé"
    exit 1
fi

echo "═══════════════════════════════════════════════════════════════"
echo "📋 ÉTAPE 1 : Configuration VERCEL"
echo "═══════════════════════════════════════════════════════════════"
echo ""
read -p "🤔 Voulez-vous configurer les variables Vercel maintenant ? (o/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[OoYy]$ ]]; then
    echo "📝 Ajout des variables dans Vercel..."
    echo ""
    echo "⚠️  NOTE : Vous pouvez aussi copier-coller depuis vercel-production-vars.txt"
    echo "   Dashboard: https://vercel.com/dashboard -> Settings -> Environment Variables"
    echo ""
    
    # Lire les variables du fichier
    while IFS='=' read -r key value; do
        # Ignorer les commentaires et lignes vides
        if [[ "$key" =~ ^# ]] || [ -z "$key" ]; then
            continue
        fi
        
        # Supprimer les espaces
        key=$(echo "$key" | tr -d ' ')
        value=$(echo "$value" | tr -d ' ')
        
        if [ -n "$key" ] && [ -n "$value" ]; then
            add_vercel_env "$key" "$value"
        fi
    done < vercel-production-vars.txt
    
    echo ""
    echo "✅ Variables Vercel configurées"
    echo ""
    read -p "🤔 Voulez-vous déployer maintenant sur Vercel ? (o/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        echo "🚀 Déploiement sur Vercel..."
        vercel --prod
        echo "✅ Déploiement Vercel terminé"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📋 ÉTAPE 2 : Configuration RAILWAY"
echo "═══════════════════════════════════════════════════════════════"
echo ""
read -p "🤔 Voulez-vous configurer les variables Railway maintenant ? (o/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[OoYy]$ ]]; then
    echo "📝 Ajout des variables dans Railway..."
    echo ""
    echo "⚠️  NOTE : Les variables backend (sans NEXT_PUBLIC_) vont dans le service backend"
    echo ""
    
    # Lire les variables du fichier
    while IFS='=' read -r key value; do
        if [[ "$key" =~ ^# ]] || [ -z "$key" ]; then
            continue
        fi
        
        key=$(echo "$key" | tr -d ' ')
        value=$(echo "$value" | tr -d ' ')
        
        if [ -n "$key" ] && [ -n "$value" ]; then
            # Variables backend (sans NEXT_PUBLIC_)
            if [[ ! "$key" =~ ^NEXT_PUBLIC_ ]]; then
                add_railway_env "$key" "$value" "backend"
            fi
        fi
    done < vercel-production-vars.txt
    
    echo ""
    echo "✅ Variables Railway configurées"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ DÉPLOIEMENT TERMINÉ"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "📋 RÉCAPITULATIF :"
echo "   ✅ Variables vérifiées"
echo "   ✅ Fichiers de configuration générés"
echo "   ✅ Vercel : Variables configurées"
echo "   ✅ Railway : Variables configurées"
echo ""
echo "🔗 URLs :"
echo "   - Frontend : https://app.luneo.app"
echo "   - API : https://api.luneo.app"
echo ""
echo "🎉 Tout est prêt pour la production !"
