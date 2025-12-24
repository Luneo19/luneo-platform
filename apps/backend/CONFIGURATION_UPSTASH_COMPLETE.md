# ✅ Configuration Upstash Redis Complète

## 📋 Informations Upstash

- **REST URL** : `https://moved-gelding-21293.upstash.io`
- **Token** : `AVMtAAIncDJmZTJmNGVkMzdhZGE0MmI5YjBhMzU4N2QyOTBmNTU2YXAyMjEyOTM`

## ✅ Configuration Effectuée

### Railway Variables
- **REDIS_URL** : `rediss://default:AVMtAAIncDJmZTJmNGVkMzdhZGE0MmI5YjBhMzU4N2QyOTBmNTU2YXAyMjEyOTM@moved-gelding-21293.upstash.io:6379`

### Vérification
```bash
cd apps/backend
railway variables --kv | grep REDIS_URL
```

## ⚠️ Note Importante

Upstash fournit deux types d'URLs :
1. **REST URL** (pour API HTTP) - Ce que vous avez
2. **Redis URL** (pour connexions directes) - Ce qui est configuré

Si l'URL Redis directe ne fonctionne pas, Upstash peut nécessiter :
- L'utilisation du client `@upstash/redis` au lieu de `ioredis`
- Ou l'URL Redis peut être différente de celle construite

## 🔍 Vérification

Après le redéploiement, vérifiez les logs :
```bash
railway logs
```

Vous devriez voir :
- ✅ Connexion Redis réussie
- ❌ Plus d'erreurs `ECONNREFUSED 127.0.0.1:6379`

## 🔄 Alternative si l'URL ne fonctionne pas

Si l'URL Redis directe ne fonctionne pas, il faudra :
1. Vérifier dans le dashboard Upstash l'URL Redis complète
2. Ou modifier le code pour utiliser `@upstash/redis` au lieu de `ioredis`

