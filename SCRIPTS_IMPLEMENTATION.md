# 🛠️ SCRIPTS & OUTILS D'IMPLÉMENTATION
## Scripts automatisés pour faciliter le développement

**Date** : Janvier 2025  
**Complément de** : `PLAN_ACTION_COMPLET_OPTIMISATION.md`

---

## 📋 SCRIPTS DE DÉVELOPPEMENT

### Script 1 : Setup Nouveau Module Backend

**Fichier** : `scripts/create-module.sh`

```bash
#!/bin/bash

# Usage: ./scripts/create-module.sh <module-name>

MODULE_NAME=$1
MODULE_PATH="apps/backend/src/modules/${MODULE_NAME}"

if [ -z "$MODULE_NAME" ]; then
  echo "❌ Usage: ./scripts/create-module.sh <module-name>"
  exit 1
fi

echo "🚀 Création du module ${MODULE_NAME}..."

# Créer structure de dossiers
mkdir -p "${MODULE_PATH}/dto"
mkdir -p "${MODULE_PATH}/services"
mkdir -p "${MODULE_PATH}/guards"
mkdir -p "${MODULE_PATH}/interfaces"

# Créer fichiers de base
cat > "${MODULE_PATH}/${MODULE_NAME}.module.ts" << EOF
import { Module } from '@nestjs/common';
import { ${MODULE_NAME^}Controller } from './${MODULE_NAME}.controller';
import { ${MODULE_NAME^}Service } from './${MODULE_NAME}.service';

@Module({
  controllers: [${MODULE_NAME^}Controller],
  providers: [${MODULE_NAME^}Service],
  exports: [${MODULE_NAME^}Service],
})
export class ${MODULE_NAME^}Module {}
EOF

cat > "${MODULE_PATH}/${MODULE_NAME}.controller.ts" << EOF
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ${MODULE_NAME^}Service } from './${MODULE_NAME}.service';

@ApiTags('${MODULE_NAME}')
@Controller('${MODULE_NAME}')
export class ${MODULE_NAME^}Controller {
  constructor(private readonly ${MODULE_NAME}Service: ${MODULE_NAME^}Service) {}

  @Get()
  findAll() {
    return this.${MODULE_NAME}Service.findAll();
  }
}
EOF

cat > "${MODULE_PATH}/${MODULE_NAME}.service.ts" << EOF
import { Injectable } from '@nestjs/common';

@Injectable()
export class ${MODULE_NAME^}Service {
  findAll() {
    return { message: 'Hello from ${MODULE_NAME}' };
  }
}
EOF

echo "✅ Module ${MODULE_NAME} créé avec succès!"
echo "📁 Fichiers créés dans: ${MODULE_PATH}"
```

---

### Script 2 : Migration Auth Supabase → NestJS

**Fichier** : `scripts/migrate-auth.sh`

```bash
#!/bin/bash

echo "🔄 Migration Auth Supabase → NestJS"
echo "===================================="

# 1. Backup fichiers existants
echo "📦 Backup des fichiers existants..."
mkdir -p backups/auth-$(date +%Y%m%d)
cp -r apps/frontend/src/app/(auth) backups/auth-$(date +%Y%m%d)/

# 2. Vérifier endpoints backend
echo "🔍 Vérification endpoints backend..."
if [ ! -f "apps/backend/src/modules/auth/auth.controller.ts" ]; then
  echo "❌ Controller auth non trouvé!"
  exit 1
fi

# 3. Modifier fichiers frontend
echo "✏️ Modification fichiers frontend..."

# Login page
sed -i.bak 's/supabase\.auth\.signInWithPassword/endpoints.auth.login/g' apps/frontend/src/app/(auth)/login/page.tsx

# Register page
sed -i.bak 's/supabase\.auth\.signUp/endpoints.auth.signup/g' apps/frontend/src/app/(auth)/register/page.tsx

# 4. Vérifier modifications
echo "✅ Migration terminée!"
echo "⚠️ Vérifiez les fichiers modifiés avant de commit"
```

---

### Script 3 : Setup Tests E2E

**Fichier** : `scripts/setup-e2e-tests.sh`

