# 📖 Bible du Déploiement Production - Luneo Platform

**Version** : 1.0.0  
**Date** : 5 janvier 2026  
**Statut** : ✅ Documentation Officielle de Référence

---

## 📋 Table des Matières

1. [Introduction](#introduction)
2. [Erreurs Railway (Backend)](#erreurs-railway-backend)
3. [Erreurs Vercel (Frontend)](#erreurs-vercel-frontend)
4. [Bonnes Pratiques](#bonnes-pratiques)
5. [Checklist de Déploiement](#checklist-de-déploiement)
6. [Guide de Résolution Rapide](#guide-de-résolution-rapide)

---

## 🎯 Introduction

Ce document est la **bible officielle** de référence pour tous les déploiements en production de Luneo Platform. Il compile **toutes les erreurs rencontrées** et leurs solutions pour éviter de refaire les mêmes erreurs.

### Architecture de Production

- **Frontend** : Vercel (`luneo.app`)
- **Backend** : Railway (`api.luneo.app`)
- **Base de données** : Railway PostgreSQL
- **Monorepo** : Structure avec `apps/frontend` et `apps/backend`

---

## 🚂 ERREURS RAILWAY (BACKEND)

### 🔴 ERREUR #1 : Health Check 404 - `/health` retourne 404

#### Symptôme
```
Cannot GET /health
Status: 404 Not Found
```

#### Cause
- Le endpoint `/health` n'était pas correctement enregistré
- `ExpressAdapter` intercepte toutes les requêtes avant que les routes Express ne soient enregistrées
- Utilisation de `server.listen()` au lieu de `app.listen()` empêchait NestJS de bien enregistrer les routes

#### Solution Appliquée
```typescript
// apps/backend/src/main.ts

// ✅ BONNE PRATIQUE : Enregistrer /health AVANT app.init()
const server = express();
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// CRITICAL: Register /health route BEFORE app.init()
server.get('/health', (req: Express.Request, res: Express.Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'luneo-backend',
    version: process.env.npm_package_version || '1.0.0',
  });
});

const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
  bodyParser: false,
});

// ... configuration ...

await app.init();

// CRITICAL: Use app.listen() instead of server.listen()
await app.listen(port, '0.0.0.0');
```

#### Points Clés
1. ✅ Enregistrer `/health` sur le serveur Express **AVANT** `app.init()`
2. ✅ Utiliser `app.listen()` et non `server.listen()`
3. ✅ Pattern identique à `serverless.ts` qui fonctionne sur Vercel

#### Référence
- Fichier : `apps/backend/src/main.ts`
- Pattern de référence : `apps/backend/src/serverless.ts`

---

### 🔴 ERREUR #2 : Dependency Injection - ExportPackService non disponible

#### Symptôme
```
Error: Nest can't resolve dependencies of the ExportPackProcessor (PrismaService, ?).
Please make sure that the argument ExportPackService at index [1] is available in the JobsModule context.
```

#### Cause
- `ExportPackService` était utilisé dans `ExportPackProcessor` (JobsModule)
- Mais `ExportPackService` n'était pas exporté par `ManufacturingModule`
- `JobsModule` ne pouvait pas injecter `ExportPackService`

#### Solution Appliquée
```typescript
// apps/backend/src/modules/manufacturing/manufacturing.module.ts

@Module({
  imports: [PrismaModule, StorageModule, SmartCacheModule],
  controllers: [ManufacturingController],
  providers: [
    ManufacturingService,
    ExportPackService,  // ✅ Service fourni
    // ...
  ],
  exports: [ManufacturingService, ExportPackService], // ✅ EXPORT AJOUTÉ
})
export class ManufacturingModule {}
```

#### Points Clés
1. ✅ Toujours exporter les services utilisés par d'autres modules
2. ✅ Vérifier les imports/exports dans tous les modules NestJS
3. ✅ Utiliser `@Inject()` si nécessaire pour les dépendances complexes

#### Référence
- Fichier : `apps/backend/src/modules/manufacturing/manufacturing.module.ts`

---

### 🔴 ERREUR #3 : Dependency Injection - ApiKeysService non disponible

#### Symptôme
```
Error: Nest can't resolve dependencies of the ApiKeyGuard (?).
Please make sure that the argument ApiKeysService at index [0] is available in the WidgetModule context.
```

#### Cause
- `ApiKeyGuard` utilise `ApiKeysService`
- Mais `WidgetModule` et `GenerationModule` n'importaient pas `ApiKeysModule`
- L'injection de dépendance échouait

#### Solution Appliquée
```typescript
// apps/backend/src/modules/widget/widget.module.ts

@Module({
  imports: [
    PrismaModule,
    ApiKeysModule, // ✅ IMPORT AJOUTÉ
  ],
  controllers: [WidgetController],
  providers: [WidgetService],
  exports: [WidgetService],
})
export class WidgetModule {}
```

```typescript
// apps/backend/src/modules/generation/generation.module.ts

@Module({
  imports: [
    PrismaModule,
    StorageModule,
    EventEmitterModule,
    ApiKeysModule, // ✅ IMPORT AJOUTÉ
    // ...
  ],
  // ...
})
export class GenerationModule {}
```

#### Points Clés
1. ✅ Importer le module qui fournit le service utilisé par un Guard
2. ✅ Vérifier tous les Guards et leurs dépendances
3. ✅ Tester l'injection de dépendance avant le déploiement

#### Référence
- Fichiers : 
  - `apps/backend/src/modules/widget/widget.module.ts`
  - `apps/backend/src/modules/generation/generation.module.ts`

---

### 🔴 ERREUR #4 : Healthcheck Railway échoue - Service Unavailable

#### Symptôme
```
Healthcheck failed!
Attempt #1 failed with service unavailable
Attempt #2 failed with service unavailable
...
1/1 replicas never became healthy!
```

#### Cause
- L'application ne démarrait pas assez vite pour répondre au healthcheck
- Le healthcheck était configuré dans le Dashboard mais l'application crashait au démarrage
- Erreurs de dépendance NestJS empêchaient le démarrage

#### Solution Appliquée
1. **Corriger les erreurs de dépendance** (voir erreurs #2 et #3)
2. **Désactiver temporairement le healthcheck** dans `railway.toml` :
```toml
[deploy]
healthcheckPath = ""  # Désactivé temporairement
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```
3. **Réactiver après correction** :
```toml
[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 300
```

#### Points Clés
1. ✅ Corriger d'abord les erreurs de démarrage
2. ✅ Désactiver temporairement le healthcheck si nécessaire
3. ✅ Réactiver une fois l'application stable

#### Référence
- Fichier : `apps/backend/railway.toml`

---

### 🔴 ERREUR #5 : Migration Prisma - Colonne `name` manquante

#### Symptôme
```
Invalid prisma.user.findUnique() invocation:
The column User.name does not exist in the current database.
Status: 500 Internal Server Error
Route: /api/auth/signup
```

#### Cause
- Le schéma Prisma contenait le champ `name` dans le modèle `User`
- Mais la colonne n'existait pas dans la base de données déployée
- Migration non appliquée

#### Solution Appliquée
```sql
-- apps/backend/prisma/migrations/add_user_name_column/migration.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'User'
    AND column_name = 'name'
  ) THEN
    ALTER TABLE "User" ADD COLUMN "name" TEXT;
    RAISE NOTICE 'Column "name" added to User table';
  ELSE
    RAISE NOTICE 'Column "name" already exists in User table';
  END IF;
END $$;
```

#### Points Clés
1. ✅ Toujours vérifier que les migrations sont appliquées
2. ✅ Utiliser `prisma migrate deploy` en production
3. ✅ Vérifier le schéma avant de déployer

#### Référence
- Migration : `apps/backend/prisma/migrations/add_user_name_column/migration.sql`

---

### 🔴 ERREUR #6 : Railway Root Directory incorrect

#### Symptôme
- Build échoue avec "No such file or directory"
- Dockerfile non trouvé
- Dépendances non installées

#### Cause
- `railway up` exécuté depuis `apps/backend` au lieu de la racine
- Le Dockerfile est à la racine du monorepo
- Railway cherchait le Dockerfile au mauvais endroit

#### Solution Appliquée
```bash
# ✅ BONNE PRATIQUE : Toujours exécuter depuis la racine
cd /Users/emmanuelabougadous/luneo-platform
railway up
```

#### Configuration Railway
- **Root Directory** : `.` (racine du monorepo)
- **Dockerfile** : À la racine
- **Build Context** : Racine du monorepo

#### Points Clés
1. ✅ Toujours exécuter `railway up` depuis la racine du monorepo
2. ✅ Vérifier que le Root Directory est `.` dans Railway Dashboard
3. ✅ Le Dockerfile doit être à la racine pour un monorepo

#### Référence
- Dockerfile : `Dockerfile` (racine)
- Configuration : `apps/backend/railway.toml`

---

## ⚡ ERREURS VERCEL (FRONTEND)

### 🔴 ERREUR #1 : HTTP 500 - loadFeatureFlags() timeout

#### Symptôme
```
HTTP 500 Internal Server Error
Route: / (page d'accueil)
Error: fetch timeout ou DNS resolution failed
```

#### Cause
- `loadFeatureFlags()` faisait un `fetch` vers `/api/feature-flags` depuis un Server Component
- Sur Vercel, les Server Components ne peuvent pas faire de fetch vers leur propre API route
- Timeout ou erreur de résolution DNS

#### Solution Appliquée
```typescript
// apps/frontend/src/lib/feature-flags/loadFeatureFlags.ts

// ❌ AVANT (ne fonctionne pas)
export async function loadFeatureFlags() {
  const response = await fetch('/api/feature-flags');
  // ...
}

// ✅ APRÈS (fonctionne)
export async function loadFeatureFlags(): Promise<{
  flags: Record<string, boolean>;
  updatedAt: string | null;
}> {
  // Charger depuis les variables d'environnement
  const envFlags: Record<string, boolean> = {};
  
  Object.keys(process.env).forEach((key) => {
    if (key.startsWith('FEATURE_FLAG_')) {
      const flagName = key
        .replace('FEATURE_FLAG_', '')
        .toLowerCase()
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      envFlags[flagName] = process.env[key] === 'true';
    }
  });
  
  const flags = {
    ...DEFAULT_FLAGS,
    ...envFlags,
  };
  
  return {
    flags,
    updatedAt: new Date().toISOString(),
  };
}
```

#### Points Clés
1. ✅ Ne jamais faire de `fetch` vers sa propre API route depuis un Server Component
2. ✅ Utiliser directement les variables d'environnement
3. ✅ Si besoin de flags dynamiques, utiliser une base de données

#### Référence
- Fichier : `apps/frontend/src/lib/feature-flags/loadFeatureFlags.ts`

---

### 🔴 ERREUR #2 : Build Error - bcryptjs manquant

#### Symptôme
```
Error: Command "(pnpm prisma generate || echo 'Prisma skipped') && pnpm run build" exited with 1
Module not found: Can't resolve 'bcryptjs'
```

#### Cause
- `bcryptjs` était utilisé dans les routes API tRPC (server-side)
- Mais n'était pas dans `apps/frontend/package.json`
- Build échouait car la dépendance était manquante

#### Solution Appliquée
```json
// apps/frontend/package.json

{
  "dependencies": {
    // ...
    "bcryptjs": "^2.4.3",
    // ...
  },
  "devDependencies": {
    // ...
    "@types/bcryptjs": "^3.0.0",
    // ...
  }
}
```

#### Points Clés
1. ✅ Vérifier toutes les dépendances utilisées dans les routes API
2. ✅ Les routes API Next.js s'exécutent côté serveur, mais les dépendances doivent être dans `package.json`
3. ✅ Utiliser `dependencies` et non `devDependencies` pour les packages utilisés en production

#### Référence
- Fichier : `apps/frontend/package.json`

---

### 🔴 ERREUR #3 : Build Error - Vercel Monorepo Configuration

#### Symptôme
```
Error: pnpm-lock.yaml not found
Error: Root Directory configuration incorrect
Build fails
```

#### Cause
- Vercel Root Directory était configuré sur `apps/frontend`
- Mais `pnpm-lock.yaml` est à la racine du monorepo
- `pnpm install` ne trouvait pas le lockfile

#### Solution Appliquée

**1. Changer Root Directory dans Vercel Dashboard** :
- Settings → General → Root Directory : `.` (racine)

**2. Ajuster `vercel.json`** :
```json
{
  "framework": "nextjs",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "cd apps/frontend && (pnpm prisma generate || echo 'Prisma skipped') && pnpm run build",
  "outputDirectory": "apps/frontend/.next",
  "devCommand": "pnpm run dev"
}
```

#### Points Clés
1. ✅ Pour un monorepo, Root Directory doit être `.` (racine)
2. ✅ Le `buildCommand` doit naviguer vers `apps/frontend`
3. ✅ Le `outputDirectory` doit pointer vers `apps/frontend/.next`

#### Référence
- Fichier : `apps/frontend/vercel.json`
- Configuration : Vercel Dashboard → Settings → General

---

### 🔴 ERREUR #4 : Build Error - `dynamic` et `revalidate` dans Client Components

#### Symptôme
```
Error: `export const dynamic` is not allowed in Client Components
Error: `export const revalidate` is not allowed in Client Components
```

#### Cause
- `export const dynamic = 'force-dynamic'` dans un fichier avec `'use client'`
- `export const revalidate = false` dans un Client Component
- Next.js ne permet pas ces exports dans les Client Components

#### Solution Appliquée

**1. Retirer les exports des Client Components** :
```typescript
// apps/frontend/src/app/(dashboard)/billing/success/page.tsx

'use client';

// ❌ AVANT
// export const dynamic = 'force-dynamic';
// export const revalidate = false;

// ✅ APRÈS - Exports retirés
// (pas d'exports dynamic/revalidate dans Client Components)
```

**2. Créer un layout séparé pour forcer le dynamic** :
```typescript
// apps/frontend/src/app/(dashboard)/billing/success/layout.tsx

// Force dynamic rendering for this specific route segment
export const dynamic = 'force-dynamic';

export default function BillingSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

#### Points Clés
1. ✅ Ne jamais mettre `dynamic` ou `revalidate` dans un Client Component
2. ✅ Utiliser un layout séparé si besoin de forcer le dynamic rendering
3. ✅ Les Server Components peuvent utiliser `dynamic` et `revalidate`

#### Référence
- Fichiers :
  - `apps/frontend/src/app/(dashboard)/billing/success/page.tsx`
  - `apps/frontend/src/app/(dashboard)/billing/success/layout.tsx`
  - `apps/frontend/src/app/(dashboard)/layout.tsx`

---

### 🔴 ERREUR #5 : Runtime Error - `ReferenceError: Image is not defined`

#### Symptôme
```
ReferenceError: Image is not defined
at HeroBannerOptimized (apps/frontend/src/components/HeroBannerOptimized.tsx:85)
```

#### Cause
- Utilisation de `Image` (Next.js) sans import
- Le composant `Image` n'était pas importé

#### Solution Appliquée
```typescript
// apps/frontend/src/components/HeroBannerOptimized.tsx

'use client';

import React, { useMemo } from 'react';
import Image from 'next/image'; // ✅ IMPORT AJOUTÉ
import styles from './HeroBannerOptimized.module.css';
```

#### Points Clés
1. ✅ Toujours importer `Image` depuis `next/image`
2. ✅ Vérifier tous les imports avant le déploiement
3. ✅ Utiliser un linter pour détecter les imports manquants

#### Référence
- Fichier : `apps/frontend/src/components/HeroBannerOptimized.tsx`

---

### 🔴 ERREUR #6 : Runtime Error - `ReferenceError: ErrorBoundary is not defined`

#### Symptôme
```
ReferenceError: ErrorBoundary is not defined
at about/page.tsx:277
```

#### Cause
- Utilisation de `ErrorBoundary` sans import
- Le composant n'était pas importé

#### Solution Appliquée
```typescript
// apps/frontend/src/app/(public)/about/page.tsx

'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary'; // ✅ IMPORT AJOUTÉ
// ...
```

#### Points Clés
1. ✅ Toujours importer les composants utilisés
2. ✅ Vérifier tous les imports avant le déploiement
3. ✅ Utiliser des alias d'import cohérents (`@/components/...`)

#### Référence
- Fichier : `apps/frontend/src/app/(public)/about/page.tsx`

---

### 🔴 ERREUR #7 : Runtime Error - `cookies()` dans Server Component

#### Symptôme
```
Error: cookies() can only be used in Server Components
Error: generateViewport() is on the client
```

#### Cause
- `loadI18nConfig()` utilise `cookies()` dans un Server Component
- Mais Next.js essayait de pré-rendre statiquement certaines pages
- Conflit entre static generation et dynamic rendering

#### Solution Appliquée
```typescript
// apps/frontend/src/app/layout.tsx

// Force dynamic rendering for the root layout as it uses cookies()
export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gestion d'erreur pour éviter les 500
  let locale: SupportedLocale = 'en';
  let messages: TranslationMessages = {} as TranslationMessages;
  
  try {
    const i18nConfig = await loadI18nConfig();
    locale = i18nConfig.locale;
    messages = i18nConfig.messages;
  } catch (error) {
    console.error('[Layout] Failed to load i18n config:', error);
    // Utiliser les valeurs par défaut
  }
  
  // ...
}
```

#### Points Clés
1. ✅ Ajouter `export const dynamic = 'force-dynamic'` si `cookies()` est utilisé
2. ✅ Gérer les erreurs avec try-catch pour éviter les 500
3. ✅ Fournir des valeurs par défaut en cas d'erreur

#### Référence
- Fichier : `apps/frontend/src/app/layout.tsx`
- Fichier : `apps/frontend/src/i18n/server.ts`

---

### 🔴 ERREUR #8 : Configuration - NEXT_PUBLIC_API_URL incorrecte

#### Symptôme
- Frontend ne peut pas se connecter au backend
- Erreurs CORS
- API calls échouent

#### Cause
- `NEXT_PUBLIC_API_URL` pointait vers une ancienne URL Vercel
- Le backend était maintenant sur Railway

#### Solution Appliquée
```bash
# Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_API_URL = https://api.luneo.app/api
```

#### Points Clés
1. ✅ Toujours vérifier `NEXT_PUBLIC_API_URL` avant le déploiement
2. ✅ Utiliser l'URL de production du backend (Railway)
3. ✅ Vérifier que CORS est configuré côté backend

#### Référence
- Configuration : Vercel Dashboard → Settings → Environment Variables

---

## ✅ BONNES PRATIQUES

### 🚂 Railway (Backend)

#### 1. Configuration Health Check
```typescript
// ✅ BONNE PRATIQUE : Enregistrer /health AVANT app.init()
const server = express();
server.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
await app.init();
await app.listen(port, '0.0.0.0');
```

#### 2. Dependency Injection
```typescript
// ✅ BONNE PRATIQUE : Toujours exporter les services utilisés
@Module({
  providers: [MyService],
  exports: [MyService], // ✅ EXPORT OBLIGATOIRE
})
export class MyModule {}

// ✅ BONNE PRATIQUE : Importer le module qui fournit le service
@Module({
  imports: [MyModule], // ✅ IMPORT OBLIGATOIRE
})
export class ConsumerModule {}
```

#### 3. Migrations Prisma
```typescript
// ✅ BONNE PRATIQUE : Exécuter les migrations au démarrage
async function bootstrap() {
  try {
    logger.log('Running database migrations...');
    execSync('pnpm prisma migrate deploy', {
      stdio: 'inherit',
      cwd: backendDir
    });
    logger.log('Database migrations completed');
  } catch (error) {
    logger.warn(`Database migration failed: ${error.message}. Continuing anyway...`);
  }
  // ...
}
```

#### 4. Monorepo Configuration
```toml
# apps/backend/railway.toml
[build]
builder = "DOCKERFILE"

[deploy]
healthcheckPath = "/health"
restartPolicyType = "ON_FAILURE"
startCommand = "node dist/src/main.js"

# IMPORTANT: Railway Root Directory doit être '.' (racine)
```

#### 5. Variables d'Environnement
```bash
# ✅ BONNE PRATIQUE : Utiliser les références Railway
DATABASE_URL = ${{Postgres.DATABASE_URL}}
REDIS_URL = ${{Redis.REDIS_URL}}
```

---

### ⚡ Vercel (Frontend)

#### 1. Server Components - Pas de Fetch Interne
```typescript
// ❌ MAUVAISE PRATIQUE
export async function loadData() {
  const response = await fetch('/api/data'); // ❌ Ne fonctionne pas
}

// ✅ BONNE PRATIQUE
export async function loadData() {
  // Utiliser directement les variables d'environnement
  // Ou charger depuis une base de données
  return process.env.DATA || defaultData;
}
```

#### 2. Client Components - Pas de `dynamic`/`revalidate`
```typescript
// ❌ MAUVAISE PRATIQUE
'use client';
export const dynamic = 'force-dynamic'; // ❌ Erreur

// ✅ BONNE PRATIQUE
'use client';
// Pas d'exports dynamic/revalidate dans Client Components
```

#### 3. Imports Obligatoires
```typescript
// ✅ BONNE PRATIQUE : Toujours importer explicitement
import Image from 'next/image';
import { ErrorBoundary } from '@/components/ErrorBoundary';
```

#### 4. Monorepo Configuration
```json
// apps/frontend/vercel.json
{
  "framework": "nextjs",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "cd apps/frontend && pnpm run build",
  "outputDirectory": "apps/frontend/.next"
}
```

**Vercel Dashboard** :
- Root Directory : `.` (racine du monorepo)

#### 5. Gestion d'Erreurs dans Layout
```typescript
// ✅ BONNE PRATIQUE : Gérer les erreurs avec try-catch
export default async function RootLayout({ children }) {
  let locale = 'en';
  let messages = {};
  
  try {
    const config = await loadI18nConfig();
    locale = config.locale;
    messages = config.messages;
  } catch (error) {
    console.error('Failed to load config:', error);
    // Utiliser les valeurs par défaut
  }
  
  return <html>...</html>;
}
```

---

## 📋 CHECKLIST DE DÉPLOIEMENT

### Pré-Déploiement

#### Backend (Railway)
- [ ] Vérifier que toutes les dépendances sont exportées/importées correctement
- [ ] Vérifier que `/health` est enregistré AVANT `app.init()`
- [ ] Vérifier que `app.listen()` est utilisé (pas `server.listen()`)
- [ ] Vérifier que les migrations Prisma sont à jour
- [ ] Vérifier que `DATABASE_URL` est configuré avec `${{Postgres.DATABASE_URL}}`
- [ ] Vérifier que le Root Directory est `.` dans Railway Dashboard
- [ ] Tester le build local : `pnpm build`

#### Frontend (Vercel)
- [ ] Vérifier que tous les imports sont présents
- [ ] Vérifier qu'aucun `dynamic`/`revalidate` dans les Client Components
- [ ] Vérifier que `NEXT_PUBLIC_API_URL` pointe vers le bon backend
- [ ] Vérifier que le Root Directory est `.` dans Vercel Dashboard
- [ ] Vérifier que `bcryptjs` et autres dépendances server-side sont dans `package.json`
- [ ] Vérifier que `loadFeatureFlags()` n'utilise pas de `fetch` interne
- [ ] Tester le build local : `pnpm build`

### Post-Déploiement

#### Backend
- [ ] Tester `/health` : `curl https://api.luneo.app/health`
- [ ] Tester `/api/health` : `curl https://api.luneo.app/api/health`
- [ ] Vérifier les logs Railway pour erreurs
- [ ] Tester un endpoint API : `curl https://api.luneo.app/api/products`

#### Frontend
- [ ] Tester la page d'accueil : `curl -I https://luneo.app`
- [ ] Vérifier les logs Vercel pour erreurs runtime
- [ ] Tester la connexion frontend → backend
- [ ] Vérifier la console navigateur pour erreurs

---

## 🔧 GUIDE DE RÉSOLUTION RAPIDE

### Railway - Health Check 404
1. Vérifier que `/health` est enregistré AVANT `app.init()`
2. Vérifier que `app.listen()` est utilisé
3. Vérifier les logs Railway pour erreurs de démarrage

### Railway - Dependency Injection Error
1. Identifier le service manquant dans l'erreur
2. Vérifier que le service est exporté par son module
3. Vérifier que le module est importé dans le module consommateur

### Vercel - Build Error
1. Vérifier les imports manquants
2. Vérifier que les dépendances sont dans `package.json`
3. Vérifier la configuration monorepo (Root Directory)

### Vercel - Runtime Error 500
1. Vérifier les logs Vercel pour l'erreur exacte
2. Vérifier que `loadFeatureFlags()` n'utilise pas de `fetch`
3. Vérifier que les imports sont présents
4. Vérifier la gestion d'erreurs dans `layout.tsx`

### Vercel - `dynamic`/`revalidate` Error
1. Retirer les exports des Client Components
2. Créer un layout séparé si besoin de forcer le dynamic

---

## 📊 RÉSUMÉ DES ERREURS

### Railway (Backend) - 6 Erreurs
1. ✅ Health Check 404 - `/health` non enregistré correctement
2. ✅ Dependency Injection - ExportPackService non exporté
3. ✅ Dependency Injection - ApiKeysService non importé
4. ✅ Healthcheck Railway - Service unavailable
5. ✅ Migration Prisma - Colonne `name` manquante
6. ✅ Root Directory - Configuration incorrecte

### Vercel (Frontend) - 8 Erreurs
1. ✅ HTTP 500 - loadFeatureFlags() timeout
2. ✅ Build Error - bcryptjs manquant
3. ✅ Build Error - Configuration monorepo
4. ✅ Build Error - `dynamic`/`revalidate` dans Client Components
5. ✅ Runtime Error - `Image` non importé
6. ✅ Runtime Error - `ErrorBoundary` non importé
7. ✅ Runtime Error - `cookies()` dans Server Component
8. ✅ Configuration - NEXT_PUBLIC_API_URL incorrecte

---

## 🎯 RÈGLES D'OR

### Pour Railway (Backend)
1. ✅ **Toujours** enregistrer `/health` AVANT `app.init()`
2. ✅ **Toujours** utiliser `app.listen()` (pas `server.listen()`)
3. ✅ **Toujours** exporter les services utilisés par d'autres modules
4. ✅ **Toujours** importer le module qui fournit un service utilisé
5. ✅ **Toujours** exécuter `railway up` depuis la racine du monorepo

### Pour Vercel (Frontend)
1. ✅ **Jamais** faire de `fetch` vers sa propre API route depuis un Server Component
2. ✅ **Toujours** importer explicitement tous les composants utilisés
3. ✅ **Jamais** mettre `dynamic`/`revalidate` dans un Client Component
4. ✅ **Toujours** vérifier que les dépendances server-side sont dans `package.json`
5. ✅ **Toujours** gérer les erreurs avec try-catch dans les layouts

---

## 📚 RÉFÉRENCES

### Fichiers Clés
- `apps/backend/src/main.ts` - Point d'entrée backend
- `apps/backend/src/serverless.ts` - Pattern de référence pour `/health`
- `apps/frontend/src/app/layout.tsx` - Layout racine frontend
- `apps/frontend/src/lib/feature-flags/loadFeatureFlags.ts` - Feature flags
- `apps/backend/railway.toml` - Configuration Railway
- `apps/frontend/vercel.json` - Configuration Vercel
- `Dockerfile` - Dockerfile pour Railway (racine)

### Documentation
- `ARCHITECTURE_PRODUCTION.md` - Architecture complète
- `CORRECTIONS_RUNTIME_VERCEL.md` - Corrections runtime
- `RESUME_CORRECTIONS_RUNTIME.md` - Résumé corrections

---

**🎉 Cette bible doit être consultée avant chaque déploiement en production !**



