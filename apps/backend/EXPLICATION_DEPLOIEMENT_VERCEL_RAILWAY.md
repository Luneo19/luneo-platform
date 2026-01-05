# 📋 Explication : Déploiement Vercel vs Railway

**Date** : 4 janvier 2026, 21:10

## 🎯 Architecture de Déploiement

Votre projet **Luneo Platform** utilise une **architecture hybride** avec deux plateformes de déploiement différentes :

### 1. **Frontend** → Vercel ✅

- **Service** : `luneo-frontend` (apps/frontend)
- **Plateforme** : Vercel
- **Raison** : Vercel est optimisé pour les applications Next.js/React
- **URL** : https://vercel.com/luneos-projects/luneo-frontend/...

**Le lien que vous avez partagé** (https://vercel.com/luneos-projects/luneo-frontend/...) est pour le **FRONTEND**, pas le backend.

**C'est normal** : Le frontend est sur Vercel car :
- ✅ Vercel est la plateforme native pour Next.js
- ✅ Déploiement automatique depuis GitHub
- ✅ CDN global intégré
- ✅ Optimisations automatiques

### 2. **Backend Principal** → Railway ✅

- **Service** : `backend` (apps/backend)
- **Plateforme** : Railway
- **Raison** : Railway est adapté pour les applications Node.js/NestJS avec base de données
- **URL** : https://api.luneo.app (Railway)

**C'est ce qu'on vient de corriger** : Le backend principal est sur Railway car :
- ✅ Support des applications long-running (pas serverless)
- ✅ Gestion des bases de données PostgreSQL
- ✅ Variables d'environnement et secrets
- ✅ Logs et monitoring
- ✅ WebSockets et connexions persistantes

### 3. **Backend Serverless** → Vercel (Optionnel) ⚠️

- **Fichier** : `apps/backend/src/serverless.ts`
- **Configuration** : `apps/backend/vercel.json`
- **Raison** : Alternative serverless pour certaines fonctions API
- **Usage** : Probablement pour certaines routes spécifiques ou comme backup

## 🔍 Vérification

Pour vérifier où est déployé le backend :

1. **Railway** (backend principal) :
   ```bash
   cd apps/backend
   railway status
   railway domain
   ```

2. **Vercel** (si configuré pour backend serverless) :
   ```bash
   cd apps/backend
   vercel ls
   ```

## 📝 Résumé

| Service | Plateforme | URL | Statut |
|---------|-----------|-----|--------|
| Frontend | Vercel | app.luneo.app (probablement) | ✅ Normal |
| Backend Principal | Railway | api.luneo.app | ✅ Normal (ce qu'on corrige) |
| Backend Serverless | Vercel (optionnel) | - | ⚠️ Optionnel |

## ❓ Questions Fréquentes

### Q: Pourquoi le backend n'est pas sur Vercel aussi ?

**R:** 
- Vercel est optimisé pour le **serverless** (fonctions courtes)
- Railway est optimisé pour les **applications long-running** (API NestJS avec connexions persistantes)
- Votre backend NestJS a besoin de :
  - Connexions persistantes à la base de données
  - WebSockets
  - Jobs en arrière-plan
  - Connexions Redis

### Q: Est-ce normal d'avoir deux plateformes ?

**R:** Oui, c'est une architecture **hybride** très courante :
- Frontend sur Vercel (CDN, optimisations Next.js)
- Backend sur Railway (infrastructure persistante)

### Q: Le backend est-il aussi sur Vercel ?

**R:** Il y a un fichier `serverless.ts` et un `vercel.json` qui permettent un déploiement Vercel, mais le **déploiement principal est sur Railway**. Le déploiement Vercel est optionnel/complémentaire.

## 🎯 Conclusion

**C'est normal** d'avoir le frontend sur Vercel et le backend sur Railway. C'est une architecture hybride standard et efficace.

**Le lien que vous avez partagé est pour le FRONTEND sur Vercel**, pas le backend. Le backend principal est bien sur **Railway** (ce qu'on vient de corriger avec `/health`).
