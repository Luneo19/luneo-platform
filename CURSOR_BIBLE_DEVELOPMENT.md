# 🛠️ CURSOR BIBLE - DÉVELOPPEMENT

**Guide pratique pour développer sur Luneo Platform**

---

## 🚀 Démarrage Rapide

### Installation
```bash
# Cloner le repo
git clone <repo-url>
cd luneo-platform

# Installer les dépendances
pnpm install

# Setup environnement
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.local

# Générer Prisma Client
cd apps/backend && npx prisma generate
cd ../frontend && npx prisma generate

# Démarrer services
docker-compose up -d postgres redis

# Migrations DB
cd apps/backend && npx prisma migrate dev
```

### Lancer en Développement
```bash
# Terminal 1 - Backend
cd apps/backend
npm run start:dev
# http://localhost:3001
# Swagger: http://localhost:3001/api/docs

# Terminal 2 - Frontend
cd apps/frontend
npm run dev
# http://localhost:3000

# Terminal 3 - Services
docker-compose up -d
```

---

## 📝 Workflow de Développement

### 1. Créer une Feature

```bash
# Créer une branche
git checkout -b feature/nom-feature

# Développer...
# - Créer/modifier fichiers
# - Tester localement
# - Commit fréquents

# Push et créer PR
git push origin feature/nom-feature
```

### 2. Checklist Avant Commit

- [ ] Code fonctionne localement
- [ ] Tests passent (`npm run test`)
- [ ] Linting OK (`npm run lint`)
- [ ] TypeScript OK (`npm run type-check`)
- [ ] Pas de `console.log` (utiliser `logger`)
- [ ] Documentation à jour si nécessaire

### 3. Structure d'un Commit

```
type(scope): description

Corps du commit (optionnel)

Fixes #123
```

**Types** : `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

---

## 🔍 Débogage

### Backend (NestJS)

**Logs** :
```typescript
import { Logger } from '@nestjs/common';

const logger = new Logger('MyService');
logger.log('Info message');
logger.error('Error message', error.stack);
logger.warn('Warning message');
logger.debug('Debug message');
```

**Déboguer un Endpoint** :
```typescript
@Get('test')
async test() {
  const logger = new Logger('TestController');
  logger.debug('Test endpoint called');
  // ...
}
```

**Vérifier la DB** :
```bash
cd apps/backend
npx prisma studio
# Ouvre http://localhost:5555
```

### Frontend (Next.js)

**Logs** :
```typescript
import { logger } from '@/lib/logger';

logger.info('Info message');
logger.error('Error message', { error, context });
logger.warn('Warning message');
```

**Déboguer une Page** :
```typescript
'use client';

export default function MyPage() {
  useEffect(() => {
    logger.debug('Page mounted');
  }, []);
  // ...
}
```

**React DevTools** : Installer extension Chrome/Firefox

---

## 🧪 Tests

### Backend

**Tests Unitaires** :
```bash
cd apps/backend
npm run test              # Tous les tests
npm run test:watch        # Mode watch
npm run test:cov          # Coverage
npm run test:unit         # Tests unitaires uniquement
```

**Exemple de Test** :
```typescript
describe('AuthService', () => {
  it('should create user', async () => {
    const result = await authService.signup(mockDto);
    expect(result.user.email).toBe(mockDto.email);
  });
});
```

**Tests E2E** :
```bash
cd apps/backend
npm run test:e2e
```

### Frontend

**Tests Unitaires (Vitest)** :
```bash
cd apps/frontend
npm run test              # Tous les tests
npm run test:watch        # Mode watch
npm run test:coverage     # Coverage
```

**Tests E2E (Playwright)** :
```bash
cd apps/frontend
npm run test:e2e          # Tous les tests E2E
npm run test:e2e:ui       # Interface UI
npm run test:e2e:smoke    # Tests smoke
```

### Vérification locale avant déploiement Vercel

```bash
cd apps/frontend