```bash
#!/bin/bash

echo "🧪 Setup Tests E2E"
echo "==================="

# Installer Playwright
echo "📦 Installation Playwright..."
cd apps/frontend
npm install -D @playwright/test
npx playwright install

# Créer structure tests
echo "📁 Création structure tests..."
mkdir -p e2e/auth
mkdir -p e2e/dashboard
mkdir -p e2e/products

# Créer config Playwright
cat > playwright.config.ts << EOF
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
EOF

echo "✅ Setup E2E terminé!"
echo "📝 Créez vos tests dans: e2e/"
```

---

### Script 4 : Optimisation Database Indexes

**Fichier** : `scripts/add-database-indexes.sh`

```bash
#!/bin/bash

echo "🗄️ Ajout Indexes Database"
echo "==========================="

# Créer migration
MIGRATION_NAME="add_performance_indexes_$(date +%Y%m%d%H%M%S)"
cd apps/backend

npx prisma migrate dev --name $MIGRATION_NAME --create-only

# Ajouter SQL indexes dans migration
cat >> "prisma/migrations/${MIGRATION_NAME}/migration.sql" << 'EOF'
-- Indexes pour requêtes fréquentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_brand_id ON "Product"("brandId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_created_at ON "Product"("createdAt" DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_status ON "Product"("status");

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_id ON "Order"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status ON "Order"("status");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_created_at ON "Order"("createdAt" DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_designs_user_id ON "Design"("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_designs_product_id ON "Design"("productId");

-- Full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_search ON "Product" USING gin(to_tsvector('french', name || ' ' || COALESCE(description, '')));
EOF

echo "✅ Migration créée: ${MIGRATION_NAME}"
echo "⚠️ Appliquez la migration avec: npx prisma migrate dev"
```

---

### Script 5 : Setup Cache Redis

**Fichier** : `scripts/setup-redis-cache.sh`

```bash
#!/bin/bash

echo "⚡ Setup Cache Redis"
echo "===================="

# Vérifier Redis disponible
if ! command -v redis-cli &> /dev/null; then
  echo "❌ Redis non installé!"
  echo "📦 Installation Redis..."
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install redis
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo apt-get install redis-server
  fi
fi

# Démarrer Redis
echo "🚀 Démarrage Redis..."
redis-server --daemonize yes

# Tester connexion
if redis-cli ping | grep -q "PONG"; then
  echo "✅ Redis fonctionne!"
else
  echo "❌ Redis ne répond pas!"
  exit 1
fi

# Créer fichier config
cat > apps/backend/src/config/redis.config.ts << 'EOF'
import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  ttl: parseInt(process.env.REDIS_TTL || '3600', 10),
}));
EOF

echo "✅ Configuration Redis créée!"
echo "📝 Ajoutez REDIS_URL dans .env"
```

---

### Script 6 : Génération Tests Unitaires

**Fichier** : `scripts/generate-unit-tests.sh`

```bash
#!/bin/bash

# Usage: ./scripts/generate-unit-tests.sh <file-path>

FILE_PATH=$1

if [ -z "$FILE_PATH" ]; then
  echo "❌ Usage: ./scripts/generate-unit-tests.sh <file-path>"
  exit 1
fi

FILENAME=$(basename "$FILE_PATH" .ts)
DIRNAME=$(dirname "$FILE_PATH")
TEST_FILE="${DIRNAME}/${FILENAME}.spec.ts"

echo "🧪 Génération tests pour ${FILE_PATH}..."

# Extraire nom de classe/service
CLASS_NAME=$(grep -o "export class [A-Za-z]*" "$FILE_PATH" | cut -d' ' -f3)

if [ -z "$CLASS_NAME" ]; then
  echo "❌ Classe non trouvée dans ${FILE_PATH}"
  exit 1
fi

# Créer fichier test
cat > "$TEST_FILE" << EOF
import { Test, TestingModule } from '@nestjs/testing';
import { ${CLASS_NAME} } from './${FILENAME}';

describe('${CLASS_NAME}', () => {
  let service: ${CLASS_NAME};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [${CLASS_NAME}],
    }).compile();

    service = module.get<${CLASS_NAME}>(${CLASS_NAME});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // TODO: Ajouter tests spécifiques
});
EOF

echo "✅ Tests générés: ${TEST_FILE}"
```

