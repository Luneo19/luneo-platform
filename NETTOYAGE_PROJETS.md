# 🧹 Nettoyage Projets Railway et Vercel

**Date** : 5 janvier 2026, 00:20

## 📋 Objectif

1. **Railway** : Supprimer tous les projets inutiles, garder seulement les projets opérationnels liés au projet actuel
2. **Vercel** : Garder seulement le projet opérationnel (`luneos-projects/frontend`), renommer les autres avec "à supprimer" ou "Caduc"

## 🔍 Projets Vercel

### Projet Actif ✅
- **`luneos-projects/frontend`** : ✅ **ACTIF** - Frontend principal
  - URL Production : `https://luneo.app`
  - Dernier déploiement : Récent
  - Status : Ready
  - **À GARDER** ✅

### Projets Inactifs à Renommer ⚠️

Liste des projets à renommer avec "à supprimer" ou "Caduc" :

1. `luneo-frontend` - À renommer
2. `backend` - À renommer (backend est sur Railway maintenant)
3. `product-ai-app-hdbl` - À renommer
4. `lau` - À renommer
5. `fme` - À renommer
6. `monorepo-turborepo` - À renommer
7. `product-ai-app` - À renommer
8. `product-ai-app-ez4a` - À renommer
9. `luneo-dashboard` - À renommer
10. `vcf` - À renommer
11. `b2b-dashboard` - À renommer
12. `b2b-api` - À renommer
13. `blm` - À renommer
14. `wgz` - À renommer
15. `luneo-platform` - À renommer
16. `saas-backend` - À renommer
17. `vercel-deploy` - À renommer
18. `luneo-backend-expert` - À renommer
19. `shopify-final` - À renommer

## 🔍 Projets Railway

### Projet Actif ✅
- **Backend Railway** : ✅ **ACTIF** - Backend principal
  - URL Production : `https://api.luneo.app`
  - Status : Opérationnel
  - **À GARDER** ✅

### Projets Inactifs à Vérifier ⚠️

À vérifier dans Railway Dashboard et supprimer les projets inactifs.

## 🚀 Actions à Effectuer

### 1. Renommer les Projets Vercel Inactifs

**Commande pour renommer** :
```bash
cd apps/frontend
vercel project rename <old-name> <new-name>
```

**Noms proposés** :
- `luneo-frontend` → `Caduc - luneo-frontend`
- `backend` → `Caduc - backend`
- `product-ai-app-hdbl` → `Caduc - product-ai-app-hdbl`
- etc.

### 2. Vérifier les Projets Railway

Vérifier dans Railway Dashboard :
- Projet actif : Backend (`api.luneo.app`)
- Supprimer les autres projets inactifs

### 3. Projet Vercel Actif

**Projet à garder** :
- `luneos-projects/frontend` ✅

**URL correcte** :
- Dashboard : https://vercel.com/luneos-projects/frontend/deployments ✅

## 📝 Checklist

### Vercel ⏳
- [ ] Identifier tous les projets inactifs
- [ ] Renommer les projets inactifs avec "Caduc -" ou "à supprimer -"
- [ ] Vérifier que le projet actif (`luneos-projects/frontend`) n'est pas renommé

### Railway ⏳
- [ ] Lister tous les projets Railway
- [ ] Identifier le projet actif (backend)
- [ ] Supprimer les projets inactifs

## 🔍 Note

**Important** : Avant de supprimer quoi que ce soit, vérifier dans les dashboards que :
1. Le projet actif est bien identifié
2. Aucun projet actif ne sera supprimé par erreur
3. Tous les projets inactifs sont bien identifiés



