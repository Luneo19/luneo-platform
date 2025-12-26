#!/bin/bash

# Script de migration pour le système de crédits IA
# Date: 2025-12-20

set -e

echo "🚀 Migration du système de crédits IA"
echo "======================================"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "prisma/schema.prisma" ]; then
    error "Ce script doit être exécuté depuis le répertoire apps/backend"
fi

# Vérifier DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL n'est pas défini. Veuillez définir cette variable d'environnement."
fi

log "Vérification de la connexion à la base de données..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    error "Impossible de se connecter à la base de données. Vérifiez DATABASE_URL."
fi

log "✅ Connexion à la base de données OK"

# 1. Générer le client Prisma
log "Génération du client Prisma..."
npx prisma generate

# 2. Créer la migration Prisma
log "Création de la migration Prisma..."
npx prisma migrate dev --name add_credits_system --create-only || {
    warn "Migration déjà créée, utilisation de la migration existante"
}

# 3. Appliquer la migration SQL manuelle (pour Supabase profiles)
log "Application de la migration SQL pour Supabase profiles..."
MIGRATION_SQL="
DO \$\$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_credits_purchased INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_credit_purchase TIMESTAMP;
    
    CREATE INDEX IF NOT EXISTS idx_profiles_ai_credits ON public.profiles(ai_credits);
    
    RAISE NOTICE 'Colonnes crédits ajoutées à la table profiles';
  ELSE
    RAISE NOTICE 'Table profiles n''existe pas, ignorée';
  END IF;
END \$\$;
"

echo "$MIGRATION_SQL" | npx prisma db execute --stdin || {
    warn "Migration Supabase profiles échouée (peut-être que la table n'existe pas)"
}

# 4. Appliquer les migrations Prisma
log "Application des migrations Prisma..."
npx prisma migrate deploy

# 5. Seed des CreditPacks
log "Seed des CreditPacks..."
if [ -f "prisma/seed-credits.ts" ]; then
    npx tsx prisma/seed-credits.ts || {
        warn "Seed échoué, mais ce n'est pas critique"
    }
else
    warn "Fichier seed-credits.ts non trouvé, seed ignoré"
fi

# 6. Vérification
log "Vérification de la migration..."
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"CreditPack\";" > /dev/null 2>&1 && {
    log "✅ Table CreditPack créée avec succès"
} || {
    error "Échec de la création de la table CreditPack"
}

npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"CreditTransaction\";" > /dev/null 2>&1 && {
    log "✅ Table CreditTransaction créée avec succès"
} || {
    error "Échec de la création de la table CreditTransaction"
}

log ""
log "🎉 Migration terminée avec succès!"
log ""
log "Prochaines étapes:"
log "1. Créer les produits Stripe (voir STRIPE_SETUP.md)"
log "2. Mettre à jour les Stripe Price IDs dans CreditPack"
log "3. Configurer les variables d'environnement"
log "4. Déployer en production"



#!/bin/bash

# Script de migration pour le système de crédits IA
# Date: 2025-12-20

set -e

echo "🚀 Migration du système de crédits IA"
echo "======================================"

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "prisma/schema.prisma" ]; then
    error "Ce script doit être exécuté depuis le répertoire apps/backend"
fi

# Vérifier DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    error "DATABASE_URL n'est pas défini. Veuillez définir cette variable d'environnement."
fi

log "Vérification de la connexion à la base de données..."
if ! npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
    error "Impossible de se connecter à la base de données. Vérifiez DATABASE_URL."
fi

log "✅ Connexion à la base de données OK"

# 1. Générer le client Prisma
log "Génération du client Prisma..."
npx prisma generate

# 2. Créer la migration Prisma
log "Création de la migration Prisma..."
npx prisma migrate dev --name add_credits_system --create-only || {
    warn "Migration déjà créée, utilisation de la migration existante"
}

# 3. Appliquer la migration SQL manuelle (pour Supabase profiles)
log "Application de la migration SQL pour Supabase profiles..."
MIGRATION_SQL="
DO \$\$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS ai_credits INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_credits_purchased INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_credit_purchase TIMESTAMP;
    
    CREATE INDEX IF NOT EXISTS idx_profiles_ai_credits ON public.profiles(ai_credits);
    
    RAISE NOTICE 'Colonnes crédits ajoutées à la table profiles';
  ELSE
    RAISE NOTICE 'Table profiles n''existe pas, ignorée';
  END IF;
END \$\$;
"

echo "$MIGRATION_SQL" | npx prisma db execute --stdin || {
    warn "Migration Supabase profiles échouée (peut-être que la table n'existe pas)"
}

# 4. Appliquer les migrations Prisma
log "Application des migrations Prisma..."
npx prisma migrate deploy

# 5. Seed des CreditPacks
log "Seed des CreditPacks..."
if [ -f "prisma/seed-credits.ts" ]; then
    npx tsx prisma/seed-credits.ts || {
        warn "Seed échoué, mais ce n'est pas critique"
    }
else
    warn "Fichier seed-credits.ts non trouvé, seed ignoré"
fi

# 6. Vérification
log "Vérification de la migration..."
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"CreditPack\";" > /dev/null 2>&1 && {
    log "✅ Table CreditPack créée avec succès"
} || {
    error "Échec de la création de la table CreditPack"
}

npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM \"CreditTransaction\";" > /dev/null 2>&1 && {
    log "✅ Table CreditTransaction créée avec succès"
} || {
    error "Échec de la création de la table CreditTransaction"
}

log ""
log "🎉 Migration terminée avec succès!"
log ""
log "Prochaines étapes:"
log "1. Créer les produits Stripe (voir STRIPE_SETUP.md)"
log "2. Mettre à jour les Stripe Price IDs dans CreditPack"
log "3. Configurer les variables d'environnement"
log "4. Déployer en production"

















