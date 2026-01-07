# AGENT-01: Correction Erreurs TypeScript

**Objectif**: Corriger les 2838 erreurs TypeScript réparties sur 224 fichiers pour rendre le projet compilable sans erreurs

**Priorité**: P1 (Critique)  
**Complexité**: 3/5  
**Estimation**: 1 semaine  
**Dépendances**: Aucune

---

## 📋 SCOPE

### Fichiers Concernés
- 224 fichiers avec erreurs TypeScript
- Principalement dans `apps/frontend/src`
- Types d'erreurs principales:
  - **TS2339** (1092 erreurs): Property does not exist on type
  - **TS2305** (584 erreurs): Module not found
  - **TS2304** (229 erreurs): Cannot find name
  - **TS2724** (221 erreurs): Property was assigned but never used
  - **TS2323** (166 erreurs): Type is not assignable
  - **TS2484** (134 erreurs): Cannot find name (variable)
  - **TS7006** (122 erreurs): Parameter implicitly has 'any' type

### Problèmes Principaux

1. **Erreurs `motion` (JSX.IntrinsicElements)**
   - Utilisation de `<motion.*>` sans déclaration TypeScript
   - Fichiers affectés: 100+ fichiers
   - Solution: Déclarer types globalement OU remplacer par `LazyMotionDiv`

2. **Modules Manquants (TS2305)**
   - Imports vers des modules non trouvés
   - Chemins d'import incorrects
   - Dépendances manquantes

3. **Noms Non Trouvés (TS2304)**
   - Variables/fonctions non importées
   - Exemple: `memo`, `ErrorBoundary` dans certains fichiers

4. **Validators avec Erreurs**
   - `src/lib/validators/product.ts` (lignes 309-324)
   - `src/lib/validators/customization.ts` (lignes 346-359)

---

## ✅ TÂCHES

### Phase 1: Analyse & Priorisation (1 jour)

- [ ] Analyser le rapport d'erreurs complet
- [ ] Grouper les erreurs par type
- [ ] Identifier les erreurs critiques (bloquantes)
- [ ] Créer un plan de correction priorisé

### Phase 2: Corrections Critiques (2 jours)

- [ ] Corriger les erreurs `motion` (déclaration globale)
  - [ ] Créer/améliorer déclaration TypeScript pour `motion`
  - [ ] OU remplacer systématiquement `<motion.*>` par composants lazy-loaded
- [ ] Corriger les imports manquants (TS2305)
  - [ ] Vérifier tous les imports avec erreur
  - [ ] Corriger les chemins d'import
  - [ ] Installer dépendances manquantes si nécessaire
- [ ] Corriger les noms non trouvés (TS2304)
  - [ ] Ajouter imports manquants
  - [ ] Vérifier déclarations de types

### Phase 3: Corrections Validators (1 jour)

- [ ] Corriger `src/lib/validators/product.ts` (lignes 309-324)
- [ ] Corriger `src/lib/validators/customization.ts` (lignes 346-359)
- [ ] Tester les validators corrigés

### Phase 4: Corrections Générales (2 jours)

- [ ] Corriger types non assignables (TS2323)
- [ ] Corriger paramètres 'any' implicites (TS7006)
- [ ] Nettoyer propriétés non utilisées (TS2724)
- [ ] Corriger autres erreurs restantes

### Phase 5: Vérification (1 jour)

- [ ] Lancer `npx tsc --noEmit` sur tout le projet
- [ ] Vérifier compilation sans erreurs
- [ ] Tests de build: `npm run build`
- [ ] Vérifier pas de régression fonctionnelle

---

## 🛠️ ACTIONS TECHNIQUES

### 1. Déclaration Types Motion

**Option A**: Déclaration globale (recommandé)

Créer `apps/frontend/src/types/framer-motion.d.ts`:
```typescript
import 'framer-motion';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      motion: any;
      motionDiv: any;
      motionSpan: any;
      // ... autres éléments motion
    }
  }
}
```

**Option B**: Remplacer par LazyMotionDiv (si déjà implémenté)
- Utiliser `LazyMotionDiv` partout
- Supprimer imports `motion` directs

### 2. Corrections Imports

```typescript
// ❌ Incorrect
import { Something } from '@/lib/non-existent';

// ✅ Correct
import { Something } from '@/lib/existing';
// OU
import { Something } from '@/lib/utils/something';
```

### 3. Corrections Validators

Vérifier les schémas Zod dans les validators et corriger les types.

---

## 📊 MÉTRIQUES DE SUCCÈS

- [ ] **0 erreur TypeScript** après correction
- [ ] Build réussit: `npm run build`
- [ ] Pas de régression fonctionnelle
- [ ] Tests passent: `npm run test`
- [ ] Code review validé

---

## 🔗 RESSOURCES

- Fichier erreurs: `.cursor/fichiers-erreurs-rapport.md`
- Documentation TypeScript: https://www.typescriptlang.org/docs/
- Framer Motion Types: https://www.framer.com/motion/

---

## 📝 NOTES

- Prioriser les corrections bloquantes (erreurs qui empêchent le build)
- Tester après chaque phase
- Utiliser `--noEmit` pour vérifier types sans build complet
- Commiter par phase pour faciliter le rollback si nécessaire





