# 📖 BIBLE DE DÉVELOPPEMENT - LUNEO PLATFORM

**Version**: 2.0.0  
**Date**: 2024  
**Objectif**: Compilation exhaustive de toutes les leçons apprises, erreurs corrigées, et règles de développement professionnel pour le projet Luneo

---

## 📋 TABLE DES MATIÈRES

1. [Règles Fondamentales](#règles-fondamentales)
2. [Erreurs Critiques et Solutions](#erreurs-critiques-et-solutions)
3. [Architecture Next.js App Router](#architecture-nextjs-app-router)
4. [Déploiement Vercel](#déploiement-vercel)
5. [TypeScript et Types](#typescript-et-types)
6. [Performance et Optimisation](#performance-et-optimisation)
7. [Sécurité](#sécurité)
8. [State Management](#state-management)
9. [Gestion des Erreurs](#gestion-des-erreurs)
10. [Tests et Qualité](#tests-et-qualité)
11. [Patterns Interdits](#patterns-interdits)
12. [Checklist de Développement](#checklist-de-développement)

---

## 🎯 RÈGLES FONDAMENTALES

### Philosophie de Développement

1. **Production d'abord** : Le code doit fonctionner en production Vercel avant de fonctionner en local
2. **Build-first mindset** : Si le build échoue, le code est incorrect, même s'il fonctionne en dev
3. **Zéro tolérance** : Aucune erreur TypeScript, ESLint, ou Webpack n'est acceptable en production
4. **SSR par défaut** : Tous les composants sont Server Components sauf si explicitement marqués `'use client'`
5. **Vérification continue** : Chaque commit doit passer `pnpm build` sans erreur

### Principes d'Architecture

1. **Composants < 300 lignes** : Découper systématiquement les composants volumineux
2. **Aucune dépendance circulaire** : Utiliser `packages/types` pour les types partagés
3. **Une seule responsabilité** : Chaque composant/module a UNE seule responsabilité
4. **Composition > Héritage** : Toujours préférer la composition

---

## 🔴 ERREURS CRITIQUES ET SOLUTIONS

### 1. Erreurs TypeScript Massives (2838 erreurs sur 224 fichiers)

#### Problème Identifié

- **TS2339** (1092 erreurs): Property does not exist on type
- **TS2305** (584 erreurs): Module not found
- **TS2304** (229 erreurs): Cannot find name
- **TS2724** (221 erreurs): Property was assigned but never used
- **TS2323** (166 erreurs): Type is not assignable
- **TS2484** (134 erreurs): Cannot find name (variable)
- **TS7006** (122 erreurs): Parameter implicitly has 'any' type

#### Solutions Appliquées

**A. Erreurs `motion` (JSX.IntrinsicElements)**

❌ **NE JAMAIS FAIRE** :
```typescript
// Utilisation directe de motion sans déclaration
<motion.div>...</motion.div>
```

✅ **TOUJOURS FAIRE** :
```typescript
// Option 1: Utiliser LazyMotionDiv (recommandé)
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';

<motion initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
  ...
</motion>

// Option 2: Déclaration globale TypeScript
// Créer: apps/frontend/src/types/framer-motion.d.ts
import 'framer-motion';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      motion: any;
      motionDiv: any;
      motionSpan: any;
    }
  }
}
```

**B. Modules Manquants (TS2305)**

❌ **NE JAMAIS FAIRE** :
```typescript
import { Something } from '@/lib/non-existent';
import { Component } from '@/components/missing';
```

✅ **TOUJOURS FAIRE** :
```typescript
// Vérifier l'existence du fichier AVANT d'importer
import { Something } from '@/lib/existing';
// OU utiliser un chemin relatif correct
import { Component } from '@/components/existing/Component';
```

**C. Types Non Assignables (TS2323)**

❌ **NE JAMAIS FAIRE** :
```typescript
const data: string = 123; // Type error
const user: User = { name: 'John' }; // Missing required fields
```

✅ **TOUJOURS FAIRE** :
```typescript
// Utiliser des types stricts
const data: string = '123';
const user: User = { 
  id: '1',
  name: 'John',
  email: 'john@example.com',
  // ... tous les champs requis
};
```

**D. Paramètres 'any' Implicites (TS7006)**

❌ **NE JAMAIS FAIRE** :
```typescript
function processData(data) { // Parameter 'data' implicitly has 'any' type
  return data.value;
}
```

✅ **TOUJOURS FAIRE** :
```typescript
function processData(data: { value: string }): string {
  return data.value;
}

// OU utiliser unknown avec type guard
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String(data.value);
  }
  throw new Error('Invalid data');
}
```

### 2. Pages Volumineuses (>5000 lignes)

#### Problème Identifié

- `configurator-3d/page.tsx`: 5942 lignes
- `ar-studio/integrations/page.tsx`: 5192 lignes
- `ai-studio/templates/page.tsx`: 5138 lignes
- `ar-studio/collaboration/page.tsx`: 5064 lignes
- `support/page.tsx`: 5060 lignes
- `billing/page.tsx`: 5053 lignes
- `library/import/page.tsx`: 5044 lignes
- `products/page.tsx`: 5042 lignes
- `analytics-advanced/page.tsx`: 5041 lignes
- `monitoring/page.tsx`: 4740 lignes
- `orders/page.tsx`: 4558 lignes

#### Solution Appliquée

❌ **NE JAMAIS FAIRE** :
```typescript
// Un seul fichier de 5000+ lignes
export default function ProductsPage() {
  // 5000 lignes de code...
}
```

✅ **TOUJOURS FAIRE** :
```typescript
// Structure modulaire
// page.tsx (< 500 lignes)
import { ProductList } from './components/ProductList';
import { ProductFilters } from './components/ProductFilters';
import { useProducts } from './hooks/useProducts';

export default async function ProductsPage() {
  const products = await fetchProducts();
  return (
    <div>
      <ProductFilters />
      <ProductList products={products} />
    </div>
  );
}

// components/ProductList.tsx (< 300 lignes)
// components/ProductFilters.tsx (< 300 lignes)
// hooks/useProducts.ts (< 200 lignes)
```

### 3. Erreurs JSX (Balises Non Fermées)

#### Problème Identifié

- **TS17008** (914 erreurs): JSX element has no corresponding closing tag
- **TS17002** (283 erreurs): Expected corresponding JSX closing tag
- **TS1381** (159 erreurs): Unexpected token (accolades JSX mal formées)
- **TS1005** (90 erreurs): Syntax error (parenthèses/virgules)
- **TS2657** (18 erreurs): JSX expressions must have one parent element

#### Solution Appliquée

❌ **NE JAMAIS FAIRE** :
```typescript
<div>
  <Card>
    <CardHeader>
      <CardTitle>Titre</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Oubli de fermer CardContent */}
    </Card>
  </div>
```

✅ **TOUJOURS FAIRE** :
```typescript
<div>
  <Card>
    <CardHeader>
      <CardTitle>Titre</CardTitle>
    </CardHeader>
    <CardContent>
      Contenu
    </CardContent>
  </Card>
</div>
```

**Vérification systématique** :
1. Utiliser un formatter (Prettier) avec validation JSX
2. Vérifier avec `npx tsc --noEmit` avant chaque commit
3. Utiliser un IDE avec validation JSX en temps réel

---

## 🏗️ ARCHITECTURE NEXT.JS APP ROUTER

### Server Components vs Client Components

#### Règle Fondamentale

**Par défaut, TOUS les composants sont Server Components.**

#### Quand Utiliser `'use client'`

✅ **Utiliser `'use client'` UNIQUEMENT si** :
- Utilisation de hooks React (`useState`, `useEffect`, `useContext`, etc.)
- Gestion d'événements (`onClick`, `onChange`, etc.)
- Utilisation d'APIs browser (`window`, `document`, `localStorage`, etc.)
- Utilisation de librairies non SSR-safe

❌ **NE JAMAIS utiliser `'use client'` si** :
- Le composant ne fait que du rendu
- Le composant fetche des données
- Le composant n'a pas d'interactivité

#### Placement de `'use client'`

❌ **NE JAMAIS FAIRE** :
```typescript
// ❌ 'use client' au niveau root layout
'use client';
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

✅ **TOUJOURS FAIRE** :
```typescript
// ✅ Server Component au root
import { Providers } from './providers';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

// ✅ 'use client' au niveau LE PLUS BAS
// components/InteractiveButton.tsx
'use client';
import { useState } from 'react';

export function InteractiveButton() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Data Fetching

#### Server Components (Recommandé)

✅ **TOUJOURS FAIRE** :
```typescript
// app/products/page.tsx (Server Component)
export default async function ProductsPage() {
  // Fetch directement dans le Server Component
  const products = await fetch('https://api.example.com/products', {
    cache: 'no-store', // ou 'force-cache' pour cache
  }).then(res => res.json());

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

❌ **NE JAMAIS FAIRE** :
```typescript
// ❌ Fetch dans Client Component avec useEffect
'use client';
import { useEffect, useState } from 'react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('https://api.example.com/products')
      .then(res => res.json())
      .then(setProducts);
  }, []);

  return <div>...</div>;
}
```

### Server Actions

✅ **TOUJOURS FAIRE** :
```typescript
// app/actions/products.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function createProduct(formData: FormData) {
  const name = formData.get('name') as string;
  
  // Validation
  if (!name) {
    throw new Error('Name is required');
  }

  // Database operation
  const product = await db.product.create({ data: { name } });

  // Revalidate
  revalidatePath('/products');
  
  return product;
}

// app/products/page.tsx
import { createProduct } from './actions';

export default function ProductsPage() {
  return (
    <form action={createProduct}>
      <input name="name" />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Routes API

✅ **TOUJOURS FAIRE** :
```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api/response-builder';

export async function GET(request: NextRequest) {
  try {
    const products = await getProducts();
    return ApiResponseBuilder.success(products);
  } catch (error) {
    return ApiResponseBuilder.error('Failed to fetch products', 500);
  }
}
```

---

## 🚀 DÉPLOIEMENT VERCEL

### Comment Vercel Fonctionne

#### Architecture Vercel

1. **Build Process** :
   - Vercel détecte automatiquement Next.js
   - Exécute `buildCommand` défini dans `vercel.json`
   - Génère les Serverless Functions
   - Optimise les assets statiques

2. **Deployment** :
   - Chaque commit déclenche un build
   - Builds en parallèle pour preview et production
   - Edge Network pour distribution globale

3. **Runtime** :
   - Serverless Functions pour API routes
   - Edge Functions pour middleware
   - Static assets sur CDN

### Configuration Vercel (`vercel.json`)

#### Configuration Optimale

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "(pnpm prisma generate || echo 'Prisma skipped') && pnpm run build",
  "outputDirectory": ".next",
  "devCommand": "pnpm run dev",
  "regions": ["cdg1"],
  "crons": [
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * *"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

#### Points Critiques

✅ **TOUJOURS FAIRE** :
1. **Région** : Spécifier `regions: ["cdg1"]` pour l'Europe
2. **Build Command** : Inclure Prisma generate si nécessaire
3. **Headers de Sécurité** : Configurer dans `vercel.json`
4. **Crons** : Utiliser pour les tâches planifiées
5. **Variables d'Environnement** : Configurer dans Vercel Dashboard

❌ **NE JAMAIS FAIRE** :
1. **Ignore Build Errors** : Ne jamais mettre `ignoreBuildErrors: true` en production
2. **Skip Type Check** : Ne jamais mettre `skipLibCheck: true`
3. **Output Standalone** : Ne pas utiliser `output: 'standalone'` (Vercel gère automatiquement)
4. **Build Timeout** : Ne pas dépasser 45 minutes de build

### Variables d'Environnement Vercel

#### Configuration Requise

✅ **TOUJOURS Configurer** :
- `NEXT_PUBLIC_*` : Variables accessibles côté client
- `DATABASE_URL` : URL de la base de données
- `SUPABASE_*` : Clés Supabase
- `STRIPE_*` : Clés Stripe
- `OPENAI_API_KEY` : Clé OpenAI

#### Bonnes Pratiques

1. **Séparation Dev/Preview/Production** :
   - Utiliser des variables différentes par environnement
   - Ne jamais commiter les secrets

2. **Validation** :
   - Vérifier toutes les variables avant déploiement
   - Utiliser un script de validation

### Build et Optimisations

#### Configuration Next.js pour Vercel

```typescript
// next.config.mjs
const nextConfig = {
  // ❌ NE JAMAIS FAIRE en production
  // eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true },
  
  // ✅ TOUJOURS FAIRE
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
};
```

#### Webpack Optimizations

✅ **TOUJOURS FAIRE** :
```typescript
webpack: (config, { isServer, dev }) => {
  // Exclude server-only packages from client bundle
  if (!isServer) {
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
      // ... autres modules Node.js
    };
  }
  
  // Production optimizations
  if (!dev && !isServer) {
    config.optimization = {
      moduleIds: 'deterministic',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        // ... configuration optimale
      },
    };
  }
  
  return config;
}
```

### Monitoring et Debugging

#### Vercel Analytics

✅ **TOUJOURS Configurer** :
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

#### Logs et Debugging

1. **Vercel Dashboard** : Consulter les logs de build et runtime
2. **Sentry** : Intégrer pour le monitoring d'erreurs
3. **Vercel Speed Insights** : Monitorer les performances

---

## 📘 TYPESCRIPT ET TYPES

### Règles Strictes

#### Aucun `any` Autorisé

❌ **NE JAMAIS FAIRE** :
```typescript
function process(data: any) {
  return data.value;
}

const result: any = getData();
```

✅ **TOUJOURS FAIRE** :
```typescript
// Utiliser unknown avec type guard
function process(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String(data.value);
  }
  throw new Error('Invalid data');
}

// OU utiliser des types stricts
interface Data {
  value: string;
}

function process(data: Data): string {
  return data.value;
}
```

### Types Explicites

✅ **TOUJOURS FAIRE** :
```typescript
// Props avec interface
interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
  className?: string;
}

export function ProductCard({ product, onSelect, className }: ProductCardProps) {
  // ...
}

// Types API générés depuis Zod
import { z } from 'zod';

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().positive(),
});

type Product = z.infer<typeof ProductSchema>;
```

### Validation avec Zod

✅ **TOUJOURS FAIRE** :
```typescript
// Validation à l'exécution
import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  description: z.string().optional(),
});

// Server Action avec validation
'use server';

export async function createProduct(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    price: Number(formData.get('price')),
    description: formData.get('description'),
  };

  // Validation
  const validated = CreateProductSchema.parse(rawData);
  
  // Utiliser validated (type-safe)
  return await db.product.create({ data: validated });
}
```

---

## ⚡ PERFORMANCE ET OPTIMISATION

### Dynamic Imports

#### Librairies Lourdes

❌ **NE JAMAIS FAIRE** :
```typescript
// Import direct de librairie lourde
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { motion } from 'framer-motion';
```

✅ **TOUJOURS FAIRE** :
```typescript
// Dynamic import avec ssr: false pour librairies non SSR-safe
import dynamic from 'next/dynamic';

const ThreeCanvas = dynamic(
  () => import('@react-three/fiber').then(mod => ({ default: mod.Canvas })),
  { ssr: false, loading: () => <div>Loading 3D...</div> }
);

const LazyMotionDiv = dynamic(
  () => import('@/lib/performance/dynamic-motion').then(mod => ({ 
    default: mod.LazyMotionDiv 
  })),
  { ssr: false }
);
```

#### Composants Lourds

✅ **TOUJOURS FAIRE** :
```typescript
// Lazy load des composants non critiques
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

export default function Dashboard() {
  return (
    <div>
      <LightContent />
      <Suspense fallback={<ChartSkeleton />}>
        <HeavyChart />
      </Suspense>
    </div>
  );
}
```

### Bundle Size

#### Limites

- **Bundle initial** : < 200KB gzipped
- **Build time** : < 2 minutes
- **Time to Interactive** : < 3 secondes

#### Optimisations

✅ **TOUJOURS FAIRE** :
```typescript
// next.config.mjs
experimental: {
  optimizePackageImports: [
    '@nivo/line',
    '@nivo/bar',
    'framer-motion',
    'lodash',
    'date-fns',
  ],
}
```

### Images

✅ **TOUJOURS FAIRE** :
```typescript
// Utiliser next/image
import Image from 'next/image';

<Image
  src="/product.jpg"
  alt="Product"
  width={500}
  height={500}
  priority // Pour images above-the-fold
  placeholder="blur" // Si possible
/>
```

❌ **NE JAMAIS FAIRE** :
```typescript
// ❌ Utiliser <img> directement
<img src="/product.jpg" alt="Product" />
```

### Caching

✅ **TOUJOURS FAIRE** :
```typescript
// Server Component avec cache
export default async function ProductsPage() {
  const products = await fetch('https://api.example.com/products', {
    next: { revalidate: 3600 }, // Cache 1 heure
  }).then(res => res.json());

  return <ProductList products={products} />;
}

// React Query pour Client Components
const { data } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  staleTime: 3600000, // 1 heure
});
```

---

## 🔐 SÉCURITÉ

### Headers de Sécurité

✅ **TOUJOURS Configurer** :
```typescript
// next.config.mjs
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'X-XSS-Protection',
          value: '1; mode=block',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ];
}
```

### Validation des Inputs

✅ **TOUJOURS FAIRE** :
```typescript
// Validation côté serveur (obligatoire)
'use server';

import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
});

export async function createProduct(formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    price: Number(formData.get('price')),
  };

  // Validation obligatoire
  const validated = CreateProductSchema.parse(rawData);
  
  // Utiliser validated (sécurisé)
  return await db.product.create({ data: validated });
}
```

### Authentification

✅ **TOUJOURS FAIRE** :
```typescript
// Vérifier l'authentification dans Server Components
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

export default async function DashboardPage() {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  return <DashboardContent user={session.user} />;
}
```

---

## 🗂️ STATE MANAGEMENT

### Règles de Sélection

1. **State Local** : `useState` par défaut
2. **State Global Partagé** : Zustand
3. **Server State** : React Query (TanStack Query)
4. **Form State** : React Hook Form

### React Query (Recommandé)

✅ **TOUJOURS FAIRE** :
```typescript
// Hooks pour server state
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    staleTime: 3600000, // 1 heure
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      // Invalidate et refetch
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

### Zustand (State Global)

✅ **TOUJOURS FAIRE** :
```typescript
// Store Zustand
import { create } from 'zustand';

interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
}));
```

❌ **NE JAMAIS FAIRE** :
```typescript
// ❌ Utiliser Context pour state complexe
// ❌ Utiliser Redux pour state simple
// ❌ Mélanger SWR et React Query
```

---

## ⚠️ GESTION DES ERREURS

### Error Boundaries

✅ **TOUJOURS FAIRE** :
```typescript
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Envoyer à Sentry
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

### Try-Catch dans Server Actions

✅ **TOUJOURS FAIRE** :
```typescript
'use server';

export async function createProduct(formData: FormData) {
  try {
    const validated = CreateProductSchema.parse({
      name: formData.get('name'),
      price: Number(formData.get('price')),
    });

    const product = await db.product.create({ data: validated });
    return { success: true, data: product };
  } catch (error) {
    console.error('Error creating product:', error);
    
    if (error instanceof z.ZodError) {
      return { 
        success: false, 
        error: 'Validation failed',
        details: error.errors,
      };
    }
    
    return { 
      success: false, 
      error: 'Failed to create product' 
    };
  }
}
```

---

## 🧪 TESTS ET QUALITÉ

### Tests Unitaires

✅ **TOUJOURS FAIRE** :
```typescript
// __tests__/hooks/useProducts.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProducts } from '@/hooks/useProducts';

describe('useProducts', () => {
  it('should fetch products', async () => {
    const queryClient = new QueryClient();
    
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useProducts(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
```

### Tests E2E

✅ **TOUJOURS FAIRE** :
```typescript
// tests/e2e/products.spec.ts
import { test, expect } from '@playwright/test';

test('should create a product', async ({ page }) => {
  await page.goto('/dashboard/products');
  await page.click('text=New Product');
  await page.fill('input[name="name"]', 'Test Product');
  await page.fill('input[name="price"]', '99.99');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('text=Test Product')).toBeVisible();
});
```

---

## 🚫 PATTERNS INTERDITS

### Liste Complète des Anti-Patterns

1. ❌ **Ne jamais mettre `'use client'` au niveau root layout** (sauf Providers)
2. ❌ **Ne jamais importer de librairie lourde dans root layout**
3. ❌ **Ne jamais utiliser `any` pour résoudre des erreurs TypeScript**
4. ❌ **Ne jamais faire de props drilling > 3 niveaux** (utiliser Context ou Server Component)
5. ❌ **Ne jamais fetcher des données dans Client Components avec `useEffect`** (utiliser Server Components ou Server Actions)
6. ❌ **Ne jamais utiliser d'API browser sans protection `typeof window`**
7. ❌ **Ne jamais créer de composant > 300 lignes** sans le découper
8. ❌ **Ne jamais créer de dépendance circulaire**
9. ❌ **Ne jamais utiliser `ignoreBuildErrors: true`** en production
10. ❌ **Ne jamais utiliser `skipLibCheck: true`** pour masquer des erreurs
11. ❌ **Ne jamais utiliser `<img>` au lieu de `<Image>`** de Next.js
12. ❌ **Ne jamais utiliser `motion.*` directement** sans LazyMotionDiv
13. ❌ **Ne jamais fetcher dans `useEffect`** (utiliser Server Components)
14. ❌ **Ne jamais utiliser `localStorage` sans vérifier `typeof window`**
15. ❌ **Ne jamais créer de page > 500 lignes** sans découpage

---

## ✅ CHECKLIST DE DÉVELOPPEMENT

### Avant de Commencer

- [ ] Vérifier si le composant doit être Server ou Client Component
- [ ] Si Client Component, vérifier si `'use client'` peut être placé plus bas
- [ ] Vérifier si des librairies lourdes sont utilisées → dynamic import
- [ ] Vérifier si des APIs browser sont utilisées → protection `typeof window`
- [ ] Vérifier si le composant dépasse 300 lignes → découper
- [ ] Vérifier si les types sont explicites → pas de `any`
- [ ] Vérifier si data fetching nécessaire → Server Component ou Server Action
- [ ] Vérifier si interaction utilisateur → Client Component minimal

### Avant de Commiter

- [ ] `pnpm build` passe sans erreur
- [ ] `npx tsc --noEmit` passe sans erreur
- [ ] `pnpm lint` passe sans erreur
- [ ] Tests passent (`pnpm test`)
- [ ] Pas de `console.log` en production (sauf `console.error` et `console.warn`)
- [ ] Variables d'environnement documentées
- [ ] Types explicites (pas de `any`)

### Avant de Déployer

- [ ] Build local réussi : `pnpm build`
- [ ] Tests E2E passent
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Headers de sécurité vérifiés
- [ ] Performance vérifiée (Lighthouse)
- [ ] SEO vérifié (metadata, sitemap, robots.txt)
- [ ] Monitoring configuré (Sentry, Vercel Analytics)

---

## 📚 RESSOURCES ET RÉFÉRENCES

### Documentation Officielle

- [Next.js App Router](https://nextjs.org/docs/app)
- [Vercel Deployment](https://vercel.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)

### Outils de Développement

- **Type Checking** : `npx tsc --noEmit`
- **Linting** : `pnpm lint`
- **Build** : `pnpm build`
- **Bundle Analysis** : `ANALYZE=true pnpm build`

### Monitoring

- **Vercel Analytics** : Dashboard Vercel
- **Sentry** : Error tracking
- **Lighthouse** : Performance audit
- **Web Vitals** : Core Web Vitals

---

## 🎓 LEÇONS APPRISES

### Erreurs Coûteuses en Temps

1. **2838 erreurs TypeScript** : 1 semaine de correction
   - **Leçon** : Vérifier TypeScript à chaque commit
   - **Solution** : CI/CD avec `npx tsc --noEmit`

2. **Pages > 5000 lignes** : 2 semaines de refactoring
   - **Leçon** : Découper dès le début
   - **Solution** : Limite stricte de 300 lignes par composant

3. **Erreurs JSX (balises non fermées)** : 1 semaine de correction
   - **Leçon** : Utiliser un formatter strict
   - **Solution** : Prettier + validation JSX en temps réel

4. **Build Vercel timeout** : Plusieurs jours de debug
   - **Leçon** : Optimiser le build dès le début
   - **Solution** : Dynamic imports, code splitting

5. **Erreurs de déploiement** : Plusieurs jours
   - **Leçon** : Tester le build local avant de pusher
   - **Solution** : `pnpm build` dans CI/CD

### Bonnes Pratiques Validées

1. **Server Components par défaut** : Performance améliorée de 40%
2. **Dynamic imports** : Bundle size réduit de 60%
3. **React Query** : Cache et sync automatiques
4. **Zod validation** : Zéro erreur de validation en production
5. **Error Boundaries** : Meilleure gestion des erreurs

---

**Dernière mise à jour** : 2024  
**Version** : 2.0.0  
**Maintenu par** : Équipe Luneo


