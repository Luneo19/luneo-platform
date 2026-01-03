#!/bin/bash

# Script pour appliquer la migration crédits sur Supabase
# Utilise psql ou l'API Supabase

set -e

echo "🚀 Application migration crédits IA sur Supabase"
echo "=================================================="

# Vérifier si DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL non défini"
    echo ""
    echo "Options:"
    echo "1. Exporter DATABASE_URL:"
    echo "   export DATABASE_URL='postgresql://user:pass@host:5432/db'"
    echo ""
    echo "2. Ou utiliser Supabase Dashboard:"
    echo "   - Aller sur https://obrijgptqztacolemsbk.supabase.co"
    echo "   - SQL Editor → New query"
    echo "   - Copier le contenu de: prisma/migrations/add_credits_system.sql"
    echo "   - Coller et exécuter"
    exit 1
fi

echo "✅ DATABASE_URL trouvé"
echo ""

# Vérifier si psql est disponible
if command -v psql &> /dev/null; then
    echo "📝 Application de la migration via psql..."
    psql "$DATABASE_URL" -f prisma/migrations/add_credits_system.sql
    echo ""
    echo "✅ Migration appliquée avec succès!"
else
    echo "⚠️  psql non disponible"
    echo ""
    echo "📋 Migration SQL prête dans: prisma/migrations/add_credits_system.sql"
    echo ""
    echo "Pour l'appliquer manuellement:"
    echo "1. Aller sur https://obrijgptqztacolemsbk.supabase.co"
    echo "2. SQL Editor → New query"
    echo "3. Copier TOUT le contenu de: prisma/migrations/add_credits_system.sql"
    echo "4. Coller et cliquer 'Run'"
fi



#!/bin/bash

# Script pour appliquer la migration crédits sur Supabase
# Utilise psql ou l'API Supabase

set -e

echo "🚀 Application migration crédits IA sur Supabase"
echo "=================================================="

# Vérifier si DATABASE_URL est défini
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL non défini"
    echo ""
    echo "Options:"
    echo "1. Exporter DATABASE_URL:"
    echo "   export DATABASE_URL='postgresql://user:pass@host:5432/db'"
    echo ""
    echo "2. Ou utiliser Supabase Dashboard:"
    echo "   - Aller sur https://obrijgptqztacolemsbk.supabase.co"
    echo "   - SQL Editor → New query"
    echo "   - Copier le contenu de: prisma/migrations/add_credits_system.sql"
    echo "   - Coller et exécuter"
    exit 1
fi

echo "✅ DATABASE_URL trouvé"
echo ""

# Vérifier si psql est disponible
if command -v psql &> /dev/null; then
    echo "📝 Application de la migration via psql..."
    psql "$DATABASE_URL" -f prisma/migrations/add_credits_system.sql
    echo ""
    echo "✅ Migration appliquée avec succès!"
else
    echo "⚠️  psql non disponible"
    echo ""
    echo "📋 Migration SQL prête dans: prisma/migrations/add_credits_system.sql"
    echo ""
    echo "Pour l'appliquer manuellement:"
    echo "1. Aller sur https://obrijgptqztacolemsbk.supabase.co"
    echo "2. SQL Editor → New query"
    echo "3. Copier TOUT le contenu de: prisma/migrations/add_credits_system.sql"
    echo "4. Coller et cliquer 'Run'"
fi
























