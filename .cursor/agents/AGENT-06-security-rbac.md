# AGENT-06: Sécurité & RBAC

**Objectif**: Renforcer la sécurité et corriger les hooks de settings security qui appellent des routes supprimées

**Priorité**: P1 (Critique)  
**Complexité**: 3/5  
**Estimation**: 1 semaine  
**Dépendances**: AGENT-01 (TypeScript), AGENT-05 (Auth)

---

## 📋 SCOPE

### Contexte Phase 12.6 (Security Settings) + Phase 16.2

Les hooks de la page security appellent des routes `/api/settings/*` supprimées.

### Fichiers à Corriger

#### Security Settings Hooks

- `apps/frontend/src/app/(dashboard)/dashboard/security/hooks/useTwoFactor.ts`
  - `/api/settings/2fa` → `endpoints.auth.setup2FA()` / `endpoints.auth.verify2FA()` / `endpoints.auth.disable2FA()`
- `apps/frontend/src/app/(dashboard)/dashboard/security/hooks/useSessions.ts`
  - `/api/settings/sessions` → `api.get('/api/v1/security/sessions')` ou créer endpoint
- `apps/frontend/src/app/(dashboard)/dashboard/security/hooks/useSecuritySettings.ts`
  - `/api/settings/password` → `api.post('/api/v1/auth/change-password', data)`

#### Phase 16.2 - TODO Actions Security

- `apps/frontend/src/components/settings/SecurityTab.tsx` : Wire session revocation to backend
- `apps/frontend/src/components/settings/DeleteAccountModal.tsx` : Wire to `/api/v1/security/gdpr/delete-account`
- `apps/frontend/src/components/settings/ExportModal.tsx` : Wire to backend export endpoint
- `apps/frontend/src/components/settings/NotificationsTab.tsx` : Wire notification preferences

#### API Keys

- `apps/frontend/src/lib/hooks/useApiKeys.ts`
  - `/api/api-keys` → `endpoints.publicApi.keys.list()`
  - `/api/api-keys` (POST) → `endpoints.publicApi.keys.create(data)`
  - `/api/api-keys/[id]` (DELETE) → `endpoints.publicApi.keys.delete(id)`

### API Endpoints Backend (existants)

```
endpoints.auth.setup2FA()                // POST /api/v1/auth/2fa/setup
endpoints.auth.verify2FA(token)          // POST /api/v1/auth/2fa/verify
endpoints.auth.disable2FA()              // POST /api/v1/auth/2fa/disable

endpoints.publicApi.keys.list()          // GET /api/v1/api-keys
endpoints.publicApi.keys.create(data)    // POST /api/v1/api-keys
endpoints.publicApi.keys.delete(id)      // DELETE /api/v1/api-keys/:id
endpoints.publicApi.keys.regenerate(id)  // POST /api/v1/api-keys/:id/regenerate
```

---

## ✅ TÂCHES

### Phase 1: Security Hooks Migration (1 jour)

- [ ] Migrer `useTwoFactor.ts` → `endpoints.auth.setup2FA/verify2FA/disable2FA`
- [ ] Migrer `useSessions.ts` → backend security sessions endpoint
- [ ] Migrer `useSecuritySettings.ts` → backend change-password endpoint

### Phase 2: API Keys Hook (0.5 jour)

- [ ] Migrer `useApiKeys.ts` → `endpoints.publicApi.keys.*`

### Phase 3: Security Settings Components (1 jour)

- [ ] Wire `SecurityTab.tsx` session revocation
- [ ] Wire `DeleteAccountModal.tsx` → `/api/v1/security/gdpr/delete-account`
- [ ] Wire `ExportModal.tsx` → backend data export
- [ ] Wire `NotificationsTab.tsx` → backend notification preferences

### Phase 4: RBAC Implementation (2 jours)

- [ ] Vérifier que les guards backend sont en place
- [ ] Implémenter côté frontend : vérification rôles avant affichage/actions
- [ ] `rbac.ts` doit appeler le backend (plus Supabase)

### Phase 5: Testing (1 jour)

- [ ] Tester 2FA setup/verify/disable
- [ ] Tester change password
- [ ] Tester API keys CRUD
- [ ] Tester RBAC (différents rôles)
- [ ] Build sans erreur

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 appel `fetch('/api/settings/...')`** ou `fetch('/api/api-keys/...')`
- [ ] **0 import `@/lib/supabase`** dans les fichiers security
- [ ] 2FA fonctionne end-to-end
- [ ] API keys CRUD fonctionne
- [ ] RBAC vérifié
- [ ] Build réussit

---

## 🔗 RESSOURCES

- API Client : `apps/frontend/src/lib/api/client.ts`
- Backend Security : `apps/backend/src/modules/security/`
- Backend Auth : `apps/backend/src/modules/auth/`
