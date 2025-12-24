# 🔍 Vérification Configuration Upstash Redis

## ✅ Configuration Actuelle

**REDIS_URL configurée** : `rediss://default:AVMtAAIncDJmZTJmNGVkMzdhZGE0MmI5YjBhMzU4N2QyOTBmNTU2YXAyMjEyOTM@moved-gelding-21293.upstash.io:6379`

## ⚠️ Problème Détecté

Les logs montrent des erreurs `MaxRetriesPerRequestError` au lieu de `ECONNREFUSED`, ce qui signifie :
- ✅ Redis essaie de se connecter (la variable est bien lue)
- ❌ La connexion échoue (URL ou format incorrect)

## 🔧 Solution : Récupérer l'URL Redis Complète

Upstash fournit **deux types d'URLs** :
1. **REST URL** (HTTP API) - `https://moved-gelding-21293.upstash.io` ✅ Vous l'avez
2. **Redis URL** (connexion directe) - Format différent ⚠️ Nécessaire pour ioredis

### Étape 1 : Récupérer l'URL Redis depuis Upstash Dashboard

1. Allez sur https://console.upstash.com
2. Ouvrez votre base Redis `moved-gelding-21293`
3. Allez dans l'onglet **"Details"** ou **"Connect"**
4. Cherchez **"Redis URL"** (pas REST URL)
5. Copiez l'URL complète (format généralement : `rediss://default:token@host:port`)

### Étape 2 : Mettre à jour REDIS_URL

Une fois l'URL Redis complète récupérée :

```bash
cd apps/backend
railway variables --set "REDIS_URL=<URL_REDIS_COMPLETE_DEPUIS_UPSTASH>" --service backend
```

### Alternative : Utiliser l'API REST Upstash

Si l'URL Redis directe ne fonctionne pas, il faudra modifier le code pour utiliser `@upstash/redis` au lieu de `ioredis`.

## 📋 Checklist

- [ ] Ouvrir https://console.upstash.com
- [ ] Trouver l'URL Redis complète (pas REST URL)
- [ ] Mettre à jour REDIS_URL dans Railway
- [ ] Redéployer : `railway up`
- [ ] Vérifier les logs : `railway logs`

## 🔗 Liens Utiles

- Dashboard Upstash : https://console.upstash.com
- Documentation Upstash : https://upstash.com/docs/redis/overall/getstarted

