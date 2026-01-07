# 📖 Guide d'Utilisation - Prompt Cursor Ultra-Pro

## 🎯 Objectif

Ce prompt permet de développer systématiquement toutes les pages dashboard de Luneo en respectant strictement la Bible Luneo et les meilleures pratiques Next.js 14+.

---

## 🚀 Démarrage Rapide

### Étape 1 : Préparation

1. **Ouvrir Cursor** dans le workspace Luneo
2. **Vérifier les fichiers de référence** :
   ```bash
   ls -la | grep -E "(AUDIT|PRIORITES|PLAN_ACTION|BIBLE)"
   ```
3. **S'assurer que le backend est accessible** pour vérification des APIs

### Étape 2 : Utilisation du Prompt

1. **Ouvrir le fichier** `PROMPT_CURSOR_ULTRA_PRO.md`
2. **Copier tout le contenu** (Cmd+A, Cmd+C)
3. **Coller dans Cursor** (Cmd+V)
4. **Envoyer le message**

### Étape 3 : Suivre le Workflow

Cursor va automatiquement :
1. Analyser la première page (Dashboard)
2. Générer le plan de développement
3. Créer tout le code nécessaire
4. Valider avec la checklist

---

## 💡 Modes d'Utilisation

### Mode 1 : Conversation Progressive (Recommandé)

**Avantages :**
- Review du code à chaque étape
- Possibilité de corriger avant de continuer
- Meilleure compréhension du code généré

**Workflow :**
1. Coller le prompt complet
2. Cursor génère la première page (Dashboard)
3. Review et validation
4. Dire : **"Continue avec la page suivante : Products"**
5. Répéter pour chaque page

**Exemple de conversation :**
```
Vous: [Colle PROMPT_CURSOR_ULTRA_PRO.md]

Cursor: # 🚀 SPRINT 1 : Dashboard Principal
        [Génère tout le code...]
        ## 🔗 Prochaine Page
        Products (refactoring)

Vous: Continue avec Products

Cursor: # 🚀 SPRINT 2 : Products - Refactoring
        [Génère le refactoring...]
```

### Mode 2 : Batch (Génération Multiple)

**Avantages :**
- Plus rapide pour plusieurs pages
- Vue d'ensemble complète

**Workflow :**
1. Coller le prompt
2. Demander : **"Génère les 4 pages P0 complètes (Dashboard, Products, Orders, Analytics)"**
3. Review globale
4. Appliquer les modifications
5. Valider avec `pnpm build`

**Exemple :**
```
Vous: [Colle PROMPT_CURSOR_ULTRA_PRO.md]
      Génère les 4 pages P0 complètes

Cursor: [Génère Dashboard, Products, Orders, Analytics en une fois]
```

### Mode 3 : Page Spécifique

**Quand utiliser :**
- Vous voulez travailler sur une page précise
- Vous avez un blocker sur une page spécifique

**Workflow :**
1. Coller le prompt
2. Demander : **"Génère uniquement la page [NOM] selon les priorités"**
3. Review et validation

**Exemple :**
```
Vous: [Colle PROMPT_CURSOR_ULTRA_PRO.md]
      Génère uniquement la page Dashboard principal

Cursor: [Génère uniquement Dashboard]
```

---

## 🔧 Résolution de Problèmes

### Problème 1 : Build Échoue

**Symptôme :**
```bash
pnpm build
# ❌ Erreur TypeScript ou Next.js
```

**Solution :**
```
Vous: La page [X] échoue au build avec l'erreur [Y].
      Analyse et corrige en respectant la Bible Luneo.
```

### Problème 2 : Backend Manquant

**Symptôme :**
```
🚨 BLOCKER : Endpoint backend manquant
```

**Solution :**
1. Vérifier si l'endpoint existe dans `apps/backend/src`
2. Si non, créer l'endpoint backend d'abord
3. Puis continuer avec le frontend

### Problème 3 : Composant Trop Grand

**Symptôme :**
```
⚠️ Composant X fait 450 lignes (limite: 300)
```

**Solution :**
```
Vous: Le composant [X] fait [Y] lignes.
      Refactorise-le en composants < 300 lignes.
```

### Problème 4 : Types Manquants

**Symptôme :**
```
❌ Type 'X' is not defined
```

