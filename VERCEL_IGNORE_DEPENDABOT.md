# 🚫 Ignorer les Builds Dependabot sur Vercel

## Problème
Vercel déploie automatiquement à chaque push, y compris les PRs de Dependabot qui mettent à jour les dépendances backend. Ces builds échouent car :
- Le lockfile peut être cassé
- Les dépendances backend (comme `canvas`) nécessitent des outils de build natifs
- Le frontend n'a pas besoin de se rebuilder pour des changements backend uniquement

## Solution : Configurer Vercel pour Ignorer les Builds Dependabot

### Option 1 : Via Dashboard Vercel (Recommandé - 2 minutes)

**Étapes rapides :**

1. **Ouvrir le Dashboard Vercel** : https://vercel.com/luneos-projects/frontend/settings/git

2. **Trouver la section "Ignored Build Step"** (en bas de la page)

3. **Ajouter cette commande exacte** :

```bash
git log -1 --pretty=format:'%an' | grep -q 'dependabot' && exit 1 || exit 0
```

4. **Cliquer sur "Save"**

**C'est tout !** ✅

Cette commande :
- ✅ Ignore les commits de Dependabot (auteur = "dependabot[bot]")
- ✅ Continue les builds pour tous les autres commits
- ✅ Évite les builds inutiles qui échouent
- ✅ Fonctionne immédiatement après sauvegarde

### Option 2 : Via Script (Plus Avancé)

Utiliser le script `.vercelignore-build-step.sh` qui :
- Ignore les commits Dependabot
- Ignore les commits qui ne modifient que le backend
- Continue les builds pour les changements frontend

Dans Vercel Dashboard → Settings → Git → Ignored Build Step :
```bash
bash .vercelignore-build-step.sh
```

### Option 3 : Désactiver les Déploiements Automatiques

1. Aller sur : https://vercel.com/luneos-projects/frontend/settings/git
2. Désactiver **"Automatic deployments from Git"**
3. Déployer manuellement uniquement quand nécessaire

⚠️ **Note** : Cette option nécessite des déploiements manuels à chaque fois.

## Vérification

Après configuration, les builds Dependabot devraient être ignorés. Vérifier dans :
- Dashboard Vercel → Deployments
- Les commits Dependabot ne devraient plus déclencher de builds

## Alternative : Configurer Dependabot

Modifier `.github/dependabot.yml` pour :
- Réduire la fréquence des mises à jour
- Ne pas merger automatiquement
- Ignorer certaines dépendances problématiques

---

**Status** : ⏳ À configurer manuellement dans Vercel Dashboard
