# AGENT-05: Auth Flow Complet

**Objectif**: Finaliser le flux d'authentification complet et supprimer TOUTES les dépendances Supabase auth du frontend

**Priorité**: P1 (Critique)  
**Complexité**: 2/5  
**Estimation**: 3-5 jours  
**Dépendances**: AGENT-01 (TypeScript)

---

## 📋 SCOPE

### Contexte Phase 12.1 + Phase 14

Des fichiers frontend appellent encore des routes `/api/auth/*` supprimées ou importent `@/lib/supabase/*` pour l'authentification. **TOUT** doit passer par le backend NestJS via `endpoints.auth.*` depuis `@/lib/api/client`.

### Fichiers à Corriger

#### Phase 12.1 - Auth/Store References (routes `/api/xxx` cassées)

- `apps/frontend/src/store/auth.ts` : appelle `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`
  - **Action** : Remplacer par `endpoints.auth.login()`, `endpoints.auth.register()`, `endpoints.auth.logout()`
- `apps/frontend/src/lib/auth/get-user.ts` : appelle `/api/auth/me`
  - **Action** : Remplacer par `endpoints.auth.me()`
- `apps/frontend/src/app/(dashboard)/layout.tsx` : vérifier migration `/api/auth/me`

#### Phase 14.1 - Supabase Auth Removal (pages dashboard)

Pages qui utilisent `createClient` depuis `@/lib/supabase/server` pour l'auth :
- `apps/frontend/src/app/(dashboard)/dashboard/settings/page.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/team/page.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/billing/page.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/library/import/page.tsx`
- Toute autre page dashboard avec import `@/lib/supabase/*`

**Action** : Remplacer par le pattern cookie-based auth :
```typescript
// ❌ AVANT (Supabase)
import { createClient } from '@/lib/supabase/server';
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// ✅ APRÈS (NestJS backend)
import { endpoints } from '@/lib/api/client';
const user = await endpoints.auth.me();
// OU pour Server Components :
import { cookies } from 'next/headers';
const cookieStore = cookies();
const token = cookieStore.get('accessToken')?.value;
const res = await fetch(`${API_URL}/api/v1/auth/me`, {
  headers: { Authorization: `Bearer ${token}` },
});
const user = await res.json();
```

#### Phase 14.4 - Utility Files Supabase Auth

- `apps/frontend/src/lib/rbac.ts` : utilise Supabase pour permissions
  - **Action** : Remplacer par appel NestJS backend
- `apps/frontend/src/middleware.ts` : vérifier pas d'import Supabase

### API Endpoints Backend (NestJS) - Déjà existants

- `POST /api/v1/auth/login` → `endpoints.auth.login(credentials)`
- `POST /api/v1/auth/signup` → `endpoints.auth.register(data)`
- `POST /api/v1/auth/logout` → `endpoints.auth.logout()`
- `GET /api/v1/auth/me` → `endpoints.auth.me()`
- `POST /api/v1/auth/refresh` → `endpoints.auth.refresh(token)`
- `POST /api/v1/auth/forgot-password` → `endpoints.auth.forgotPassword(email)`
- `POST /api/v1/auth/reset-password` → `endpoints.auth.resetPassword(token, password)`
- `POST /api/v1/auth/2fa/setup` → `endpoints.auth.setup2FA()`
- `POST /api/v1/auth/2fa/verify` → `endpoints.auth.verify2FA(token)`

---

## ✅ TÂCHES

### Phase 1: Auth Store Migration (1 jour)

- [ ] Ouvrir `apps/frontend/src/store/auth.ts`
- [ ] Remplacer tous les `fetch('/api/auth/...')` par `endpoints.auth.*`
- [ ] Vérifier la gestion des tokens (httpOnly cookies, pas localStorage)
- [ ] Tester login/logout/register flow

### Phase 2: Auth Utility Migration (1 jour)

- [ ] Migrer `apps/frontend/src/lib/auth/get-user.ts` vers `endpoints.auth.me()`
- [ ] Migrer `apps/frontend/src/lib/rbac.ts` pour ne plus importer Supabase
- [ ] Vérifier `apps/frontend/src/middleware.ts` (supprimer imports Supabase)

### Phase 3: Dashboard Pages Supabase Removal (2 jours)

- [ ] Scanner tous les fichiers dans `apps/frontend/src/app/(dashboard)/` qui importent `@/lib/supabase`
- [ ] Pour chaque fichier :
  - [ ] Supprimer `import { createClient } from '@/lib/supabase/server'`
  - [ ] Remplacer par pattern cookie-based auth ou `endpoints.auth.me()`
  - [ ] Tester que la page fonctionne
- [ ] Pages prioritaires : settings, team, billing, library/import

### Phase 4: Vérification Zero Supabase Auth (0.5 jour)

- [ ] `grep -r "supabase" apps/frontend/src/ --include="*.ts" --include="*.tsx"` → 0 résultats auth
- [ ] `grep -r "@/lib/supabase" apps/frontend/src/` → identifier tout résidu
- [ ] Build OK : `cd apps/frontend && npm run build`
- [ ] Login/logout/register fonctionnent end-to-end

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Pattern Auth Recommandé

```typescript
// Hook client-side (pour 'use client' components)
import { endpoints } from '@/lib/api/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    endpoints.auth.me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const result = await endpoints.auth.login(credentials);
    // Tokens are set as httpOnly cookies by backend
    return result;
  };

  return { user, login, logout: endpoints.auth.logout };
}
```

```typescript
// Server Component pattern
import { cookies } from 'next/headers';

async function getServerUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  
  if (!res.ok) return null;
  return res.json();
}
```

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 import `@/lib/supabase`** dans les fichiers auth
- [ ] **0 appel `fetch('/api/auth/...')`** (ancien pattern route Next.js)
- [ ] Tous les flux auth utilisent `endpoints.auth.*`
- [ ] Build réussit sans erreur
- [ ] Login, register, logout, forgot-password fonctionnent
- [ ] 2FA setup/verify fonctionne

---

## 🔗 RESSOURCES

- API Client : `apps/frontend/src/lib/api/client.ts` (endpoints.auth.*)
- Auth Store : `apps/frontend/src/store/auth.ts`
- Auth Service Backend : `apps/backend/src/modules/auth/auth.service.ts`
- Auth Controller Backend : `apps/backend/src/modules/auth/auth.controller.ts`

---

## 📝 NOTES

- **ZERO SUPABASE** : Aucun import Supabase ne doit rester dans le code auth
- Les tokens sont gérés en httpOnly cookies par le backend NestJS
- `withCredentials: true` est déjà configuré dans le client API (axios)
- Le backend lit les tokens depuis les cookies en priorité
