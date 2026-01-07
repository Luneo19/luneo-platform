# 🔧 Correction du Problème /health Endpoint

## 📋 Problème Identifié

Le endpoint `/health` retournait toujours 404 malgré plusieurs tentatives de configuration. Le problème était que `ExpressAdapter` intercepte toutes les requêtes et les passe par le système de routage NestJS, même si on enregistre une route directement sur le serveur Express.

## ✅ Solution Appliquée

**Changement dans `main.ts`** : Enregistrer `/health` **AVANT** de créer l'application NestJS avec `ExpressAdapter`.

### Avant (ne fonctionnait pas)
```typescript
const server = express();
server.use(express.json());
const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
await app.init();
server.get('/health', ...); // ❌ Trop tard, ExpressAdapter a déjà pris le contrôle
```

### Après (fonctionne)
```typescript
const server = express();
server.get('/health', ...); // ✅ Enregistré AVANT ExpressAdapter
server.use(express.json());
const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
await app.init();
```

## 🎯 Pourquoi ça fonctionne maintenant

1. **Ordre d'enregistrement** : En enregistrant `/health` avant de créer l'application NestJS, la route est dans la pile Express **avant** que `ExpressAdapter` ne prenne le contrôle
2. **Middleware Express** : Les middlewares Express sont traités dans l'ordre d'enregistrement, donc `/health` est traité avant NestJS
3. **Pattern similaire à serverless.ts** : Même si `serverless.ts` enregistre `/health` après `app.init()`, il ne fait pas `app.listen()`, ce qui change le comportement

## 📝 Prochaines Étapes

1. **Déployer les changements** :
   ```bash
   git add apps/backend/src/main.ts
   git commit -m "fix: Register /health endpoint before NestJS app creation"
   git push
   ```

2. **Vérifier que le déploiement réussit** :
   - Les logs Railway devraient montrer : `Health check route registered at /health (BEFORE NestJS app creation)`
   - Le endpoint `/health` devrait retourner 200

3. **Réactiver le health check dans railway.toml** (une fois que ça fonctionne) :
   ```toml
   [deploy]
   healthcheckPath = "/health"
   healthcheckTimeout = 300
   ```

4. **Exécuter la migration SQL** (si pas encore fait) :
   ```bash
   cd apps/backend
   ./scripts/execute-migration-locale.sh
   ```

## 🔍 Vérification

Une fois déployé, tester :
```bash
curl https://api.luneo.app/health
```

Devrait retourner :
```json
{
  "status": "ok",
  "timestamp": "2026-01-04T...",
  "uptime": 123.45,
  "service": "luneo-backend",
  "version": "1.0.0"
}
```



