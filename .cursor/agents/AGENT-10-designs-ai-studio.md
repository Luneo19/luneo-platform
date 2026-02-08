# AGENT-10: Designs & AI Studio

**Objectif**: Rendre les modules Designs et AI Studio production-ready en corrigeant toutes les routes API cassées et en supprimant les dépendances Supabase

**Priorité**: P1 (Critique)  
**Complexité**: 4/5  
**Estimation**: 2 semaines  
**Dépendances**: AGENT-01 (TypeScript), AGENT-05 (Auth)

---

## 📋 SCOPE

### Contexte Phase 12.2 + 12.5 (designs)

Plusieurs fichiers appellent des routes `/api/ai/*` et `/api/designs/*` supprimées. Tout doit passer par `endpoints.ai.*` et `endpoints.designs.*` depuis `@/lib/api/client`.

### Fichiers à Corriger

#### Phase 12.2 - AI/Generation References

- `apps/frontend/src/lib/ai/AIService.ts` : 6 routes supprimées
  - `/api/ai/background-removal` → `endpoints.ai.removeBackground(designId)`
  - `/api/ai/upscale` → `endpoints.ai.upscale(designId)`
  - `/api/ai/extract-colors` → `endpoints.ai.extractColors(imageUrl)`
  - `/api/ai/text-to-design` → `endpoints.ai.generate({ prompt, productId })`
  - `/api/ai/smart-crop` → `endpoints.ai.smartCrop({ imageUrl, aspectRatio })`
  - `/api/ai/quota` → `endpoints.credits.balance()`
- `apps/frontend/src/app/(dashboard)/ai-studio/page.tsx` : Multiple `/api/ai/*` calls
  - **Action** : Remplacer tous les `fetch('/api/ai/...')` par `endpoints.ai.*`
- `apps/frontend/src/components/ai/AIStudio.tsx` : `/api/ai/generate`
  - **Action** : Remplacer par `endpoints.ai.generate(data)`

#### Phase 12.5 - Designs References

- `apps/frontend/src/app/(dashboard)/designs/[id]/page.tsx` : `/api/designs/*`
  - **Action** : Remplacer par `endpoints.designs.get(id)`
- `apps/frontend/src/app/(dashboard)/designs/[id]/versions/page.tsx` : `/api/designs/*/versions`
  - **Action** : Ajouter endpoint versions ou appeler directement backend
- `apps/frontend/src/components/ai/AIStudio.tsx` : `/api/designs`
  - **Action** : Remplacer par `endpoints.designs.create(data)`
- `apps/frontend/src/components/collections/AddDesignsModal.tsx` : `/api/designs`
  - **Action** : Remplacer par `endpoints.designs.list(params)`

#### Phase 14 - Supabase Removal (AI Studio pages)

- `apps/frontend/src/app/(dashboard)/dashboard/ai-studio/page.tsx` : `createClient` Supabase
- `apps/frontend/src/app/(dashboard)/dashboard/ai-studio/templates/page.tsx`
- `apps/frontend/src/app/(dashboard)/dashboard/ai-studio/animations/page.tsx`
  - **Action** : Supprimer Supabase, utiliser pattern cookie-based auth

### API Endpoints Backend (déjà existants)

```
endpoints.ai.generate({ prompt, productId, options })
endpoints.ai.upscale(designId)
endpoints.ai.removeBackground(designId)
endpoints.ai.extractColors(imageUrl)
endpoints.ai.smartCrop({ imageUrl, aspectRatio })
endpoints.ai.status(jobId)

endpoints.designs.list(params)
endpoints.designs.get(id)
endpoints.designs.create(data)
endpoints.designs.delete(id)

endpoints.credits.balance()
endpoints.credits.packs()
endpoints.credits.buy(data)
```

---

## ✅ TÂCHES

### Phase 1: AIService Migration (1 jour)

- [ ] Ouvrir `apps/frontend/src/lib/ai/AIService.ts`
- [ ] Remplacer les 6 routes `/api/ai/*` par `endpoints.ai.*`
- [ ] Remplacer `/api/ai/quota` par `endpoints.credits.balance()`
- [ ] Vérifier gestion erreurs et types retour

### Phase 2: AI Studio Pages (2 jours)

- [ ] Migrer `apps/frontend/src/app/(dashboard)/ai-studio/page.tsx`
  - [ ] Remplacer tous les `fetch('/api/ai/...')` par `endpoints.ai.*`
  - [ ] Supprimer imports Supabase si présents
- [ ] Migrer `apps/frontend/src/components/ai/AIStudio.tsx`
  - [ ] `/api/ai/generate` → `endpoints.ai.generate(data)`
  - [ ] `/api/designs` → `endpoints.designs.create(data)`
- [ ] Migrer pages AI Studio dashboard (templates, animations)
  - [ ] Supprimer `createClient` Supabase
  - [ ] Utiliser auth cookie-based

### Phase 3: Designs Pages (2 jours)

- [ ] Migrer `apps/frontend/src/app/(dashboard)/designs/[id]/page.tsx`
  - [ ] `/api/designs/*` → `endpoints.designs.get(id)`
- [ ] Migrer `apps/frontend/src/app/(dashboard)/designs/[id]/versions/page.tsx`
  - [ ] Créer endpoint versions si manquant ou appeler backend direct
- [ ] Migrer `apps/frontend/src/components/collections/AddDesignsModal.tsx`
  - [ ] `/api/designs` → `endpoints.designs.list()`

### Phase 4: Supabase Removal (1 jour)

- [ ] Scanner tous les fichiers designs/AI qui importent `@/lib/supabase`
- [ ] Supprimer chaque import et remplacer par backend NestJS
- [ ] Vérifier 0 résidu Supabase dans le scope designs/AI

### Phase 5: Testing & Polish (2 jours)

- [ ] Tester génération AI end-to-end
- [ ] Tester CRUD designs
- [ ] Tester upscale, background removal, extract colors, smart crop
- [ ] Vérifier affichage crédits AI
- [ ] Build sans erreur

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 appel `fetch('/api/ai/...')`** ou `fetch('/api/designs/...')`
- [ ] **0 import `@/lib/supabase`** dans les fichiers AI/designs
- [ ] Tous les flux AI utilisent `endpoints.ai.*`
- [ ] Tous les flux designs utilisent `endpoints.designs.*`
- [ ] Crédits AI affichés via `endpoints.credits.balance()`
- [ ] Build réussit sans erreur

---

## 🔗 RESSOURCES

- API Client : `apps/frontend/src/lib/api/client.ts` (endpoints.ai.*, endpoints.designs.*)
- AI Service : `apps/frontend/src/lib/ai/AIService.ts`
- AI Studio Page : `apps/frontend/src/app/(dashboard)/ai-studio/page.tsx`
- Backend AI : `apps/backend/src/modules/generation/`
- Backend Designs : `apps/backend/src/modules/designs/`
