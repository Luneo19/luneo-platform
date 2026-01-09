# Guide de Démarrage Rapide - Audit Multi-Agents

## Vue d'ensemble
Ce guide vous permet de lancer plusieurs audits en parallèle ou séquentiellement.

## Option 1: Audit Séquentiel (Recommandé)
Utiliser un seul agent qui travaille fichier par fichier.

### Étape 1: Commencer avec configurator-3d/page.tsx
```
Copier le contexte de l'Agent 1 depuis .cursor/agent-contexts.md
Lancer l'audit section par section (1-500, 501-1000, etc.)
```

### Étape 2: Continuer avec les autres fichiers
Après chaque fichier, passer au suivant dans l'ordre:
1. configurator-3d/page.tsx (5942 lignes)
2. ar-studio/integrations/page.tsx (5192 lignes)
3. ai-studio/templates/page.tsx (5138 lignes)
4. ar-studio/collaboration/page.tsx (5064 lignes)
5. support/page.tsx (5060 lignes)
6. billing/page.tsx (5053 lignes)
7. library/import/page.tsx (5044 lignes)
8. products/page.tsx (5042 lignes)
9. analytics-advanced/page.tsx (5041 lignes)

### Étape 3: Vérifier Motion
Après tous les audits, vérifier motion dans tous les fichiers listés dans `.cursor/files-with-motion.txt`

## Option 2: Audit Parallèle (Si plusieurs onglets Cursor)
Ouvrir plusieurs onglets Cursor et lancer un agent par fichier simultanément.

## Commandes Utiles

### Vérifier erreurs TypeScript pour un fichier
```bash
cd apps/frontend && npx tsc --noEmit --pretty false 2>&1 | grep "nom-du-fichier" | head -20
```

### Compter les erreurs
```bash
cd apps/frontend && npx tsc --noEmit --pretty false 2>&1 | grep "nom-du-fichier" | wc -l
```

### Vérifier un fichier spécifique avec linter
```bash
# Dans Cursor, utiliser read_lints tool sur le fichier
```

## Checklist par Fichier

Pour chaque fichier audité, vérifier:
- [ ] Aucune erreur TypeScript (`npx tsc --noEmit`)
- [ ] Toutes les balises JSX sont correctement fermées
- [ ] Les imports `LazyMotionDiv` sont corrects
- [ ] L'utilisation de `motion` est correcte (pas de `motion.div`, utiliser `motion` ou `MotionDiv`)
- [ ] Les fragments JSX (`<>...</>`) sont correctement fermés
- [ ] Les props des composants sont typées correctement
- [ ] Le code compile sans erreurs

## Progression

Suivre la progression dans `.cursor/audit-plan.md` et mettre à jour les statuts:
- ✅ = Complété
- ⏳ = En attente
- 🔄 = En cours
- ❌ = Erreur bloquante

## Notes Importantes

1. **Toujours vérifier après corrections**: Exécuter `npx tsc --noEmit` et `read_lints`
2. **Documenter les corrections**: Noter dans `.cursor/audit-plan.md`
3. **Travailler par sections**: Ne pas essayer de tout corriger d'un coup
4. **Tester après chaque section**: S'assurer que le code compile







