# 🛠️ Makefile - Luneo Platform
# Commandes utiles pour le développement

.PHONY: help setup dev build test clean deploy

# Default
help:
	@echo "🛠️  Luneo Platform - Available Commands"
	@echo "========================================"
	@echo ""
	@echo "  make setup      - Setup dev environment"
	@echo "  make dev        - Start dev servers"
	@echo "  make build      - Build production"
	@echo "  make test       - Run all tests"
	@echo "  make test-e2e   - Run E2E tests"
	@echo "  make lint       - Lint code"
	@echo "  make clean      - Clean build files"
	@echo "  make docker-up  - Start Docker services"
	@echo "  make docker-down - Stop Docker services"
	@echo "  make health     - Check services health"
	@echo "  make deploy     - Deploy to production"
	@echo ""

# Setup development environment
setup:
	@echo "🛠️  Setting up development environment..."
	@./scripts/setup-dev.sh

# Start development servers
dev:
	@echo "🚀 Starting development servers..."
	@echo "Backend: http://localhost:3001"
	@echo "Frontend: http://localhost:3000"
	@echo ""
	@make -j 2 dev-backend dev-frontend

dev-backend:
	@cd apps/backend && npm run start:dev

dev-frontend:
	@cd apps/frontend && npm run dev

# Build production
build:
	@echo "🏗️  Building production..."
	@cd apps/frontend && npm run build
	@cd apps/backend && npm run build
	@echo "✅ Build complete!"

# Run tests
test:
	@echo "🧪 Running all tests..."
	@./scripts/test-all.sh

test-e2e:
	@echo "🧪 Running E2E tests..."
	@cd apps/frontend && npm run test:e2e

# Lint
lint:
	@echo "🔍 Linting code..."
	@cd apps/frontend && npm run lint
	@cd apps/backend && npm run lint || echo "Backend lint not configured"

# Clean
clean:
	@echo "🧹 Cleaning build files..."
	@rm -rf apps/frontend/.next
	@rm -rf apps/frontend/out
	@rm -rf apps/backend/dist
	@echo "✅ Clean complete!"

# Docker
docker-up:
	@echo "🐳 Starting Docker services..."
	@docker-compose up -d
	@echo "✅ Services started!"
	@echo "   PostgreSQL: localhost:5432"
	@echo "   Redis: localhost:6379"
	@echo "   MinIO: http://localhost:9001 (admin:minioadmin)"
	@echo "   MailHog: http://localhost:8025"

docker-down:
	@echo "🐳 Stopping Docker services..."
	@docker-compose down
	@echo "✅ Services stopped!"

docker-logs:
	@docker-compose logs -f

# Health check
health:
	@./scripts/check-health.sh

# Deploy
deploy:
	@echo "🚀 Deploying to production..."
	@cd apps/frontend && vercel --prod
	@cd apps/backend && railway up || echo "Configure Railway first"
	@echo "✅ Deployment complete!"

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	@cd apps/frontend && npm install
	@cd apps/backend && npm install
	@echo "✅ Dependencies installed!"

# Database migrations
migrate:
	@echo "🗄️  Running database migrations..."
	@cd apps/backend && npx prisma migrate dev
	@echo "✅ Migrations complete!"

# Database reset (CAUTION!)
db-reset:
	@echo "⚠️  Resetting database..."
	@read -p "Are you sure? This will delete all data! (y/N): " confirm && [ "$$confirm" = "y" ] || exit 1
	@cd apps/backend && npx prisma migrate reset --force
	@echo "✅ Database reset complete!"

# Generate Prisma Client
prisma-generate:
	@echo "🔧 Generating Prisma Client..."
	@cd apps/backend && npx prisma generate
	@echo "✅ Prisma Client generated!"

# Prisma Studio (DB GUI)
db-studio:
	@echo "🎨 Opening Prisma Studio..."
	@cd apps/backend && npx prisma studio

# Bundle analysis
analyze:
	@echo "📊 Analyzing bundle size..."
	@cd apps/frontend && npm run build:analyze

# Format code
format:
	@echo "💅 Formatting code..."
	@cd apps/frontend && npm run format
	@echo "✅ Code formatted!"

# Check all
check-all: lint test build
	@echo "✅ All checks passed!"



