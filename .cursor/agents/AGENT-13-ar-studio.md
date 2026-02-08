# AGENT-13: AR Studio

**Objectif**: Rendre le module AR Studio production-ready en corrigeant les routes API cassées et supprimant Supabase

**Priorité**: P2 (Important)  
**Complexité**: 4/5  
**Estimation**: 2 semaines  
**Dépendances**: AGENT-01 (TypeScript), AGENT-05 (Auth)

---

## 📋 SCOPE

### Contexte Phase 12.6 + Phase 14

Les hooks AR Studio appellent des routes `/api/ar-studio/*` supprimées et des pages utilisent Supabase auth.

### Fichiers à Corriger

#### Phase 12.6 - AR Studio References

- `apps/frontend/src/app/(dashboard)/dashboard/ar-studio/preview/hooks/useARPreview.ts`
  - `/api/ar-studio/preview` → `api.post('/api/v1/ar/preview', data)`
  - `/api/ar-studio/models` → `api.get('/api/v1/ar/models')`
  - `/api/ar-studio/qr-code` → `api.post('/api/v1/ar/qr-code', data)`
  - Tous les `/api/ar-studio/*` → backend NestJS `/api/v1/ar/*`

#### Phase 14 - Supabase Removal

- `apps/frontend/src/app/(dashboard)/dashboard/ar-studio/page.tsx` : supprimer Supabase
- `apps/frontend/src/app/(dashboard)/dashboard/ar-studio/preview/page.tsx` : supprimer Supabase
- `apps/frontend/src/app/(dashboard)/dashboard/ar-studio/library/page.tsx` : supprimer Supabase
- `apps/frontend/src/app/(dashboard)/dashboard/ar-studio/integrations/page.tsx` : supprimer Supabase
- `apps/frontend/src/app/(dashboard)/dashboard/ar-studio/collaboration/page.tsx` : supprimer Supabase

### Endpoints Backend Nécessaires

Si non existants, les créer dans `apps/backend/src/modules/ar/` :
```
GET    /api/v1/ar/models              - Liste modèles 3D
POST   /api/v1/ar/models              - Upload modèle
GET    /api/v1/ar/models/:id          - Détails modèle
DELETE /api/v1/ar/models/:id          - Supprimer modèle
POST   /api/v1/ar/preview             - Générer preview AR
POST   /api/v1/ar/qr-code             - Générer QR code AR
POST   /api/v1/ar/convert-2d-to-3d    - Conversion 2D → 3D
POST   /api/v1/ar/export              - Export AR (USDZ, GLB)
```

---

## ✅ TÂCHES

### Phase 1: Hook Migration (2 jours)

- [ ] Migrer `useARPreview.ts` → backend NestJS endpoints
- [ ] Identifier et migrer tout hook/service AR avec `/api/ar-studio/*`

### Phase 2: Supabase Removal (1 jour)

- [ ] Supprimer Supabase de toutes les pages AR Studio
- [ ] Utiliser auth cookie-based

### Phase 3: Backend Endpoints (3 jours)

- [ ] Vérifier quels endpoints AR existent déjà dans le backend
- [ ] Créer les endpoints manquants dans `apps/backend/src/modules/ar/`
- [ ] Ajouter les endpoints au client API `endpoints.ar.*` si nécessaire

### Phase 4: Testing (2 jours)

- [ ] Tester preview AR
- [ ] Tester upload modèle 3D
- [ ] Tester QR code generation
- [ ] Build sans erreur

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 appel `fetch('/api/ar-studio/...')`**
- [ ] **0 import `@/lib/supabase`** dans AR Studio
- [ ] AR preview fonctionne
- [ ] Build réussit

---

## 🔗 RESSOURCES

- Hook AR : `apps/frontend/src/app/(dashboard)/dashboard/ar-studio/preview/hooks/useARPreview.ts`
- Backend AR : `apps/backend/src/modules/ar/` (si existant)
