# 🧬 Mutation Testing - Guide Complet

## 📋 Vue d'ensemble

Le mutation testing permet de détecter les tests faibles en introduisant des mutations (changements) dans le code et en vérifiant si les tests les détectent.

## 🛠️ Configuration

### Installation

```bash
cd apps/backend
pnpm add -D @stryker-mutator/core @stryker-mutator/jest-runner @stryker-mutator/typescript-checker
```

### Configuration

Le fichier `stryker.conf.json` est déjà configuré avec :
- ✅ Coverage analysis par test
- ✅ TypeScript checker
- ✅ Jest test runner
- ✅ HTML reporter
- ✅ Dashboard integration

## 🚀 Utilisation

### Exécuter les tests de mutation

```bash
cd apps/backend
npx stryker run stryker.conf.json
```

### Exécuter sur un module spécifique

```bash
npx stryker run stryker.conf.json --mutate "src/modules/auth/**/*.ts"
```

### Voir le rapport HTML

Après exécution, ouvrir `reports/mutation/html/index.html`

## 📊 Interprétation des Résultats

### Mutation Score

- **80%+** : Excellent - Tests très robustes
- **70-79%** : Bon - Tests solides
- **60-69%** : Acceptable - Améliorations nécessaires
- **<60%** : Insuffisant - Tests faibles détectés

### Types de Mutations

1. **Arithmetic Operators** : `+` → `-`, `*` → `/`
2. **Logical Operators** : `&&` → `||`, `!` → (suppression)
3. **Conditional Expressions** : `if (a)` → `if (true)`, `if (false)`
4. **Return Values** : `return x` → `return null`
5. **Method Calls** : `method()` → (suppression)

## 🎯 Modules Critiques à Tester

### Priorité 1
- ✅ `auth.service.ts` - Logique d'authentification critique
- ⚠️ `products.service.ts` - Logique métier importante
- ⚠️ `designs.service.ts` - Logique métier importante

### Priorité 2
- ⚠️ `orders.service.ts` - Logique de commandes
- ⚠️ `analytics.service.ts` - Calculs analytiques
- ⚠️ `billing.service.ts` - Facturation

## 📝 Exemple de Test Mutation

```typescript
// Code original
function isPasswordStrong(password: string): boolean {
  return password.length >= 8 && 
         /[A-Z]/.test(password) && 
         /[a-z]/.test(password) && 
         /[0-9]/.test(password) && 
         /[!@#$%^&*]/.test(password);
}

// Mutation 1: && → ||
// Si le test ne détecte pas cette mutation, le test est faible
function isPasswordStrong(password: string): boolean {
  return password.length >= 8 ||  // Mutation: && → ||
         /[A-Z]/.test(password) && 
         /[a-z]/.test(password) && 
         /[0-9]/.test(password) && 
         /[!@#$%^&*]/.test(password);
}
```

## 🔧 Amélioration Continue

1. **Exécuter régulièrement** : Après chaque ajout de tests
2. **Analyser les mutations non tuées** : Améliorer les tests correspondants
3. **Fixer les seuils** : Maintenir mutation score > 70%

## 📚 Ressources

- [Stryker Documentation](https://stryker-mutator.io/)
- [Mutation Testing Guide](https://stryker-mutator.io/docs/mutation-testing-elements/)
