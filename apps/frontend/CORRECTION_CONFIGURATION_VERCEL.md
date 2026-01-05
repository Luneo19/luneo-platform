# 🔧 Correction Configuration Vercel Frontend

**Date** : 4 janvier 2026, 21:15

## 🎯 Problème Identifié

Le frontend officiel est sur : **`frontend-5et896d3k-luneos-projects.vercel.app`**

Il y a potentiellement des problèmes de configuration :
1. **Projets Vercel multiples** : Il y a deux projets Vercel différents
2. **Variables d'environnement** : `NEXT_PUBLIC_API_URL` doit pointer vers Railway (api.luneo.app)
3. **Configuration de projet** : Vérifier que le bon projet est lié

## ✅ Actions à Effectuer

### 1. Vérifier le Projet Vercel Lié

```bash
cd apps/frontend
vercel project ls
```

### 2. Vérifier les Variables d'Environnement

```bash
cd apps/frontend
vercel env ls production
```

**Vérifier que** :
- `NEXT_PUBLIC_API_URL` = `https://api.luneo.app/api` (Railway backend)

### 3. Corriger si Nécessaire

Si `NEXT_PUBLIC_API_URL` n'est pas correct :

```bash
cd apps/frontend
vercel env rm NEXT_PUBLIC_API_URL production
echo "https://api.luneo.app/api" | vercel env add NEXT_PUBLIC_API_URL production
```

### 4. Vérifier la Configuration du Projet

Le projet officiel est : `frontend-5et896d3k-luneos-projects.vercel.app`

Vérifier que `.vercel/project.json` dans `apps/frontend` pointe vers le bon projet.

## 📋 Structure des Projets Vercel

- **Frontend** : `frontend-5et896d3k-luneos-projects.vercel.app` ✅ (officiel)
- **Backend** : Railway (api.luneo.app) ✅

## 🔍 Vérification

1. ✅ URL officielle : `frontend-5et896d3k-luneos-projects.vercel.app`
2. ⏳ Variables d'environnement : À vérifier
3. ⏳ Configuration projet : À vérifier
4. ⏳ URL backend : Doit être `https://api.luneo.app/api`

