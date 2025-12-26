# 🚀 Guide d'Installation - Luneo Platform

Guide complet pour installer et configurer Luneo Platform en local.

## 📋 Prérequis

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **PostgreSQL**: >= 14.0
- **Redis**: >= 6.0 (optionnel pour dev)

## 🔧 Installation

### 1. Cloner le Repository

```bash
git clone https://github.com/votre-org/luneo-platform.git
cd luneo-platform
```

### 2. Installer les Dépendances

```bash
# Installer pnpm si nécessaire
npm install -g pnpm

# Installer toutes les dépendances
pnpm install
```

### 3. Configuration Environnement

#### Frontend

```bash
cd apps/frontend
cp .env.example .env.local
```

**Variables requises:**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/luneo

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Sentry (optionnel)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

#### Backend

```bash
cd apps/backend
cp .env.example .env
```

**Variables requises:**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/luneo

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars

# Redis (optionnel)
REDIS_URL=redis://localhost:6379

# Stripe (optionnel pour dev)
STRIPE_SECRET_KEY=sk_test_...
```

### 4. Database Setup

```bash
# Générer Prisma Client
cd apps/frontend
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed data (optionnel)
pnpm prisma db seed
```

### 5. Lancer le Projet

#### Développement

```bash
# Depuis la racine
pnpm dev

# Ou individuellement
cd apps/frontend && pnpm dev
cd apps/backend && pnpm start:dev
```

#### Production

```bash
# Build
pnpm build

# Start
pnpm start
```

## 🧪 Tests

### Tests Unitaires

```bash
cd apps/frontend
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Tests E2E

```bash
cd apps/frontend
pnpm test:e2e
pnpm test:e2e:ui
```

## 🔍 Vérification

### Health Check

```bash
# Frontend
curl http://localhost:3000/api/health

# Backend
curl http://localhost:3001/api/health
```

### Vérifier l'Installation

1. ✅ Frontend accessible: http://localhost:3000
2. ✅ Backend accessible: http://localhost:3001
3. ✅ Database connectée
4. ✅ Tests passent

## 🐛 Troubleshooting

### Erreur: "Cannot find module"

```bash
# Réinstaller dépendances
rm -rf node_modules
pnpm install
```

### Erreur: "Prisma Client not generated"

```bash
cd apps/frontend
pnpm prisma generate
```

### Erreur: "Database connection failed"

- Vérifier DATABASE_URL
- Vérifier que PostgreSQL est démarré
- Vérifier les credentials

### Erreur: "Port already in use"

```bash
# Changer le port dans .env
PORT=3001
```

## 📚 Ressources

- [Documentation complète](/docs)
- [Architecture](/ARCHITECTURE.md)
- [Contributing](/CONTRIBUTING.md)

---

**Besoin d'aide?** Contactez support@luneo.app

