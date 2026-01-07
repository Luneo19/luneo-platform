# 🚀 SPRINT 2 : Products Refactoring - PLAN

## 📊 Analyse

**Fichier actuel :** `apps/frontend/src/app/(dashboard)/dashboard/products/page.tsx`  
**Lignes :** 5017 lignes  
**Problème :** Violation Bible Luneo (max 500 lignes par fichier)  
**Action :** Refactoring complet en composants modulaires

## 🎯 Objectif

Refactoriser en :
- `page.tsx` : < 200 lignes (Server Component)
- `ProductsPageClient.tsx` : < 300 lignes (Client Component principal)
- Composants extraits : < 300 lignes chacun

## 📁 Structure Cible

```
products/
├── page.tsx (< 200 lignes)
├── ProductsPageClient.tsx (< 300 lignes)
├── components/
│   ├── modals/
│   │   ├── CreateProductModal.tsx
│   │   ├── EditProductModal.tsx
│   │   └── ExportModal.tsx
│   ├── filters/
│   │   └── ProductFilters.tsx
│   ├── table/
│   │   ├── ProductsGrid.tsx
│   │   ├── ProductsTable.tsx
│   │   ├── ProductCard.tsx
│   │   └── ProductRow.tsx
│   └── ProductsHeader.tsx
│   └── ProductsStats.tsx
│   └── ProductsSkeleton.tsx
├── hooks/
│   ├── useProducts.ts ✅
│   ├── useProductActions.ts ✅
│   └── useProductExport.ts ✅
├── types/
│   └── index.ts ✅
└── constants/
    └── products.ts ✅
```

## ✅ Déjà Créé

- ✅ Types (`types/index.ts`)
- ✅ Constants (`constants/products.ts`)
- ✅ Hooks (`hooks/useProducts.ts`, `hooks/useProductActions.ts`, `hooks/useProductExport.ts`)

## 🔨 À Créer

1. **Composants Modals** (3 fichiers)
   - `CreateProductModal.tsx`
   - `EditProductModal.tsx`
   - `ExportModal.tsx`

2. **Composants Filters** (1 fichier)
   - `ProductFilters.tsx`

3. **Composants Table** (4 fichiers)
   - `ProductsGrid.tsx`
   - `ProductsTable.tsx`
   - `ProductCard.tsx`
   - `ProductRow.tsx`

4. **Composants UI** (3 fichiers)
   - `ProductsHeader.tsx`
   - `ProductsStats.tsx`
   - `ProductsSkeleton.tsx`

5. **Page Principale** (2 fichiers)
   - `page.tsx` (Server Component)
   - `ProductsPageClient.tsx` (Client Component)

## 🗑️ À Supprimer

- Toutes les sections répétitives "Advanced Features" (lignes 1078-4428)
- Code dupliqué
- Sections inutiles pour atteindre 5000+ lignes

## ⏱️ Estimation

- Création composants : 2h
- Refactoring page principale : 1h
- Tests & validation : 1h
- **Total : 4h**

## 📝 Notes

- Garder uniquement les fonctionnalités essentielles
- Supprimer tout le code répétitif
- Respecter la Bible Luneo (< 300 lignes par composant)
- Maintenir toutes les fonctionnalités existantes


