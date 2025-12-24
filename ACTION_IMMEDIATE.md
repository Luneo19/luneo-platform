# 🚀 ACTION IMMÉDIATE - CORRECTION ROOT DIRECTORY

**Date** : 23 décembre 2025

---

## ⚡ ACTION RAPIDE (2 minutes)

### Étape 1 : Créer Token Vercel

1. Aller sur : **https://vercel.com/account/tokens**
2. Cliquer sur **"Create Token"**
3. Nommer : "Luneo Root Directory Fix"
4. **Copier le token** (affiché une seule fois)

### Étape 2 : Exécuter le Script

```bash
cd /Users/emmanuelabougadous/luneo-platform
export VERCEL_TOKEN="votre-token-ici"
./SCRIPT_CORRECTION_ROOT_DIRECTORY.sh
```

**OU** depuis `apps/frontend` :

```bash
cd /Users/emmanuelabougadous/luneo-platform/apps/frontend
export VERCEL_TOKEN="votre-token-ici"
bash scripts/update-root-directory.sh
```

### Étape 3 : Déployer

```bash
cd apps/frontend
vercel --prod --yes
```

---

## ✅ RÉSULTAT ATTENDU

Après correction :
- ✅ Root Directory = `.` (point)
- ✅ Build s'exécute correctement (plusieurs minutes)
- ✅ Routes fonctionnent sur `luneo.app`

---

**✅ Scripts prêts. Il suffit d'exporter VERCEL_TOKEN et d'exécuter le script.**
