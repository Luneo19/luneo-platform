# 🚨 REGISTRE DES ERREURS DE CODAGE - LUNEO PLATFORM

**Document de référence pour éviter les erreurs récurrentes dans le projet Luneo.**

Ce document liste toutes les erreurs de codage rencontrées dans le projet, avec des exemples et des solutions pour ne plus les répéter.

---

## 📋 TABLE DES MATIÈRES

1. [Erreurs JSX Structurelles](#erreurs-jsx-structurelles)
2. [Erreurs TypeScript](#erreurs-typescript)
3. [Erreurs d'Architecture](#erreurs-darchitecture)
4. [Erreurs de Build](#erreurs-de-build)
5. [Erreurs de Performance](#erreurs-de-performance)

---

## 🔴 ERREURS JSX STRUCTURELLES

### ERREUR #1 : Balises JSX non fermées (TS17008)

**Description :** Balises JSX ouvertes sans balise de fermeture correspondante.

**Exemple d'erreur :**
```tsx
// ❌ INCORRECT
<Card className="bg-slate-900">
  <CardHeader>
    <CardTitle>Mon Titre
    <CardDescription>Ma description
  </CardHeader>
  <CardContent>
    Contenu
  </CardContent>
</Card>

// ✅ CORRECT
<Card className="bg-slate-900">
  <CardHeader>
    <CardTitle>Mon Titre</CardTitle>
    <CardDescription>Ma description</CardDescription>
  </CardHeader>
  <CardContent>
    Contenu
  </CardContent>
</Card>
```

**Causes fréquentes :**
- Oubli de fermer des balises après un copier-coller
- Erreurs d'indentation qui masquent les balises manquantes
- Balises auto-fermantes mal utilisées (`<div />` au lieu de `<div></div>`)

**Prévention :**
- Utiliser un formatter (Prettier) qui détecte les balises non fermées
- Toujours vérifier la structure JSX avec un linter
- Utiliser des composants plus petits (< 300 lignes) pour faciliter la détection

**Fichiers concernés :**
- `apps/frontend/src/app/(dashboard)/dashboard/monitoring/page.tsx` (4436 lignes → refactorisation nécessaire)
- `apps/frontend/src/app/(dashboard)/dashboard/orders/page.tsx`

---

### ERREUR #2 : Balises de fermeture manquantes ou mal placées (TS17002)

**Description :** Balise de fermeture manquante ou placée au mauvais endroit.

**Exemple d'erreur :**
```tsx
// ❌ INCORRECT
<div className="container">
  <Card>
    <CardContent>
      <p>Texte
    </CardContent>
  </div>
</Card>

// ✅ CORRECT
<div className="container">
  <Card>
    <CardContent>
      <p>Texte</p>
    </CardContent>
  </Card>
</div>
```

**Causes fréquentes :**
- Fermeture de balises dans le mauvais ordre
- Oubli de fermer des balises imbriquées
- Copier-coller de code avec structure incorrecte

**Prévention :**
- Vérifier l'indentation pour visualiser la structure
- Utiliser un éditeur avec fermeture automatique des balises
- Tester le build après chaque modification importante

---

### ERREUR #3 : Tokens JSX inattendus (TS1381)

**Description :** Accolades JSX mal formées, tokens inattendus.

**Exemple d'erreur :**
```tsx
// ❌ INCORRECT
<div>
  {items.map((item) => (
    <Card key={item.id}>
      <p>{item.name}
    </Card>
  ))}
</div>

// ✅ CORRECT
<div>
  {items.map((item) => (
    <Card key={item.id}>
      <p>{item.name}</p>
    </Card>
  ))}
</div>
```

**Causes fréquentes :**
- Accolades `{}` mal placées dans les expressions JSX
- Oubli de fermer les parenthèses dans les fonctions map
- Erreurs de syntaxe dans les expressions ternaires complexes

**Prévention :**
- Utiliser des parenthèses explicites dans les fonctions map
- Vérifier la syntaxe des expressions JSX complexes
- Éviter les expressions JSX trop complexes (extrait en fonction)

---

### ERREUR #4 : Expressions JSX nécessitant un élément parent (TS2657)

**Description :** Plusieurs éléments JSX sans wrapper parent.

**Exemple d'erreur :**
```tsx
// ❌ INCORRECT
function Component() {
  return (
    <div>Premier</div>
    <div>Deuxième</div>
  );
}

// ✅ CORRECT
function Component() {
  return (
    <>
      <div>Premier</div>
      <div>Deuxième</div>
    </>
  );
}
```

**Prévention :**
- Utiliser un Fragment (`<>...</>`) ou un div wrapper
- Toujours retourner un seul élément JSX depuis un composant

---

## 🔵 ERREURS TYPESCRIPT

### ERREUR #5 : Utilisation de `any` (Règle #23, #42)

**Description :** Utilisation du type `any` qui désactive la vérification de type.

**Exemple d'erreur :**
```tsx
// ❌ INCORRECT
function processData(data: any) {
  return data.value;
}

// ✅ CORRECT
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: unknown }).value;
  }
  throw new Error('Invalid data');
}
```

**Prévention :**
- Toujours utiliser `unknown` si le type est vraiment inconnu
- Créer des type guards pour valider les données
- Définir des interfaces/types explicites

---

### ERREUR #6 : Types de props non explicites (Règle #24)

**Description :** Props de composants sans types explicites.

**Exemple d'erreur :**
```tsx
// ❌ INCORRECT
function Button({ onClick, children }) {
  return <button onClick={onClick}>{children}</button>;
}

// ✅ CORRECT
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

**Prévention :**
- Toujours définir une interface pour les props
- Utiliser des types stricts
- Éviter les types optionnels sauf si vraiment nécessaire

---

## 🏗️ ERREURS D'ARCHITECTURE

### ERREUR #7 : Composants trop grands (> 300 lignes) (Règle #1, #46)

**Description :** Composants dépassant 300 lignes, violant les règles CURSOR.

**Exemple d'erreur :**
- `monitoring/page.tsx` : 4436 lignes ❌
- `orders/page.tsx` : > 2000 lignes ❌

**Solution :**
- Découper en composants plus petits (< 300 lignes chacun)
- Extraire la logique dans des hooks personnalisés
- Créer une structure modulaire avec des dossiers séparés

**Prévention :**
- Vérifier la taille des fichiers avant de committer
- Refactoriser dès qu'un composant dépasse 200 lignes
- Utiliser des composants de composition

---

### ERREUR #8 : `'use client'` au mauvais niveau (Règle #7, #15, #40)

**Description :** Directive `'use client'` placée trop haut dans l'arbre des composants.

**Exemple d'erreur :**
```tsx
// ❌ INCORRECT - 'use client' au root
'use client';
import { Header } from './Header';
import { Content } from './Content';

export function Page() {
  return (
    <>
      <Header />
      <Content />
    </>
  );
}

// ✅ CORRECT - 'use client' au niveau le plus bas
import { Header } from './Header';
import { InteractiveContent } from './InteractiveContent';

export function Page() {
  return (
    <>
      <Header />
      <InteractiveContent />
    </>
  );
}

// InteractiveContent.tsx
'use client';
export function InteractiveContent() {
  const [state, setState] = useState();
  // ...
}
```

**Prévention :**
- Par défaut, tous les composants sont Server Components
- Ajouter `'use client'` uniquement au composant qui en a besoin
- Créer des wrappers Client Components minimes

---

### ERREUR #9 : Data fetching dans Client Components (Règle #44)

**Description :** Utilisation de `useEffect` pour fetcher des données dans Client Components.

**Exemple d'erreur :**
```tsx
// ❌ INCORRECT
'use client';
function DataComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data').then(res => res.json()).then(setData);
  }, []);
  
  return <div>{data?.value}</div>;
}

// ✅ CORRECT
// Server Component (page.tsx)
async function DataPage() {
  const data = await fetchData();
  return <DataDisplay data={data} />;
}

// Client Component minimal
'use client';
function DataDisplay({ data }: { data: DataType }) {
  return <div>{data.value}</div>;
}
```

**Prévention :**
- Fetcher les données dans Server Components
- Passer les données en props aux Client Components
- Utiliser Server Actions pour les mutations

---

### ERREUR #10 : APIs browser sans protection (Règle #18, #45)

**Description :** Utilisation d'APIs browser (`window`, `document`, `localStorage`) sans vérification.

**Exemple d'erreur :**
```tsx
// ❌ INCORRECT
function Component() {
  const value = localStorage.getItem('key');
  return <div>{value}</div>;
}

// ✅ CORRECT
'use client';
function Component() {
  const [value, setValue] = useState<string | null>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setValue(localStorage.getItem('key'));
    }
  }, []);
  
  return <div>{value}</div>;
}
```

**Prévention :**
- Toujours vérifier `typeof window !== 'undefined'`
- Utiliser les APIs browser uniquement dans `useEffect`
- Créer des hooks personnalisés pour les APIs browser

---

## 🔧 ERREURS DE BUILD

### ERREUR #11 : Masquer les erreurs de build (Règle #30, #32)

**Description :** Utilisation de `ignoreBuildErrors: true` ou `skipLibCheck: true`.

**Exemple d'erreur :**
```typescript
// ❌ INCORRECT - next.config.js
module.exports = {
  typescript: {
    ignoreBuildErrors: true, // ❌ JAMAIS
  },
  eslint: {
    ignoreDuringBuilds: true, // ❌ JAMAIS
  },
};

