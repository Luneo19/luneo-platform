# 🚨 PROBLÈME CRITIQUE IDENTIFIÉ

**Date** : 4 janvier 2026, 21:05

## ❌ Le Problème

En comparant `serverless.ts` (qui **fonctionne** sur Vercel) avec `main.ts` (qui **ne fonctionne pas** sur Railway), j'ai trouvé la différence CRUCIALE :

### Dans `serverless.ts` (✅ FONCTIONNE) :
```typescript
// Health check endpoint optimisé
server.get('/health', (_req: express.Request, res: express.Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

await app.init();  // ← app.init() APRÈS /health
cachedApp = server;
return server;
```

### Dans `main.ts` (❌ NE FONCTIONNE PAS) :
```typescript
await app.init();  // ← app.init() AVANT /health

// CRITICAL: Register /health route AFTER app.init() but on the raw Express server
server.get('/health', (req: Express.Request, res: Express.Response) => {
  // ...
});
```

## 🔍 Pourquoi ça ne fonctionne pas ?

Quand on utilise `ExpressAdapter` avec `app.init()`, NestJS enregistre son middleware de routage **AVANT** que notre route `/health` soit enregistrée. Même si on enregistre `/health` sur le serveur Express brut APRÈS `app.init()`, l'ordre des middlewares dans Express est déjà fixé.

**L'ordre des middlewares Express est déterminé par l'ordre d'enregistrement**. NestJS ajoute son middleware pendant `app.init()`, donc si on enregistre `/health` après, NestJS intercepte d'abord.

## ✅ Solution

**Enregistrer `/health` AVANT `app.init()`**, exactement comme dans `serverless.ts` :

```typescript
const server = express();
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
  bodyParser: false,
});

// ... configuration NestJS ...

// CRITICAL: Register /health BEFORE app.init()
server.get('/health', (req: Express.Request, res: Express.Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'luneo-backend',
    version: process.env.npm_package_version || '1.0.0',
  });
});

await app.init();  // ← app.init() APRÈS /health (comme serverless.ts)

await app.listen(port, '0.0.0.0');
```

## 📋 Prochaines Étapes

1. ✅ Identifier le problème (fait)
2. ⏳ Corriger `main.ts` pour enregistrer `/health` AVANT `app.init()`
3. ⏳ Commit et push
4. ⏳ Redéployer et vérifier