---

### Script 7 : Audit Performance

**Fichier** : `scripts/audit-performance.sh`

```bash
#!/bin/bash

echo "📊 Audit Performance"
echo "===================="

# Frontend Lighthouse
echo "🔍 Audit Frontend (Lighthouse)..."
cd apps/frontend
npm run build
npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html

# Backend API Performance
echo "🔍 Audit Backend API..."
cd ../backend
npm run test:e2e -- --grep "performance"

# Database Queries
echo "🔍 Audit Database Queries..."
npx prisma studio &
sleep 5
echo "✅ Prisma Studio ouvert sur http://localhost:5555"

# Générer rapport
cat > performance-report.md << EOF
# Rapport Performance

## Frontend
- Lighthouse Score: Voir lighthouse-report.html

## Backend
- API Response Time: Voir logs
- Database Queries: Voir Prisma Studio

## Recommandations
- Optimiser requêtes lentes
- Ajouter cache Redis
- Lazy loading composants
EOF

echo "✅ Rapport créé: performance-report.md"
```

---

### Script 8 : Déploiement Automatique

**Fichier** : `scripts/deploy.sh`

```bash
#!/bin/bash

ENV=${1:-staging}

echo "🚀 Déploiement ${ENV}"
echo "===================="

# Tests avant déploiement
echo "🧪 Exécution tests..."
npm run test
if [ $? -ne 0 ]; then
  echo "❌ Tests échoués!"
  exit 1
fi

# Build
echo "📦 Build..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build échoué!"
  exit 1
fi

# Déploiement selon environnement
if [ "$ENV" == "production" ]; then
  echo "🌐 Déploiement production..."
  # Vercel production
  vercel --prod
elif [ "$ENV" == "staging" ]; then
  echo "🧪 Déploiement staging..."
  vercel
else
  echo "❌ Environnement invalide: ${ENV}"
  exit 1
fi

echo "✅ Déploiement ${ENV} terminé!"
```

---

## 📦 PACKAGE.JSON SCRIPTS

**Fichier** : `package.json` (ajouter dans scripts)

```json
{
  "scripts": {
    "create:module": "./scripts/create-module.sh",
    "migrate:auth": "./scripts/migrate-auth.sh",
    "setup:e2e": "./scripts/setup-e2e-tests.sh",
    "db:indexes": "./scripts/add-database-indexes.sh",
    "setup:redis": "./scripts/setup-redis-cache.sh",
    "test:generate": "./scripts/generate-unit-tests.sh",
    "audit:performance": "./scripts/audit-performance.sh",
    "deploy:staging": "./scripts/deploy.sh staging",
    "deploy:prod": "./scripts/deploy.sh production"
  }
}
```

---

## 🔧 OUTILS RECOMMANDÉS

### 1. Code Quality

```bash
# ESLint
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Prettier
npm install -D prettier eslint-config-prettier

# Husky (Git hooks)
npm install -D husky lint-staged
npx husky install
```

### 2. Testing

```bash
# Jest (Backend)
npm install -D jest @nestjs/testing

# Playwright (E2E)
npm install -D @playwright/test

# Testing Library (Frontend)
npm install -D @testing-library/react @testing-library/jest-dom
```

### 3. Monitoring

```bash
# Sentry
npm install @sentry/node @sentry/react

# Prometheus
npm install prom-client
```

---

## 📝 CHECKLIST AVANT COMMIT

**Fichier** : `.husky/pre-commit`

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Lint
npm run lint

# Tests
npm run test

# Type check
npm run type-check

# Build
npm run build
```

---

## 🎯 CONCLUSION

Ces scripts automatisent les tâches répétitives et facilitent l'implémentation du plan d'action.

**Prochaines étapes** :
1. Rendre scripts exécutables : `chmod +x scripts/*.sh`
2. Tester chaque script
3. Intégrer dans CI/CD
4. Documenter usage

---

**Document créé le** : Janvier 2025
