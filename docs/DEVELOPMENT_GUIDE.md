# 🛠️ Guide de Développement - Luneo Platform

**Guide complet pour développer sur Luneo Platform**

---

## 📋 Table des Matières

1. [Environnement de Développement](#environnement-de-développement)
2. [Workflow de Développement](#workflow-de-développement)
3. [Conventions de Code](#conventions-de-code)
4. [Outils et Commandes](#outils-et-commandes)
5. [Structure du Code](#structure-du-code)
6. [Débogage](#débogage)

---

## 🖥️ Environnement de Développement

### Prérequis

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0
- **PostgreSQL**: >= 14.0 (ou Supabase)
- **Git**: >= 2.30.0

### Setup Initial

```bash
# 1. Cloner le repository
git clone https://github.com/votre-org/luneo-platform.git
cd luneo-platform

# 2. Installer les dépendances
pnpm install

# 3. Configurer l'environnement
cd apps/frontend
cp .env.example .env.local
# Éditer .env.local avec vos valeurs

# 4. Générer Prisma Client
pnpm prisma generate

# 5. Lancer les migrations
pnpm prisma migrate dev

# 6. Lancer le serveur de développement
pnpm dev
```

**Voir:** `SETUP.md` pour guide complet

---

## 🔄 Workflow de Développement

### 1. Créer une Branche

```bash
# Depuis main/develop
git checkout -b feature/ma-feature
# ou
git checkout -b fix/mon-bug
```

**Conventions:**
- `feature/` - Nouvelles fonctionnalités
- `fix/` - Corrections de bugs
- `docs/` - Documentation
- `refactor/` - Refactoring
- `test/` - Tests

### 2. Développement

```bash
# Lancer le serveur de développement
pnpm dev

# Dans un autre terminal, lancer les tests en watch
pnpm test:watch
```

### 3. Vérifications Avant Commit

```bash
# Lint
pnpm lint

# Type check
pnpm type-check

# Tests
pnpm test

# Format
pnpm format
```

### 4. Commit

```bash
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"
```

**Convention de commit:**
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage
- `refactor:` - Refactoring
- `test:` - Tests
- `chore:` - Maintenance

### 5. Push et PR

```bash
git push origin feature/ma-feature
```

Créer une Pull Request sur GitHub.

**Voir:** `CONTRIBUTING.md` pour détails

---

## 📝 Conventions de Code

### TypeScript

```typescript
// ✅ Bon
interface User {
  id: string;
  email: string;
  name: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Mauvais
function getUser(id: any): any {
  // ...
}
```

**Règles:**
- TypeScript strict activé
- Éviter `any`
- Types explicites pour fonctions publiques
- Interfaces pour objets complexes

### React

```typescript
// ✅ Bon - Composant fonctionnel
export function MyComponent({ title }: { title: string }) {
  return <div>{title}</div>;
}

// ✅ Bon - Hook personnalisé
export function useMyData() {
  const [data, setData] = useState(null);
  // ...
  return { data, loading, error };
}

// ❌ Mauvais - Class component
export class MyComponent extends React.Component {
  // ...
}
```

**Règles:**
- Composants fonctionnels uniquement
- Hooks personnalisés pour logique réutilisable
- Error boundaries pour gestion d'erreurs
- Memoization si nécessaire

### Styling

```typescript
// ✅ Bon - Tailwind CSS
<div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900">
  <Button variant="primary">Click me</Button>
</div>

// ❌ Mauvais - Inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  <button style={{ backgroundColor: 'blue' }}>Click me</button>
</div>
```

**Règles:**
- Tailwind CSS pour styling
- Dark mode support
- Responsive design
- Accessibilité (WCAG AA)

### Naming

```typescript
// ✅ Bon
export function UserProfile() {} // PascalCase pour composants
export function getUserData() {} // camelCase pour fonctions
const API_BASE_URL = '...'; // UPPER_CASE pour constantes
const user-data.ts // kebab-case pour fichiers

// ❌ Mauvais
export function userProfile() {}
export function GetUserData() {}
const apiBaseUrl = '...';
const UserData.ts
```

---

## 🛠️ Outils et Commandes

### Développement

```bash
# Lancer le serveur de développement
pnpm dev

# Build pour production
pnpm build

# Démarrer en production
pnpm start
```

### Tests

```bash
# Tests unitaires
pnpm test

# Tests en watch mode
pnpm test:watch

# Tests avec UI
pnpm test:ui

# Coverage
pnpm test:coverage

# Tests E2E
pnpm test:e2e

# Tests E2E avec UI
pnpm test:e2e:ui

# Tests E2E smoke (Chrome uniquement)
pnpm test:e2e:smoke
```

### Qualité de Code

```bash
# Lint
pnpm lint          # Lint et auto-fix
pnpm lint:check    # Vérifier seulement

# Format
pnpm format        # Formatter avec Prettier
pnpm format:check  # Vérifier seulement

# Type check
pnpm type-check
```

### Database

```bash
# Générer Prisma Client
pnpm prisma generate

# Créer une migration
pnpm prisma migrate dev --name migration-name

# Appliquer les migrations
pnpm prisma migrate deploy

# Ouvrir Prisma Studio
pnpm prisma studio

# Seed la database
pnpm prisma db seed
```

---

## 📁 Structure du Code

### Frontend

```
apps/frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # Pages publiques
│   │   │   ├── page.tsx        # Homepage
│   │   │   ├── pricing/
│   │   │   └── ...
│   │   ├── (dashboard)/        # Pages dashboard
│   │   │   ├── dashboard/
│   │   │   ├── ai-studio/
│   │   │   └── ...
│   │   ├── (auth)/             # Pages auth
│   │   │   ├── login/
│   │   │   └── register/
│   │   └── api/                # API Routes
│   │       ├── health/
│   │       ├── products/
│   │       └── ...
│   ├── components/             # Composants React
│   │   ├── ui/                 # Composants UI de base
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ...
│   ├── lib/                    # Utilitaires et services
│   │   ├── trpc/               # tRPC configuration
│   │   ├── services/           # Services métier
│   │   │   ├── BillingService.ts
│   │   │   ├── AIService.ts
│   │   │   └── ...
│   │   ├── hooks/              # Hooks tRPC
│   │   ├── monitoring/         # Monitoring
│   │   └── ...
│   ├── hooks/                  # React hooks personnalisés
│   │   ├── useAuth.ts
│   │   ├── useCredits.ts
│   │   └── ...
│   └── types/                  # TypeScript types
├── tests/                      # Tests
│   ├── e2e/                    # Tests E2E
│   ├── api/                    # Tests API
│   └── security/               # Tests sécurité
└── prisma/                     # Prisma schema
    └── schema.prisma
```

### Patterns

#### 1. API Routes

```typescript
// apps/frontend/src/app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw { status: 401, message: 'Non authentifié' };
    }
    
    // Logique
    return { products: [] };
  }, '/api/products', 'GET');
}
```

#### 2. Services

```typescript
// apps/frontend/src/lib/services/MyService.ts
import { logger } from '@/lib/logger';

export class MyService {
  async doSomething(data: MyData): Promise<Result> {
    logger.info('Doing something', { data });
    // Logique
    return result;
  }
}

export const myService = new MyService();
```

#### 3. Hooks

```typescript
// apps/frontend/src/hooks/useMyData.ts
import { useState, useEffect } from 'react';

export function useMyData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}
```

#### 4. Components

```typescript
// apps/frontend/src/components/MyComponent.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>{title}</h1>
      <Button onClick={() => setCount(count + 1)}>
        Count: {count}
      </Button>
    </div>
  );
}
```

---

## 🐛 Débogage

### Erreurs Communes

#### 1. "Cannot find module"
```bash
# Solution
rm -rf node_modules
pnpm install
```

#### 2. "Prisma Client not generated"
```bash
# Solution
cd apps/frontend
pnpm prisma generate
```

#### 3. "Database connection failed"
- Vérifier `DATABASE_URL` dans `.env.local`
- Vérifier que PostgreSQL/Supabase est accessible
- Vérifier les credentials

#### 4. "Port already in use"
```bash
# Solution - Tuer le processus
lsof -ti:3000 | xargs kill -9

# Ou changer le port
PORT=3001 pnpm dev
```

### Outils de Débogage

#### React DevTools
- Installer l'extension Chrome/Firefox
- Inspecter les composants et state

#### Next.js DevTools
- Accessible via `http://localhost:3000/_next/webpack-hmr`

#### Sentry
- Erreurs trackées automatiquement
- Dashboard: https://sentry.io

#### Console Logs
```typescript
import { logger } from '@/lib/logger';

logger.info('Info message', { data });
logger.warn('Warning message', { data });
logger.error('Error message', { error });
```

---

## 🔗 Ressources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [tRPC Documentation](https://trpc.io)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 📚 Documentation Projet

- [README.md](../README.md) - Vue d'ensemble
- [SETUP.md](../SETUP.md) - Guide d'installation
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architecture
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Guide de contribution
- [docs/API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Documentation API
- [tests/TESTING_GUIDE.md](../apps/frontend/tests/TESTING_GUIDE.md) - Guide de tests

---

**Dernière mise à jour:** Décembre 2024