**Solution :**
```
Vous: Le type [X] est manquant.
      Crée-le dans types/index.ts selon la Bible Luneo.
```

---

## 📋 Checklist de Validation

Après chaque page générée, vérifier :

### Build & Types
```bash
# 1. Build
pnpm build

# 2. Types
npx tsc --noEmit

# 3. Lint
pnpm lint
```

### Structure
- [ ] `page.tsx` < 200 lignes
- [ ] Tous composants < 300 lignes
- [ ] `loading.tsx` présent
- [ ] `error.tsx` présent

### Fonctionnalité
- [ ] Données réelles (pas de mock)
- [ ] CRUD complet si applicable
- [ ] Tous boutons fonctionnels
- [ ] Validation Zod présente

---

## 🎯 Ordre d'Exécution Recommandé

### Phase 1 : P0 Critique (Semaines 1-2)
1. ✅ Dashboard principal
2. ✅ Products (refactoring)
3. ✅ Orders (complétion)
4. ✅ Analytics (refactoring)

### Phase 2 : P1 Important (Semaines 3-6)
5. Settings
6. Notifications (résoudre TODO)
7. Billing (refactoring)
8. Credits (résoudre TODO)
9. Library (refactoring)
10. Configurator 3D (refactoring)

[Voir PRIORITES.md pour la liste complète]

---

## 📊 Suivi de Progrès

### Template de Suivi

Créer un fichier `PROGRESS.md` :

```markdown
# 📊 Suivi de Progrès - Pages Dashboard

## Sprint 1-2 : P0 Critique
- [x] Dashboard principal
- [ ] Products (refactoring)
- [ ] Orders (complétion)
- [ ] Analytics (refactoring)

## Sprint 3-4 : P1 Configuration
- [ ] Settings
- [ ] Notifications
- [ ] Billing
- [ ] Credits

## Métriques
- Pages complétées: X/68
- Pages fonctionnelles: Y/68
- Pages < 500 lignes: Z/68
```

---

## 🚨 Points d'Attention

### ⚠️ Ne Jamais
- ❌ Créer des fichiers > 500 lignes
- ❌ Utiliser `any` ou `as any`
- ❌ Mettre `'use client'` au niveau page
- ❌ Oublier la validation Zod
- ❌ Oublier les loading/error states

### ✅ Toujours
- ✅ Server Components par défaut
- ✅ Composants < 300 lignes
- ✅ Types explicites
- ✅ Validation Zod
- ✅ Gestion d'erreurs complète
- ✅ Tests unitaires + E2E

---

## 🔗 Références

- **Bible Luneo** : `BIBLE_DEPLOIEMENT_PRODUCTION.md`
- **Audit** : `AUDIT_DASHBOARD.md`
- **Priorités** : `PRIORITES.md`
- **Plan d'Action** : `PLAN_ACTION.md`
- **Fiches Projet** : `fiches-projet/*.md`

---

## 💬 Exemples de Commandes

### Générer une page spécifique
```
Génère uniquement la page Dashboard principal selon les priorités
```

### Générer plusieurs pages
```
Génère les 4 pages P0 complètes (Dashboard, Products, Orders, Analytics)
```

### Corriger une erreur
```
La page Products échoue au build avec l'erreur "Type 'Product' is not defined".
Analyse et corrige en respectant la Bible Luneo.
```

### Refactoriser un composant
```
Le composant ProductsTable fait 450 lignes.
Refactorise-le en composants < 300 lignes selon la Bible Luneo.
```

### Résoudre un blocker
```
Blocker: L'endpoint backend /api/products n'existe pas.
Options: 1) Créer l'endpoint backend 2) Utiliser tRPC existant
Recommandation: Utiliser tRPC existant (trpc.product.list)
```

---

## 🎓 Bonnes Pratiques

### 1. Review Avant Application
Toujours review le code généré avant de l'appliquer dans le projet.

### 2. Tests Incrementaux
Tester chaque page après génération, pas toutes à la fin.

### 3. Commits Atomiques
Faire un commit par page complétée et validée.

### 4. Documentation
Documenter les décisions importantes dans les commentaires.

### 5. Communication
Si un blocker est identifié, le documenter immédiatement.

---

**Ce guide est un complément au prompt principal. Utilisez-le pour maximiser l'efficacité du développement.** 🚀


