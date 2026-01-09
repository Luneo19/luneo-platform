# 🔧 FIX - Supabase Client Error

**Date** : Janvier 2025

---

## 🔍 PROBLÈME IDENTIFIÉ

**Erreur** :
```
Error: @supabase/ssr: Your project's URL and API key are required to create a Supabase client!
```

**Cause** : 
- `AuthProvider` utilise Supabase pour l'authentification
- Les variables d'environnement `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` ne sont pas configurées
- Selon les règles du projet, l'authentification devrait utiliser le backend NestJS, pas Supabase

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Client Supabase rendu optionnel

**Fichier** : `apps/frontend/src/lib/supabase/client.ts`

**Avant** :
```tsx
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

**Après** :
```tsx
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase is not configured, return null to avoid errors
  if (!url || !key) {
    console.warn('Supabase is not configured. Using NestJS backend auth instead.');
    return null as any;
  }

  return createBrowserClient(url, key);
}
```

### 2. AuthProvider gère l'absence de Supabase

**Fichier** : `apps/frontend/src/hooks/useAuth.tsx`

**Changements** :
- ✅ Détection de la configuration Supabase
- ✅ Skip de l'authentification Supabase si non configuré
- ✅ Login utilise backend API si Supabase non disponible
- ✅ Logout utilise backend API si Supabase non disponible
- ✅ `useEffect` vérifie la configuration avant d'utiliser Supabase

---

## 📝 FICHIERS MODIFIÉS

- ✅ `apps/frontend/src/lib/supabase/client.ts` - Client optionnel
- ✅ `apps/frontend/src/hooks/useAuth.tsx` - Gestion gracieuse de l'absence de Supabase

---

## 🚀 RÉSULTAT

La page devrait maintenant se charger sans erreur, même si Supabase n'est pas configuré.

L'authentification utilisera :
- **Backend NestJS** si Supabase n'est pas configuré (recommandé)
- **Supabase** si les variables d'environnement sont présentes (legacy)

---

## 💡 PROCHAINES ÉTAPES (Optionnel)

Pour migrer complètement vers le backend NestJS :

1. **Mettre à jour les endpoints** dans `useAuth.tsx` :
   - Utiliser `/api/v1/auth/login` au lieu de Supabase
   - Utiliser `/api/v1/auth/register` au lieu de Supabase
   - Utiliser `/api/v1/auth/logout` au lieu de Supabase
   - Utiliser `/api/v1/auth/me` pour récupérer l'utilisateur

2. **Gérer les tokens JWT** :
   - Stocker les tokens dans httpOnly cookies (recommandé)
   - Ou utiliser localStorage avec gestion de refresh token

3. **Retirer Supabase complètement** :
   - Supprimer `@supabase/ssr` des dépendances
   - Supprimer les fichiers `lib/supabase/*`
   - Mettre à jour tous les composants qui utilisent Supabase

---

## ✅ STATUT

- [x] Client Supabase rendu optionnel
- [x] AuthProvider gère l'absence de Supabase
- [x] Login/Logout utilisent backend API si Supabase non disponible
- [ ] Migration complète vers backend NestJS (à faire progressivement)

---

**Note** : Cette correction permet à l'application de fonctionner immédiatement, même sans Supabase. La migration complète vers le backend NestJS peut être faite progressivement.
