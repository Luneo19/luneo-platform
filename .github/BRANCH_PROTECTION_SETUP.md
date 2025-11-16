# Configuration des Branches Protégées sur GitHub

## 📋 Instructions pour activer la protection des branches

Cette configuration doit être effectuée manuellement dans l'interface GitHub. Suivez ces étapes :

### 1. Accéder aux paramètres du repository

1. Allez sur votre repository GitHub
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Branches**

### 2. Ajouter une règle de protection pour `main`

1. Cliquez sur **Add rule** (Ajouter une règle)
2. Dans **Branch name pattern**, entrez : `main`
3. Configurez les options suivantes :

#### ✅ Require a pull request before merging
- ✅ **Require pull request reviews before merging**
  - Required number of approvals: **2** (ou 1 selon votre équipe)
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners
  - ✅ Restrict who can dismiss pull request reviews: Sélectionnez les admins

#### ✅ Require status checks to pass before merging
- ✅ **Require branches to be up to date before merging**
- Ajoutez les checks suivants :
  - `build` (si vous avez un workflow de build)
  - `test` (si vous avez un workflow de tests)
  - `lint` (si vous avez un workflow de lint)
  - `check-secrets` (workflow de vérification des secrets)

#### ✅ Require conversation resolution before merging
- ✅ **Require conversation resolution before merging**

#### ✅ Require signed commits (optionnel mais recommandé)
- ✅ **Require signed commits**

#### ✅ Require linear history (optionnel)
- ✅ **Require linear history** (empêche les merge commits)

#### ✅ Include administrators
- ✅ **Include administrators** (les admins doivent aussi suivre ces règles)

#### ✅ Restrict who can push to matching branches
- ✅ **Restrict pushes that create matching branches**
- Sélectionnez uniquement les admins et les bots CI/CD

#### ✅ Allow force pushes
- ❌ **Ne PAS cocher** (désactivé par défaut, c'est bien)

#### ✅ Allow deletions
- ❌ **Ne PAS cocher** (désactivé par défaut, c'est bien)

### 3. Ajouter une règle pour `develop` (si vous utilisez Git Flow)

Répétez les mêmes étapes pour la branche `develop` avec des règles légèrement moins strictes :
- Required number of approvals: **1**
- Autres règles similaires à `main`

### 4. Vérifier la configuration

Une fois configuré, testez en créant une PR :
1. Créez une branche feature
2. Faites quelques commits
3. Créez une Pull Request vers `main`
4. Vérifiez que :
   - Les status checks doivent passer
   - Au moins 1-2 reviews sont requis
   - Les conversations doivent être résolues
   - Vous ne pouvez pas merger directement sans PR

## 🔒 Règles recommandées

### Pour `main` (production)
- ✅ 2 approbations requises
- ✅ Code Owners review requis
- ✅ Tous les status checks doivent passer
- ✅ Pas de push direct autorisé
- ✅ Pas de force push
- ✅ Pas de suppression de branche

### Pour `develop` (développement)
- ✅ 1 approbation requise
- ✅ Code Owners review requis (si applicable)
- ✅ Status checks critiques doivent passer
- ✅ Pas de push direct autorisé (ou limité aux admins)

## 📝 Notes importantes

1. **Code Owners** : Assurez-vous que le fichier `.github/CODEOWNERS` est bien configuré
2. **Status Checks** : Les workflows GitHub Actions doivent être configurés pour créer des status checks
3. **Permissions** : Seuls les admins du repository peuvent modifier ces règles
4. **Bypass** : Les admins peuvent bypasser ces règles si nécessaire (mais c'est déconseillé)

## 🚨 En cas d'urgence

Si vous devez bypasser les règles en cas d'urgence :
1. Un admin peut temporairement désactiver la protection
2. Faire le push nécessaire
3. Réactiver immédiatement la protection
4. Documenter l'incident dans un issue GitHub

## ✅ Checklist de vérification

- [ ] Règle créée pour `main`
- [ ] Règle créée pour `develop` (si applicable)
- [ ] Reviews requis configurés
- [ ] Status checks configurés
- [ ] Code Owners activé
- [ ] Push direct désactivé
- [ ] Force push désactivé
- [ ] Suppression de branche désactivée
- [ ] Admins inclus dans les règles
- [ ] Test effectué avec une PR

## 📚 Ressources

- [GitHub Documentation - Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Documentation - Code Owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

