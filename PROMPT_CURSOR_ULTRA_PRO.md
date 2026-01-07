# 🚀 PROMPT CURSOR ULTRA-PRO - Plan d'Exécution Pages Dashboard Luneo

## 🎯 MISSION : DÉVELOPPEMENT SYSTÉMATIQUE DES PAGES DASHBOARD LUNEO

### CONTEXTE GLOBAL

Tu es un développeur senior expert Next.js 14+ App Router, TypeScript strict, et architecture SaaS. Tu travailles sur la plateforme Luneo, un SaaS de configuration 3D/AR pour e-commerce.

#### Audit Réalisé
- **68 pages analysées** dans `/dashboard`
- **32 pages fonctionnelles** (47%)
- **13 pages semi-fonctionnelles** (19%)  
- **23 pages statiques** (34%)
- **12 pages > 5000 lignes** (violation critique)

#### Documents de Référence (OBLIGATOIRES)
1. `BIBLE_DEPLOIEMENT_PRODUCTION.md` - Règles Railway/Vercel
2. `AUDIT_DASHBOARD.md` - État de chaque page
3. `PLAN_ACTION.md` - Timeline et phases
4. `PRIORITES.md` - Ordre de développement
5. `fiches-projet/*.md` - Détails techniques par page

---

## 🔒 RÈGLES ABSOLUES (NE JAMAIS VIOLER)

### Architecture Next.js
```typescript
// ✅ OBLIGATOIRE : Server Components par défaut
// ❌ INTERDIT : 'use client' au niveau page sauf nécessité absolue

// ✅ OBLIGATOIRE : Composants < 300 lignes
// ❌ INTERDIT : Fichiers > 500 lignes

// ✅ OBLIGATOIRE : Types explicites
// ❌ INTERDIT : any, as any, @ts-ignore
```

### Structure de Fichiers
```
apps/frontend/src/app/(dashboard)/[page]/
├── page.tsx              # < 200 lignes - Server Component
├── layout.tsx            # Si nécessaire
├── loading.tsx           # Skeleton/Loading state
├── error.tsx             # Error boundary
├── actions.ts            # Server Actions
├── components/
│   ├── PageHeader.tsx    # < 100 lignes
│   ├── DataTable.tsx     # < 200 lignes
│   ├── FilterBar.tsx     # < 150 lignes
│   ├── CreateModal.tsx   # < 200 lignes
│   └── ...
├── hooks/
│   ├── usePageData.ts    # React Query hooks
│   └── useFilters.ts
├── lib/
│   ├── schemas.ts        # Zod schemas
│   └── api.ts            # API functions
└── types/
    └── index.ts          # Types locaux
```

### Patterns Obligatoires

#### 1. Data Fetching - Server Component
```typescript
export default async function PageName() {
  const data = await fetchData(); // Server-side fetch
  return <ClientComponent initialData={data} />;
}
```

#### 2. Mutations - Server Actions
```typescript
'use server';
export async function createItem(formData: FormData) {
  const validated = Schema.parse(Object.fromEntries(formData));
  const result = await db.item.create({ data: validated });
  revalidatePath('/dashboard/items');
  return { success: true, data: result };
}
```

#### 3. Client Interactivity - Minimal 'use client'
```typescript
'use client';
export function InteractiveTable({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  // Logique interactive minimale
}
```

#### 4. Validation - Zod obligatoire
```typescript
const CreateItemSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
});
```

---

## 📋 PROTOCOLE D'EXÉCUTION PAR PAGE

### PHASE 1 : ANALYSE (5 min)

Pour chaque page, exécute d'abord cette analyse :

```bash
# 1. Localiser le fichier
find apps/frontend/src/app/\(dashboard\) -path "*[PAGE_NAME]*" -name "page.tsx"

# 2. Compter les lignes
wc -l [FICHIER]

# 3. Identifier le type
grep -c "'use client'" [FICHIER]
grep -c "useState\|useEffect" [FICHIER]
grep -c "useQuery\|useMutation" [FICHIER]
grep -c "TODO\|FIXME\|XXX" [FICHIER]

# 4. Vérifier le backend
find apps/backend/src -name "*[MODULE]*" -type f
```

