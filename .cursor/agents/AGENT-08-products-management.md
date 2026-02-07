# AGENT-08: Products Management

**Objectif**: Rendre le module Products Management production-ready avec toutes les fonctionnalités CRUD, validations, et intégrations backend

**Priorité**: P1 (Critique)  
**Complexité**: 3/5  
**Estimation**: 1 semaine  
**Dépendances**: AGENT-01 (TypeScript), AGENT-05 (Auth)

---

## 📋 SCOPE

### Routes Concernées
- `/dashboard/products` - Liste produits
- `/dashboard/products/[id]` - Détails produit (à créer)
- `/dashboard/products/new` - Création produit (à créer)
- `/dashboard/products/[id]/edit` - Édition produit (à créer)

### Composants
- `apps/frontend/src/app/(dashboard)/dashboard/products/page.tsx` (~5000 lignes)
- Composants à créer/refactoriser:
  - `ProductList.tsx`
  - `ProductCard.tsx`
  - `ProductForm.tsx`
  - `ProductDetail.tsx`
  - `ProductFilters.tsx`
  - `ProductBulkActions.tsx`

### API Endpoints Requis

#### Backend (NestJS)
- `GET /api/v1/products` - Liste produits (✅ existe)
- `GET /api/v1/products/:id` - Détails produit (✅ existe)
- `POST /api/v1/products` - Créer produit (✅ existe)
- `PUT /api/v1/products/:id` - Modifier produit (✅ existe)
- `DELETE /api/v1/products/:id` - Supprimer produit (✅ existe)
- `POST /api/v1/products/bulk` - Actions bulk (à créer)
- `POST /api/v1/products/import` - Import CSV/Excel (à créer)
- `GET /api/v1/products/export` - Export CSV/JSON (à créer)

#### Frontend API Routes
- `GET /api/products` - Proxy vers backend (✅ existe)
- `POST /api/products` - Proxy vers backend (✅ existe)
- `PUT /api/products/[id]` - Proxy vers backend (à créer)
- `DELETE /api/products/[id]` - Proxy vers backend (à créer)

---

## ⚠️ PRE-REQUIS: Phase 12.5 - Corriger Routes API Cassées

**AVANT de commencer le refactoring**, ces fichiers appellent des routes `/api/products` supprimées et doivent être migrés :

- `apps/frontend/src/lib/hooks/useProducts.ts` : `/api/products` → `endpoints.products.list(params)`
- `apps/frontend/src/app/(dashboard)/customize/[productId]/page.tsx` : `/api/products/*` → `endpoints.products.get(id)`

**Pattern de migration** :
```typescript
// ❌ AVANT (route Next.js supprimée)
const res = await fetch('/api/products');
const data = await res.json();

// ✅ APRÈS (backend NestJS via client API)
import { endpoints } from '@/lib/api/client';
const data = await endpoints.products.list(params);
```

**Endpoints disponibles** :
```
endpoints.products.list(params)   // GET /api/v1/products
endpoints.products.get(id)        // GET /api/v1/products/:id
endpoints.products.create(data)   // POST /api/v1/products
endpoints.products.update(id, d)  // PUT /api/v1/products/:id
endpoints.products.delete(id)     // DELETE /api/v1/products/:id
```

---

## ✅ TÂCHES

### Phase 0: Fix Broken API Routes (0.5 jour) [Phase 12.5]

- [ ] Migrer `useProducts.ts` → `endpoints.products.list(params)`
- [ ] Migrer `customize/[productId]/page.tsx` → `endpoints.products.get(id)`
- [ ] Supprimer tout `fetch('/api/products')` résiduel
- [ ] Vérifier 0 import `@/lib/supabase` dans les fichiers products

### Phase 1: Refactoring Page Principale (2 jours)

- [ ] Analyser la page actuelle (~5000 lignes)
- [ ] Extraire composants réutilisables:
  - [ ] `ProductList.tsx` (liste avec grid/list view)
  - [ ] `ProductCard.tsx` (carte produit)
  - [ ] `ProductFilters.tsx` (filtres avancés)
  - [ ] `ProductBulkActions.tsx` (actions bulk)
