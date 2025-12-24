# 🔧 Corrections Sécurité et TypeScript

## 🔒 Vulnérabilité Sécurité

### Problème
- **Package**: `glob` version 10.2.0 - 10.4.5
- **Sévérité**: High
- **CVE**: GHSA-5j98-mcp5-4vw2
- **Description**: Command injection via -c/--cmd executes matches with shell:true

### Solution
Le projet utilise un workspace monorepo (pnpm), donc `npm audit fix` ne fonctionne pas directement.

**Actions à faire**:
1. Mettre à jour `glob` manuellement dans les `package.json` qui l'utilisent
2. Ou utiliser `pnpm audit fix` si disponible
3. Vérifier les dépendances qui utilisent `glob` et les mettre à jour

**Commande**:
```bash
pnpm update glob@latest
```

## 🔧 Erreurs TypeScript/ESLint

### Problème 1: Modules manquants (framer-motion, lucide-react)
**Statut**: ✅ Dépendances présentes dans `package.json`
- `framer-motion`: ^11.0.0
- `lucide-react`: ^0.400.0

**Solution**: Réinstallation des dépendances
```bash
cd apps/frontend
pnpm install
```

### Problème 2: Modules NestJS manquants
**Statut**: ✅ Dépendances présentes dans `package.json`
- `@nestjs/core`: ^10.0.0
- `@nestjs/schedule`: ^4.0.0

**Solution**: Réinstallation des dépendances
```bash
cd apps/backend
pnpm install
```

### Problème 3: Types Button (size et variant)
**Statut**: ⚠️ Le composant Button a bien les props définies via `VariantProps<typeof buttonVariants>`

**Analyse**:
- Le composant `Button` dans `apps/frontend/src/components/ui/button.tsx` définit correctement:
  - `variant` via `VariantProps<typeof buttonVariants>`
  - `size` via `VariantProps<typeof buttonVariants>`

**Cause probable**:
- Cache TypeScript obsolète
- node_modules non synchronisés
- Problème de résolution de types

**Solutions**:
1. Nettoyer le cache TypeScript:
   ```bash
   rm -rf apps/frontend/.next
   rm -rf apps/frontend/node_modules/.cache
   ```

2. Réinstaller les dépendances:
   ```bash
   cd apps/frontend
   pnpm install
   ```

3. Redémarrer le serveur TypeScript dans l'IDE

4. Vérifier `tsconfig.json` pour s'assurer que les paths sont corrects

## 📋 Checklist de Correction

### Phase 1 - Sécurité
- [ ] Mettre à jour `glob` vers la dernière version
- [ ] Vérifier qu'aucune autre vulnérabilité n'existe
- [ ] Documenter les dépendances critiques

### Phase 2 - Dépendances
- [ ] Réinstaller toutes les dépendances frontend
- [ ] Réinstaller toutes les dépendances backend
- [ ] Vérifier que tous les modules sont installés

### Phase 3 - TypeScript
- [ ] Nettoyer le cache TypeScript
- [ ] Vérifier les erreurs TypeScript après réinstallation
- [ ] Corriger les types Button si nécessaire
- [ ] Vérifier que tous les imports sont corrects

### Phase 4 - Vérification
- [ ] Exécuter `npm run type-check` (ou `pnpm type-check`)
- [ ] Exécuter `npm run lint` (ou `pnpm lint`)
- [ ] Vérifier qu'il n'y a plus d'erreurs

## 🎯 Commandes Rapides

```bash
# Nettoyer et réinstaller
cd apps/frontend
rm -rf node_modules .next
pnpm install

cd ../backend
rm -rf node_modules dist
pnpm install

# Vérifier les types
cd apps/frontend
pnpm type-check

# Vérifier le linting
pnpm lint
```

## 📝 Notes

1. **Workspace monorepo**: Le projet utilise pnpm workspaces, donc toutes les commandes doivent être exécutées depuis la racine ou dans chaque app
2. **Cache TypeScript**: Parfois, le cache TypeScript peut causer des erreurs fantômes. Nettoyer le cache résout souvent le problème
3. **Dépendances extraneous**: Si npm/pnpm signale des dépendances "extraneous", c'est souvent un problème de synchronisation. Réinstaller résout le problème