Puis génère ce rapport :

```markdown
## 📊 ANALYSE : [PAGE_NAME]

**Fichier:** `[CHEMIN]`
**Lignes:** [X] (⚠️ si > 500 / 🔴 si > 1000)
**Type:** Server Component / Client Component
**État:** Fonctionnel / Semi-fonctionnel / Statique

### Problèmes Identifiés
1. [Problème 1]
2. [Problème 2]

### Backend Disponible
- Controller: ✅/❌ `[chemin]`
- Service: ✅/❌ `[chemin]`
- Routes API: ✅/❌ `[chemin]`

### Décision
- [ ] Refactoring (si > 500 lignes)
- [ ] Connexion API (si statique)
- [ ] Complétion (si semi-fonctionnel)
- [ ] Validation (si fonctionnel)
```

### PHASE 2 : PLANIFICATION (10 min)

Génère le plan de développement :

```markdown
## 🎯 PLAN : [PAGE_NAME]

### Objectif
[Description en 1 phrase]

### User Stories
- [ ] US1: En tant que [rôle], je veux [action] pour [bénéfice]
- [ ] US2: ...

### Tâches Techniques

#### Si Refactoring Nécessaire
1. [ ] Créer structure de dossiers
2. [ ] Extraire composants (< 300 lignes chacun)
3. [ ] Créer hooks personnalisés
4. [ ] Implémenter Server Actions
5. [ ] Ajouter loading.tsx et error.tsx
6. [ ] Tests unitaires composants
7. [ ] Tests E2E page

#### Si Connexion API Nécessaire
1. [ ] Identifier endpoints backend existants
2. [ ] Créer Server Actions pour mutations
3. [ ] Implémenter useQuery pour lectures
4. [ ] Ajouter gestion erreurs
5. [ ] Ajouter loading states
6. [ ] Tests E2E

#### Si Complétion Nécessaire
1. [ ] Résoudre tous les TODO/FIXME
2. [ ] Implémenter boutons manquants
3. [ ] Connecter formulaires aux Server Actions
4. [ ] Ajouter validation Zod
5. [ ] Tests E2E

### Fichiers à Créer/Modifier
[Liste des fichiers avec actions: CREATE/MODIFY/DELETE]

### Dépendances
- Backend: [endpoints requis]
- Composants partagés: [liste]
- Librairies: [liste]

### Estimation
- Développement: [X]h
- Tests: [X]h
- Review: [X]h
- **Total:** [X]h
```

### PHASE 3 : EXÉCUTION (Variable)

Exécute le développement en suivant cette structure :

#### Étape 1 : Structure de Base (si refactoring)
```typescript
// apps/frontend/src/app/(dashboard)/[page]/page.tsx

import { Suspense } from 'react';
import { PageHeader } from './components/PageHeader';
import { DataSection } from './components/DataSection';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { fetchPageData } from './lib/api';

export const metadata = {
  title: '[Page Name] | Luneo',
  description: '[Description]',
};

export default async function PageName() {
  const data = await fetchPageData();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <PageHeader 
        title="[Titre]"
        description="[Description]"
        actions={[
          { label: 'Create', href: '/dashboard/[page]/create' }
        ]}
      />
      
      <Suspense fallback={<LoadingSkeleton />}>
        <DataSection initialData={data} />
      </Suspense>
    </div>
  );
}
```

#### Étape 2 : Server Actions
```typescript
// apps/frontend/src/app/(dashboard)/[page]/actions.ts

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

const CreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  // ... autres champs
});

const UpdateSchema = CreateSchema.partial().extend({
  id: z.string().uuid(),
});

export async function createItem(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const rawData = Object.fromEntries(formData);
    const validated = CreateSchema.parse(rawData);

    const item = await db.item.create({
      data: {
        ...validated,
        userId: session.user.id,
      },
    });

    revalidatePath('/dashboard/[page]');
    return { success: true, data: item };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: 'Validation failed', details: error.errors };
    }
    console.error('[createItem]', error);
    return { success: false, error: 'Failed to create item' };
  }
}

export async function updateItem(formData: FormData) {
  // ... même pattern
}

export async function deleteItem(id: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.item.delete({
      where: { id, userId: session.user.id },
    });

    revalidatePath('/dashboard/[page]');
    return { success: true };
  } catch (error) {
    console.error('[deleteItem]', error);
    return { success: false, error: 'Failed to delete item' };
  }
}
```

