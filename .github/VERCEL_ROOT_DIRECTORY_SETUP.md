# 🔧 Configuration Root Directory Vercel

**Date**: 17 novembre 2025  
**Projet**: Frontend Luneo

---

## 📋 Problème

Vercel ne détecte pas Next.js car le projet frontend est dans `apps/frontend` et non à la racine.

**Erreur**: `No Next.js version detected. Make sure your package.json has "next" in either "dependencies" or "devDependencies". Also check your Root Directory setting matches the directory of your package.json file.`

---

## ✅ Solution Automatique (Recommandée)

### Étape 1: Créer Token API Vercel

1. Aller sur: https://vercel.com/account/tokens
2. Cliquer sur **"Create Token"**
3. Nommer le token (ex: "Luneo Deployment")
4. Copier le token généré

### Étape 2: Exporter le Token

```bash
export VERCEL_TOKEN='votre_token_ici'
```

### Étape 3: Exécuter le Script

```bash
./scripts/configure-vercel-root-directory.sh
```

Le script va automatiquement:
- ✅ Récupérer Project ID et Team ID depuis `.vercel/project.json`
- ✅ Configurer Root Directory: `apps/frontend` via API Vercel
- ✅ Confirmer la configuration

---

## 📝 Solution Manuelle (Alternative)

Si vous préférez configurer manuellement:

1. Aller sur: https://vercel.com/luneos-projects/frontend/settings/general
2. Trouver la section **"Root Directory"**
3. Entrer: `apps/frontend`
4. Cliquer **"Save"**
5. Redéployer: `cd apps/frontend && vercel --prod --yes`

---

## 🔍 Vérification

Après configuration, vérifier que le Root Directory est correct:

```bash
cd apps/frontend
vercel project inspect
```

Ou vérifier dans Vercel Dashboard → Settings → General

---

## 🚀 Déploiement

Une fois Root Directory configuré:

```bash
cd apps/frontend
vercel --prod --yes
```

---

## 📚 Documentation

- Script: `scripts/configure-vercel-root-directory.sh`
- API Vercel: https://vercel.com/docs/rest-api
- Tokens: https://vercel.com/account/tokens

---

**Status**: ⚠️ En attente de configuration Root Directory

