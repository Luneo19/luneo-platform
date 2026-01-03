# Contextes pour Agents - Corrections d'Erreurs TypeScript

## Analyse des Erreurs

**Types d'erreurs identifiés:**
- TS17008 (914 erreurs): JSX element has no corresponding closing tag
- TS17002 (283 erreurs): Expected corresponding JSX closing tag  
- TS1381 (159 erreurs): Unexpected token (accolades JSX mal formées)
- TS1005 (90 erreurs): Syntax error (parenthèses/virgules)
- TS2657 (18 erreurs): JSX expressions must have one parent element
- TS1382 (5 erreurs): Unexpected token (chevrons)
- Autres erreurs mineures

**Fichiers avec erreurs:**
1. `apps/frontend/src/app/(dashboard)/dashboard/monitoring/page.tsx` (4740 lignes)
2. `apps/frontend/src/app/(dashboard)/dashboard/orders/page.tsx` (4558 lignes)
3. `apps/frontend/src/test/helpers.ts` (159 lignes)

---

## 🔴 AGENT 11 - CORRECTION JSX MONITORING 🔴
**Nom**: Agent-Correction-JSX-Monitoring
**Fichier**: `apps/frontend/src/app/(dashboard)/dashboard/monitoring/page.tsx`
**Lignes**: 4740
**Problématique**: Erreurs JSX (balises non fermées, balises mal fermées)

### Instructions pour l'Agent 11:
```
Tu es un expert ingénieur de corrections TypeScript/JSX. 
Ton rôle: corriger toutes les erreurs JSX dans monitoring/page.tsx de manière méthodique.

Problématiques identifiées:
- TS17008: Balises JSX sans balise de fermeture correspondante
- TS17002: Balises de fermeture manquantes ou mal placées
- TS1381: Tokens inattendus (accolades JSX mal formées)
- TS1005: Erreurs de syntaxe (parenthèses/virgules)
- TS2657: Expressions JSX nécessitant un élément parent

Objectifs:
1. Analyser ligne 1 à 1000: vérifier imports, types, hooks initiaux
2. Analyser ligne 1001 à 2000: vérifier composants, états, fonctions utilitaires
3. Analyser ligne 2001 à 3000: vérifier logique métier, handlers, JSX structure
4. Analyser ligne 3001 à 4000: vérifier rendu JSX principal, Cards, Dialogs
5. Analyser ligne 4001 à 4740: vérifier dialogs, modals, fin du composant

Pour chaque section:
- Lancer: cd apps/frontend && npx tsc --noEmit 2>&1 | grep "monitoring/page.tsx" | head -20
- Identifier les erreurs JSX (TS17008, TS17002, TS1381, TS1005, TS2657)
- Corriger les balises manquantes/fermantes
- Vérifier l'indentation et la structure JSX
- Vérifier que tous les composants Card, CardContent, CardHeader, etc. sont correctement fermés
- Corriger les expressions JSX mal formées (accolades, parenthèses)
- Documenter les corrections

Fichier à corriger: apps/frontend/src/app/(dashboard)/dashboard/monitoring/page.tsx
```

---

## 🔴 AGENT 12 - CORRECTION JSX ORDERS 🔴
**Nom**: Agent-Correction-JSX-Orders
**Fichier**: `apps/frontend/src/app/(dashboard)/dashboard/orders/page.tsx`
**Lignes**: 4558
**Problématique**: Erreurs JSX (balises non fermées, balises mal fermées)

### Instructions pour l'Agent 12:
```
Tu es un expert ingénieur de corrections TypeScript/JSX. 
Ton rôle: corriger toutes les erreurs JSX dans orders/page.tsx de manière méthodique.

Problématiques identifiées:
- TS17008: Balises JSX sans balise de fermeture correspondante (nombreuses occurrences)
- TS17002: Balises de fermeture manquantes ou mal placées
- TS1381: Tokens inattendus (accolades JSX mal formées)
- TS1005: Erreurs de syntaxe (parenthèses/virgules)
- TS2657: Expressions JSX nécessitant un élément parent
- TS1382: Tokens inattendus (chevrons)

Objectifs:
1. Analyser ligne 1 à 900: vérifier imports, types, hooks initiaux
2. Analyser ligne 901 à 1800: vérifier composants, états, fonctions utilitaires
3. Analyser ligne 1801 à 2700: vérifier logique métier, handlers, JSX structure
4. Analyser ligne 2701 à 3600: vérifier rendu JSX principal, Cards, Dialogs, Tabs
5. Analyser ligne 3601 à 4558: vérifier dialogs complexes, modals, fin du composant

Pour chaque section:
- Lancer: cd apps/frontend && npx tsc --noEmit 2>&1 | grep "orders/page.tsx" | head -30
- Identifier les erreurs JSX (TS17008, TS17002, TS1381, TS1005, TS2657, TS1382)
- Corriger les balises manquantes/fermantes (Card, CardContent, CardHeader, Dialog, Tabs, etc.)
- Vérifier l'indentation et la structure JSX (attention aux composants imbriqués)
- Corriger les expressions JSX mal formées (accolades, parenthèses, chevrons)
- Vérifier que tous les Dialog, Tabs, TabsContent sont correctement fermés
- Documenter les corrections

Fichier à corriger: apps/frontend/src/app/(dashboard)/dashboard/orders/page.tsx
```

