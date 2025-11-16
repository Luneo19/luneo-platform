# Configuration Manuelle des Branches Protégées

## ⚠️ Note importante

GitHub nécessite un compte **Pro** ou **Team** pour activer la protection des branches sur les repositories **privés**. 

**Options disponibles :**
1. ✅ Rendre le repository **public** (gratuit, protection des branches disponible)
2. ✅ Upgrader vers GitHub **Pro** ou **Team** (payant)
3. ✅ Configurer manuellement via l'interface web (voir ci-dessous)

## 🔧 Configuration manuelle via l'interface GitHub

### Étape 1 : Accéder aux paramètres

1. Allez sur https://github.com/Luneo19/luneo-platform
2. Cliquez sur **Settings** (Paramètres)
3. Dans le menu de gauche, cliquez sur **Branches**

### Étape 2 : Ajouter une règle pour `main`

1. Cliquez sur **Add rule** (Ajouter une règle)
2. Dans **Branch name pattern**, entrez : `main`
3. Configurez les options suivantes :

#### ✅ Require a pull request before merging
- ✅ **Require pull request reviews before merging**
  - **Required number of approvals**: `2`
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from Code Owners
  - ✅ Restrict who can dismiss pull request reviews: Sélectionnez les admins

#### ✅ Require status checks to pass before merging
- ✅ **Require branches to be up to date before merging**
- Ajoutez les checks suivants :
  - `build`
  - `test`
  - `lint`
  - `check-secrets`

#### ✅ Require conversation resolution before merging
- ✅ **Require conversation resolution before merging**

#### ✅ Require signed commits (optionnel mais recommandé)
- ✅ **Require signed commits**

#### ✅ Require linear history (optionnel)
- ✅ **Require linear history**

#### ✅ Include administrators
- ✅ **Include administrators**

#### ✅ Restrict who can push to matching branches
- ✅ **Restrict pushes that create matching branches**
- Sélectionnez uniquement les admins et les bots CI/CD

#### ❌ Allow force pushes
- ❌ **Ne PAS cocher** (désactivé par défaut)

#### ❌ Allow deletions
- ❌ **Ne PAS cocher** (désactivé par défaut)

4. Cliquez sur **Create** (Créer)

### Étape 3 : Vérifier la configuration

1. Créez une branche test : `git checkout -b test-branch`
2. Faites un commit : `git commit --allow-empty -m "test"`
3. Essayez de pusher directement sur main : `git push origin main`
4. Vous devriez voir une erreur indiquant que le push direct est bloqué

## 🔄 Alternative : Rendre le repository public

Si vous souhaitez activer la protection des branches gratuitement :

```bash
gh repo edit Luneo19/luneo-platform --visibility public
```

**Note** : Assurez-vous qu'aucun secret n'est dans le code avant de rendre le repository public !

## 📋 Checklist de vérification

- [ ] Règle créée pour `main`
- [ ] 2 approbations requises configurées
- [ ] Code Owners activé
- [ ] Status checks configurés (build, test, lint, check-secrets)
- [ ] Push direct désactivé
- [ ] Force push désactivé
- [ ] Suppression de branche désactivée
- [ ] Admins inclus dans les règles
- [ ] Test effectué avec une branche test

## 🔗 Liens utiles

- Repository: https://github.com/Luneo19/luneo-platform
- Settings Branches: https://github.com/Luneo19/luneo-platform/settings/branches
- GitHub Pricing: https://github.com/pricing

