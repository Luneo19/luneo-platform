#!/bin/bash

# 🛠️ Setup Development Environment - Luneo
# Configure tout pour le développement local

set -e

echo "🛠️  Setup Development Environment - Luneo"
echo "=========================================="
echo ""

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ required. Current major version: $NODE_VERSION"
  exit 1
fi
echo "✅ Node.js version OK: $(node -v)"

# Check if Docker is running (for PostgreSQL & Redis)
if ! docker info > /dev/null 2>&1; then
  echo "⚠️  Docker is not running. Starting PostgreSQL and Redis manually will be required."
else
  echo "✅ Docker is running"
  
  # Start PostgreSQL & Redis
  echo ""
  echo "🐳 Starting PostgreSQL and Redis..."
  docker-compose up -d postgres redis || echo "⚠️  Docker compose failed, continuing..."
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."

echo "  → Frontend..."
cd apps/frontend
npm install --silent

echo "  → Backend..."
cd ../backend
npm install --silent

cd ../..

# Create .env files if they don't exist
echo ""
echo "📝 Creating .env files..."

if [ ! -f "apps/frontend/.env.local" ]; then
  echo "  → Creating frontend/.env.local from template..."
  cp apps/frontend/env.example apps/frontend/.env.local || true
  echo "  ⚠️  Please edit apps/frontend/.env.local and fill in the values"
else
  echo "  ✅ frontend/.env.local already exists"
fi

if [ ! -f "apps/backend/.env" ]; then
  echo "  → Creating backend/.env from template..."
  cat > apps/backend/.env << EOF
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/luneo_dev
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_your_key_here
EOF
  echo "  ⚠️  Please edit apps/backend/.env and fill in the values"
else
  echo "  ✅ backend/.env already exists"
fi

# Run Prisma migrations
echo ""
echo "🗄️  Running database migrations..."
cd apps/backend
npx prisma generate
npx prisma migrate dev --name init || echo "⚠️  Migrations failed or already applied"

cd ../..

# Generate Prisma Client
echo ""
echo "🔧 Generating Prisma Client..."
cd apps/backend
npx prisma generate

cd ../..

echo ""
echo "=================================="
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Edit apps/frontend/.env.local (add Stripe keys)"
echo "   2. Edit apps/backend/.env (add database URL)"
echo "   3. Run: npm run dev (in both frontend and backend)"
echo ""
echo "📚 Read: README_ACTIONS_IMMEDIATES.md for more details"



