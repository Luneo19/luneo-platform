# 🏗️ ENGINEERING GUIDELINES - LUNEO PLATFORM

**Version:** 1.0.0  
**Dernière mise à jour:** 2025-01-XX  
**Auteur:** Engineering Team  
**Status:** ⚠️ **RÈGLES OBLIGATOIRES - NON NÉGOCIABLES**

---

## 📋 TABLE DES MATIÈRES

1. [Philosophie Build-First](#philosophie-build-first)
2. [Historique des Erreurs](#historique-des-erreurs)
3. [Taxonomie des Erreurs](#taxonomie-des-erreurs)
4. [Règles Fondamentales](#règles-fondamentales)
5. [Anti-Patterns Documentés](#anti-patterns-documentés)
6. [Patterns Validés](#patterns-validés)
7. [Exemples Concrets](#exemples-concrets)
8. [Checklist Avant Ajout de Fonctionnalité](#checklist-avant-ajout-de-fonctionnalité)
9. [Checklist Avant Merge / Build](#checklist-avant-merge--build)
10. [Références Techniques](#références-techniques)

---

## 🎯 PHILOSOPHIE BUILD-FIRST

### Principe Fondamental

**TOUT code doit être pensé et écrit pour passer le build en production, dès la première ligne.**

### Règles d'Or

1. **Production d'abord** : Le code doit fonctionner en production Vercel avant de fonctionner en local
2. **Build-first mindset** : Si le build échoue, le code est incorrect, même s'il fonctionne en dev
3. **Zéro tolérance** : Aucune erreur TypeScript, ESLint, ou Webpack n'est acceptable en production
4. **SSR par défaut** : Tous les composants sont Server Components sauf si explicitement marqués `'use client'`
5. **Vérification continue** : Chaque commit doit passer `pnpm build` sans erreur

### Pourquoi Build-First ?

- **Erreurs détectées tôt** : Les erreurs de build sont détectées avant le déploiement
- **Réduction de la dette technique** : Évite l'accumulation de workarounds et de hacks
- **Confiance dans le déploiement** : Un build qui passe = une garantie que le code fonctionne
- **Performance maintenue** : Les optimisations Webpack sont préservées
- **Scalabilité** : Le code reste maintenable à long terme

---

## 📊 HISTORIQUE DES ERREURS

### Synthèse des Erreurs Passées

Ce projet a connu plusieurs catégories d'erreurs critiques qui ont impacté le développement et le déploiement :

1. **Erreurs SSR/Client-Server** (120+ occurrences)
   - Utilisation d'APIs browser (`window`, `document`, `localStorage`) dans Server Components
   - Composants marqués `'use client'` alors qu'ils devraient être Server Components
   - Hydration mismatches causés par des différences client/serveur

2. **Erreurs Webpack** (50+ occurrences)
   - Imports de librairies non SSR-safe sans protection
   - Bundles trop volumineux causant des timeouts de build
   - Conflits de résolution de modules dans le monorepo
   - Erreurs de tree-shaking avec certaines librairies

3. **Erreurs TypeScript** (200+ occurrences)
   - Types incorrects causant des erreurs de compilation
   - Utilisation de `any` masquant des erreurs
   - Types manquants pour les props de composants
   - Problèmes d'imports circulaires

4. **Erreurs de Build Vercel** (30+ occurrences)
   - Timeouts de build (> 5 minutes)
   - Erreurs de mémoire pendant le build
   - Problèmes de résolution de dépendances
   - Erreurs Prisma lors du build

5. **Erreurs d'Architecture** (40+ occurrences)
   - Composants trop volumineux (> 1000 lignes)
   - Dépendances circulaires entre modules
   - Couplage fort entre composants
   - Violation du principe de responsabilité unique

6. **Erreurs d'Imports** (80+ occurrences)
   - Imports incorrects de librairies externes
   - Imports circulaires
   - Imports de modules non exportés
   - Problèmes de résolution de paths

7. **Erreurs de Librairies Frontend** (60+ occurrences)
   - Utilisation de librairies non SSR-safe sans protection
   - Versions incompatibles entre dépendances
   - Problèmes de compatibilité avec Next.js 15
   - Memory leaks avec certaines librairies

8. **Erreurs de Croissance du Codebase** (20+ occurrences)
   - Fichiers trop volumineux (> 2000 lignes)
   - Builds de plus en plus lents
   - Problèmes de performance à l'exécution
   - Difficulté de maintenance

### Leçons Apprises

- **Configuration actuelle masque des problèmes** : `ignoreBuildErrors: true` et `skipLibCheck: true` masquent des erreurs réelles
- **Les workarounds deviennent des problèmes** : Les solutions temporaires deviennent permanentes
- **La dette technique s'accumule rapidement** : Sans discipline, le code devient difficile à maintenir
- **Les erreurs se multiplient** : Une erreur non corrigée en génère d'autres

---

## 🗂️ TAXONOMIE DES ERREURS

### 1. ARCHITECTURE

#### Erreur A1 : Composants Trop Volumineux

**Description** : Fichiers de composants dépassant 500 lignes.

**Pourquoi elle apparaît** :
- Développement rapide sans refactoring
- Ajout progressif de fonctionnalités sans découpage
- Copier-coller de code existant

**Pourquoi elle est dangereuse** :
- Build plus lent (Webpack doit parser plus de code)
- Difficile à tester
- Réutilisation impossible
- Performance dégradée (tout le composant est chargé même si une seule partie est utilisée)
- Maintenabilité réduite (chercher du code devient difficile)

**Règle** : ✅ **Tous les composants doivent faire moins de 300 lignes. Au-delà, découper en sous-composants ou hooks.**

#### Erreur A2 : Dépendances Circulaires

**Description** : Module A importe B, B importe C, C importe A.

**Pourquoi elle apparaît** :
- Structure de modules non planifiée
- Imports réciproques pour éviter la duplication
- Manque de barrières architecturales claires

**Pourquoi elle est dangereuse** :
- Erreurs de build imprévisibles
- Tree-shaking impossible
- Bundle size augmenté inutilement
- Comportement indéterminé à l'exécution
- Difficile à déboguer

**Règle** : ✅ **Aucune dépendance circulaire n'est autorisée. Utiliser des interfaces/types partagés dans `packages/types`.**

#### Erreur A3 : Violation du Principe de Responsabilité Unique

**Description** : Un composant/module fait plusieurs choses non liées.

**Pourquoi elle apparaît** :
- Développement rapide sans design
- "Ça marche" est prioritaire sur "c'est bien fait"
- Manque de refactoring régulier

**Pourquoi elle est dangereuse** :
- Tests difficiles (beaucoup de cas à tester)
- Réutilisation impossible
- Modifications risquées (changer une partie casse l'autre)
- Performance dégradée (chargement inutile)

**Règle** : ✅ **Chaque composant/module a UNE seule responsabilité. Utiliser la composition plutôt que l'héritage ou l'accumulation.**

---

### 2. APP ROUTER

#### Erreur AR1 : Confusion Server/Client Components

**Description** : Utilisation incorrecte de Server Components et Client Components.

**Pourquoi elle apparaît** :
- Manque de compréhension du modèle App Router
- Migration depuis Pages Router
- Copier-coller de code sans comprendre

**Pourquoi elle est dangereuse** :
- Erreurs SSR (Server Components ne peuvent pas utiliser hooks/browser APIs)
- Performance dégradée (Client Components chargés inutilement)
- Bundle size augmenté
- Hydration errors

**Règles** :
- ✅ **Par défaut, TOUS les composants sont Server Components**
- ✅ **Utiliser `'use client'` UNIQUEMENT si nécessaire (hooks, event handlers, browser APIs)**
- ✅ **Marquer `'use client'` au niveau LE PLUS BAS possible dans l'arbre**
- ✅ **Les pages (route.tsx) sont TOUJOURS Server Components sauf cas exceptionnel**

#### Erreur AR2 : Data Fetching dans Client Components

**Description** : Appels API directement dans des Client Components au lieu d'utiliser Server Components ou Server Actions.

**Pourquoi elle apparaît** :
- Pattern familier depuis Pages Router
- Manque de compréhension des Server Components
- Besoin immédiat de data côté client

**Pourquoi elle est dangereuse** :
- Perte des bénéfices SSR (SEO, performance)
- Exposition d'API keys côté client
- Requêtes supplémentaires inutiles
- Latence augmentée

**Règle** : ✅ **Fetcher les données dans Server Components ou Server Actions. Passer les données en props aux Client Components.**

#### Erreur AR3 : Routes API Mal Structurées

**Description** : Routes API qui ne suivent pas les conventions Next.js ou qui mélangent logique métier et présentation.

**Pourquoi elle apparaît** :
- Patterns hérités de Pages Router
- Manque de structure claire
- Rapidité de développement

**Pourquoi elle est dangereuse** :
- Code dupliqué
- Tests difficiles
- Maintenance complexe
- Performance dégradée

**Règle** : ✅ **Les routes API doivent utiliser `ApiResponseBuilder` pour la structure de réponse. La logique métier doit être dans `lib/` ou `services/`.**

---

### 3. SERVER COMPONENTS

#### Erreur SC1 : Utilisation d'APIs Browser dans Server Components

**Description** : Utilisation de `window`, `document`, `localStorage`, etc. dans des Server Components.

**Pourquoi elle apparaît** :
- Code copié depuis des Client Components
- Manque de vérification avant commit
- Utilisation de librairies qui utilisent ces APIs

**Pourquoi elle est dangereuse** :
- Build échoue en production
- Erreurs runtime en SSR
- Comportement indéterminé

**Règle** : ✅ **Aucune API browser dans Server Components. Utiliser des Client Components pour toute interaction browser.**

#### Erreur SC2 : Hooks React dans Server Components

**Description** : Utilisation de `useState`, `useEffect`, etc. dans des Server Components.

**Pourquoi elle apparaît** :
- Pattern familier depuis React classique
- Oubli du `'use client'`
- Confusion entre Server et Client Components

**Pourquoi elle est dangereuse** :
- Build échoue
- Erreur runtime claire mais fréquente

**Règle** : ✅ **Aucun hook React dans Server Components. Utiliser `'use client'` si des hooks sont nécessaires.**

#### Erreur SC3 : Async/Await Mal Utilisé

**Description** : Server Components async utilisés incorrectement ou pas du tout.

**Pourquoi elle apparaît** :
- Pattern nouveau (Next.js 13+)
- Confusion avec Client Components
- Oubli du `async`

**Pourquoi elle est dangereuse** :
- Performance dégradée (data fetching bloquant)
- UX dégradée (pas de streaming)
- Erreurs de type TypeScript

**Règle** : ✅ **Les Server Components qui fetchent des données doivent être `async` et utiliser `await` pour les appels async.**

---

### 4. CLIENT COMPONENTS

#### Erreur CC1 : `'use client'` au Mauvais Niveau

**Description** : Directive `'use client'` placée trop haut dans l'arbre des composants.

**Pourquoi elle apparaît** :
- Manque de compréhension du boundary
- Facilité (mettre en haut évite les problèmes)
- Pattern hérité

**Pourquoi elle est dangereuse** :
- Bundle size augmenté inutilement
- Performance dégradée (trop de code côté client)
- Perte des bénéfices SSR

**Règle** : ✅ **`'use client'` doit être au niveau LE PLUS BAS possible. Créer des composants wrapper Client Components minimes.**

#### Erreur CC2 : Imports de Librairies Lourdes sans Dynamic Import

**Description** : Import direct de librairies lourdes (Three.js, Framer Motion, etc.) dans Client Components.

**Pourquoi elle apparaît** :
- Facilité de développement
- Manque de connaissance des dynamic imports
- Performance non prioritaire

**Pourquoi elle est dangereuse** :
- Bundle initial trop lourd
- Time to Interactive dégradé
- Expérience utilisateur dégradée
- Build plus lent

**Règle** : ✅ **Les librairies > 100KB doivent être importées dynamiquement avec `dynamic()` et `ssr: false` si non SSR-safe.**

#### Erreur CC3 : State Management Mal Utilisé

**Description** : Utilisation incorrecte de Zustand, React Query, ou state local.

**Pourquoi elle apparaît** :
- Confusion entre les besoins (state local vs global)
- Over-engineering (state global partout)
- Under-engineering (props drilling excessif)

**Pourquoi elle est dangereuse** :
- Performance dégradée (re-renders inutiles)
- Complexité inutile
- Tests difficiles
- Maintenance complexe

**Règle** : ✅ **Utiliser state local (`useState`) par défaut. Zustand pour state global partagé. React Query pour server state.**

---

### 5. LIBRAIRIES EXTERNES

#### Erreur LE1 : Librairies Non SSR-Safe Importées Directement

**Description** : Import direct de librairies qui utilisent des APIs browser sans protection.

**Pourquoi elle apparaît** :
- Manque de documentation sur la compatibilité SSR
- Tests uniquement côté client
- Manque de vérification

**Pourquoi elle est dangereuse** :
- Build échoue en production
- Erreurs runtime en SSR
- Comportement indéterminé

**Règle** : ✅ **Toute librairie utilisant `window`, `document`, ou autres APIs browser doit être importée dynamiquement avec `ssr: false`.**

**Librairies connues non SSR-safe** :
- `three`, `@react-three/fiber`, `@react-three/drei`
- `konva`, `react-konva`
- `framer-motion` (partiellement, nécessite `'use client'`)
- `@mediapipe/*`
- `html2canvas`
- `jspdf`
- `socket.io-client`

#### Erreur LE2 : Versions Incompatibles

**Description** : Utilisation de versions incompatibles de librairies.

**Pourquoi elle apparaît** :
- Mises à jour non testées
- Résolution de conflits de dépendances
- Manque de contraintes de version

**Pourquoi elle est dangereuse** :
- Erreurs de build
- Comportement indéterminé
- Bugs runtime
- Sécurité (vulnérabilités)

**Règle** : ✅ **Toutes les dépendances doivent avoir des versions exactes ou des ranges stricts. Tester après chaque mise à jour.**

#### Erreur LE3 : Imports Non Optimisés

**Description** : Import de toute une librairie alors qu'un seul module est nécessaire.

**Pourquoi elle apparaît** :
- Facilité (`import * from 'library'`)
- Manque de connaissance des exports nommés
- Build tools qui optimisent (mais pas toujours)

**Pourquoi elle est dangereuse** :
- Bundle size augmenté
- Build plus lent
- Performance dégradée

**Règle** : ✅ **Toujours importer de manière spécifique : `import { specific } from 'library'` plutôt que `import *`.**

---

### 6. TYPES

#### Erreur T1 : Utilisation de `any`

**Description** : Utilisation du type `any` au lieu de types spécifiques.

**Pourquoi elle apparaît** :
- Rapidité de développement
- Types complexes à définir
- Workaround pour erreurs TypeScript

**Pourquoi elle est dangereuse** :
- Perte des bénéfices TypeScript
- Erreurs détectées trop tard
- Refactoring difficile
- Bugs runtime

**Règle** : ✅ **Aucun `any` autorisé. Utiliser `unknown` si le type est vraiment inconnu, puis faire un type guard.**

#### Erreur T2 : Types Manquants pour les Props

**Description** : Composants sans types pour les props, ou utilisation de types génériques incorrects.

**Pourquoi elle apparaît** :
- Développement rapide
- Types hérités incorrects
- Manque de discipline

**Pourquoi elle est dangereuse** :
- Erreurs à l'utilisation
- Pas d'autocomplétion
- Refactoring risqué

**Règle** : ✅ **Tous les composants doivent avoir des types explicites pour les props. Utiliser `interface` pour les props complexes.**

#### Erreur T3 : Types Incorrects pour les APIs

**Description** : Types qui ne correspondent pas à la réalité des données API.

**Pourquoi elle apparaît** :
- Types générés incorrectement
- APIs qui changent
- Types manuels non mis à jour

**Pourquoi elle est dangereuse** :
- Erreurs runtime
- Bugs difficiles à détecter
- Maintenance difficile

**Règle** : ✅ **Les types API doivent être générés depuis les schémas (Zod) ou validés à l'exécution.**

---

### 7. BUILD & WEBPACK

#### Erreur BW1 : Configuration Webpack Complexe

**Description** : Configuration Webpack trop complexe ou non nécessaire.

**Pourquoi elle apparaît** :
- Workarounds accumulés
- Optimisations prématurées
- Manque de compréhension

**Pourquoi elle est dangereuse** :
- Build fragile
- Debugging difficile
- Maintenance complexe
- Updates Next.js difficiles

**Règle** : ✅ **La configuration Webpack doit être minimale. Utiliser les optimisations Next.js par défaut. Modifier seulement si nécessaire et documenter pourquoi.**

#### Erreur BW2 : Bundles Trop Volumineux

**Description** : Bundles JavaScript > 500KB.

**Pourquoi elle apparaît** :
- Imports non optimisés
- Code mort non éliminé
- Librairies lourdes non lazy-loadées

**Pourquoi elle est dangereuse** :
- Performance dégradée
- Time to Interactive élevé
- Expérience utilisateur dégradée
- Coûts de bande passante

**Règle** : ✅ **Le bundle initial doit être < 200KB gzipped. Utiliser dynamic imports pour le code non critique.**

#### Erreur BW3 : Build Time Trop Long

**Description** : Build qui prend > 3 minutes.

**Pourquoi elle apparaît** :
- Code non optimisé
- Trop de dépendances
- Configuration Webpack complexe
- Code mort

**Pourquoi elle est dangereuse** :
- Déploiements lents
- Feedback lent pour les développeurs
- CI/CD bloqué
- Coûts infrastructure

**Règle** : ✅ **Le build doit prendre < 2 minutes. Analyser avec `ANALYZE=true next build` régulièrement.**

---

### 8. VERCEL & PRODUCTION

#### Erreur VP1 : Variables d'Environnement Manquantes

**Description** : Code qui utilise des variables d'environnement non définies en production.

**Pourquoi elle apparaît** :
- Développement local avec `.env.local`
- Oubli de configurer Vercel
- Variables mal nommées

**Pourquoi elle est dangereuse** :
- Erreurs runtime en production
- Fonctionnalités cassées
- Expérience utilisateur dégradée

**Règle** : ✅ **Toutes les variables d'environnement doivent être documentées et vérifiées avant déploiement.**

#### Erreur VP2 : Erreurs Masquées par Configuration

**Description** : `ignoreBuildErrors: true` ou `skipLibCheck: true` masquant des erreurs réelles.

**Pourquoi elle apparaît** :
- Workaround pour erreurs difficiles à résoudre
- Rapidité de développement
- Manque de temps pour corriger

**Pourquoi elle est dangereuse** :
- Erreurs en production
- Bugs difficiles à détecter
- Dette technique accumulée
- Refactoring impossible

**Règle** : ✅ **`ignoreBuildErrors` et `skipLibCheck` doivent être `false` en production. Corriger les erreurs plutôt que les masquer.**

#### Erreur VP3 : Timeouts de Build

**Description** : Build qui timeout (> 5 minutes sur Vercel).

**Pourquoi elle apparaît** :
- Code trop volumineux
- Build non optimisé
- Dépendances lourdes
- Configuration incorrecte

**Pourquoi elle est dangereuse** :
- Déploiements impossibles
- CI/CD bloqué
- Développement ralenti

**Règle** : ✅ **Le build ne doit jamais timeout. Optimiser le code et la configuration si nécessaire.**

---

## ✅ RÈGLES FONDAMENTALES

### Règle R1 : Server Components par Défaut

```typescript
// ✅ BON : Server Component par défaut
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await fetchProduct(params.id);
  return <ProductDetails product={product} />;
}

// ❌ MAUVAIS : Client Component inutile
'use client';
export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState(null);
  useEffect(() => {
    fetchProduct(params.id).then(setProduct);
  }, [params.id]);
  return product ? <ProductDetails product={product} /> : <Loading />;
}
```

### Règle R2 : Dynamic Imports pour Librairies Lourdes

```typescript
// ✅ BON : Dynamic import avec ssr: false
const ThreeViewer = dynamic(
  () => import('@/components/ThreeViewer'),
  { ssr: false, loading: () => <LoadingSpinner /> }
);

// ❌ MAUVAIS : Import direct
import { ThreeViewer } from '@/components/ThreeViewer';
```

### Règle R3 : Protection Browser APIs

```typescript
// ✅ BON : Vérification typeof window
function useLocalStorage(key: string) {
  const [value, setValue] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setValue(window.localStorage.getItem(key));
  }, [key]);
  
  return [value, setValue];
}

// ❌ MAUVAIS : Utilisation directe
function useLocalStorage(key: string) {
  const value = window.localStorage.getItem(key); // ❌ Erreur SSR
  return [value, setValue];
}
```

### Règle R4 : Types Explicites

```typescript
// ✅ BON : Types explicites
interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
  };
  onSelect?: (id: string) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  // ...
}

// ❌ MAUVAIS : Types implicites ou any
export function ProductCard({ product, onSelect }: any) { // ❌
  // ...
}
```

### Règle R5 : Composants < 300 Lignes

```typescript
// ✅ BON : Composant découpé
// ProductPage.tsx (100 lignes)
export default function ProductPage({ product }: Props) {
  return (
    <div>
      <ProductHeader product={product} />
      <ProductDetails product={product} />
      <ProductActions product={product} />
    </div>
  );
}

// ❌ MAUVAIS : Composant monolithique
// ProductPage.tsx (800 lignes) - ❌
export default function ProductPage({ product }: Props) {
  // ... 800 lignes de code ...
}
```

### Règle R6 : Data Fetching dans Server Components

```typescript
// ✅ BON : Data fetching dans Server Component
export default async function ProductsPage() {
  const products = await getProducts(); // Server-side
  return <ProductsList products={products} />;
}

// ❌ MAUVAIS : Data fetching dans Client Component
'use client';
export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);
  return <ProductsList products={products} />;
}
```

---

## ❌ ANTI-PATTERNS DOCUMENTÉS

### Anti-Pattern AP1 : Client Component Wrapper Inutile

```typescript
// ❌ MAUVAIS : 'use client' trop haut
'use client'; // ❌ Toute la page est client-side

export default function Page() {
  return (
    <div>
      <ServerComponent /> {/* ❌ Ne peut pas être Server Component */}
      <ClientComponent />
    </div>
  );
}

// ✅ BON : Client Component minimal
// Page.tsx (Server Component)
export default function Page() {
  return (
    <div>
      <ServerComponent />
      <ClientWrapper /> {/* ✅ Wrapper minimal */}
    </div>
  );
}

// ClientWrapper.tsx
'use client';
export function ClientWrapper() {
  return <ClientComponent />;
}
```

### Anti-Pattern AP2 : Import de Librairie Lourde dans Root Layout

```typescript
// ❌ MAUVAIS : Import dans layout
import { HeavyLibrary } from '@/lib/heavy-library'; // ❌ 500KB

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <HeavyLibrary /> {/* ❌ Chargé sur toutes les pages */}
      </body>
    </html>
  );
}

// ✅ BON : Dynamic import dans composant spécifique
const HeavyLibrary = dynamic(() => import('@/components/HeavyLibrary'), {
  ssr: false
});

export default function SpecificPage() {
  return <HeavyLibrary />; // ✅ Chargé uniquement sur cette page
}
```

### Anti-Pattern AP3 : Utilisation de `any` pour Résoudre des Erreurs TypeScript

```typescript
// ❌ MAUVAIS : Utilisation de any
function processData(data: any) { // ❌
  return data.map(item => item.value);
}

// ✅ BON : Types explicites
interface DataItem {
  value: string;
}

function processData(data: DataItem[]) {
  return data.map(item => item.value);
}
```

### Anti-Pattern AP4 : Props Drilling Excessif

```typescript
// ❌ MAUVAIS : Props drilling
function Page({ user, theme, locale, currency }) {
  return <Layout user={user} theme={theme} locale={locale} currency={currency}>
    <Header user={user} theme={theme} locale={locale} />
    <Content user={user} currency={currency} />
  </Layout>;
}

// ✅ BON : Context ou Server Component
// Page.tsx
export default function Page() {
  const user = await getCurrentUser();
  return (
    <UserProvider user={user}>
      <Layout>
        <Header />
        <Content />
      </Layout>
    </UserProvider>
  );
}
```

---

## ✅ PATTERNS VALIDÉS

### Pattern P1 : Server Component + Client Component Minimal

```typescript
// Page.tsx (Server Component)
export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  return <ProductView product={product} />;
}

// ProductView.tsx (Server Component)
export function ProductView({ product }: { product: Product }) {
  return (
    <div>
      <ProductHeader product={product} />
      <ProductActionsWrapper product={product} />
    </div>
  );
}

// ProductActionsWrapper.tsx (Client Component minimal)
'use client';
export function ProductActionsWrapper({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  return (
    <div>
      <QuantitySelector value={quantity} onChange={setQuantity} />
      <AddToCartButton product={product} quantity={quantity} />
    </div>
  );
}
```

### Pattern P2 : Dynamic Import avec Loading State

```typescript
// HeavyComponent.tsx (Client Component)
'use client';
import dynamic from 'next/dynamic';

const ThreeViewer = dynamic(
  () => import('@/components/ThreeViewer').then(mod => ({ default: mod.ThreeViewer })),
  {
    ssr: false,
    loading: () => <ThreeViewerSkeleton />
  }
);

export function Product3DView({ productId }: { productId: string }) {
  return <ThreeViewer productId={productId} />;
}
```

### Pattern P3 : Hook pour Browser APIs

```typescript
// hooks/useLocalStorage.ts
'use client';
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (isClient) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### Pattern P4 : Server Actions pour Mutations

```typescript
// app/actions/products.ts
'use server';

import { revalidatePath } from 'next/cache';

export async function updateProduct(id: string, data: UpdateProductData) {
  // Validation
  const validated = updateProductSchema.parse(data);
  
  // Database update
  await db.product.update({ where: { id }, data: validated });
  
  // Revalidation
  revalidatePath(`/products/${id}`);
  
  return { success: true };
}

// app/products/[id]/page.tsx
import { updateProduct } from '@/app/actions/products';

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  return <ProductForm product={product} updateAction={updateProduct} />;
}

// components/ProductForm.tsx
'use client';
export function ProductForm({ product, updateAction }) {
  async function handleSubmit(formData: FormData) {
    await updateAction(product.id, Object.fromEntries(formData));
  }
  
  return <form action={handleSubmit}>...</form>;
}
```

### Pattern P5 : Error Boundaries

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// app/products/[id]/error.tsx (Error boundary spécifique)
'use client';

export default function ProductError({ error, reset }: ErrorProps) {
  return (
    <div>
      <h2>Failed to load product</h2>
      <button onClick={reset}>Retry</button>
    </div>
  );
}
```

---

## 📝 EXEMPLES CONCRETS

### Exemple E1 : Page avec Data Fetching

```typescript
// ✅ BON : Server Component avec data fetching
// app/products/[id]/page.tsx
import { getProduct } from '@/lib/products';
import { ProductDetails } from '@/components/ProductDetails';
import { ProductActions } from '@/components/ProductActions';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  
  if (!product) {
    notFound();
  }

  return (
    <div>
      <ProductDetails product={product} />
      <ProductActions product={product} />
    </div>
  );
}

// ❌ MAUVAIS : Client Component avec data fetching
'use client';
import { useEffect, useState } from 'react';

export default function ProductPage({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState(null);
  
  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(r => r.json())
      .then(setProduct);
  }, [params.id]);
  
  if (!product) return <Loading />;
  
  return <ProductDetails product={product} />;
}
```

### Exemple E2 : Composant avec Interaction Client

```typescript
// ✅ BON : Client Component minimal
// components/AddToCartButton.tsx
'use client';

import { useState, useTransition } from 'react';
import { addToCart } from '@/app/actions/cart';

interface AddToCartButtonProps {
  productId: string;
}

export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();
  
  function handleClick() {
    startTransition(async () => {
      await addToCart(productId);
    });
  }
  
  return (
    <button onClick={handleClick} disabled={isPending}>
      {isPending ? 'Adding...' : 'Add to Cart'}
    </button>
  );
}

// ❌ MAUVAIS : Server Component avec interaction
export function AddToCartButton({ productId }: AddToCartButtonProps) {
  // ❌ Ne peut pas utiliser onClick dans Server Component
  return <button onClick={() => {}}>Add to Cart</button>;
}
```

### Exemple E3 : Librairie Lourde (Three.js)

```typescript
// ✅ BON : Dynamic import avec ssr: false
// components/Product3DViewer.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const ThreeViewer = dynamic(
  () => import('./ThreeViewer').then(mod => ({ default: mod.ThreeViewer })),
  {
    ssr: false,
    loading: () => <ThreeViewerSkeleton />
  }
);

export function Product3DViewer({ productId }: { productId: string }) {
  return (
    <Suspense fallback={<ThreeViewerSkeleton />}>
      <ThreeViewer productId={productId} />
    </Suspense>
  );
}

// ❌ MAUVAIS : Import direct
'use client';
import { ThreeViewer } from './ThreeViewer'; // ❌ 500KB dans le bundle initial

export function Product3DViewer({ productId }: { productId: string }) {
  return <ThreeViewer productId={productId} />;
}
```

---

## ✅ CHECKLIST AVANT AJOUT DE FONCTIONNALITÉ

Avant d'ajouter une nouvelle fonctionnalité, vérifier :

### Architecture
- [ ] Le composant fait < 300 lignes
- [ ] Aucune dépendance circulaire
- [ ] Responsabilité unique respectée
- [ ] Structure de dossiers respectée

### Server/Client Components
- [ ] Composant Server Component par défaut
- [ ] `'use client'` uniquement si nécessaire
- [ ] `'use client'` au niveau le plus bas
- [ ] Data fetching dans Server Component

### Types
- [ ] Types explicites pour toutes les props
- [ ] Aucun `any` utilisé
- [ ] Types API corrects
- [ ] Types générés depuis Zod si possible

### Imports
- [ ] Librairies lourdes importées dynamiquement
- [ ] `ssr: false` pour librairies non SSR-safe
- [ ] Imports spécifiques (pas `import *`)
- [ ] Pas d'imports circulaires

### Browser APIs
- [ ] Aucune API browser dans Server Components
- [ ] Protection `typeof window` pour Client Components
- [ ] Hooks personnalisés pour APIs browser

### Performance
- [ ] Bundle size acceptable
- [ ] Dynamic imports pour code non critique
- [ ] Images optimisées (Next/Image)
- [ ] Lazy loading approprié

### Tests
- [ ] Tests unitaires pour la logique
- [ ] Tests d'intégration pour les composants
- [ ] Tests E2E pour les flows critiques

---

## ✅ CHECKLIST AVANT MERGE / BUILD

Avant de merger ou de builder, vérifier :

### Build
- [ ] `pnpm build` passe sans erreur
- [ ] `pnpm type-check` passe sans erreur
- [ ] `pnpm lint` passe sans erreur
- [ ] Build time < 2 minutes

### Configuration
- [ ] `ignoreBuildErrors: false` dans `next.config.mjs`
- [ ] `skipLibCheck: false` dans `tsconfig.json`
- [ ] Pas de workarounds temporaires
- [ ] Configuration documentée

### Code Quality
- [ ] Aucun `any` utilisé
- [ ] Tous les composants typés
- [ ] Pas de code mort
- [ ] Imports optimisés

### Performance
- [ ] Bundle size analysé
- [ ] Pas de librairies lourdes dans bundle initial
- [ ] Dynamic imports utilisés correctement
- [ ] Images optimisées

### Documentation
- [ ] Code commenté si complexe
- [ ] README mis à jour si nécessaire
- [ ] Types documentés
- [ ] Breaking changes documentés

---

## 📚 RÉFÉRENCES TECHNIQUES

### Documentation Officielle

- [Next.js App Router](https://nextjs.org/docs/app)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Next.js Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

### Outils

- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [ESLint Next.js Plugin](https://github.com/vercel/next.js/tree/canary/packages/eslint-config-next)

### Librairies Compatibles SSR

- ✅ **SSR-Safe** : `react`, `next`, `date-fns`, `zod`, `@radix-ui/*`
- ⚠️ **Client-Only** : `three`, `@react-three/fiber`, `konva`, `framer-motion`, `socket.io-client`

---

## 🎯 CONCLUSION

Ces guidelines sont **OBLIGATOIRES** et **NON NÉGOCIABLES**. Elles ont été créées à partir de l'analyse de toutes les erreurs passées du projet et doivent être suivies strictement pour garantir :

1. ✅ Builds qui passent systématiquement
2. ✅ Performance maintenue à long terme
3. ✅ Code maintenable et scalable
4. ✅ Déploiements sans erreur
5. ✅ Expérience développeur optimale

**En cas de doute, consulter ce document AVANT de coder.**

---

**Version:** 1.0.0  
**Dernière mise à jour:** 2025-01-XX  
**Prochaine révision:** Trimestrielle ou après erreur majeure




