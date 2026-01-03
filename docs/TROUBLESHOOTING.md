# 🔧 Guide de Troubleshooting - Luneo Platform

**Solutions aux problèmes courants**

---

## 🐛 Problèmes de Développement

### Erreur: "Cannot find module"

**Symptômes:**
```
Error: Cannot find module '@/lib/...'
```

**Solutions:**
```bash
# 1. Vérifier que le fichier existe
ls apps/frontend/src/lib/...

# 2. Réinstaller les dépendances
rm -rf node_modules
pnpm install

# 3. Vérifier tsconfig.json
cat apps/frontend/tsconfig.json | grep paths
```

---

### Erreur: "Prisma Client not generated"

**Symptômes:**
```
Error: @prisma/client did not initialize yet
```

**Solutions:**
```bash
cd apps/frontend
pnpm prisma generate

# Si ça ne fonctionne pas
rm -rf node_modules/.prisma
pnpm prisma generate
```

---

### Erreur: "Database connection failed"

**Symptômes:**
```
Error: P1001: Can't reach database server
```

**Solutions:**
1. Vérifier `DATABASE_URL` dans `.env.local`
2. Vérifier que PostgreSQL/Supabase est accessible
3. Tester la connexion:
   ```bash
   psql $DATABASE_URL
   ```
4. Vérifier les credentials

---

### Erreur: "Port already in use"

**Symptômes:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**
```bash
# Tuer le processus
lsof -ti:3000 | xargs kill -9

# Ou changer le port
PORT=3001 pnpm dev
```

---

## 🧪 Problèmes de Tests

### Tests échouent avec "Cannot find module"

**Symptômes:**
```
Error: Cannot find module '@/lib/...' in tests
```

**Solutions:**
1. Vérifier `vitest.config.mjs` - alias configuré
2. Vérifier `src/test/setup.ts` - mocks corrects
3. Réinstaller dépendances:
   ```bash
   rm -rf node_modules
   pnpm install
   ```

---

### Tests E2E: "ERR_CONNECTION_REFUSED"

**Symptômes:**
```
Error: page.goto: net::ERR_CONNECTION_REFUSED
```

**Solutions:**
1. Lancer le serveur de développement:
   ```bash
   pnpm dev
   ```
2. Ou configurer `webServer` dans `playwright.config.ts`
3. Vérifier que le serveur est accessible:
   ```bash
   curl http://localhost:3000/api/health
   ```

---

### Coverage trop bas

**Symptômes:**
```
Coverage: 5.98% (objectif: 70%)
```

**Solutions:**
1. Vérifier que les fichiers sont inclus:
   ```bash
   cat vitest.config.mjs | grep include
   ```
2. Ajouter des tests pour code critique
3. Vérifier les exclusions:
   ```bash
   cat vitest.config.mjs | grep exclude
   ```

---

## 🚀 Problèmes de Build

### Build échoue avec erreurs TypeScript

**Symptômes:**
```
Error: Type error in ...
```

**Solutions:**
```bash
# 1. Vérifier les erreurs
pnpm type-check

# 2. Corriger les erreurs TypeScript
# 3. Vérifier que tous les types sont corrects
```

---

### Build échoue avec erreurs ESLint

**Symptômes:**
```
Error: ESLint errors found
```

**Solutions:**
```bash
# Auto-fix si possible
pnpm lint

# Ou corriger manuellement
```

---

### Build lent

**Symptômes:**
```
Build prend > 5 minutes
```

**Solutions:**
1. Vérifier le cache Next.js:
   ```bash
   rm -rf apps/frontend/.next
   pnpm build
   ```
2. Vérifier les dépendances lourdes
3. Optimiser les imports (lazy loading)

---

## 🔐 Problèmes d'Authentification

### "Non authentifié" sur toutes les routes

**Symptômes:**
```
401 Unauthorized sur toutes les routes API
```

**Solutions:**
1. Vérifier que Supabase est configuré:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
2. Vérifier que le token est envoyé:
   ```typescript
   const supabase = createClient();
   const { data: { session } } = await supabase.auth.getSession();
   console.log('Session:', session);
   ```
3. Vérifier les cookies (si SSR)

---

### OAuth ne fonctionne pas

**Symptômes:**
```
Erreur lors de la connexion OAuth
```

**Solutions:**
1. Vérifier les credentials OAuth dans Supabase
2. Vérifier les URLs de callback:
   ```
   http://localhost:3000/auth/callback
   ```
3. Vérifier les variables d'environnement

---

## 💳 Problèmes de Billing

### Stripe Checkout ne fonctionne pas

**Symptômes:**
```
Erreur lors de la création de la session Stripe
```

**Solutions:**
1. Vérifier les clés Stripe:
   ```env
   STRIPE_SECRET_KEY=sk_...
   STRIPE_PUBLISHABLE_KEY=pk_...
   ```
2. Vérifier que les price IDs sont configurés:
   ```env
   STRIPE_PRICE_STARTER_MONTHLY=price_...
   ```
