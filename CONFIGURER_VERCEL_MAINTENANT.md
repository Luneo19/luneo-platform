# ⚡ Configuration Vercel - Ignorer Builds Dependabot

## 🎯 Objectif
Empêcher Vercel de builder automatiquement les commits de Dependabot qui échouent.

## 📋 Étapes (2 minutes)

### 1. Ouvrir le Dashboard Vercel
👉 **Lien direct** : https://vercel.com/luneos-projects/frontend/settings/git

### 2. Trouver la section "Ignored Build Step"
- Descendre dans la page jusqu'à la section **"Ignored Build Step"**
- C'est généralement en bas de la page, après les autres paramètres Git

### 3. Ajouter la commande
Dans le champ **"Ignored Build Step"**, copier-coller exactement cette commande :

```bash
git log -1 --pretty=format:'%an' | grep -q 'dependabot' && exit 1 || exit 0
```

### 4. Sauvegarder
- Cliquer sur le bouton **"Save"** ou **"Update"**
- Attendre la confirmation

## ✅ Vérification

Après sauvegarde :
1. Les prochains commits Dependabot seront automatiquement ignorés
2. Les builds normaux continueront de fonctionner
3. Plus d'erreurs de build pour les mises à jour de dépendances backend

## 🔍 Comment ça marche ?

La commande :
- Récupère l'auteur du dernier commit (`git log -1 --pretty=format:'%an'`)
- Vérifie si c'est "dependabot" (`grep -q 'dependabot'`)
- Si oui → `exit 1` (ignore le build)
- Si non → `exit 0` (continue le build)

## 📝 Alternative : Script Avancé

Si vous voulez aussi ignorer les commits qui ne modifient que le backend, utilisez :

```bash
bash .vercelignore-build-step.sh
```

Ce script ignore :
- ✅ Les commits Dependabot
- ✅ Les commits qui ne modifient que `apps/backend/`
- ✅ Continue les builds pour les changements frontend

---

**Temps estimé** : 2 minutes  
**Difficulté** : ⭐ Facile  
**Effet** : Immédiat après sauvegarde