#### Étape 3 : Composants Client (minimaux)
```typescript
// apps/frontend/src/app/(dashboard)/[page]/components/DataTable.tsx

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { deleteItem } from '../actions';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface DataTableProps {
  items: Item[];
}

export function DataTable({ items }: DataTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    
    startTransition(async () => {
      const result = await deleteItem(deleteId);
      if (result.success) {
        toast.success('Item deleted successfully');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
      setDeleteId(null);
    });
  };

  return (
    <>
      <Table>
        <TableHeader>
          {/* ... */}
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => router.push(`/dashboard/[page]/${item.id}`)}
                >
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setDeleteId(item.id)}
                  disabled={isPending}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Item"
        description="Are you sure? This action cannot be undone."
        loading={isPending}
      />
    </>
  );
}
```

#### Étape 4 : Loading & Error States
```typescript
// apps/frontend/src/app/(dashboard)/[page]/loading.tsx

import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}

// apps/frontend/src/app/(dashboard)/[page]/error.tsx

'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[PageError]', error);
    // Envoyer à Sentry si configuré
  }, [error]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground text-center max-w-md">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
```

### PHASE 4 : VALIDATION (15 min)

Après chaque page, exécute cette checklist :

```markdown
## ✅ VALIDATION : [PAGE_NAME]

### Build & Types
- [ ] `pnpm build` passe sans erreur
- [ ] `npx tsc --noEmit` passe sans erreur
- [ ] `pnpm lint` passe sans erreur

### Structure
- [ ] page.tsx < 200 lignes
- [ ] Tous composants < 300 lignes
- [ ] loading.tsx présent
- [ ] error.tsx présent

### Fonctionnalité
- [ ] Affichage données réelles (pas de mock)
- [ ] CRUD complet si applicable
- [ ] Tous boutons/CTA fonctionnels
- [ ] Formulaires avec validation Zod
- [ ] Loading states présents
- [ ] Error states présents
- [ ] Empty states présents

### Performance
- [ ] Pas d'import dynamique manquant pour libs lourdes
- [ ] Images avec next/image
- [ ] Pas de useEffect pour fetch

### Sécurité
- [ ] Authentification vérifiée
- [ ] Validation côté serveur
- [ ] Pas de données sensibles exposées

### Tests
- [ ] Tests composants (jest/vitest)
- [ ] Tests E2E (playwright) - scénarios principaux
```

---

## 🔄 WORKFLOW PAR SPRINT

### Format de Réponse Attendu

Pour chaque sprint/page, réponds avec ce format :

```markdown
# 🚀 SPRINT [X] : [PAGE_NAME]

## 📊 Analyse Initiale
[Rapport d'analyse Phase 1]

## 🎯 Plan de Développement
[Plan Phase 2]

## 💻 Code Généré
[Code Phase 3 - tous les fichiers]

## ✅ Validation
[Checklist Phase 4 complétée]

## 📝 Notes de Déploiement
- Variables d'environnement requises: [liste]
- Migrations Prisma nécessaires: [oui/non]
- Dépendances backend: [liste]

## 🔗 Prochaine Page
[Nom de la prochaine page selon PRIORITES.md]
```

---

## 📌 ORDRE D'EXÉCUTION (PRIORITÉS)

Execute les pages dans cet ordre exact :

### Sprint 1-2 : P0 Critique
1. `/dashboard` (Dashboard principal) - **CRÉER**
2. `/dashboard/products` - **REFACTORING**
3. `/dashboard/orders` - **COMPLÉTION**
4. `/dashboard/analytics` - **REFACTORING**

