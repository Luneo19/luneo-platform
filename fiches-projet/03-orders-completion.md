# 📋 FICHE PROJET : Orders - Complétion Fonctionnalités

## Contexte
- **Route** : `/dashboard/orders`
- **Fichier** : `apps/frontend/src/app/(dashboard)/dashboard/orders/page.tsx`
- **État actuel** : ⚠️ Server Component avec données mais actions limitées
- **Objectif** : Ajouter toutes les actions CRUD manquantes
- **Priorité** : P0 (Critique)
- **Effort estimé** : 4 jours

---

## Problème Actuel

- ✅ Affichage des commandes fonctionne
- ✅ Filtres fonctionnent
- ✅ Pagination fonctionne
- ❌ Pas de création de commande
- ❌ Pas de modification de statut
- ❌ Pas d'actions bulk
- ❌ Pas d'export

---

## User Stories

### En tant qu'utilisateur
- [ ] Je veux créer une nouvelle commande manuellement
- [ ] Je veux modifier le statut d'une commande
- [ ] Je veux modifier le statut de plusieurs commandes en une fois
- [ ] Je veux exporter mes commandes en CSV/JSON
- [ ] Je veux voir les détails complets d'une commande
- [ ] Je veux imprimer une commande

### En tant qu'admin
- [ ] Je veux voir toutes les commandes (pas seulement les miennes)
- [ ] Je veux modifier n'importe quelle commande

---

## Tâches Techniques

### Backend
- [ ] Créer endpoint `trpc.order.create` (si manquant)
- [ ] Créer endpoint `trpc.order.updateStatus` (si manquant)
- [ ] Créer endpoint `trpc.order.bulkUpdateStatus` (si manquant)
- [ ] Créer endpoint `trpc.order.export` (si manquant)
- [ ] Créer DTOs et validations Zod
- [ ] Tests unitaires endpoints
- [ ] Tests E2E endpoints

### Frontend
- [ ] Créer composant `CreateOrderModal.tsx` (< 300 lignes)
- [ ] Créer composant `UpdateOrderStatusModal.tsx` (< 200 lignes)
- [ ] Créer composant `BulkActionsModal.tsx` (< 200 lignes)
- [ ] Créer composant `ExportOrdersModal.tsx` (< 200 lignes)
- [ ] Créer composant `OrderDetailDialog.tsx` (améliorer existant)
- [ ] Ajouter mutations tRPC
  - [ ] `createOrderMutation`
  - [ ] `updateStatusMutation`
  - [ ] `bulkUpdateStatusMutation`
- [ ] Ajouter actions dans `OrdersPageClient`
- [ ] Ajouter validation Zod pour formulaires
- [ ] Ajouter loading states
- [ ] Ajouter error handling
- [ ] Tests composants
- [ ] Tests E2E

### Intégration
- [ ] Vérifier CORS
- [ ] Vérifier authentification
- [ ] Vérifier autorisations (admin vs user)
- [ ] Optimiser performances
- [ ] Responsive design

---

## Structure des Composants

```
apps/frontend/src/app/(dashboard)/dashboard/orders/
├── page.tsx (Server Component - OK)
├── orders-page-client.tsx (Client Component - modifier)
├── orders-page-skeleton.tsx (OK)
└── components/
    ├── order-detail-dialog.tsx (améliorer)
    ├── order-row.tsx (OK)
    ├── orders-filters.tsx (OK)
    ├── orders-header.tsx (modifier - ajouter boutons)
    ├── orders-list.tsx (OK)
    ├── orders-stats.tsx (OK)
    ├── CreateOrderModal.tsx (créer - < 300 lignes)
    ├── UpdateOrderStatusModal.tsx (créer - < 200 lignes)
    ├── BulkActionsModal.tsx (créer - < 200 lignes)
    └── ExportOrdersModal.tsx (créer - < 200 lignes)
```

---

## Critères d'Acceptation

- [ ] Formulaire création commande fonctionne
- [ ] Modification statut fonctionne
- [ ] Actions bulk fonctionnent
- [ ] Export CSV/JSON fonctionne
- [ ] Détails commande complets
- [ ] Validation formulaires (Zod)
- [ ] Gestion d'erreurs complète
- [ ] Loading states présents
- [ ] Tests passent
- [ ] Build Vercel OK

---

## Fichiers à Modifier/Créer

### Créer
- `apps/frontend/src/app/(dashboard)/dashboard/orders/components/CreateOrderModal.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/orders/components/UpdateOrderStatusModal.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/orders/components/BulkActionsModal.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/orders/components/ExportOrdersModal.tsx`

### Modifier
- `apps/frontend/src/app/(dashboard)/dashboard/orders/orders-page-client.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/orders/components/orders-header.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/orders/components/order-detail-dialog.tsx`

### Backend (si nécessaire)
- `apps/backend/src/modules/order/order.router.ts`
- `apps/backend/src/modules/order/order.service.ts`

---

## Dépendances

- ✅ Supabase (données existantes)
- ⚠️ tRPC endpoints (vérifier/créer)
- ✅ Composants UI existants
- ✅ Types existants

---

## Notes Techniques

- **Architecture** : Server Component pour fetch initial, Client Component pour interactions
- **Validation** : Utiliser Zod pour tous les formulaires
- **Mutations** : Utiliser tRPC mutations avec optimistic updates
- **Performance** : Optimiser avec `React.memo` et `useMemo`

---

## Références

- Code actuel : `apps/frontend/src/app/(dashboard)/dashboard/orders/`
- Exemple similaire : `apps/frontend/src/app/(dashboard)/dashboard/products/` (pour les modals)


