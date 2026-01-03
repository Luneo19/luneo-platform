#!/bin/bash

# ========================================
# COMMANDES RAPIDES - PRODUCTION IMMÉDIATE
# ========================================

echo "🚀 LUNEO - PASSAGE EN PRODUCTION"
echo "=================================="
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Exécutez ce script depuis la racine du projet"
    exit 1
fi

echo "✅ Dossier correct détecté"
echo ""

# Menu principal
echo "Choisissez une action:"
echo ""
echo "1️⃣  Tester en LOCAL"
echo "2️⃣  Déployer sur VERCEL"
echo "3️⃣  Voir les logs Vercel"
echo "4️⃣  Tester l'API de production"
echo "5️⃣  Configuration complète (tout installer)"
echo "0️⃣  Quitter"
echo ""
read -p "Votre choix (0-5): " choice

case $choice in
    1)
        echo ""
        echo "🔧 Lancement du serveur local..."
        echo "================================"
        cd apps/frontend
        npm run dev
        ;;
    2)
        echo ""
        echo "🚀 Déploiement sur Vercel..."
        echo "================================"
        echo "⚠️  Assurez-vous d'avoir configuré les variables d'environnement!"
        read -p "Continuer? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            cd apps/frontend
            vercel --prod
        fi
        ;;
    3)
        echo ""
        echo "📋 Logs Vercel (temps réel)..."
        echo "================================"
        vercel logs --follow
        ;;
    4)
        echo ""
        echo "🧪 Test de l'API de production..."
        echo "================================"
        echo ""
        echo "Health Check:"
        curl -i https://app.luneo.app/api/health
        echo ""
        echo ""
        echo "Si vous voyez {\"status\":\"healthy\"}, tout va bien! ✅"
        ;;
    5)
        echo ""
        echo "🔧 Configuration complète..."
        echo "================================"
        echo ""
        echo "Installation des dépendances..."
        npm install
        echo ""
        echo "✅ Installation terminée!"
        echo ""
        echo "⚠️  IMPORTANT:"
        echo "1. Allez sur https://bkasxmzwilkbmszovedc.supabase.co"
        echo "2. SQL Editor → Exécutez les 3 fichiers SQL"
        echo "3. Configurez les variables sur Vercel"
        echo "4. Relancez ce script et choisissez option 2"
        ;;
    0)
        echo "Au revoir! 👋"
        exit 0
        ;;
    *)
        echo "❌ Option invalide"
        exit 1
        ;;
esac