### Sprint 3-4 : P1 Configuration
5. `/dashboard/settings` - **VALIDATION**
6. `/notifications` - **RÉSOUDRE TODO**
7. `/dashboard/billing` - **REFACTORING**
8. `/dashboard/credits` - **RÉSOUDRE TODO**

### Sprint 5-6 : P1 Library & Studios
9. `/dashboard/library` - **REFACTORING**
10. `/dashboard/configurator-3d` - **REFACTORING**
11. `/dashboard/ar-studio` - **VALIDATION**
12. `/dashboard/ai-studio` - **VALIDATION**

[Continuer selon PRIORITES.md]

---

## 🚨 GESTION DES BLOCKERS

Si tu rencontres un blocker :

```markdown
## 🚨 BLOCKER : [Description]

**Page:** [Nom]
**Type:** Backend manquant / Dépendance / Clarification requise

### Contexte
[Explication du problème]

### Options
1. [Option 1 - avec pros/cons]
2. [Option 2 - avec pros/cons]

### Recommandation
[Ta recommandation]

### Action Requise
- [ ] [Action à prendre par l'équipe]
```

---

## 🎬 DÉMARRE MAINTENANT

Commence par la première page P0 selon les priorités :

**Page:** Dashboard Principal (`/dashboard`)  
**Fichier:** `apps/frontend/src/app/(dashboard)/dashboard/page.tsx`  
**État actuel:** ❌ Vide (0 lignes selon l'audit)  
**Action:** CRÉER depuis zéro

Génère :
1. L'analyse complète
2. Le plan de développement
3. Tout le code nécessaire
4. La validation

**GO! 🚀**

---

## 📋 CHECKLIST AVANT UTILISATION

Avant de coller ce prompt dans Cursor, assure-toi que :

- [ ] Les fichiers d'audit sont accessibles dans le workspace
- [ ] `AUDIT_DASHBOARD.md` est présent
- [ ] `PRIORITES.md` est présent
- [ ] `PLAN_ACTION.md` est présent
- [ ] La Bible Luneo est dans le contexte
- [ ] Le backend est accessible pour vérification

---

## 💡 CONSEILS D'UTILISATION

### Mode Conversation
1. Colle le prompt complet en premier message
2. Cursor va commencer par Dashboard
3. À chaque `## 🔗 Prochaine Page`, dis "Continue avec [page suivante]"
4. Si blocker, résous avant de continuer

### Mode Batch
1. Demande "Génère les 4 pages P0 complètes"
2. Review le code généré
3. Applique les modifications
4. Valide avec `pnpm build`

### Mode Debug
Si une page échoue au build :
```
"La page [X] échoue au build avec l'erreur [Y].
Analyse et corrige en respectant la Bible Luneo."
```

---

## 🔗 RÉFÉRENCES TECHNIQUES

### Imports Standards
```typescript
// Server Components
import { Suspense } from 'react';
import { revalidatePath } from 'next/cache';

// Client Components
'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

// Validation
import { z } from 'zod';

// UI Components
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

// Database
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
```

### Patterns de Validation
```typescript
// Schema Zod
const Schema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  age: z.number().int().positive(),
});

// Validation dans Server Action
try {
  const validated = Schema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    return { success: false, errors: error.errors };
  }
}
```

### Patterns de Gestion d'Erreurs
```typescript
// Server Action
try {
  // ... logique
} catch (error) {
  console.error('[functionName]', error);
  return { success: false, error: 'User-friendly message' };
}

// Client Component
try {
  const result = await action();
  if (!result.success) {
    toast.error(result.error);
  }
} catch (error) {
  toast.error('An unexpected error occurred');
}
```

---

## 📊 MÉTRIQUES DE SUCCÈS

Pour chaque page développée :

- ✅ **Build:** `pnpm build` passe
- ✅ **Types:** `npx tsc --noEmit` passe
- ✅ **Lint:** `pnpm lint` passe
- ✅ **Tests:** Tests unitaires + E2E passent
- ✅ **Performance:** Lighthouse score > 90
- ✅ **Accessibilité:** a11y score > 90
- ✅ **SEO:** Metadata complète

---

**Ce prompt est optimisé pour générer du code production-ready conforme à la Bible Luneo.** 🎯


