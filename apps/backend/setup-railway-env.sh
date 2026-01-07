#!/bin/bash

# Script pour configurer les variables d'environnement Railway
# Usage: ./setup-railway-env.sh

set -e

echo "🚂 Configuration des variables d'environnement Railway"
echo "======================================================"
echo ""

# Vérifier que railway est installé
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI n'est pas installé"
    echo "Installez-le avec: curl -fsSL https://railway.com/install.sh | sh"
    exit 1
fi

# Vérifier que le projet est lié
if ! railway status &> /dev/null; then
    echo "⚠️  Le projet n'est pas encore lié"
    echo "Lieez-le avec: railway link -p 0e3eb9ba-6846-4e0e-81d2-bd7da54da971"
    exit 1
fi

echo "✅ Railway CLI détecté"
echo ""

# Générer les secrets JWT
echo "🔐 Génération des secrets JWT..."
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)

echo "✅ Secrets JWT générés"
echo ""

# Variables obligatoires
echo "📝 Configuration des variables obligatoires..."

# ATTENTION: DATABASE_URL doit être configuré manuellement via l'interface Railway
# car elle utilise la référence ${{Postgres.DATABASE_URL}}
echo "⚠️  DATABASE_URL doit être configurée manuellement dans Railway Dashboard"
echo "   Utilisez: \${{Postgres.DATABASE_URL}}"
echo ""

railway variables set NODE_ENV="production" || echo "NODE_ENV déjà configuré"
railway variables set PORT="3001" || echo "PORT déjà configuré"
railway variables set JWT_SECRET="$JWT_SECRET" || echo "JWT_SECRET déjà configuré"
railway variables set JWT_REFRESH_SECRET="$JWT_REFRESH_SECRET" || echo "JWT_REFRESH_SECRET déjà configuré"
railway variables set JWT_EXPIRES_IN="15m" || echo "JWT_EXPIRES_IN déjà configuré"
railway variables set JWT_REFRESH_EXPIRES_IN="7d" || echo "JWT_REFRESH_EXPIRES_IN déjà configuré"

echo ""
echo "✅ Variables obligatoires configurées"
echo ""

# Variables optionnelles (à configurer selon vos besoins)
echo "📝 Pour configurer les variables optionnelles, exécutez:"
echo ""
echo "  # Frontend"
echo "  railway variables set FRONTEND_URL=\"https://app.luneo.app\""
echo "  railway variables set CORS_ORIGIN=\"https://app.luneo.app\""
echo ""
echo "  # Redis (si ajouté)"
echo "  railway variables set REDIS_URL=\"\${{Redis.REDIS_URL}}\""
echo ""
echo "  # SendGrid"
echo "  railway variables set SENDGRID_API_KEY=\"SG.xxx...\""
echo ""
echo "  # Stripe"
echo "  railway variables set STRIPE_SECRET_KEY=\"sk_live_...\""
echo ""
echo "  # OpenAI"
echo "  railway variables set OPENAI_API_KEY=\"sk-...\""
echo ""
echo "  # Cloudinary"
echo "  railway variables set CLOUDINARY_CLOUD_NAME=\"xxx\""
echo "  railway variables set CLOUDINARY_API_KEY=\"xxx\""
echo "  railway variables set CLOUDINARY_API_SECRET=\"xxx\""
echo ""

echo "🎉 Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Ajoutez PostgreSQL dans Railway Dashboard si pas déjà fait"
echo "2. Configurez DATABASE_URL via l'interface web: \${{Postgres.DATABASE_URL}}"
echo "3. Exécutez les migrations: railway run \"cd apps/backend && pnpm prisma migrate deploy\""
echo "4. Déployez: railway up"
echo ""




