3. Vérifier les webhooks Stripe

---

## 🤖 Problèmes d'IA

### OpenAI API ne fonctionne pas

**Symptômes:**
```
Error: OpenAI API error
```

**Solutions:**
1. Vérifier la clé API:
   ```env
   OPENAI_API_KEY=sk-...
   ```
2. Vérifier les quotas OpenAI
3. Vérifier les crédits disponibles

---

## 📊 Problèmes de Monitoring

### Sentry ne fonctionne pas

**Symptômes:**
```
Aucune erreur dans Sentry
```

**Solutions:**
1. Vérifier le DSN:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=...
   ```
2. Vérifier que Sentry est activé en production:
   ```typescript
   enabled: process.env.NODE_ENV === 'production'
   ```
3. Tester manuellement:
   ```typescript
   import { captureException } from '@/lib/sentry';
   captureException(new Error('Test error'));
   ```

---

### Web Vitals ne sont pas trackés

**Symptômes:**
```
Aucune métrique dans l'API
```

**Solutions:**
1. Vérifier que `WebVitalsReporter` est dans `layout.tsx`
2. Vérifier que l'API endpoint existe:
   ```bash
   curl http://localhost:3000/api/analytics/web-vitals
   ```
3. Vérifier la console pour erreurs

---

## 🗄️ Problèmes de Database

### Migrations échouent

**Symptômes:**
```
Error: Migration failed
```

**Solutions:**
1. Vérifier la connexion à la database
2. Vérifier que la database existe
3. Résoudre les conflits:
   ```bash
   pnpm prisma migrate resolve --applied migration_name
   ```
4. Réinitialiser si nécessaire (⚠️ perte de données):
   ```bash
   pnpm prisma migrate reset
   ```

---

### Prisma Client outdated

**Symptômes:**
```
Error: Unknown arg in query
```

**Solutions:**
```bash
# Régénérer Prisma Client
pnpm prisma generate

# Si ça ne fonctionne pas
rm -rf node_modules/.prisma
pnpm prisma generate
```

---

## 🔄 Problèmes de CI/CD

### CI échoue avec erreurs de cache

**Symptômes:**
```
Error: Cache miss
```

**Solutions:**
1. Vérifier la configuration du cache dans `.github/workflows/ci.yml`
2. Vérifier que les clés de cache sont correctes
3. Nettoyer le cache si nécessaire

---

### Tests E2E échouent en CI

**Symptômes:**
```
Tests E2E passent localement mais échouent en CI
```

**Solutions:**
1. Vérifier que les navigateurs sont installés:
   ```yaml
   - name: Install Playwright Browsers
     run: pnpm exec playwright install --with-deps chromium firefox webkit
   ```
2. Vérifier les timeouts
3. Vérifier les variables d'environnement

---

## 📦 Problèmes de Dépendances

### Conflits de versions

**Symptômes:**
```
Error: Conflicting peer dependencies
```

**Solutions:**
```bash
# Résoudre les conflits
pnpm install --force

# Ou mettre à jour les dépendances
pnpm update
```

---

### pnpm-lock.yaml désynchronisé

**Symptômes:**
```
Error: Lockfile is out of sync
```

**Solutions:**
```bash
# Régénérer le lockfile
rm pnpm-lock.yaml
pnpm install
```

---

## 🔍 Debugging Tips

### Activer les logs détaillés

```typescript
// Dans le code
import { logger } from '@/lib/logger';

logger.debug('Debug message', { data });
logger.info('Info message', { data });
logger.warn('Warning message', { data });
logger.error('Error message', { error });
```

### Utiliser React DevTools

1. Installer l'extension Chrome/Firefox
2. Inspecter les composants
3. Vérifier le state et props

### Utiliser Next.js DevTools

- Accessible via `http://localhost:3000/_next/webpack-hmr`
- Voir les erreurs de build
- Voir les performances

### Utiliser Sentry

- Erreurs trackées automatiquement
- Dashboard: https://sentry.io
- Voir les stack traces complètes

---

## 📞 Obtenir de l'Aide

### Ressources

1. **Documentation:**
   - [README.md](../README.md)
   - [SETUP.md](../SETUP.md)
   - [ARCHITECTURE.md](../ARCHITECTURE.md)
   - [CONTRIBUTING.md](../CONTRIBUTING.md)

2. **Guides:**
   - [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
   - [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
   - [TESTING_GUIDE.md](../apps/frontend/tests/TESTING_GUIDE.md)

3. **Support:**
   - 📧 Email: support@luneo.app
   - 💬 Discord: [Lien]
   - 📖 Documentation: /help/documentation

---

## 🔗 Liens Utiles

- [Next.js Troubleshooting](https://nextjs.org/docs/app/building-your-application/troubleshooting)
- [Prisma Troubleshooting](https://www.prisma.io/docs/guides/troubleshooting)
- [TypeScript Troubleshooting](https://www.typescriptlang.org/docs/handbook/declaration-files/templates/module-d-ts.html)

---

**Dernière mise à jour:** Décembre 2024








