# 🚀 GUIDE DE DÉPLOIEMENT COMPLET - AGENTS IA

## 📋 PRÉREQUIS

### Outils Requis
- [ ] Railway CLI (`npm i -g @railway/cli`)
- [ ] Vercel CLI (`npm i -g vercel`)
- [ ] pnpm installé
- [ ] Comptes Railway et Vercel

---

## ✅ ÉTAPE 1: INSTALLATION

### 1.1 Installation Dépendances
```bash
# À la racine du projet
pnpm install
```

### 1.2 Vérification
```bash
# Backend
cd apps/backend
npm run build

# Frontend
cd apps/frontend
npm run build
```

---

## ✅ ÉTAPE 2: CONFIGURATION VARIABLES ENVIRONNEMENT

### 2.1 Backend (Railway)

Variables requises:
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
MISTRAL_API_KEY=...
FRONTEND_URL=https://your-app.vercel.app
PROMETHEUS_ENABLED=true
METRICS_PORT=9090
```

Ajouter dans Railway:
```bash
railway variables set DATABASE_URL=...
railway variables set REDIS_URL=...
# etc.
```

### 2.2 Frontend (Vercel)

Variables requises:
```bash
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Ajouter dans Vercel:
```bash
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_APP_URL
```

---

## ✅ ÉTAPE 3: DÉPLOIEMENT BACKEND (RAILWAY)

### 3.1 Connexion Railway
```bash
railway login
```

### 3.2 Créer/Connecter Projet
```bash
railway init
# Ou connecter projet existant
railway link
```

### 3.3 Configurer Service
```bash
# Dans Railway Dashboard:
# - Root Directory: apps/backend
# - Build Command: npm run build
# - Start Command: npm run start:prod
# - Port: 3001
```

### 3.4 Déployer
```bash
# Option 1: Via script
./scripts/deploy-railway.sh

# Option 2: Manuel
cd apps/backend
railway up
```

### 3.5 Vérification
```bash
# Health check
curl https://your-app.railway.app/health

# Metrics
curl https://your-app.railway.app/health/metrics
```

---

## ✅ ÉTAPE 4: DÉPLOIEMENT FRONTEND (VERCEL)

### 4.1 Connexion Vercel
```bash
vercel login
```

### 4.2 Créer/Connecter Projet
```bash
cd apps/frontend
vercel
```

### 4.3 Configurer Projet
```bash
# Dans Vercel Dashboard:
# - Framework: Next.js
# - Root Directory: apps/frontend
# - Build Command: npm run build
# - Output Directory: .next
```

### 4.4 Déployer Production
```bash
# Option 1: Via script
./scripts/deploy-vercel.sh

# Option 2: Manuel
cd apps/frontend
vercel --prod
```

### 4.5 Vérification
- [ ] Build réussi
- [ ] Routes fonctionnelles
- [ ] API calls fonctionnent
- [ ] Agents IA accessibles

---

## ✅ ÉTAPE 5: MONITORING PROMETHEUS

### 5.1 Vérifier Endpoint
```bash
curl https://your-backend.railway.app/health/metrics
```

### 5.2 Configurer Scraping (Optionnel)
Si vous avez un serveur Prometheus:
```yaml
scrape_configs:
  - job_name: 'luneo-backend'
    static_configs:
      - targets: ['your-backend.railway.app']
    metrics_path: '/health/metrics'
    scrape_interval: 15s
```

### 5.3 Métriques Disponibles
- `agent_request_duration_seconds`
- `agent_requests_total`
- `agent_tokens_total`
- `agent_cost_total`
- `agent_errors_total`
- `agent_retries_total`
- `agent_circuit_breaker_state`
- `agent_cache_hits_total`
- `agent_cache_misses_total`

---

## ✅ ÉTAPE 6: TESTS E2E

### 6.1 Exécuter Tests
```bash
# Avec token
./scripts/test-e2e-agents.sh https://your-backend.railway.app YOUR_TOKEN

# Sans token (tests basiques)
./scripts/test-e2e-agents.sh https://your-backend.railway.app
```

### 6.2 Tests Manuels

#### Test Luna
```bash
curl -X POST https://your-backend.railway.app/api/agents/luna/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are my sales?",
    "brandId": "brand-id",
    "userId": "user-id"
  }'
```

#### Test Streaming SSE
```bash
curl -N https://your-backend.railway.app/api/agents/luna/chat/stream?message=Hello \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Accept: text/event-stream"
```

#### Test RAG
```bash
curl -X POST https://your-backend.railway.app/api/agents/luna/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How do I configure a product?",
    "brandId": "brand-id"
  }'
```

---

## ✅ ÉTAPE 7: OPTIMISATIONS

### 7.1 Performance Backend
- [ ] Optimiser requêtes Prisma
- [ ] Configurer cache Redis
- [ ] Optimiser queries database

### 7.2 Performance Frontend
- [ ] Optimiser bundle size
- [ ] Lazy load composants
- [ ] Optimiser images

### 7.3 Vector Store (pgvector)
- [ ] Installer extension PostgreSQL
- [ ] Créer colonne embedding
- [ ] Migrer données
- [ ] Tester recherche vectorielle

---

## 📊 CHECKLIST FINALE

### Déploiement
- [ ] Backend déployé sur Railway
- [ ] Frontend déployé sur Vercel
- [ ] Variables environnement configurées
- [ ] Health checks fonctionnent

### Tests
- [ ] Tests E2E passent
- [ ] Streaming SSE fonctionne
- [ ] RAG fonctionne
- [ ] Rate limiting fonctionne

### Monitoring
- [ ] Prometheus metrics disponibles
- [ ] Logs accessibles
- [ ] Alertes configurées (optionnel)

---

**Status**: ✅ **PRÊT POUR PRODUCTION**
