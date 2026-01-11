# 🚀 Guide de Déploiement Railway - Luneo Platform

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration Initiale](#configuration-initiale)
3. [Erreurs Communes et Solutions](#erreurs-communes-et-solutions)
4. [Checklist de Déploiement](#checklist-de-déploiement)
5. [Bonnes Pratiques](#bonnes-pratiques)
6. [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Ce guide documente toutes les erreurs rencontrées lors du déploiement sur Railway et leurs solutions définitives. **Lisez ce document avant chaque déploiement** pour éviter de répéter les mêmes erreurs.

### Architecture du Déploiement

- **Plateforme**: Railway
- **Type**: Monorepo (pnpm workspaces)
- **Backend**: NestJS (TypeScript)
- **Base de données**: PostgreSQL (Railway)
- **Cache**: Redis (Upstash)
- **Build**: Multi-stage Docker avec Alpine Linux

---

## ⚙️ Configuration Initiale

### 1. Structure des Fichiers Requis

```
luneo-platform/
├── Dockerfile              # À la racine (OBLIGATOIRE)
├── railway.json            # Configuration Railway
├── railway.toml            # Configuration alternative
├── .dockerignore           # Exclure fichiers inutiles
├── package.json            # Root package.json
├── pnpm-lock.yaml          # Lockfile pnpm
├── pnpm-workspace.yaml     # Configuration workspace
└── apps/backend/
    ├── package.json
    └── prisma/
        └── schema.prisma
```

### 2. Configuration Railway Dashboard

**Root Directory**: `.` (racine du monorepo)

**Variables d'environnement requises**:
```bash
DATABASE_URL=<fourni par Railway>
NODE_ENV=production
PORT=<fourni par Railway>
JWT_SECRET=<votre secret>
REDIS_URL=<votre URL Redis>
STRIPE_SECRET_KEY=<votre clé Stripe>
CLOUDINARY_URL=<votre URL Cloudinary>
```

### 3. Configuration Prisma (CRITIQUE)

**⚠️ ERREUR FRÉQUENTE**: Prisma Client généré pour mauvais binary target

**Solution**: Ajouter `binaryTargets` dans `schema.prisma`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

**Pourquoi**: Railway utilise Alpine Linux avec OpenSSL 3.0.x, pas le standard `linux-musl`.

---

## 🐛 Erreurs Communes et Solutions

### ❌ Erreur 1: `Dockerfile does not exist`

**Symptôme**:
```
ERROR: Dockerfile `Dockerfile` does not exist
```

**Cause**: 
- Dockerfile dans `apps/backend/` au lieu de la racine
- `railway.json` pointe vers mauvais chemin

**Solution**:
1. ✅ Dockerfile **DOIT** être à la racine du monorepo
2. ✅ `railway.json` doit avoir:
```json
{
  "build": {
    "dockerfilePath": "Dockerfile"
  }
}
```

**Vérification**:
```bash
ls -la Dockerfile  # Doit exister à la racine
```

---

### ❌ Erreur 2: `"/apps/backend/package.json": not found`

**Symptôme**:
```
ERROR: failed to solve: failed to compute cache key: 
failed to calculate checksum of ref ... "/apps/backend/package.json": not found
```

**Cause**: 
- Docker build context ne trouve pas les fichiers
- Ordre des `COPY` incorrect dans Dockerfile

**Solution**:
1. ✅ Copier `package.json` AVANT `apps/backend/`:
```dockerfile
# ✅ CORRECT
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages ./packages/
COPY apps/backend ./apps/backend/

# ❌ INCORRECT (ne pas copier apps/backend avant package.json)
COPY apps/backend ./apps/backend
```

2. ✅ Vérifier que tous les fichiers existent:
```bash
ls -la apps/backend/package.json
ls -la package.json
ls -la pnpm-lock.yaml
```

---

### ❌ Erreur 3: `ERR_PNPM_NO_LOCKFILE`

**Symptôme**:
```
ERR_PNPM_NO_LOCKFILE Cannot install with "frozen-lockfile" 
because pnpm-lock.yaml is absent
```

**Cause**: 
- `pnpm-lock.yaml` non copié dans Docker
- Build context incorrect

**Solution**:
1. ✅ Copier `pnpm-lock.yaml` AVANT `pnpm install`:
```dockerfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile ...
```

2. ✅ Vérifier présence dans `.dockerignore`:
```dockerignore
# Ne PAS exclure pnpm-lock.yaml
# ❌ pnpm-lock.yaml  # INCORRECT
```

---

### ❌ Erreur 4: `Image of size 4.5 GB exceeded limit of 4.0 GB`

**Symptôme**:
```
ERROR: Image of size 4.5 GB exceeded limit of 4.0 GB
```

**Cause**: 
- Image Docker trop lourde
- Dépendances dev incluses en production
- Fichiers inutiles non nettoyés

**Solution**:
1. ✅ Utiliser multi-stage build:
```dockerfile
FROM node:20-alpine AS builder
# ... build avec devDependencies

FROM node:20-alpine AS production
# ... copier uniquement ce qui est nécessaire
RUN pnpm install --prod  # UNIQUEMENT production
```

2. ✅ Nettoyer agressivement:
```dockerfile
RUN rm -rf /app/node_modules/.cache \
    && rm -rf /tmp/* \
    && find /app/node_modules -type d \( -name "test" -o -name "tests" \) -exec rm -rf {} + \
    && find /app/node_modules -type f \( -name "*.md" -o -name "*.map" -o -name "*.ts" \) -delete
```

3. ✅ Créer `.dockerignore`:
```dockerignore
node_modules
.git
.env
*.md
.vscode
.idea
dist
coverage
```

**Résultat attendu**: Image < 2.0 GB

---

### ❌ Erreur 5: `canvas` compilation failure

**Symptôme**:
```
gyp ERR! find Python
ModuleNotFoundError: No module named 'distutils'
```

**Cause**: 
- Dépendances système manquantes pour compiler `canvas`
- Python3 et build tools absents

**Solution**:
1. ✅ Installer dépendances système dans builder:
```dockerfile
FROM node:20-alpine AS builder

RUN apk add --no-cache \
    python3 \
    py3-setuptools \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev
```

2. ✅ Installer runtime libraries en production:
```dockerfile
FROM node:20-alpine AS production

RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

# Compiler canvas
RUN pnpm install --prod

# Supprimer build tools après compilation
RUN apk del python3 py3-setuptools make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev
```

3. ✅ Alternative: Downgrader `canvas` si nécessaire:
```json
{
  "canvas": "^2.11.2"  // Version plus stable
}
```

---

### ❌ Erreur 6: `Prisma Client could not locate the Query Engine`

**Symptôme**:
```
PrismaClientInitializationError: Prisma Client could not locate 
the Query Engine for runtime "linux-musl-openssl-3.0.x"
```

**Cause**: 
- Prisma Client généré pour mauvais binary target
- Binary target manquant dans `schema.prisma`

**Solution**:
1. ✅ Ajouter `binaryTargets` dans `schema.prisma`:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

2. ✅ Régénérer Prisma Client:
```bash
cd apps/backend
pnpm prisma generate
```

3. ✅ Vérifier dans Dockerfile:
```dockerfile
WORKDIR /app/apps/backend
RUN pnpm prisma generate
```

**⚠️ IMPORTANT**: Toujours inclure `linux-musl-openssl-3.0.x` pour Railway/Alpine.

---

### ❌ Erreur 7: `Configuration key "SHOPIFY_CLIENT_ID" does not exist`

**Symptôme**:
```
TypeError: Configuration key "SHOPIFY_CLIENT_ID" does not exist
at ConfigService.getOrThrow
```

**Cause**: 
- Variables d'environnement optionnelles utilisées avec `getOrThrow()`
- Service échoue au démarrage si variable absente

**Solution**:
1. ✅ Utiliser `get()` avec valeur par défaut:
```typescript
// ❌ INCORRECT
this.clientId = this.configService.getOrThrow<string>('SHOPIFY_CLIENT_ID');

// ✅ CORRECT
this.clientId = this.configService.get<string>('SHOPIFY_CLIENT_ID') || '';
if (!this.clientId) {
  this.logger.warn('Shopify credentials not configured. Service will not be available.');
}
```

2. ✅ Vérifier dans les méthodes qui utilisent la variable:
```typescript
generateAuthUrl(...) {
  if (!this.clientId) {
    throw new Error('Shopify Client ID not configured. Please set SHOPIFY_CLIENT_ID.');
  }
  // ... reste du code
}
```

**Principe**: Services optionnels ne doivent pas bloquer le démarrage.

---

### ❌ Erreur 8: `Command "prisma" not found`

**Symptôme**:
```
ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL Command "prisma" not found
```

**Cause**: 
- `prisma` est une `devDependency`
- Non disponible en production après `pnpm install --prod`

**Solution**:
1. ✅ Option A: Copier Prisma Client depuis builder:
```dockerfile
# Dans builder stage
RUN pnpm prisma generate
RUN tar -czf /tmp/prisma-client.tar.gz -C node_modules .prisma

# Dans production stage
COPY --from=builder /tmp/prisma-client.tar.gz /tmp/prisma-client.tar.gz
RUN tar -xzf /tmp/prisma-client.tar.gz -C node_modules
```

2. ✅ Option B: Installer prisma comme dev dependency en production:
```dockerfile
RUN pnpm install --prod
RUN pnpm add -D prisma@^5.22.0
RUN pnpm prisma generate
RUN pnpm remove prisma  # Optionnel: supprimer après génération
```

3. ✅ Option C: Utiliser npx dans start.sh:
```bash
npx prisma migrate deploy || echo "WARNING: Migrations failed"
```

**Recommandation**: Option A (copier depuis builder) pour éviter duplication.

---

### ❌ Erreur 9: `Container failed to start. The executable 'cd' could not be found`

**Symptôme**:
```
Container failed to start. The executable `cd` could not be found.
```

**Cause**: 
- `CMD` utilise `cd` directement au lieu de `sh`
- Script shell non exécuté correctement

**Solution**:
1. ✅ Utiliser `sh` pour exécuter le script:
```dockerfile
# ❌ INCORRECT
CMD ["cd", "/app/apps/backend", "&&", "node", "dist/src/main.js"]

# ✅ CORRECT
CMD ["sh", "/app/start.sh"]
```

2. ✅ Créer script `start.sh`:
```bash
#!/bin/sh
set -e
cd /app/apps/backend
exec node dist/src/main.js
```

3. ✅ Rendre exécutable:
```dockerfile
RUN chmod +x /app/start.sh
```

---

### ❌ Erreur 10: `Cannot find module '@nestjs/common'`

**Symptôme**:
```
Error: Cannot find module '@nestjs/common'
```

**Cause**: 
- `NODE_PATH` non défini
- `node_modules` non trouvé par Node.js
- Structure monorepo incorrecte

**Solution**:
1. ✅ Définir `NODE_PATH` dans start.sh:
```bash
#!/bin/sh
set -e
export NODE_PATH=/app/node_modules
export PATH="/app/node_modules/.bin:$PATH"
cd /app/apps/backend
exec node dist/src/main.js
```

2. ✅ Vérifier structure monorepo:
```dockerfile
# Copier packages AVANT node_modules
COPY packages ./packages/
RUN pnpm install --prod
```

3. ✅ Vérifier `pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

---

### ❌ Erreur 11: Circular Dependencies NestJS

**Symptôme**:
```
Nest cannot create the AnalyticsModule instance. 
The module at index [7] of the AnalyticsModule "imports" array is undefined.
```

**Cause**: 
- Dépendances circulaires entre modules
- `forwardRef()` manquant

**Solution**:
1. ✅ Utiliser `forwardRef()` pour résoudre dépendances circulaires:
```typescript
// analytics.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { AgentsModule } from '@/modules/agents/agents.module';

@Module({
  imports: [
    forwardRef(() => AgentsModule),  // ✅ Utiliser forwardRef
  ],
})
export class AnalyticsModule {}
```

2. ✅ Appliquer dans les deux sens si nécessaire:
```typescript
// agents.module.ts
@Module({
  imports: [
    forwardRef(() => AnalyticsModule),  // ✅ forwardRef aussi ici
  ],
})
export class AgentsModule {}
```

**Règle**: Toujours utiliser `forwardRef()` quand Module A importe Module B et Module B importe Module A.

---

### ❌ Erreur 12: `ERR max requests limit exceeded` (Redis)

**Symptôme**:
```
ReplyError: ERR max requests limit exceeded. 
Limit: 500000, Usage: 500001
```

**Cause**: 
- Plan Upstash gratuit limité à 500k requêtes/mois
- Limite atteinte

**Solution**:
1. ✅ **Action requise**: Upgrader plan Upstash
2. ✅ Monitoring: Vérifier usage dans dashboard Upstash
3. ✅ Optimisation: Réduire nombre de requêtes Redis (cache TTL, pooling)

**Note**: Cette erreur n'empêche pas le démarrage mais bloque les opérations Redis.

---

## ✅ Checklist de Déploiement

### Avant le Déploiement

- [ ] **Dockerfile à la racine** (`/Dockerfile`)
- [ ] **railway.json** configuré avec `dockerfilePath: "Dockerfile"`
- [ ] **pnpm-lock.yaml** à jour et commité
- [ ] **schema.prisma** avec `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`
- [ ] **Variables d'environnement** configurées dans Railway Dashboard
- [ ] **.dockerignore** créé pour exclure fichiers inutiles
- [ ] **Services optionnels** utilisent `get()` au lieu de `getOrThrow()`

### Pendant le Build

- [ ] Build réussit sans erreur `Dockerfile does not exist`
- [ ] Build réussit sans erreur `package.json not found`
- [ ] Build réussit sans erreur `pnpm-lock.yaml absent`
- [ ] Image Docker < 4.0 GB
- [ ] Prisma Client généré avec bon binary target

### Après le Déploiement

- [ ] Container démarre sans erreur
- [ ] Prisma migrations appliquées (`prisma migrate deploy`)
- [ ] Application répond sur `/health`
- [ ] Logs ne montrent pas d'erreurs critiques
- [ ] Variables d'environnement chargées correctement

---

## 🎓 Bonnes Pratiques

### 1. Structure Monorepo

```
✅ CORRECT
luneo-platform/
├── Dockerfile              # Racine
├── railway.json            # Racine
├── package.json            # Racine
├── pnpm-lock.yaml          # Racine
└── apps/backend/           # Sous-dossier

❌ INCORRECT
luneo-platform/
└── apps/backend/
    ├── Dockerfile          # Ne PAS mettre ici
    └── railway.json        # Ne PAS mettre ici
```

### 2. Dockerfile Multi-Stage

**Toujours utiliser multi-stage build**:
- Stage 1 (`builder`): Compile avec devDependencies
- Stage 2 (`production`): Copie uniquement ce qui est nécessaire

**Avantages**:
- Image finale plus petite
- Sécurité améliorée (pas de dev tools en production)
- Build plus rapide (cache layers)

### 3. Prisma Client

**Toujours inclure `linux-musl-openssl-3.0.x`** dans `binaryTargets`:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}
```

**Pourquoi**: Railway utilise Alpine Linux avec OpenSSL 3.0.x.

### 4. Variables d'Environnement

**Services optionnels** (Shopify, Mailgun, etc.):
```typescript
// ✅ CORRECT: Ne bloque pas le démarrage
this.config = this.configService.get<string>('OPTIONAL_CONFIG') || '';

// ❌ INCORRECT: Bloque le démarrage si absent
this.config = this.configService.getOrThrow<string>('OPTIONAL_CONFIG');
```

**Services requis** (Database, JWT, etc.):
```typescript
// ✅ CORRECT: Doit être présent
this.databaseUrl = this.configService.getOrThrow<string>('DATABASE_URL');
```

### 5. Gestion des Erreurs

**Migrations Prisma**:
```bash
# ✅ CORRECT: Continue même si migrations échouent
pnpm prisma migrate deploy || echo "WARNING: Migrations failed"

# ❌ INCORRECT: Arrête le container si migrations échouent
pnpm prisma migrate deploy
```

**Services externes**:
```typescript
// ✅ CORRECT: Log warning mais continue
try {
  await redis.connect();
} catch (error) {
  this.logger.warn('Redis connection failed, continuing without cache');
}
```

---

## 🔧 Dépannage

### Vérifier les Logs Railway

```bash
# Voir les logs en temps réel
railway logs --service backend

# Voir les logs d'un déploiement spécifique
railway logs --service backend <deployment-id>
```

### Vérifier la Configuration

```bash
# Vérifier variables d'environnement
railway variables

# Vérifier configuration Railway
cat railway.json
cat railway.toml
```

### Tester Localement

```bash
# Build Docker localement
docker build -t luneo-backend .

# Tester le container
docker run -p 3001:3001 \
  -e DATABASE_URL="..." \
  -e NODE_ENV=production \
  luneo-backend
```

### Commandes Utiles

```bash
# Vérifier taille image Docker
docker images | grep luneo-backend

# Inspecter container
docker inspect <container-id>

# Voir logs container
docker logs <container-id>

# Entrer dans container
docker exec -it <container-id> sh
```

---

## 📚 Ressources

- [Railway Documentation](https://docs.railway.app/)
- [Prisma Binary Targets](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference#binarytargets-options)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [pnpm Workspaces](https://pnpm.io/workspaces)

---

## 🎯 Résumé des Erreurs Critiques

| # | Erreur | Solution | Priorité |
|---|--------|----------|----------|
| 1 | Dockerfile not found | Dockerfile à la racine | 🔴 CRITIQUE |
| 2 | package.json not found | Ordre COPY correct | 🔴 CRITIQUE |
| 3 | pnpm-lock.yaml absent | Copier avant install | 🔴 CRITIQUE |
| 4 | Image > 4.0 GB | Multi-stage build + cleanup | 🔴 CRITIQUE |
| 5 | canvas compilation | Dépendances système | 🟡 IMPORTANT |
| 6 | Prisma binary target | Ajouter linux-musl-openssl-3.0.x | 🔴 CRITIQUE |
| 7 | Config getOrThrow | Utiliser get() pour optionnel | 🟡 IMPORTANT |
| 8 | Prisma CLI not found | Copier depuis builder | 🟡 IMPORTANT |
| 9 | Container start failed | Utiliser sh pour CMD | 🔴 CRITIQUE |
| 10 | Module not found | NODE_PATH + structure | 🟡 IMPORTANT |
| 11 | Circular dependencies | forwardRef() | 🟡 IMPORTANT |
| 12 | Redis limit exceeded | Upgrader plan | 🟢 INFO |

---

**Dernière mise à jour**: Janvier 2026  
**Version**: 1.0.0  
**Auteur**: Luneo Platform Team

---

## 💡 Leçons Apprises

1. **Toujours vérifier la structure monorepo** avant de déployer
2. **Prisma binaryTargets est CRITIQUE** - ne jamais oublier
3. **Multi-stage Docker** est essentiel pour réduire taille image
4. **Services optionnels** ne doivent jamais bloquer le démarrage
5. **Tester localement** avec Docker avant de déployer sur Railway
6. **Logs Railway** sont votre meilleur ami pour le debugging
7. **Variables d'environnement** doivent être vérifiées AVANT le build
8. **pnpm-lock.yaml** doit être commité et à jour
9. **forwardRef()** pour toutes dépendances circulaires
10. **Health checks** sont essentiels pour monitoring

---

**⚠️ IMPORTANT**: Relisez ce guide avant chaque déploiement pour éviter de répéter les mêmes erreurs !
