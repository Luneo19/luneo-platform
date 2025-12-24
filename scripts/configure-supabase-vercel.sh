#!/bin/bash

# Script pour configurer les variables Supabase dans Vercel
# Usage: ./scripts/configure-supabase-vercel.sh

set -e

echo "🔧 Configuration des variables Supabase dans Vercel"
echo "=================================================="
echo ""

# Vérifier que Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI n'est pas installé"
    echo "Installez-le avec: npm i -g vercel"
    exit 1
fi

# Vérifier que l'utilisateur est connecté
if ! vercel whoami &> /dev/null; then
    echo "❌ Vous n'êtes pas connecté à Vercel"
    echo "Connectez-vous avec: vercel login"
    exit 1
fi

# Variables Supabase (à remplacer par vos valeurs)
SUPABASE_URL="${SUPABASE_URL:-https://obrijgptqztacolemsbk.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI2NjAyMiwiZXhwIjoyMDc2ODQyMDIyfQ.r8pgz9G88K41Jpseg_vseH9jevqK17zJcNcM6YQR-YE}"

echo "📋 Variables à configurer:"
echo "  - NEXT_PUBLIC_SUPABASE_URL: $SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY: (masqué)"
echo "  - SUPABASE_SERVICE_ROLE_KEY: (masqué)"
echo ""

# Demander confirmation
read -p "Continuer avec ces valeurs? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Annulé"
    exit 1
fi

# Aller dans le répertoire frontend
cd apps/frontend

# Configurer pour Production
echo "🔧 Configuration pour Production..."
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "$SUPABASE_SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Configurer pour Preview
echo "🔧 Configuration pour Preview..."
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "$SUPABASE_SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview

# Configurer pour Development
echo "🔧 Configuration pour Development..."
echo "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL development
echo "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
echo "$SUPABASE_SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY development

echo ""
echo "✅ Variables Supabase configurées avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Redéployez l'application sur Vercel"
echo "  2. Testez l'inscription sur https://frontend-luneos-projects.vercel.app/register"
echo ""

