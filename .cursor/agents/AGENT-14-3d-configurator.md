# AGENT-14: 3D Configurator

**Objectif**: Rendre le configurateur 3D production-ready en corrigeant les routes API cassées et supprimant Supabase

**Priorité**: P2 (Important)  
**Complexité**: 4/5  
**Estimation**: 2 semaines  
**Dépendances**: AGENT-01 (TypeScript), AGENT-05 (Auth)

---

## 📋 SCOPE

### Contexte Phase 12.6 + Phase 14

Les hooks 3D Configurator appellent des routes `/api/3d-configurations/*` supprimées.

### Fichiers à Corriger

#### Phase 12.6 - 3D Configurator References

- `apps/frontend/src/components/3d-configurator/ProductConfigurator3D.tsx`
  - `/api/3d-configurations/save` → `api.post('/api/v1/configurator-3d/save', data)`
- `apps/frontend/src/app/(dashboard)/dashboard/configurator-3d/hooks/useConfigurator3D.ts`
  - `/api/3d-configurations/save` → `api.post('/api/v1/configurator-3d/save', data)`

#### Phase 14 - Supabase Removal

- `apps/frontend/src/app/(dashboard)/dashboard/configurator-3d/page.tsx` : supprimer Supabase

### Endpoints Backend Nécessaires

```
POST   /api/v1/configurator-3d/save          - Sauvegarder configuration
GET    /api/v1/configurator-3d/:id            - Charger configuration
GET    /api/v1/configurator-3d/templates      - Templates 3D disponibles
POST   /api/v1/configurator-3d/render         - Rendre preview 3D
```

---

## ✅ TÂCHES

### Phase 1: Hook Migration (1 jour)

- [ ] Migrer `useConfigurator3D.ts` → backend NestJS
- [ ] Migrer `ProductConfigurator3D.tsx` → backend NestJS

### Phase 2: Supabase Removal (0.5 jour)

- [ ] Supprimer Supabase de la page configurator-3d

### Phase 3: Backend Endpoints (2 jours)

- [ ] Vérifier endpoints existants dans le backend
- [ ] Créer les manquants
- [ ] Ajouter au client API si nécessaire

### Phase 4: Testing (1 jour)

- [ ] Tester save/load configuration 3D
- [ ] Build sans erreur

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 appel `fetch('/api/3d-configurations/...')`**
- [ ] **0 import `@/lib/supabase`** dans le configurateur 3D
- [ ] Configuration 3D sauvegarde/charge correctement
- [ ] Build réussit

---

## 🔗 RESSOURCES

- Composant : `apps/frontend/src/components/3d-configurator/ProductConfigurator3D.tsx`
- Hook : `apps/frontend/src/app/(dashboard)/dashboard/configurator-3d/hooks/useConfigurator3D.ts`
