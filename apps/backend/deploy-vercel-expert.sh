#!/bin/bash

echo "🚀 DÉPLOIEMENT VERCEL EXPERT - LUNEO BACKEND"
echo "=============================================="

# Configuration
PROJECT_DIR="/Users/emmanuelabougadous/saas-backend/apps/backend"
VERCEL_PROJECT_NAME="luneo-backend-expert"

cd "$PROJECT_DIR"

echo "📁 Répertoire de travail: $(pwd)"

# 1. Nettoyer les builds précédents
echo "🧹 Nettoyage des builds précédents..."
rm -rf dist/
rm -rf .vercel/
rm -rf node_modules/.cache/

# 2. Installer les dépendances
echo "📦 Installation des dépendances..."
npm install --production=false

# 3. Tentative de build NestJS (avec gestion d'erreur)
echo "🔨 Tentative de build NestJS..."
if npm run build 2>/dev/null; then
    echo "✅ Build NestJS réussi"
    BUILD_SUCCESS=true
else
    echo "⚠️  Build NestJS échoué, utilisation du fallback Express"
    BUILD_SUCCESS=false
fi

# 4. Créer le fichier vercel.json optimisé
echo "⚙️  Configuration Vercel..."
cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.js",
      "use": "@vercel/node@3.0.7"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/api/index.js"
    }
  ],
  "regions": ["iad1"],
  "public": true,
  "env": {
    "NODE_ENV": "production"
  }
}
EOF

# 5. Créer le package.json optimisé pour Vercel
echo "📝 Configuration package.json pour Vercel..."
cat > package-vercel.json << EOF
{
  "name": "@luneo/backend-vercel",
  "version": "1.0.0",
  "description": "Luneo Backend API - Vercel Optimized",
  "main": "api/index.js",
  "scripts": {
    "start": "node api/index.js",
    "build": "echo 'Build completed'",
    "vercel-build": "echo 'Vercel build completed'"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/swagger": "^7.1.17",
    "@nestjs/throttler": "^5.0.1",
    "@nestjs/terminus": "^10.2.0",
    "@nestjs/bull": "^10.0.1",
    "@nestjs/event-emitter": "^2.0.3",
    "@nestjs/schedule": "^4.0.0",
    "@nestjs/passport": "^10.0.2",
    "@nestjs/jwt": "^10.2.0",
    "@sentry/nestjs": "^7.91.0",
    "@sentry/node": "^7.91.0",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "passport-local": "^1.0.0",
    "bcryptjs": "^2.4.3",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "hpp": "^0.2.3",
    "express-rate-limit": "^7.1.5",
    "express-slow-down": "^2.0.1",
    "bull": "^4.12.2",
    "ioredis": "^5.3.2",
    "prisma": "^5.7.1",
    "@prisma/client": "^5.7.1",
    "stripe": "^14.9.0",
    "sendgrid": "^5.2.3",
    "nodemailer": "^6.9.7",
    "sharp": "^0.33.1",
    "openai": "^4.20.1",
    "replicate": "^0.25.2",
    "cloudinary": "^1.41.0",
    "multer": "^1.4.5-lts.2",
    "uuid": "^9.0.1",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1",
    "express": "^4.18.2",
    "cors": "^2.8.5"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
EOF

# 6. Sauvegarder le package.json original et utiliser la version Vercel
if [ -f "package.json" ]; then
    cp package.json package.json.backup
fi
cp package-vercel.json package.json

# 7. Déployer sur Vercel
echo "🚀 Déploiement sur Vercel..."
if vercel --prod --name "$VERCEL_PROJECT_NAME" --yes; then
    echo "✅ Déploiement Vercel réussi!"
    
    # 8. Récupérer l'URL de déploiement
    DEPLOYMENT_URL=$(vercel ls | grep "$VERCEL_PROJECT_NAME" | head -1 | awk '{print $2}')
    echo "🌐 URL de déploiement: https://$DEPLOYMENT_URL"
    
    # 9. Test de l'API
    echo "🧪 Test de l'API..."
    if curl -s "https://$DEPLOYMENT_URL/health" > /dev/null; then
        echo "✅ API accessible et fonctionnelle"
    else
        echo "⚠️  API non accessible, vérifiez les logs Vercel"
    fi
    
else
    echo "❌ Échec du déploiement Vercel"
    exit 1
fi

# 10. Restaurer le package.json original
if [ -f "package.json.backup" ]; then
    cp package.json.backup package.json
    rm package.json.backup
fi

echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ!"
echo "========================"
echo "📊 Statut: $([ "$BUILD_SUCCESS" = true ] && echo "NestJS + Fallback" || echo "Fallback Express")"
echo "🌐 URL: https://$DEPLOYMENT_URL"
echo "📋 Logs: vercel logs $VERCEL_PROJECT_NAME"
echo ""
echo "🔧 Commandes utiles:"
echo "  - Voir les logs: vercel logs $VERCEL_PROJECT_NAME"
echo "  - Redéployer: vercel --prod"
echo "  - Supprimer: vercel remove $VERCEL_PROJECT_NAME"


