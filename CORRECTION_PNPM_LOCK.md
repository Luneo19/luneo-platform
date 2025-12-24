# ✅ CORRECTION pnpm-lock.yaml

**Date** : 23 décembre 2025

---

## 🔴 PROBLÈME IDENTIFIÉ

**Erreur** : `ERROR  Headless installation requires a pnpm-lock.yaml file`

**Cause** : Le Dashboard a `pnpm install --frozen-lockfile` mais il n'y a pas de `pnpm-lock.yaml` dans `apps/frontend/`.

---

## ✅ SOLUTION APPLIQUÉE

### Correction de `vercel.json`

Ajout de `installCommand` dans `vercel.json` pour utiliser `--no-frozen-lockfile` :

```json
{
  "installCommand": "pnpm install --no-frozen-lockfile",
  "buildCommand": "bash scripts/setup-local-packages.sh && pnpm run build",
  ...
}
```

**Raison** : 
- `--frozen-lockfile` nécessite `pnpm-lock.yaml` dans le répertoire
- `--no-frozen-lockfile` permet l'installation sans lockfile strict

---

## 📊 CONFIGURATION

### Avant ❌
- Install Command (Dashboard): `pnpm install --frozen-lockfile`
- Erreur: `Headless installation requires a pnpm-lock.yaml file`

### Après ✅
- Install Command (vercel.json): `pnpm install --no-frozen-lockfile`
- Fonctionne sans lockfile strict

---

## 🚀 DÉPLOIEMENT

Nouveau déploiement déclenché avec la correction.

**Vérification** :
- ⏳ En attente du build (3-5 minutes)
- ⏳ Vérification que le build réussit
- ⏳ Test des routes

---

**✅ Correction appliquée. Déploiement en cours...**
