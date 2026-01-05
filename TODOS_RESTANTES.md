# 📋 To-Dos Restantes - Luneo Platform

**Date** : 5 janvier 2026, 00:35

## ✅ Statut Actuel

### Backend Railway ✅
- ✅ Application déployée et fonctionnelle
- ✅ Endpoint `/health` : 200 OK
- ✅ Endpoint `/api/health` : 200 OK
- ✅ Toutes les corrections appliquées

### Frontend Vercel ⏳
- ✅ Configuration variables : Correcte
- ✅ `NEXT_PUBLIC_API_URL` : `https://api.luneo.app/api` ✅
- ✅ Correction `loadFeatureFlags()` : Appliquée et pushée
- ⏳ Redéploiement automatique : En attente (si GitHub connecté)
- ⏳ Vérification erreur 500 : À faire après redéploiement

## 📋 To-Dos Restantes

### 1. Vérifier que l'erreur 500 est résolue ⏳

**Action** :
- Vérifier le dernier déploiement Vercel
- Tester l'URL principale : `https://luneo.app`
- Vérifier que le status HTTP est 200 OK (pas 500)

**Commandes de test** :
```bash
curl -I https://luneo.app
curl https://luneo.app | head -20
```

**Si l'erreur persiste** :
- Vérifier les logs Vercel
- Vérifier que le redéploiement a bien été déclenché
- Redéployer manuellement si nécessaire : `cd apps/frontend && vercel --prod`

### 2. Tests End-to-End Frontend → Backend ⏳

**Actions** :
1. Tester la connexion frontend → backend
2. Tester l'authentification (login/signup)
3. Vérifier les logs Vercel pour les erreurs
4. Vérifier les logs Railway pour les erreurs

**Tests à effectuer** :
```bash
# Backend
curl https://api.luneo.app/api/health

# Frontend
curl -I https://luneo.app
curl https://luneo.app

# Connexion frontend → backend (via navigateur)
# Ouvrir https://luneo.app et vérifier la console navigateur
```

### 3. Nettoyage Railway (À faire manuellement) ⏳

**Actions** :
1. Supprimer `@luneo/backend-vercel` sur Railway
2. Supprimer `luneo-frontend` sur Railway

**Comment faire** :
- Ouvrir Railway Dashboard : https://railway.app/project/0e3eb9ba-6846-4e0e-81d2-bd7da54da971
- Pour chaque service obsolète :
  - Cliquer sur le service
  - Settings → Danger Zone
  - Delete Service
  - Confirmer

### 4. Nettoyage Vercel (À faire manuellement) ⏳

**Actions** :
1. Renommer tous les projets inactifs avec "Caduc - " devant le nom

**Comment faire** :
- Ouvrir Vercel Dashboard : https://vercel.com/luneos-projects
- Pour chaque projet inactif (sauf `frontend`) :
  - Cliquer sur le projet
  - Settings → General
  - Renommer avec "Caduc - " devant le nom
  - Sauvegarder

## 🎯 Priorités

### Priorité 1 : Vérifier l'erreur 500 ✅
- Vérifier le dernier déploiement Vercel
- Tester l'URL principale
- Confirmer que l'erreur est résolue

### Priorité 2 : Tests End-to-End ⏳
- Tester la connexion frontend → backend
- Vérifier l'authentification
- Vérifier les logs

### Priorité 3 : Nettoyage ⏳
- Nettoyage Railway (supprimer services obsolètes)
- Nettoyage Vercel (renommer projets inactifs)

## 📝 Checklist

- [ ] Vérifier que l'erreur 500 est résolue
- [ ] Effectuer les tests end-to-end
- [ ] Nettoyage Railway (supprimer services obsolètes)
- [ ] Nettoyage Vercel (renommer projets inactifs)

