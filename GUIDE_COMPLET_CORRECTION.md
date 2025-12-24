# ✅ GUIDE COMPLET - CORRECTION ROOT DIRECTORY

**Date** : 23 décembre 2025

---

## 🎯 PROBLÈME

Le Root Directory est `apps/frontend` mais doit être `.` (point) pour que le déploiement fonctionne depuis `apps/frontend/`.

**Erreur** : `The provided path "~/luneo-platform/apps/frontend/apps/frontend" does not exist`

---

## ✅ SOLUTION 1 : Script Automatique (Recommandé)

### Étape 1 : Créer un Token API Vercel

1. Aller sur : https://vercel.com/account/tokens
2. Cliquer sur **"Create Token"**
3. Nommer le token (ex: "Luneo Root Directory Fix")
4. **Copier le token généré** (il ne sera affiché qu'une fois)

### Étape 2 : Exporter le Token

```bash
export VERCEL_TOKEN="votre-token-ici"
```

### Étape 3 : Exécuter le Script

**Option A : Script à la racine**
```bash
cd /Users/emmanuelabougadous/luneo-platform
./SCRIPT_CORRECTION_ROOT_DIRECTORY.sh
```

**Option B : Script dans apps/frontend**
```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
bash scripts/update-root-directory.sh
```

Les deux scripts font la même chose :
- ✅ Mettent à jour le Root Directory à `.` via API Vercel
- ✅ Confirment la modification
- ✅ Indiquent les prochaines étapes

---

## ✅ SOLUTION 2 : Correction Manuelle Dashboard

1. **Ouvrir** : https://vercel.com/luneos-projects/frontend/settings
2. **Settings → General** :
   - Root Directory : Changer de `apps/frontend` à **`.`** (point)
   - **Save**
3. **Déclencher Nouveau Déploiement** :
   - Deployments → Redeploy

---

## 📊 CONFIGURATION ATTENDUE

### Avant ❌
- Root Directory: `apps/frontend`
- Erreur: `The provided path "~/luneo-platform/apps/frontend/apps/frontend" does not exist`

### Après ✅
- Root Directory: `.` (point)
- Déploiement depuis: `apps/frontend/`
- Fonctionne correctement ✅

---

## 🚀 APRÈS CORRECTION

Une fois le Root Directory corrigé :

```bash
cd apps/frontend
vercel --prod --yes
```

Le build devrait maintenant :
- ✅ S'exécuter correctement (plusieurs minutes, pas 6 secondes)
- ✅ Générer les fichiers dans `.next/`
- ✅ Servir correctement toutes les routes

---

## 📋 SCRIPTS DISPONIBLES

1. **`SCRIPT_CORRECTION_ROOT_DIRECTORY.sh`** (racine)
   - Script simple et direct
   - Nécessite `VERCEL_TOKEN` en variable d'environnement

2. **`apps/frontend/scripts/update-root-directory.sh`**
   - Script amélioré avec meilleure gestion d'erreurs
   - Peut demander le token interactivement si non fourni

---

**✅ Scripts créés et prêts à être utilisés. Il suffit d'exporter VERCEL_TOKEN et d'exécuter le script.**