# 1) Vérifier que le build passe en local
pnpm build

# 2) Vérifier que toutes les dépendances utilisées côté serveur (API / lib)
#    sont bien déclarées dans package.json :
#    - bcryptjs
#    - speakeasy
#    - qrcode

# 3) Ne jamais lancer un déploiement Vercel depuis la racine du monorepo.
#    Utiliser UNIQUEMENT :
#       vercel --prod --yes --cwd apps/frontend
#
#    Cela garantit que le projet ciblé est bien "frontend" sur Vercel
#    et évite de consommer le quota API sur le projet "luneo-frontend".
```

---

## 🗄️ Base de Données

### Prisma

**Migrations** :
```bash
cd apps/backend

# Créer migration
npx prisma migrate dev --name nom_migration

# Appliquer migrations
npx prisma migrate deploy

# Réinitialiser DB (⚠️ DANGER)
npx prisma migrate reset
```

**Schéma** :
- Fichier : `apps/backend/prisma/schema.prisma`
- Modifier le schéma → `npx prisma migrate dev`

**Studio** :
```bash
npx prisma studio
# Ouvre http://localhost:5555
```

**Seed** :
```bash
npm run seed  # Si disponible
```

---

## 🔧 Configuration

### Variables d'Environnement

**Backend** (`.env`) :
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
NODE_ENV=development
PORT=3001
```

**Frontend** (`.env.local`) :
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Configuration NestJS

**Modules** : `apps/backend/src/config/configuration.ts`

**JWT** :
- Secret : `JWT_SECRET`
- Expiration : `JWT_EXPIRES_IN` (défaut: 15m)
- Refresh : `JWT_REFRESH_EXPIRES_IN` (défaut: 7d)

---

## 📦 Packages

### Ajouter une Dépendance

**Backend** :
```bash
cd apps/backend
pnpm add package-name
# ou
npm install package-name
```

**Frontend** :
```bash
cd apps/frontend
pnpm add package-name
```

**Shared Package** :
```bash
cd packages/shared-package-name
pnpm add package-name
```

---

## 🐛 Problèmes Courants

### Backend ne démarre pas

1. Vérifier variables d'environnement
2. Vérifier connexion DB : `npx prisma db push`
3. Vérifier logs : Regarder console

### Frontend erreur de build

1. Vérifier TypeScript : `npm run type-check`
2. Vérifier imports manquants
3. Nettoyer cache : `rm -rf .next`

### Erreurs Prisma

1. Régénérer client : `npx prisma generate`
2. Vérifier migrations : `npx prisma migrate status`
3. Vérifier schéma : `npx prisma validate`

### Erreurs de TypeScript

1. Vérifier types manquants
2. Vérifier imports
3. Redémarrer TS server (VSCode: Cmd+Shift+P → "TypeScript: Restart TS Server")

---

## 📚 Ressources

### Documentation
- **NestJS** : https://docs.nestjs.com
- **Next.js** : https://nextjs.org/docs
- **Prisma** : https://www.prisma.io/docs
- **React Query** : https://tanstack.com/query

### Utiles
- **Swagger** : http://localhost:3001/api/docs
- **Prisma Studio** : http://localhost:5555
- **Storybook** : (si configuré)

---

## ✅ Best Practices

### Code
- ✅ Toujours typer (TypeScript strict)
- ✅ Utiliser DTOs pour validation
- ✅ Gérer les erreurs correctement
- ✅ Logger au lieu de console.log
- ✅ Tests pour logique critique

### Git
- ✅ Commits atomiques
- ✅ Messages clairs
- ✅ Branches par feature
- ✅ PR avec description

### Performance
- ✅ Lazy loading composants
- ✅ Pagination pour listes
- ✅ Cache queries React Query
- ✅ Optimiser images Next.js

---

*Dernière mise à jour : Décembre 2024*