// ✅ CORRECT
module.exports = {
  typescript: {
    ignoreBuildErrors: false, // Corriger les erreurs
  },
  eslint: {
    ignoreDuringBuilds: false, // Corriger les erreurs
  },
};
```

**Prévention :**
- Toujours corriger les erreurs plutôt que les masquer
- Tester le build en local avant de pusher
- Utiliser `pnpm build` pour vérifier

---

### ERREUR #12 : Dépendances circulaires (Règle #2, #47)

**Description :** Importations circulaires entre modules.

**Exemple d'erreur :**
```
Module A → Module B → Module A (circulaire ❌)
```

**Solution :**
- Utiliser `packages/types` pour les types partagés
- Restructurer les imports pour éviter les cycles
- Extraire les types dans un fichier séparé

---

## ⚡ ERREURS DE PERFORMANCE

### ERREUR #13 : Librairies lourdes non dynamiques (Règle #16, #19, #20)

**Description :** Importation de librairies lourdes (> 100KB) sans dynamic import.

**Exemple d'erreur :**
```tsx
// ❌ INCORRECT
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';

// ✅ CORRECT
import dynamic from 'next/dynamic';

const ThreeScene = dynamic(() => import('./ThreeScene'), {
  ssr: false,
  loading: () => <div>Chargement...</div>,
});
```

**Librairies concernées :**
- `three`, `@react-three/fiber`, `@react-three/drei`
- `konva`, `react-konva`
- `framer-motion` (dans certains cas)
- `@mediapipe/*`
- `html2canvas`, `jspdf`
- `socket.io-client`

**Prévention :**
- Vérifier la taille des librairies avant import
- Utiliser dynamic import avec `ssr: false` si non SSR-safe
- Ajouter des états de chargement

---

## 📊 RÉSUMÉ DES ERREURS PAR CATÉGORIE

### JSX Structurelles
- ❌ Balises non fermées (TS17008)
- ❌ Balises mal placées (TS17002)
- ❌ Tokens inattendus (TS1381)
- ❌ Expressions JSX sans parent (TS2657)

### TypeScript
- ❌ Utilisation de `any`
- ❌ Types de props non explicites
- ❌ Types optionnels inutiles

### Architecture
- ❌ Composants > 300 lignes
- ❌ `'use client'` au mauvais niveau
- ❌ Data fetching dans Client Components
- ❌ APIs browser sans protection
- ❌ Dépendances circulaires

### Build
- ❌ Masquer les erreurs de build
- ❌ Build qui timeout

### Performance
- ❌ Librairies lourdes non dynamiques
- ❌ Bundle initial > 200KB

---

## ✅ CHECKLIST DE VÉRIFICATION

Avant chaque commit, vérifier :

- [ ] Tous les composants font < 300 lignes
- [ ] Toutes les balises JSX sont correctement fermées
- [ ] Aucun `any` dans le code
- [ ] Tous les props ont des types explicites
- [ ] `'use client'` est au niveau le plus bas
- [ ] Pas de data fetching dans Client Components
- [ ] APIs browser protégées avec `typeof window`
- [ ] Librairies lourdes utilisent dynamic import
- [ ] Le build passe sans erreurs (`pnpm build`)
- [ ] Aucune erreur TypeScript/ESLint

---

## 🎯 ACTIONS PRIORITAIRES

1. **Refactoriser les gros fichiers** (> 300 lignes)
   - `monitoring/page.tsx` (4436 lignes) → EN COURS
   - `orders/page.tsx` (> 2000 lignes) → À FAIRE

2. **Corriger toutes les erreurs JSX**
   - Vérifier tous les fichiers avec erreurs TS17008/TS17002
   - Utiliser un linter/formatter automatique

3. **Éliminer tous les `any`**
   - Audit complet du codebase
   - Créer des types appropriés

4. **Vérifier l'utilisation de `'use client'`**
   - Audit de tous les fichiers avec `'use client'`
   - Déplacer au niveau le plus bas possible

---

**Dernière mise à jour :** 2025-01-XX
**Version :** 1.0.0





