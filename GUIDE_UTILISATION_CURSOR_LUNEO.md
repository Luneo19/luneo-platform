# 🚀 Guide d'Utilisation Cursor AI pour Luneo Platform

**Guide pratique pour configurer et utiliser Cursor AI dans votre projet Luneo**

---

## ✅ Étape 1 : Vérification de la Configuration

### 1.1 Vérifier que les fichiers sont en place

Les fichiers suivants doivent être présents :

```bash
# À la racine du projet
.cursor/rules.md                    # ✅ Déjà créé
GUIDE_CURSOR_AI_SAAS_MONDIAL.md    # ✅ Guide complet
```

### 1.2 Vérifier le contenu de `.cursor/rules.md`

Le fichier est automatiquement détecté par Cursor. Vérifiez qu'il contient bien les règles pour Luneo Platform.

---

## ⚙️ Étape 2 : Configuration de Cursor

### 2.1 Ouvrir les Settings de Cursor

1. **Mac** : `Cmd + ,` (ou `Cursor > Settings`)
2. **Windows/Linux** : `Ctrl + ,`

### 2.2 Configurer le Modèle AI

1. Allez dans **Settings > Cursor > AI Model**
2. Sélectionnez **"Claude 3.5 Sonnet"** (recommandé pour code complexe)
3. Alternative : **"GPT-4o"** pour tâches rapides

### 2.3 Activer les Extensions Essentielles

Dans **Settings > Extensions**, installez :

- ✅ **ESLint** (linting TypeScript/JavaScript)
- ✅ **Prettier** (formatage automatique)
- ✅ **TypeScript** (support TS strict)
- ✅ **Python** (si vous utilisez Python)

### 2.4 Configurer VS Code Settings

Créez ou modifiez `.vscode/settings.json` à la racine :

```json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## 🎯 Étape 3 : Utilisation Pratique

### 3.1 Chat avec Codebase (Cmd+K)

**Utilisation :** Pour poser des questions sur tout le projet

**Exemple :**
```
@codebase Comment fonctionne le système de crédits dans Luneo ?
```

**Raccourci :** `Cmd + K` (Mac) ou `Ctrl + K` (Windows/Linux)

### 3.2 Référencer des Fichiers Spécifiques

**Utilisation :** Pour travailler sur un fichier précis

**Exemple :**
```
@file:apps/backend/src/modules/credits/credits.service.ts
Ajoute une fonction pour vérifier le solde de crédits d'un utilisateur
avec gestion d'erreurs et logging approprié.
```

### 3.3 Référencer un Dossier

**Utilisation :** Pour travailler sur un module entier

**Exemple :**
```
@folder:apps/frontend/src/components/credits
Refactorise tous les composants pour utiliser next-intl pour l'i18n
au lieu de chaînes hardcodées.
```

### 3.4 Composer Mode (Refactoring Massif)

**Utilisation :** Pour modifier plusieurs fichiers à la fois

**Limite recommandée :** 5-10 fichiers maximum

**Exemple :**
```
Refactorise le système d'authentification pour :
1. Ajouter support 2FA
2. Implémenter refresh tokens
3. Ajouter audit logs

Fichiers concernés :
- apps/backend/src/modules/auth/auth.service.ts
- apps/backend/src/modules/auth/auth.controller.ts
- apps/frontend/src/components/auth/LoginForm.tsx
```

---

## 📝 Exemples de Prompts pour Luneo

### Exemple 1 : Créer un Nouveau Composant

```
Crée un composant React TypeScript pour afficher le solde de crédits utilisateur.

Requirements :
- Utilise next-intl pour l'i18n (EN, FR, ES)
- Affiche le solde avec formatage selon locale
- Bouton pour acheter plus de crédits
- Loading state et error handling
- Accessible (ARIA labels)
- Responsive (mobile-first)

Stack :
- Next.js 14 App Router
- TypeScript strict
- Tailwind CSS
- TanStack Query pour data fetching
```

### Exemple 2 : Créer un Endpoint API

```
Crée un endpoint POST /api/credits/purchase pour acheter des crédits.

Requirements :
- Validation avec Zod
- Intégration Stripe pour paiement
- Mise à jour du solde utilisateur (transaction DB)
- Logging avec Sentry en cas d'erreur
- Rate limiting (10 req/min par user)
- Support multi-devises

Stack :
- Next.js API Route
- Prisma pour DB
- Stripe SDK
- Zod validation
```

### Exemple 3 : Refactoriser du Code Existant

```
@file:apps/backend/src/modules/credits/credits.service.ts

Refactorise cette fonction pour :
1. Remplacer tous les console.log par le logger service
2. Ajouter gestion d'erreurs structurée
3. Ajouter tests unitaires
4. Optimiser les requêtes DB (éviter N+1)
5. Ajouter JSDoc complet
```

### Exemple 4 : Ajouter une Feature Complète

```
Crée un système de notifications push pour Luneo avec :

Étape 1: Architecture
- Service de notifications
- Queue avec Bull (Redis)
- Templates i18n pour emails
- Preferences utilisateur

Étape 2: Backend
- API REST pour gérer notifications
- Webhook handler pour événements
- Service worker pour push web

Étape 3: Frontend
- Composant de notifications
- Settings page pour preferences
- Real-time updates avec WebSocket

