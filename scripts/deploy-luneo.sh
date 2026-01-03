#!/bin/bash

echo "🚀 LUNEO EXPERT DEPLOYMENT"
echo "========================="

# Navigate to frontend directory
cd apps/frontend

echo "📦 Installing dependencies..."
npm install --silent --no-audit --no-fund

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "🏗️ Building project with corrections..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi

echo "🚀 Deploying to Vercel..."
npx vercel@latest --prod --yes --confirm

if [ $? -eq 0 ]; then
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "Your Luneo platform is now live!"
else
    echo "❌ Deployment failed"
    exit 1
fi