- [ ] Extraire logique métier dans hooks:
  - [ ] `useProducts.ts` (déjà existe, à améliorer)
  - [ ] `useProductFilters.ts` (à créer)
  - [ ] `useProductBulkActions.ts` (à créer)
- [ ] Réduire la page à < 500 lignes

### Phase 2: CRUD Complet (2 jours)

- [ ] Créer page détails produit (`/products/[id]/page.tsx`)
  - [ ] Affichage informations produit
  - [ ] Tabs: Overview, Zones, Customizations, Analytics, History
  - [ ] Actions: Edit, Delete, Duplicate, Export
- [ ] Créer page création (`/products/new/page.tsx`)
  - [ ] Formulaire création complet
  - [ ] Validation Zod
  - [ ] Upload images
  - [ ] Prévisualisation
- [ ] Créer page édition (`/products/[id]/edit/page.tsx`)
  - [ ] Formulaire édition
  - [ ] Validation
  - [ ] Gestion zones personnalisables
- [ ] Implémenter suppression avec confirmation

### Phase 3: Features Avancées (2 jours)

- [ ] Recherche avancée
  - [ ] Recherche multi-critères (nom, SKU, catégorie, prix)
  - [ ] Filtres multiples (statut, catégorie, prix, date)
  - [ ] Tri multi-colonnes
- [ ] Pagination infinie
  - [ ] Scroll infini
  - [ ] Pagination classique (option)
- [ ] Actions bulk
  - [ ] Sélection multiple
  - [ ] Delete bulk
  - [ ] Archive bulk
  - [ ] Export bulk
- [ ] Import/Export
  - [ ] Import CSV/Excel
  - [ ] Export CSV/JSON/PDF
  - [ ] Template import

### Phase 4: Intégrations Backend (1 jour)

- [ ] Connecter toutes les pages au backend
- [ ] Gérer états de chargement
- [ ] Gérer erreurs
- [ ] Optimistic updates
- [ ] Cache invalidation (React Query)

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Structure Fichiers

```
apps/frontend/src/app/(dashboard)/dashboard/products/
├── page.tsx                    # Liste produits (refactorisé)
├── [id]/
│   ├── page.tsx               # Détails produit (à créer)
│   └── edit/
│       └── page.tsx           # Édition produit (à créer)
├── new/
│   └── page.tsx               # Création produit (à créer)
└── components/
    ├── ProductList.tsx
    ├── ProductCard.tsx
    ├── ProductForm.tsx
    ├── ProductFilters.tsx
    ├── ProductBulkActions.tsx
    └── ProductDetailTabs.tsx
```

### Hooks

```typescript
// useProducts.ts (améliorer)
export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => api.products.list(filters),
  });
}

// useProduct.ts (créer)
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => api.products.get(id),
    enabled: !!id,
  });
}

// useCreateProduct.ts (créer)
export function useCreateProduct() {
  return useMutation({
    mutationFn: (data: CreateProductInput) => api.products.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    },
  });
}
```

### Validation Zod

```typescript
// schemas/product.ts
export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().positive(),
  currency: z.string().default('EUR'),
  images: z.array(z.string().url()).optional(),
  // ... autres champs
});
```

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] Page principale < 500 lignes
- [ ] Tous les composants < 300 lignes
- [ ] 100% des endpoints backend connectés
- [ ] Validation Zod complète
- [ ] Gestion erreurs/loading complète
- [ ] Tests unitaires pour hooks
- [ ] Tests E2E pour flux CRUD
- [ ] Performance: < 2s chargement initial

---

## 🔗 RESSOURCES

- Page actuelle: `apps/frontend/src/app/(dashboard)/dashboard/products/page.tsx`
- Hook existant: `apps/frontend/src/lib/hooks/useProducts.ts`
- Backend: `apps/backend/src/modules/products/`
- Schema Prisma: `apps/backend/prisma/schema.prisma` (modèle Product)

---

## 📝 NOTES

- La page actuelle est très complète mais trop longue (~5000 lignes)
- Prioriser le refactoring pour maintenabilité
- Utiliser Server Components où possible (Next.js 15)
- Optimiser les images avec Next.js Image
- Utiliser React Query pour cache et sync






