#!/bin/bash

echo "🚀 DÉPLOIEMENT PHASE 1 - LUNEO PLATFORM"
echo "========================================"
echo ""

# Vérifier qu'on est dans le bon dossier
if [ ! -d "apps/frontend" ]; then
  echo "❌ Erreur : Exécutez ce script depuis le dossier luneo-platform"
  exit 1
fi

echo "📦 Vérification des fichiers créés..."
echo ""

# Vérifier les API routes
echo "✅ API Routes :"
ls -la apps/frontend/src/app/api/profile/route.ts 2>/dev/null && echo "  ✓ /api/profile/route.ts" || echo "  ✗ /api/profile/route.ts MANQUANT"
ls -la apps/frontend/src/app/api/dashboard/stats/route.ts 2>/dev/null && echo "  ✓ /api/dashboard/stats/route.ts" || echo "  ✗ /api/dashboard/stats/route.ts MANQUANT"
ls -la apps/frontend/src/app/api/team/route.ts 2>/dev/null && echo "  ✓ /api/team/route.ts" || echo "  ✗ /api/team/route.ts MANQUANT"

# Vérifier les hooks
echo ""
echo "✅ Hooks React :"
ls -la apps/frontend/src/lib/hooks/useProfile.ts 2>/dev/null && echo "  ✓ useProfile.ts" || echo "  ✗ useProfile.ts MANQUANT"
ls -la apps/frontend/src/lib/hooks/useDashboardData.ts 2>/dev/null && echo "  ✓ useDashboardData.ts" || echo "  ✗ useDashboardData.ts MANQUANT"
ls -la apps/frontend/src/lib/hooks/useTeam.ts 2>/dev/null && echo "  ✓ useTeam.ts" || echo "  ✗ useTeam.ts MANQUANT"

# Vérifier les pages
echo ""
echo "✅ Pages modifiées :"
ls -la apps/frontend/src/app/\(dashboard\)/dashboard/page.tsx 2>/dev/null && echo "  ✓ dashboard/page.tsx" || echo "  ✗ dashboard/page.tsx MANQUANT"
ls -la apps/frontend/src/app/\(dashboard\)/settings/page.tsx 2>/dev/null && echo "  ✓ settings/page.tsx" || echo "  ✗ settings/page.tsx MANQUANT"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Proposer les options
echo "🚀 Choisissez une option de déploiement :"
echo ""
echo "  1) Déploiement automatique (git push + Vercel auto-deploy)"
echo "  2) Déploiement manuel (npx vercel --prod)"
echo "  3) Annuler"
echo ""
read -p "Votre choix (1-3) : " choice

case $choice in
  1)
    echo ""
    echo "📤 Déploiement automatique via Git..."
    echo ""
    
    # Vérifier si git est initialisé
    if [ ! -d ".git" ]; then
      echo "⚠️  Git n'est pas initialisé. Initialisation..."
      git init
      git add .
      git commit -m "feat: Phase 1 - Infrastructure backend, API routes, hooks, dashboard & settings"
      echo ""
      echo "⚠️  Vous devez maintenant ajouter un remote et pusher :"
      echo "     git remote add origin <votre-repo-url>"
      echo "     git push -u origin main"
    else
      # Statut git
      echo "📊 Statut Git :"
      git status --short
      echo ""
      
      # Ajouter tous les fichiers
      echo "➕ Ajout des fichiers..."
      git add .
      
      # Commit
      echo "💾 Création du commit..."
      git commit -m "feat: Phase 1 - Infrastructure backend, API routes, hooks, dashboard & settings" || echo "⚠️  Aucun changement à committer"
      
      # Push
      echo "📤 Push vers le repository..."
      git push origin main || git push origin master || echo "⚠️  Erreur lors du push. Vérifiez votre remote."
      
      echo ""
      echo "✅ Push terminé !"
      echo "🔄 Vercel va détecter les changements et déployer automatiquement."
      echo "📊 Suivez le déploiement sur : https://vercel.com/dashboard"
    fi
    ;;
    
  2)
    echo ""
    echo "🚀 Déploiement manuel via Vercel CLI..."
    echo ""
    
    # Vérifier si vercel est installé
    if ! command -v vercel &> /dev/null; then
      echo "⚠️  Vercel CLI n'est pas installé. Installation..."
      npm install -g vercel
    fi
    
    # Déployer
    cd apps/frontend
    echo "📦 Build et déploiement en cours..."
    npx vercel --prod --yes
    
    echo ""
    echo "✅ Déploiement terminé !"
    echo "🌐 Votre application est disponible sur : https://app.luneo.app"
    ;;
    
  3)
    echo ""
    echo "❌ Déploiement annulé."
    exit 0
    ;;
    
  *)
    echo ""
    echo "❌ Choix invalide. Déploiement annulé."
    exit 1
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 PHASE 1 DÉPLOYÉE !"
echo ""
echo "📋 Prochaines étapes :"
echo "  1. Ouvrir https://app.luneo.app/dashboard"
echo "  2. Vérifier que les stats réelles se chargent"
echo "  3. Ouvrir https://app.luneo.app/settings"
echo "  4. Tester la sauvegarde du profil"
echo ""
echo "🐛 En cas de problème :"
echo "  - Ouvrir F12 → Console (vérifier erreurs)"
echo "  - Ouvrir F12 → Network (vérifier requêtes API)"
echo ""
echo "🚀 Une fois validé, on passe à Phase 2 !"
echo ""

