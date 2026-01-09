# 📋 FICHE PROJET : Notifications - Résolution TODO

## Contexte
- **Route** : `/notifications`
- **Fichier** : `apps/frontend/src/app/(dashboard)/notifications/page.tsx`
- **État actuel** : 🟢 Fonctionnel mais 3 TODO non résolus
- **Objectif** : Résoudre les 3 TODO identifiés
- **Priorité** : P1 (Important)
- **Effort estimé** : 1 jour

---

## TODO Identifiés

1. **Ligne 494** : `avgReadTime: 0, // TODO: Calculate from read_at - created_at`
2. **Ligne 1229** : `// TODO: Implement CSV export`
3. **Ligne 1240** : `// TODO: Implement JSON export`

---

## User Stories

### En tant qu'utilisateur
- [ ] Je veux voir le temps moyen de lecture des notifications
- [ ] Je veux exporter mes notifications en CSV
- [ ] Je veux exporter mes notifications en JSON

### En tant qu'admin
- [ ] Je veux analyser les statistiques de lecture des notifications

---

## Tâches Techniques

### TODO 1 : Calculer avgReadTime (2h)

#### Backend (si nécessaire)
- [ ] Vérifier si `read_at` est disponible dans la réponse API
- [ ] Créer endpoint pour calculer avgReadTime (si nécessaire)

#### Frontend
- [ ] Calculer `avgReadTime` dans le composant
- [ ] Utiliser `read_at - created_at` pour chaque notification lue
- [ ] Calculer la moyenne
- [ ] Afficher dans les stats
- [ ] Tests unitaires

**Code à implémenter :**
```typescript
const avgReadTime = useMemo(() => {
  const readNotifications = allNotifications.filter(n => n.read && n.read_at);
  if (readNotifications.length === 0) return 0;
  
  const totalTime = readNotifications.reduce((sum, n) => {
    const readAt = new Date(n.read_at);
    const createdAt = new Date(n.created_at);
    return sum + (readAt.getTime() - createdAt.getTime());
  }, 0);
  
  return totalTime / readNotifications.length; // en millisecondes
}, [allNotifications]);
```

### TODO 2 : Export CSV (2h)

#### Frontend
- [ ] Créer fonction `exportToCSV`
- [ ] Convertir notifications en format CSV
- [ ] Télécharger le fichier
- [ ] Ajouter bouton export CSV
- [ ] Tests unitaires

**Code à implémenter :**
```typescript
const exportToCSV = useCallback(() => {
  const headers = ['ID', 'Type', 'Title', 'Message', 'Read', 'Priority', 'Created At', 'Read At'];
  const rows = filteredNotifications.map(n => [
    n.id,
    n.type,
    n.title,
    n.message,
    n.read ? 'Yes' : 'No',
    n.priority,
    n.created_at,
    n.read_at || '',
  ]);
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notifications-${new Date().toISOString()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}, [filteredNotifications]);
```

### TODO 3 : Export JSON (1h)

#### Frontend
- [ ] Créer fonction `exportToJSON`
- [ ] Convertir notifications en format JSON
- [ ] Télécharger le fichier
- [ ] Ajouter bouton export JSON
- [ ] Tests unitaires

**Code à implémenter :**
```typescript
const exportToJSON = useCallback(() => {
  const data = filteredNotifications.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    archived: n.archived,
    priority: n.priority,
    created_at: n.created_at,
    read_at: n.read_at,
    action_url: n.action_url,
    action_label: n.action_label,
    metadata: n.metadata,
  }));
  
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notifications-${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}, [filteredNotifications]);
```

---

## Structure des Modifications

```
apps/frontend/src/app/(dashboard)/notifications/
├── page.tsx (modifier - résoudre TODO)
└── utils/
    └── export.ts (créer - fonctions export)
```

---

## Critères d'Acceptation

- [ ] `avgReadTime` calculé et affiché correctement
- [ ] Export CSV fonctionne
- [ ] Export JSON fonctionne
- [ ] Boutons export visibles et fonctionnels
- [ ] Tests unitaires passent
- [ ] Aucune régression
- [ ] Build Vercel OK

---

## Fichiers à Modifier/Créer

### Modifier
- `apps/frontend/src/app/(dashboard)/notifications/page.tsx`
  - Ligne 494 : Calculer `avgReadTime`
  - Ligne 1229 : Implémenter export CSV
  - Ligne 1240 : Implémenter export JSON

### Créer (optionnel)
- `apps/frontend/src/app/(dashboard)/notifications/utils/export.ts`

---

## Dépendances

- ✅ tRPC API (`trpc.notification.*`)
- ✅ Données notifications (déjà disponibles)
- ✅ Composants UI existants

---

## Notes Techniques

- **Performance** : Utiliser `useMemo` pour le calcul de `avgReadTime`
- **Export** : Utiliser Blob API pour le téléchargement
- **Tests** : Tests unitaires pour chaque fonction d'export
- **UX** : Ajouter toast de confirmation après export

---

## Références

- Code actuel : `apps/frontend/src/app/(dashboard)/notifications/page.tsx`
- Exemple export : `apps/frontend/src/app/(dashboard)/dashboard/products/` (pour référence)



