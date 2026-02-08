# AGENT-16: Refactoring Fichiers Geants

**Objectif**: Decomposer les 5 fichiers frontend de plus de 4000 lignes en composants modulaires (<300 lignes chacun)

**Priorité**: P1 (Critique)  
**Complexité**: 3/5  
**Estimation**: 5-8 jours  
**Dépendances**: AGENT-01 (TypeScript), AGENT-10 (Designs AI Studio)

---

## 📋 SCOPE

### Fichiers Cibles

| Fichier | Lignes estimees | Page |
|---------|----------------|------|
| `apps/frontend/src/app/(dashboard)/dashboard/affiliate/page.tsx` | >4000 | Programme affilies |
| `apps/frontend/src/app/(dashboard)/library/page.tsx` | >4000 | Bibliotheque designs |
| `apps/frontend/src/app/(dashboard)/dashboard/customize/page.tsx` | >4000 | Editeur customisation |
| `apps/frontend/src/app/(dashboard)/dashboard/ai-studio/3d/page.tsx` | >4000 | AI Studio 3D |
| `apps/frontend/src/app/(dashboard)/integrations/page.tsx` | >4000 | Page integrations |

### Objectif par Fichier

- Page principale : <100 lignes (layout + imports composants)
- Composants extraits : <300 lignes chacun
- Hooks extraits : <150 lignes chacun
- Types extraits : fichier dedie `types.ts`

---

## ✅ TÂCHES

### Phase 1: Analyse et Planning (1 jour)

- [ ] Lire chaque fichier et identifier les sections logiques
- [ ] Planifier le decoupage : quels composants, hooks, types extraire
- [ ] Creer la structure de dossiers pour chaque page

### Phase 2: Refactoring Affiliate (1-2 jours)

- [ ] Creer `affiliate/components/` avec composants extraits
- [ ] Creer `affiliate/hooks/` avec hooks extraits
- [ ] Creer `affiliate/types.ts`
- [ ] Reduire `page.tsx` a <100 lignes
- [ ] Verifier le build

### Phase 3: Refactoring Library (1-2 jours)

- [ ] Creer `library/components/` avec composants extraits
- [ ] Creer `library/hooks/` avec hooks extraits
- [ ] Creer `library/types.ts`
- [ ] Reduire `page.tsx` a <100 lignes
- [ ] Verifier le build

### Phase 4: Refactoring Customize + AI Studio 3D (1-2 jours)

- [ ] Decomposer `customize/page.tsx`
- [ ] Decomposer `ai-studio/3d/page.tsx`
- [ ] Verifier le build

### Phase 5: Refactoring Integrations + Verification (1 jour)

- [ ] Decomposer `integrations/page.tsx`
- [ ] Verifier que tous les fichiers refactores buildent
- [ ] Verifier que les fonctionnalites sont preservees

---

## 🛠️ ARCHITECTURE TECHNIQUE

### Structure Cible par Page

```
dashboard/affiliate/
├── page.tsx              # <100 lignes - layout principal
├── types.ts              # Types et interfaces
├── components/
│   ├── AffiliateStats.tsx
│   ├── AffiliateLinks.tsx
│   ├── AffiliatePayouts.tsx
│   ├── AffiliateChart.tsx
│   └── AffiliateSettings.tsx
└── hooks/
    ├── useAffiliateData.ts
    └── useAffiliateActions.ts
```

### Pattern de Decomposition

```typescript
// page.tsx - APRES refactoring
'use client';
import { AffiliateStats } from './components/AffiliateStats';
import { AffiliateLinks } from './components/AffiliateLinks';
import { AffiliatePayouts } from './components/AffiliatePayouts';
import { useAffiliateData } from './hooks/useAffiliateData';

export default function AffiliatePage() {
  const { stats, links, payouts, isLoading } = useAffiliateData();

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6">
      <AffiliateStats data={stats} />
      <AffiliateLinks links={links} />
      <AffiliatePayouts payouts={payouts} />
    </div>
  );
}
```

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 fichier** de plus de 500 lignes dans les pages refactorees
- [ ] **page.tsx** de chaque page <100 lignes
- [ ] Build reussit sans erreur
- [ ] Fonctionnalites identiques avant/apres
- [ ] Pas de regression visuelle

---

## 🔗 RESSOURCES

- Pages cibles : `apps/frontend/src/app/(dashboard)/`
- Composants UI : `apps/frontend/src/components/ui/` (shadcn)

---

## 📝 NOTES

- Ne pas changer la logique metier, seulement decomposer
- Garder les `'use client'` necessaires
- Extraire les types dans un fichier dedie par page
- Les hooks doivent utiliser `endpoints.*` ou `api.*` (pas de fetch direct)
