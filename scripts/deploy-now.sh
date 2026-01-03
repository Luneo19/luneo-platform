#!/bin/bash

echo "🚀 LUNEO DEPLOYMENT SCRIPT"
echo "========================="

# Navigate to frontend directory
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend

echo "📦 Installing dependencies..."
npm install --silent

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
npx vercel@latest --prod --yes

if [ $? -eq 0 ]; then
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "Your Luneo platform is now live!"
else
    echo "❌ Deployment failed"
    exit 1
fi