Requirements :
- Support 20+ langues
- GDPR compliant (opt-out)
- Performance optimisée
- Tests complets
```

---

## 🔍 Vérification que les Règles Fonctionnent

### Test 1 : Générer du Code Simple

**Prompt :**
```
Crée une fonction TypeScript pour formater un montant en devise.
```

**Vérifiez que le code généré :**
- ✅ Utilise TypeScript strict (pas de `any`)
- ✅ Inclut des types/interfaces
- ✅ Support i18n (pas de chaînes hardcodées)
- ✅ Gestion d'erreurs
- ✅ Commentaires en anglais

### Test 2 : Vérifier les Anti-Patterns

**Prompt :**
```
Crée un composant React simple pour afficher un message.
```

**Vérifiez que le code généré :**
- ❌ N'utilise PAS `console.log`
- ❌ N'utilise PAS `any`
- ❌ N'utilise PAS `@ts-ignore`
- ✅ Utilise i18n pour les textes
- ✅ Inclut ARIA labels

---

## 🎨 Workflow Recommandé

### Pour Développer une Nouvelle Feature

1. **Planification** : Utilisez Cursor Chat pour discuter de l'architecture
   ```
   @codebase Comment implémenter un système de templates pour les designs ?
   ```

2. **Génération** : Utilisez des prompts structurés
   ```
   Crée un système de templates avec :
   - Schema Prisma
   - API REST
   - Composants React
   - Tests
   ```

3. **Itération** : Affinez avec des prompts spécifiques
   ```
   @file:apps/backend/src/modules/templates/templates.service.ts
   Ajoute la fonctionnalité de versioning pour les templates.
   ```

4. **Review** : Vérifiez que le code respecte les règles
   - Pas de `console.log`
   - Pas de `any`
   - i18n supporté
   - Tests inclus

### Pour Refactoriser du Code Existant

1. **Analyse** : Comprenez le code actuel
   ```
   @file:path/to/file.ts
   Explique ce que fait ce code et identifie les problèmes.
   ```

2. **Refactoring** : Utilisez Composer Mode (limité à 5-10 fichiers)
   ```
   Refactorise ce module pour :
   - Remplacer console.log par logger
   - Ajouter types stricts
   - Optimiser les requêtes DB
   ```

3. **Tests** : Vérifiez que tout fonctionne
   ```
   Génère des tests pour cette fonctionnalité refactorisée.
   ```

---

## 🚨 Troubleshooting

### Problème : Les règles ne sont pas appliquées

**Solution :**
1. Vérifiez que `.cursor/rules.md` est à la racine du projet
2. Redémarrez Cursor
3. Vérifiez dans les settings que le modèle AI est bien configuré
4. Utilisez des hints explicites dans vos prompts :
   ```
   Crée ce composant en respectant les règles dans .cursor/rules.md
   ```

### Problème : Code généré avec des `any` ou `console.log`

**Solution :**
1. Ajoutez des hints explicites :
   ```
   Crée cette fonction SANS utiliser `any` et SANS `console.log`.
   Utilise le logger service et des types stricts.
   ```
2. Itérez avec correction :
   ```
   Corrige ce code pour remplacer tous les `any` par des types appropriés
   et tous les console.log par le logger service.
   ```

### Problème : Cursor ne trouve pas les fichiers

**Solution :**
1. Utilisez des chemins absolus depuis la racine :
   ```
   @file:apps/frontend/src/components/Button.tsx
   ```
2. Vérifiez que vous êtes dans le bon workspace
3. Utilisez `@codebase` pour le contexte global

---

## 📚 Ressources

### Fichiers de Référence

- **Guide Complet** : `GUIDE_CURSOR_AI_SAAS_MONDIAL.md`
- **Règles Projet** : `.cursor/rules.md`

### Commandes Utiles

```bash
# Vérifier que les fichiers existent
ls -la .cursor/rules.md
ls -la GUIDE_CURSOR_AI_SAAS_MONDIAL.md

# Ouvrir Cursor dans le projet
cursor .

# Vérifier la configuration TypeScript
cd apps/frontend && npx tsc --noEmit
```

### Raccourcis Cursor

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Chat avec Codebase | `Cmd + K` | `Ctrl + K` |
| Composer Mode | `Cmd + I` | `Ctrl + I` |
| Settings | `Cmd + ,` | `Ctrl + ,` |
| Quick Fix | `Cmd + .` | `Ctrl + .` |

---

## ✅ Checklist de Démarrage

Avant de commencer à utiliser Cursor AI dans Luneo :

- [ ] Fichier `.cursor/rules.md` vérifié et présent
- [ ] Modèle AI configuré (Claude 3.5 Sonnet)
- [ ] Extensions installées (ESLint, Prettier, TypeScript)
- [ ] Settings VS Code configurés
- [ ] Test de prompt simple effectué
- [ ] Vérification que les règles sont appliquées

---

## 🎯 Prochaines Étapes

1. **Testez** avec un prompt simple sur un composant existant
2. **Itérez** en affinant vos prompts selon vos besoins
3. **Personnalisez** `.cursor/rules.md` avec vos spécificités Luneo
4. **Partagez** les meilleurs prompts avec votre équipe

---

**Besoin d'aide ?** Consultez `GUIDE_CURSOR_AI_SAAS_MONDIAL.md` pour plus de détails et d'exemples avancés.















