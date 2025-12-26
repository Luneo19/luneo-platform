# 🤝 Guide de Contribution - Luneo Platform

Merci de votre intérêt pour contribuer à Luneo Platform! Ce document fournit les guidelines pour contribuer au projet.

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Standards de Code](#standards-de-code)
- [Process de Pull Request](#process-de-pull-request)
- [Tests](#tests)
- [Documentation](#documentation)

## 📜 Code de Conduite

Ce projet adhère à un code de conduite. En participant, vous êtes tenu de maintenir ce code.

## 🚀 Comment Contribuer

### 1. Fork et Clone

```bash
# Fork le repository sur GitHub
# Puis clonez votre fork
git clone https://github.com/votre-username/luneo-platform.git
cd luneo-platform
```

### 2. Créer une Branche

```bash
# Créer une branche pour votre feature/fix
git checkout -b feature/ma-feature
# ou
git checkout -b fix/mon-bug
```

**Convention de nommage:**
- `feature/` - Nouvelles fonctionnalités
- `fix/` - Corrections de bugs
- `docs/` - Documentation
- `refactor/` - Refactoring
- `test/` - Tests
- `chore/` - Maintenance

### 3. Développement

1. **Installer les dépendances**
   ```bash
   pnpm install
   ```

2. **Lancer le dev server**
   ```bash
   pnpm dev
   ```

3. **Vérifier le code**
   ```bash
   pnpm lint
   pnpm type-check
   ```

### 4. Tests

**Avant de commit:**
```bash
# Tests unitaires
pnpm test

# Tests E2E (si applicable)
pnpm test:e2e

# Coverage
pnpm test:coverage
```

**Objectif**: Maintenir coverage > 70% pour code critique

### 5. Commit

```bash
git add .
git commit -m "feat: ajouter nouvelle fonctionnalité"
```

**Convention de commit:**
- `feat:` - Nouvelle fonctionnalité
- `fix:` - Correction de bug
- `docs:` - Documentation
- `style:` - Formatage
- `refactor:` - Refactoring
- `test:` - Tests
- `chore:` - Maintenance

## 📝 Standards de Code

### TypeScript

- ✅ Utiliser TypeScript strict
- ✅ Éviter `any`
- ✅ Types explicites pour fonctions publiques
- ✅ Interfaces pour objets complexes

### React

- ✅ Composants fonctionnels
- ✅ Hooks personnalisés pour logique réutilisable
- ✅ Error boundaries pour gestion d'erreurs
- ✅ Memoization si nécessaire

### Styling

- ✅ Tailwind CSS pour styling
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Accessibilité (WCAG AA)

### Naming

- ✅ PascalCase pour composants
- ✅ camelCase pour fonctions/variables
- ✅ UPPER_CASE pour constantes
- ✅ kebab-case pour fichiers

## 🔄 Process de Pull Request

### 1. Préparer la PR

- [ ] Code conforme aux standards
- [ ] Tests passent
- [ ] Coverage maintenu
- [ ] Documentation mise à jour
- [ ] Lint/Type check passent

### 2. Créer la PR

1. Push votre branche
   ```bash
   git push origin feature/ma-feature
   ```

2. Créer la PR sur GitHub
   - Titre clair et descriptif
   - Description détaillée
   - Référencer les issues liées

3. Template PR:
   ```markdown
   ## Description
   [Description de la feature/fix]
   
   ## Type de changement
   - [ ] Bug fix
   - [ ] Nouvelle feature
   - [ ] Breaking change
   - [ ] Documentation
   
   ## Tests
   - [ ] Tests unitaires
   - [ ] Tests E2E
   - [ ] Tests manuels
   
   ## Checklist
   - [ ] Code conforme aux standards
   - [ ] Tests passent
   - [ ] Documentation mise à jour
   ```

### 3. Review Process

- ✅ Au moins 1 approbation requise
- ✅ Tous les tests doivent passer
- ✅ CI doit être vert
- ✅ Pas de conflits

### 4. Merge

- ✅ Squash and merge (recommandé)
- ✅ Commit message clair
- ✅ Référencer la PR dans le commit

## 🧪 Tests

### Tests Unitaires

**Où**: `apps/frontend/src/**/__tests__/`

**Exemple**:
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

**Pattern AAA (Arrange-Act-Assert):**
- **Arrange:** Préparer les données et mocks
- **Act:** Exécuter l'action
- **Assert:** Vérifier le résultat

**Voir:** `apps/frontend/tests/TESTING_GUIDE.md` pour guide complet

### Tests E2E

**Où**: `apps/frontend/tests/e2e/`

**Exemple**:
```typescript
import { test, expect } from '@playwright/test';
import { setLocale, ensureCookieBannerClosed } from './utils/locale';

test('user can login', async ({ page }) => {
  await setLocale(page, 'fr');
  await ensureCookieBannerClosed(page);
  await page.goto('/login');
  // Test E2E
});
```

**Voir:** `apps/frontend/tests/TESTING_GUIDE.md` pour guide complet

### Coverage

**Objectif**: 70%+ pour code critique

```bash
cd apps/frontend
pnpm test:coverage
```

**Rapport:** Généré dans `apps/frontend/coverage/`

## 📚 Documentation

### Code Comments

- ✅ JSDoc pour fonctions publiques
- ✅ Commentaires pour logique complexe
- ✅ README par module si nécessaire

**Exemple**:
```typescript
/**
 * Calcule le prix total avec taxes
 * @param amount - Montant HT
 * @param taxRate - Taux de taxe (0.20 = 20%)
 * @returns Montant TTC
 */
export function calculateTotal(amount: number, taxRate: number): number {
  return amount * (1 + taxRate);
}
```

### Documentation Utilisateur

- ✅ Guides clairs
- ✅ Exemples de code
- ✅ Screenshots si nécessaire

### Fichiers de Documentation

- **README.md** - Vue d'ensemble du projet
- **SETUP.md** - Guide d'installation
- **ARCHITECTURE.md** - Architecture du projet
- **CONTRIBUTING.md** - Ce guide
- **docs/** - Documentation détaillée
- **tests/TESTING_GUIDE.md** - Guide de tests
- **.github/workflows/CI_CD_GUIDE.md** - Guide CI/CD
- **MONITORING_GUIDE.md** - Guide monitoring

## 🐛 Reporting de Bugs

1. Vérifier que le bug n'existe pas déjà
2. Créer une issue avec:
   - Description claire
   - Steps to reproduce
   - Comportement attendu vs actuel
   - Environnement (OS, browser, etc.)
   - Screenshots si applicable

## 💡 Suggestions de Features

1. Vérifier que la feature n'existe pas déjà
2. Créer une issue avec:
   - Description de la feature
   - Cas d'usage
   - Bénéfices
   - Mockups si applicable

## 🔧 Outils de Développement

### Linting
```bash
cd apps/frontend
pnpm lint          # Lint et auto-fix
pnpm lint:check    # Vérifier seulement
```

### Type Checking
```bash
cd apps/frontend
pnpm type-check
```

### Formatage
```bash
cd apps/frontend
pnpm format        # Formatter avec Prettier
pnpm format:check  # Vérifier seulement
```

## 📞 Support

Pour questions ou aide:
- 📧 Email: support@luneo.app
- 💬 Discord: [Lien]
- 📖 Documentation: /help/documentation
- 📚 Guides: Voir `docs/` et fichiers `.md` à la racine

## 🔗 Ressources

- [Guide de Tests](apps/frontend/tests/TESTING_GUIDE.md)
- [Guide CI/CD](.github/workflows/CI_CD_GUIDE.md)
- [Guide Monitoring](MONITORING_GUIDE.md)
- [Architecture](ARCHITECTURE.md)
- [Setup](SETUP.md)

---

**Merci de contribuer à Luneo Platform! 🚀**

