# 🔧 FIX - Client Reference Manifest Error

**Erreur** : `Invariant: Expected clientReferenceManifest to be defined. This is a bug in Next.js.`

**Date** : Janvier 2025

---

## 🔍 CAUSE IDENTIFIÉE

Le problème venait de :
1. **Pages avec `'use client'` alors qu'elles devaient être Server Components**
   - `apps/frontend/src/app/test-homepage/page.tsx`
   - `apps/frontend/src/app/(public)/page-new.tsx`

2. **Cache Next.js corrompu** (`.next`)

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. ✅ Cache nettoyé
```bash
rm -rf apps/frontend/.next
rm -rf apps/frontend/node_modules/.cache
```

### 2. ✅ Pages corrigées

**Avant** (❌ Incorrect) :
```tsx
'use client';  // ← PROBLÈME : Page avec 'use client'

export default function HomePage() {
  return <main>...</main>;
}
```

**Après** (✅ Correct) :
```tsx
// Pas de 'use client' - C'est un Server Component

export default function HomePage() {
  return <main>...</main>;
}
```

**Raison** : 
- Dans Next.js App Router, les **pages** sont des **Server Components** par défaut
- Seuls les **composants enfants** qui utilisent des hooks React ou des interactions doivent être des Client Components
- Tous nos composants marketing (`HeroSection`, etc.) ont déjà `'use client'` donc c'est correct

---

## 🚀 PROCHAINES ÉTAPES

### 1. Arrêter le serveur actuel
```bash
# Dans le terminal où tourne npm run dev
Ctrl+C
```

### 2. Relancer le serveur
```bash
cd apps/frontend
npm run dev
```

**IMPORTANT** : Attendre que la compilation initiale soit terminée (message `✓ Ready`)

### 3. Tester la page
```
http://localhost:3000/test-homepage
```

---

## 🔍 ARCHITECTURE CORRECTE

```
Page (Server Component - pas de 'use client')
  └─ ErrorBoundary (peut être Server ou Client)
      └─ main
          ├─ HeroSection ('use client') ✅
          ├─ FeaturesSection ('use client') ✅
          └─ ... (tous avec 'use client') ✅
```

**Règle** :
- ✅ Page = Server Component (pas de 'use client')
- ✅ Composants avec animations/interactions = Client Components ('use client')

---

## 📝 FICHIERS MODIFIÉS

- ✅ `apps/frontend/src/app/test-homepage/page.tsx` - Retiré `'use client'`
- ✅ `apps/frontend/src/app/(public)/page-new.tsx` - Retiré `'use client'`

---

## ⚠️ SI L'ERREUR PERSISTE

### Option 1 : Rebuild complet
```bash
cd apps/frontend
rm -rf .next node_modules/.cache
npm install
npm run dev
```

### Option 2 : Vérifier Next.js version
L'erreur mentionne "Next.js 15.5.7 (outdated)". Mettre à jour :
```bash
cd apps/frontend
npm install next@latest
```

### Option 3 : Vérifier les erreurs de build
```bash
cd apps/frontend
npm run build 2>&1 | head -100
```

---

## ✅ STATUT

- [x] Cache .next supprimé
- [x] Cache node_modules supprimé
- [x] Pages corrigées (retiré 'use client')
- [ ] Serveur redémarré (à faire manuellement)
- [ ] Test réussi (à valider)

---

**Note** : Après ces corrections, l'erreur `clientReferenceManifest` devrait être résolue car Next.js peut maintenant correctement générer les manifestes client/server.