---

## 🟡 AGENT 13 - CORRECTION SYNTAXE TEST HELPERS 🟡
**Nom**: Agent-Correction-Syntax-TestHelpers
**Fichier**: `apps/frontend/src/test/helpers.ts`
**Lignes**: 159
**Problématique**: Erreurs de syntaxe TypeScript (expressions régulières, tokens)

### Instructions pour l'Agent 13:
```
Tu es un expert ingénieur de corrections TypeScript. 
Ton rôle: corriger les erreurs de syntaxe dans test/helpers.ts.

Problématiques identifiées:
- TS1005: '>' expected, ')' expected
- TS1161: Unterminated regular expression literal
- TS1128: Declaration or statement expected
- Erreurs autour de la ligne 27-30 (probablement expression régulière mal formée)

Objectifs:
1. Lire le fichier complet (fichier ~159 lignes)
2. Identifier la ligne problématique (ligne 27 selon erreurs)
3. Corriger l'expression régulière ou la syntaxe TypeScript
4. Vérifier: cd apps/frontend && npx tsc --noEmit 2>&1 | grep "test/helpers.ts"
5. S'assurer que toutes les erreurs sont corrigées

Fichier à corriger: apps/frontend/src/test/helpers.ts
```

---

## 🔵 AGENT 14 - VÉRIFICATION GLOBALE POST-CORRECTIONS 🔵
**Nom**: Agent-Verification-Globale
**Mission**: Vérifier que toutes les corrections sont complètes

### Instructions pour l'Agent 14:
```
Tu es un expert ingénieur de vérification TypeScript. 
Ton rôle: vérifier que toutes les erreurs ont été corrigées.

Objectifs:
1. Lancer la compilation TypeScript complète:
   cd apps/frontend && npx tsc --noEmit 2>&1 | grep -E "error TS" | wc -l
   
2. Vérifier spécifiquement les fichiers corrigés:
   - monitoring/page.tsx: cd apps/frontend && npx tsc --noEmit 2>&1 | grep "monitoring/page.tsx" | wc -l
   - orders/page.tsx: cd apps/frontend && npx tsc --noEmit 2>&1 | grep "orders/page.tsx" | wc -l
   - test/helpers.ts: cd apps/frontend && npx tsc --noEmit 2>&1 | grep "test/helpers.ts" | wc -l

3. Si des erreurs persistent:
   - Lister les erreurs restantes
   - Identifier la problématique
   - Documenter pour correction supplémentaire

4. Si toutes les erreurs sont corrigées:
   - Confirmer que la compilation TypeScript passe
   - Documenter le succès
```

---

## 📋 Résumé des Problématiques

### Problématique 1: Erreurs JSX (Balises)
**Fichiers concernés:**
- monitoring/page.tsx (4740 lignes) → **Agent 11**
- orders/page.tsx (4558 lignes) → **Agent 12**

**Types d'erreurs:**
- TS17008: Balises sans fermeture
- TS17002: Fermetures manquantes/mal placées
- TS1381: Tokens inattendus (accolades)
- TS1005: Syntaxe (parenthèses/virgules)
- TS2657: Expressions JSX sans parent

### Problématique 2: Erreurs de Syntaxe TypeScript
**Fichiers concernés:**
- test/helpers.ts (159 lignes) → **Agent 13**

**Types d'erreurs:**
- TS1005: Syntaxe attendue
- TS1161: Expression régulière non terminée
- TS1128: Déclaration attendue

### Problématique 3: Vérification
**Mission:** → **Agent 14**
- Vérifier que toutes les corrections sont complètes
- Confirmer compilation TypeScript sans erreurs

---

## Utilisation

Pour utiliser ces contextes avec plusieurs agents dans Cursor:

1. **Agent 11**: Corriger monitoring/page.tsx (erreurs JSX)
2. **Agent 12**: Corriger orders/page.tsx (erreurs JSX)  
3. **Agent 13**: Corriger test/helpers.ts (erreurs syntaxe)
4. **Agent 14**: Vérifier globalement que tout est corrigé

**Ordre recommandé:**
- Commencer par Agent 13 (fichier petit, corrections rapides)
- Puis Agent 11 et Agent 12 en parallèle si possible (fichiers grands)
- Terminer par Agent 14 (vérification)

Ou utiliser un seul agent qui travaille séquentiellement sur chaque problématique.

