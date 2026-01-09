# 📋 FICHE PROJET : Dashboard Principal

## Contexte
- **Route** : `/dashboard`
- **Fichier** : `apps/frontend/src/app/(dashboard)/dashboard/page.tsx`
- **État actuel** : 🔴 Page vide (0 lignes)
- **Objectif** : Créer le dashboard principal avec KPIs et analytics
- **Priorité** : P0 (Critique)
- **Effort estimé** : 3 jours

---

## User Stories

### En tant qu'utilisateur connecté
- [ ] Je veux voir un dashboard avec mes KPIs principaux (revenus, commandes, produits)
- [ ] Je veux voir mes statistiques de performance (graphiques)
- [ ] Je veux voir mes notifications récentes
- [ ] Je veux accéder rapidement aux actions principales (quick actions)
- [ ] Je veux voir l'activité récente sur mes produits

### En tant qu'admin
- [ ] Je veux voir les statistiques globales de la plateforme
- [ ] Je veux voir les alertes système importantes

---

## Tâches Techniques

### Backend
- [ ] Vérifier que `trpc.analytics.getDashboard` existe
- [ ] Créer endpoint pour notifications récentes (si manquant)
- [ ] Créer endpoint pour activité récente (si manquant)
- [ ] Tests unitaires endpoints
- [ ] Tests E2E endpoints

### Frontend
- [ ] Créer composant `DashboardPage` (Server Component)
- [ ] Créer composant `DashboardKPIs` (< 300 lignes)
- [ ] Créer composant `DashboardCharts` (< 300 lignes)
- [ ] Créer composant `RecentNotifications` (< 300 lignes)
- [ ] Créer composant `QuickActions` (< 300 lignes)
- [ ] Créer composant `RecentActivity` (< 300 lignes)
- [ ] Connecter API `trpc.analytics.getDashboard`
- [ ] Ajouter loading states
- [ ] Ajouter error boundaries
- [ ] Tests composants
- [ ] Tests E2E

### Intégration
- [ ] Vérifier CORS
- [ ] Vérifier authentification
- [ ] Vérifier autorisations
- [ ] Optimiser performances (memoization)
- [ ] Responsive design
- [ ] Accessibilité (a11y)

---

## Structure des Composants

```
apps/frontend/src/app/(dashboard)/dashboard/
├── page.tsx (Server Component - < 100 lignes)
└── components/
    ├── DashboardKPIs.tsx (< 300 lignes)
    ├── DashboardCharts.tsx (< 300 lignes)
    ├── RecentNotifications.tsx (< 300 lignes)
    ├── QuickActions.tsx (< 300 lignes)
    └── RecentActivity.tsx (< 300 lignes)
```

---

## Critères d'Acceptation

- [ ] Dashboard affiche les KPIs principaux
- [ ] Graphiques affichent des données réelles
- [ ] Notifications récentes fonctionnent
- [ ] Quick actions redirigent correctement
- [ ] Activité récente s'affiche
- [ ] Loading states présents
- [ ] Error states présents
- [ ] Tests passent
- [ ] Build Vercel OK
- [ ] Performance < 3s load time

---

## Fichiers à Modifier/Créer

### Créer
- `apps/frontend/src/app/(dashboard)/dashboard/page.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/components/DashboardKPIs.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/components/DashboardCharts.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/components/RecentNotifications.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/components/QuickActions.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/components/RecentActivity.tsx`

### Modifier (si nécessaire)
- `apps/backend/src/modules/analytics/analytics.router.ts` (vérifier endpoints)

---

## Dépendances

- ✅ Analytics API (`trpc.analytics.getDashboard`)
- ⚠️ Notifications API (vérifier si existe)
- ⚠️ Activity API (vérifier si existe)

---

## Notes Techniques

- Utiliser Server Component pour le fetch initial
- Utiliser Client Components pour les interactions
- Respecter la Bible Luneo (< 300 lignes par composant)
- Utiliser `ErrorBoundary` pour la gestion d'erreurs
- Utiliser `Suspense` pour le loading

---

## Références

- Page Analytics existante : `apps/frontend/src/app/(dashboard)/dashboard/analytics/page.tsx`
- Composants UI : `apps/frontend/src/components/ui/`



