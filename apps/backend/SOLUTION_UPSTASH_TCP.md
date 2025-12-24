# 🔧 Solution Upstash Redis - URL TCP

## ⚠️ Problème Actuel

Les erreurs `MaxRetriesPerRequestError` indiquent que BullMQ ne peut pas se connecter à Upstash Redis.

## 🔍 Cause Probable

Upstash fournit **deux types d'URLs** :
1. **REST URL** (HTTP API) - `https://moved-gelding-21293.upstash.io` ✅ Vous l'avez
2. **TCP URL** (connexion directe Redis) - Format différent ⚠️ Nécessaire pour ioredis/BullMQ

## ✅ Solution : Récupérer l'URL TCP depuis Upstash

### Étape 1 : Ouvrir le Dashboard Upstash
1. Allez sur https://console.upstash.com
2. Ouvrez votre base Redis `luneo-production-redis` (ou `moved-gelding-21293`)

### Étape 2 : Récupérer l'URL TCP
1. Dans la section **"Connect"**, cliquez sur l'onglet **"TCP"** (pas "REST")
2. Vous verrez l'URL Redis complète au format :
   ```
   rediss://default:<TOKEN>@<HOST>:<PORT>
   ```
3. **Copiez cette URL complète**

### Étape 3 : Mettre à jour dans Railway
```bash
cd apps/backend
railway variables --set "REDIS_URL=<URL_TCP_COMPLETE_DEPUIS_UPSTASH>" --service backend
railway up
```

## 📋 Format Attendu

L'URL TCP devrait ressembler à :
```
rediss://default:AVMtAAIncDJmZTJmNGVkMzdhZGE0MmI5YjBhMzU4N2QyOTBmNTU2YXAyMjEyOTM@moved-gelding-21293.upstash.io:6379
```

Mais vérifiez dans l'onglet **TCP** du dashboard Upstash pour l'URL exacte.

## 🔄 Alternative : Désactiver OutboxScheduler temporairement

Si l'URL TCP ne fonctionne toujours pas, on peut désactiver temporairement OutboxScheduler :

```typescript
// Dans outbox-scheduler.ts, ajouter une vérification
if (!redisConnected) {
  return; // Skip si Redis non disponible
}
```

## ✅ Vérification

Après configuration :
```bash
railway logs | grep -E "(Redis|Connected|ERROR)"
```

Vous devriez voir :
- ✅ Connexion Redis réussie
- ❌ Plus d'erreurs `MaxRetriesPerRequestError`

