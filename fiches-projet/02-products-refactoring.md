# 📋 FICHE PROJET : Products - Refactoring

## Contexte
- **Route** : `/dashboard/products`
- **Fichier** : `apps/frontend/src/app/(dashboard)/dashboard/products/page.tsx`
- **État actuel** : 🟢 Fonctionnel mais 5017 lignes (violation Bible Luneo)
- **Objectif** : Refactoriser en composants < 300 lignes
- **Priorité** : P0 (Critique)
- **Effort estimé** : 5 jours

---

## Problème Actuel

- ❌ **5017 lignes** dans un seul fichier
- ❌ Violation de la Bible Luneo (max 500 lignes)
- ❌ Difficile à maintenir
- ❌ Performance non optimale

---

## User Stories

### En tant que développeur
- [ ] Je veux que chaque composant soit < 300 lignes
- [ ] Je veux que le code soit modulaire et réutilisable
- [ ] Je veux que les performances soient optimisées

### En tant qu'utilisateur
- [ ] Je veux que toutes les fonctionnalités continuent de fonctionner
- [ ] Je veux que les performances soient meilleures

---

## Tâches Techniques

### Phase 1 : Analyse (0.5j)
- [ ] Identifier les sections logiques du code
- [ ] Lister tous les composants à extraire
- [ ] Identifier les hooks personnalisés nécessaires
- [ ] Identifier les types/interfaces à extraire

### Phase 2 : Extraction Composants (2j)
- [ ] Extraire modals dans `components/products/modals/`
  - [ ] `CreateProductModal.tsx`
  - [ ] `EditProductModal.tsx`
  - [ ] `DeleteProductModal.tsx`
  - [ ] `BulkActionsModal.tsx`
  - [ ] `ExportModal.tsx`
  - [ ] `ImportModal.tsx`
- [ ] Extraire filtres dans `components/products/filters/`
  - [ ] `ProductFilters.tsx`
  - [ ] `ProductSearch.tsx`
  - [ ] `ProductSort.tsx`
- [ ] Extraire tableau dans `components/products/table/`
  - [ ] `ProductsTable.tsx`
  - [ ] `ProductsGrid.tsx`
  - [ ] `ProductCard.tsx`
  - [ ] `ProductRow.tsx`
- [ ] Extraire formulaires dans `components/products/forms/`
  - [ ] `ProductForm.tsx`
  - [ ] `ProductImageUpload.tsx`
  - [ ] `ProductVariantsForm.tsx`

### Phase 3 : Hooks Personnalisés (1j)
- [ ] Créer `hooks/useProducts.ts`
- [ ] Créer `hooks/useProductFilters.ts`
- [ ] Créer `hooks/useProductActions.ts`
- [ ] Créer `hooks/useProductExport.ts`

### Phase 4 : Types & Utils (0.5j)
- [ ] Extraire types dans `types/product.ts`
- [ ] Extraire constants dans `constants/products.ts`
- [ ] Extraire utils dans `utils/products.ts`

### Phase 5 : Optimisation (1j)
- [ ] Ajouter `React.memo` aux composants
- [ ] Optimiser re-renders
- [ ] Optimiser bundle size
- [ ] Tests unitaires
- [ ] Tests E2E

---

## Structure Cible

```
apps/frontend/src/app/(dashboard)/dashboard/products/
├── page.tsx (< 200 lignes - Server Component)
├── ProductsPageClient.tsx (< 300 lignes - Client Component)
└── components/
    ├── modals/
    │   ├── CreateProductModal.tsx (< 300 lignes)
    │   ├── EditProductModal.tsx (< 300 lignes)
    │   ├── DeleteProductModal.tsx (< 200 lignes)
    │   ├── BulkActionsModal.tsx (< 200 lignes)
    │   ├── ExportModal.tsx (< 200 lignes)
    │   └── ImportModal.tsx (< 300 lignes)
    ├── filters/
    │   ├── ProductFilters.tsx (< 300 lignes)
    │   ├── ProductSearch.tsx (< 200 lignes)
    │   └── ProductSort.tsx (< 200 lignes)
    ├── table/
    │   ├── ProductsTable.tsx (< 300 lignes)
    │   ├── ProductsGrid.tsx (< 300 lignes)
    │   ├── ProductCard.tsx (< 200 lignes)
    │   └── ProductRow.tsx (< 200 lignes)
    └── forms/
        ├── ProductForm.tsx (< 300 lignes)
        ├── ProductImageUpload.tsx (< 200 lignes)
        └── ProductVariantsForm.tsx (< 300 lignes)
```

---

## Critères d'Acceptation

- [ ] Page principale < 200 lignes
- [ ] Tous les composants < 300 lignes
- [ ] Toutes les fonctionnalités fonctionnent
- [ ] Performance améliorée (bundle size réduit)
- [ ] Tests unitaires passent
- [ ] Tests E2E passent
- [ ] Build Vercel OK
- [ ] Aucune régression fonctionnelle

---

## Fichiers à Modifier/Créer

### Créer
- `apps/frontend/src/app/(dashboard)/dashboard/products/components/modals/`
- `apps/frontend/src/app/(dashboard)/dashboard/products/components/filters/`
- `apps/frontend/src/app/(dashboard)/dashboard/products/components/table/`
- `apps/frontend/src/app/(dashboard)/dashboard/products/components/forms/`
- `apps/frontend/src/app/(dashboard)/dashboard/products/hooks/useProducts.ts`
- `apps/frontend/src/app/(dashboard)/dashboard/products/hooks/useProductFilters.ts`
- `apps/frontend/src/app/(dashboard)/dashboard/products/hooks/useProductActions.ts`
- `apps/frontend/src/app/(dashboard)/dashboard/products/types/product.ts`
- `apps/frontend/src/app/(dashboard)/dashboard/products/constants/products.ts`

### Modifier
- `apps/frontend/src/app/(dashboard)/dashboard/products/page.tsx` (refactoring complet)

---

## Dépendances

- ✅ tRPC API (`trpc.product.*`)
- ✅ Composants UI existants
- ✅ Types existants

---

## Notes Techniques

- **Architecture** : Server Component pour page.tsx, Client Component pour interactions
- **Performance** : Utiliser `React.memo` et `useMemo`/`useCallback`
- **Tests** : Tests unitaires pour chaque composant, tests E2E pour le flux complet
- **Migration** : Faire en plusieurs PRs pour faciliter la review

---

## Risques

1. **Régressions** : Risque de casser des fonctionnalités existantes
   - **Mitigation** : Tests E2E avant/après, review code approfondie

2. **Performance** : Risque de dégrader les performances
   - **Mitigation** : Profiling avant/après, optimisations ciblées

---

## Références

- Code actuel : `apps/frontend/src/app/(dashboard)/dashboard/products/page.tsx`
- Bible Luneo : Composants < 300 lignes
- Exemple refactoring : `apps/frontend/src/app/(dashboard)/dashboard/orders/` (architecture similaire)


