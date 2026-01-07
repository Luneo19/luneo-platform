# 📋 Plan d'Action - Todos Restantes

**Date** : 5 janvier 2026, 10:20

## ✅ Statut Actuel

### Frontend Vercel ✅
- ✅ Déploiement production réussi
- ✅ Status HTTP 200 OK
- ✅ Toutes les corrections appliquées
- ⏳ Domaine `luneo.app` à configurer (manuel dans Dashboard)

### Backend Railway ✅
- ✅ Application fonctionnelle
- ✅ `/health` et `/api/health` : 200 OK
- ✅ Toutes les corrections appliquées

## 📋 Todos Restantes

### 1. Tests End-to-End Frontend → Backend ⏳
**Status** : `pending`
**Actions** :
- Tester la connexion frontend → backend
- Vérifier que les appels API fonctionnent
- Tester les endpoints critiques :
  - `/api/health`
  - `/api/auth/login`
  - `/api/auth/signup`
  - `/api/products`
  - `/api/designs`

**Commandes de test** :
```bash
# Backend
curl https://api.luneo.app/api/health

# Frontend → Backend (via navigateur)
# Ouvrir https://luneo.app et vérifier la console navigateur
```

### 2. Nettoyage Railway ⏳
**Status** : `in_progress`
**Actions** :
- Supprimer les services obsolètes :
  - `@luneo/backend-vercel` (obsolète)
  - `luneo-frontend` (obsolète)
- Garder uniquement le service `backend` opérationnel

**Comment faire** :
- Ouvrir Railway Dashboard : https://railway.app/project/0e3eb9ba-6846-4e0e-81d2-bd7da54da971
- Pour chaque service obsolète :
  - Cliquer sur le service
  - Settings → Danger Zone
  - Delete Service
  - Confirmer

### 3. Nettoyage Vercel ⏳
**Status** : `pending`
**Actions** :
- Renommer les projets obsolètes avec "Caduc - " devant le nom
- Garder uniquement le projet `frontend` opérationnel

**Comment faire** :
- Ouvrir Vercel Dashboard : https://vercel.com/luneos-projects
- Pour chaque projet inactif (sauf `frontend`) :
  - Cliquer sur le projet
  - Settings → General
  - Renommer avec "Caduc - " devant le nom
  - Sauvegarder

### 4. Vérification Repositories GitHub ⏳
**Status** : `in_progress`
**Actions** :
- Vérifier que Railway est connecté au bon repository
- Vérifier que Vercel est connecté au bon repository
- Confirmer que les deux pointent vers `Luneo19/luneo-platform`

**Repository Local** : ✅ `Luneo19/luneo-platform` (confirmé)

**Vérifications à faire** :
- Railway Dashboard → Settings → Source
- Vercel Dashboard → Settings → Git

### 5. Architecture Finale ⏳
**Status** : `pending`
**Actions** :
- Documenter l'architecture finale :
  - Frontend : Vercel (`luneo.app`)
  - Backend : Railway (`api.luneo.app`)

## 🎯 Priorités

1. **Priorité 1** : Tests end-to-end (vérifier que tout fonctionne)
2. **Priorité 2** : Vérification repositories GitHub
3. **Priorité 3** : Nettoyage Railway et Vercel
4. **Priorité 4** : Documentation architecture finale

## 📝 Checklist

- [ ] Tests end-to-end frontend → backend
- [ ] Vérification repositories GitHub (Railway et Vercel)
- [ ] Nettoyage Railway (supprimer services obsolètes)
- [ ] Nettoyage Vercel (renommer projets inactifs)
- [ ] Documentation architecture finale
