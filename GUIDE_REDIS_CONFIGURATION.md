# 🚀 GUIDE CONFIGURATION REDIS UPSTASH

**Objectif** : Activer le caching et rate limiting pour améliorer les performances

---

## 📋 PRÉREQUIS

✅ Code déjà prêt :
- `src/lib/rate-limit.ts` - Rate limiting
- `src/lib/redis-cache.ts` - Caching system
- `src/middleware.ts` - Rate limiting middleware

❌ Manque uniquement :
- Variables d'environnement Upstash

---

## 🎯 ÉTAPE 1 : Créer compte Upstash (GRATUIT)

### 1.1 Aller sur Upstash
```
https://upstash.com
```

### 1.2 S'inscrire (gratuit)
- Cliquer "Sign Up"
- Utiliser GitHub/Google
- Plan gratuit : 10,000 requests/jour

### 1.3 Créer Redis Database
1. Cliquer "Create Database"
2. Nom : `luneo-cache`
3. Type : `Regional`
4. Region : Choisir la plus proche de Vercel (US East recommended)
5. Cliquer "Create"

---

## 🎯 ÉTAPE 2 : Obtenir les credentials

### 2.1 Dans Upstash Dashboard
1. Sélectionner database `luneo-cache`
2. Onglet "REST API"
3. Copier :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

Exemple :
```bash
UPSTASH_REDIS_REST_URL=https://us1-merry-crab-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXkdaB...secrettoken...XYZ123
```

---

## 🎯 ÉTAPE 3 : Configurer Vercel

### 3.1 Aller sur Vercel Dashboard
```
https://vercel.com/luneos-projects/frontend/settings/environment-variables
```

### 3.2 Ajouter variables
1. Cliquer "Add New"
2. Key : `UPSTASH_REDIS_REST_URL`
3. Value : Coller l'URL d'Upstash
4. Environment : `Production`, `Preview`, `Development`
5. Cliquer "Save"

6. Répéter pour `UPSTASH_REDIS_REST_TOKEN`

---

## 🎯 ÉTAPE 4 : Redéployer

### 4.1 Redéployer l'application
```bash
cd apps/frontend
npx vercel --prod --yes
```

### 4.2 Attendre le build (~ 1 minute)

---

## ✅ ÉTAPE 5 : Vérifier

### 5.1 Tester API Health
```bash
curl https://app.luneo.app/api/health | jq '.services.redis'
```

**Résultat attendu** :
```json
{
  "status": "healthy"
}
```

### 5.2 Tester rate limiting
```bash
# Faire 10 requêtes rapides
for i in {1..10}; do
  curl -s -o /dev/null -w "%{http_code}\n" https://app.luneo.app/api/templates
done
```

**Résultat attendu** :
```
200
200
200
...
429 (après limite atteinte)
```

### 5.3 Tester caching
```bash
# Première requête (sans cache)
time curl -s https://app.luneo.app/api/templates > /dev/null

# Deuxième requête (avec cache)
time curl -s https://app.luneo.app/api/templates > /dev/null
```

**Résultat attendu** :
```
1ère requête: ~300ms
2ème requête: <50ms (10x plus rapide!)
```

---

## 💡 BÉNÉFICES ATTENDUS

### Performance
- ✅ Templates API : 300ms → <50ms (cache hit)
- ✅ Cliparts API : 350ms → <50ms (cache hit)
- ✅ Health check : unhealthy → healthy

### Sécurité
- ✅ Rate limiting actif
- ✅ Protection DDoS
- ✅ Limite 100 req/min par IP

### Scalabilité
- ✅ Cache distribué
- ✅ Session storage rapide
- ✅ Prêt pour 1000+ utilisateurs

---

## 📊 CONFIGURATION OPTIMALE

### Cache TTL (déjà configuré dans le code)
```typescript
// src/lib/redis-cache.ts
templates: 5 minutes
cliparts: 5 minutes
products: 2 minutes
user_data: 1 minute
```

### Rate Limits (déjà configuré dans le code)
```typescript
// src/lib/rate-limit.ts
API routes: 100 requests / minute / IP
Auth routes: 10 requests / minute / IP
```

---

## ⚠️ NOTE IMPORTANTE

**Redis est OPTIONNEL pour la production**

La plateforme fonctionne **parfaitement SANS Redis** :
- ✅ Toutes les pages accessibles
- ✅ Toutes les APIs fonctionnelles
- ✅ Database opérationnelle

**Avec Redis** :
- 🚀 Performance 10x meilleure
- 🔒 Sécurité renforcée
- 📈 Scalabilité enterprise

**Recommandation** : Configurer Redis **avant** d'accepter des utilisateurs en masse.

---

## 🎯 RÉSUMÉ

### Temps requis
⏱️ **Total : 10 minutes**
- Créer compte Upstash : 2 min
- Créer database : 1 min
- Copier credentials : 1 min
- Configurer Vercel : 3 min
- Redéployer : 1 min
- Tester : 2 min

### Résultat
✅ **Redis actif**
✅ **Cache fonctionnel**
✅ **Rate limiting actif**
✅ **Performance optimale**

---

**Prêt pour la production ! 🚀**



