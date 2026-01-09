# 🔧 FIX - Internal Server Error

**Date** : Janvier 2025

---

## 🔍 PROBLÈME IDENTIFIÉ

**Erreur** : `Internal Server Error` lors de l'accès à `/test-homepage`

**Cause** : `ErrorBoundary` est un **Client Component** (`'use client'`), mais il était utilisé directement dans une **Server Component** (la page).

Dans Next.js App Router :
- ❌ Un Server Component **ne peut pas** importer directement un Client Component
- ✅ Un Server Component **peut** passer un Client Component comme `children` ou prop
- ✅ Mais dans ce cas, il faut que le Client Component soit déjà dans l'arbre de composants

---

## ✅ SOLUTION APPLIQUÉE

### Avant (❌ Incorrect) :
```tsx
// page.tsx (Server Component)
import { ErrorBoundary } from '@/components/ErrorBoundary'; // Client Component

export default function HomePage() {
  return (
    <ErrorBoundary>  {/* ❌ Problème : Client Component dans Server Component */}
      <main>...</main>
    </ErrorBoundary>
  );
}
```

### Après (✅ Correct) :
```tsx
// page.tsx (Server Component)
// Pas d'import ErrorBoundary

export default function HomePage() {
  return (
    <main>  {/* ✅ Directement les composants, pas besoin d'ErrorBoundary ici */}
      <HeroSection />  {/* Déjà Client Component avec 'use client' */}
      ...
    </main>
  );
}
```

**Raison** :
- Les composants enfants (`HeroSection`, etc.) sont déjà des Client Components
- Ils gèrent leurs propres erreurs ou peuvent être wrappés dans `ErrorBoundary` au niveau du layout si nécessaire
- Pour une page simple, on n'a pas besoin d'ErrorBoundary au niveau de la page

---

## 📝 FICHIERS MODIFIÉS

- ✅ `apps/frontend/src/app/test-homepage/page.tsx` - Retiré `ErrorBoundary`
- ✅ `apps/frontend/src/app/(public)/page-new.tsx` - Retiré `ErrorBoundary`

---

## 🚀 PROCHAINES ÉTAPES

1. **Redémarrer le serveur** (si nécessaire) :
   ```bash
   cd apps/frontend
   npm run dev
   ```

2. **Tester la page** :
   ```
   http://localhost:3000/test-homepage
   ```

---

## 💡 NOTES

### Si vous voulez garder ErrorBoundary

Si vous voulez vraiment un `ErrorBoundary` au niveau de la page, il faut le mettre dans le **layout** :

```tsx
// app/(public)/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function Layout({ children }) {
  return (
    <ErrorBoundary level="page">
      {children}  {/* Les pages passent comme children */}
    </ErrorBoundary>
  );
}
```

Mais dans la plupart des cas, ce n'est pas nécessaire car :
- Les composants individuels gèrent leurs erreurs
- Next.js a déjà un error boundary global
- Les composants avec `'use client'` peuvent avoir leurs propres boundaries

---

## ✅ STATUT

- [x] ErrorBoundary retiré des pages
- [x] Pages simplifiées (Server Components purs)
- [ ] Serveur redémarré (à faire manuellement si nécessaire)
- [ ] Test réussi (à valider)

---

**Note** : Cette correction devrait résoudre l'erreur `Internal Server Error`.
