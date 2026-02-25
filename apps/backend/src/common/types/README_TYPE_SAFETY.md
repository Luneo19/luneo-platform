# 🔒 Type Safety - Guide d'amélioration

## Vue d'ensemble

Ce guide explique comment améliorer progressivement le type safety du projet en remplaçant les usages de `any` par des types appropriés.

## Configuration TypeScript

### Backend (activé)

```json
{
  "strictNullChecks": true,
  "noImplicitAny": true,
  "strictBindCallApply": true,
  "strictFunctionTypes": true,
  "strictPropertyInitialization": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true
}
```

### Frontend (déjà activé)

Le frontend utilise `"strict": true` qui active toutes les vérifications strictes.

## Types utilitaires disponibles

### JsonValue / JsonObject / JsonArray

Pour remplacer `any` dans les métadonnées, configurations, etc.

```typescript
// ❌ Avant
interface Config {
  metadata: any;
}

// ✅ Après
import { JsonObject } from '@/common/types/utility-types';

interface Config {
  metadata: JsonObject;
}
```

### Record<string, T>

Pour les objets avec clés dynamiques.

```typescript
// ❌ Avant
const data: any = {};

// ✅ Après
const data: Record<string, unknown> = {};
```

### Types génériques

Pour les fonctions et classes génériques.

```typescript
// ❌ Avant
function process(data: any): any {
  return data;
}

// ✅ Après
function process<T>(data: T): T {
  return data;
}
```

## Stratégie de migration

### Phase 1 : Types utilitaires (✅ Complété)

- ✅ Création de `utility-types.ts` avec types de base
- ✅ Remplacement dans `ValidationPipe`
- ✅ Remplacement dans `ProductsService` et `DesignsService`

### Phase 2 : Services critiques (En cours)

1. **DTOs et interfaces**
   - Remplacer `any` dans les DTOs par des types spécifiques
   - Utiliser `JsonValue` pour les métadonnées

2. **Services**
   - Typer les paramètres `currentUser`
   - Typer les `createDto` et `updateDto`
   - Utiliser des génériques pour les méthodes réutilisables

3. **Workers et jobs**
   - Typer les `JobData` interfaces
   - Utiliser des types spécifiques pour les options

### Phase 3 : Code legacy

- Migrer progressivement les fichiers existants
- Utiliser `@ts-expect-error` temporairement si nécessaire
- Documenter les cas complexes

## Exemples de remplacement

### Paramètres de fonction

```typescript
// ❌ Avant
async create(data: any, user: any) {
  // ...
}

// ✅ Après
interface CreateDto {
  name: string;
  description?: string;
}

interface CurrentUser {
  id: string;
  role: UserRole;
  brandId?: string | null;
}

async create(data: CreateDto, user: CurrentUser) {
  // ...
}
```

### Retour de fonction

```typescript
// ❌ Avant
async findAll(): Promise<any[]> {
  // ...
}

// ✅ Après
async findAll(): Promise<Product[]> {
  // ...
}
```

### Variables

```typescript
// ❌ Avant
const result: any = await fetchData();

// ✅ Après
const result: ApiResponse<Product> = await fetchData();
// ou
const result = await fetchData(); // Type inference
```

### Casts

```typescript
// ❌ Avant
const data = response as any;

// ✅ Après
interface ApiResponse {
  data: Product;
  status: number;
}
const data = response as ApiResponse;
```

### Métadonnées

```typescript
// ❌ Avant
interface Order {
  metadata: any;
}

// ✅ Après
import { JsonObject } from '@/common/types/utility-types';

interface Order {
  metadata?: JsonObject;
}
```

## Bonnes pratiques

1. **Utiliser l'inférence de type** quand possible
   ```typescript
   // ✅ Bon
   const user = { id: '123', name: 'John' };
   
   // ❌ Éviter
   const user: any = { id: '123', name: 'John' };
   ```

2. **Créer des interfaces** pour les structures réutilisables
   ```typescript
   // ✅ Bon
   interface User {
     id: string;
     email: string;
   }
   ```

3. **Utiliser des génériques** pour la réutilisabilité
   ```typescript
   // ✅ Bon
   function findById<T>(id: string): Promise<T | null> {
     // ...
   }
   ```

4. **Éviter `as any`** - utiliser des assertions de type spécifiques
   ```typescript
   // ❌ Éviter
   const data = value as any;
   
   // ✅ Préférer
   const data = value as SpecificType;
   ```

5. **Utiliser `unknown`** pour les valeurs vraiment inconnues
   ```typescript
   // ✅ Bon
   function processUnknown(value: unknown): void {
     if (typeof value === 'string') {
       // Type narrowing
     }
   }
   ```

## Vérification

Utiliser le script d'analyse :

```bash
npm run analyze-types
# ou
ts-node scripts/improve-type-safety.ts
```

Le script génère un rapport `TYPE_SAFETY_REPORT.json` avec :
- Nombre total d'usages de `any`
- Répartition par type (parameter, return, variable, etc.)
- Top fichiers à corriger

## Migration progressive

Pour éviter de casser le code existant :

1. **Activer strict checks progressivement**
   - Commencer par les nouveaux fichiers
   - Migrer les fichiers critiques
   - Finalement migrer le reste

2. **Utiliser `@ts-expect-error` temporairement**
   ```typescript
   // @ts-expect-error - To be migrated in Phase 2
   const legacyData: any = getLegacyData();
   ```

3. **Documenter les cas complexes**
   ```typescript
   /**
    * Complex type that requires any due to dynamic structure
    * Migration note: create a dedicated interface in Phase 3
    */
   const complexData: any = // ...
   ```

## Ressources

- [TypeScript Handbook - Type Safety](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Utility Types Documentation](./utility-types.ts)

