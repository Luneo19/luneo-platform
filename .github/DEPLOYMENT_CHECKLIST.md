# ✅ Checklist Déploiement Staging - Luneo Platform

**Date**: 16 novembre 2025  
**Status**: 🚀 **PRÊT POUR DÉPLOIEMENT**

---

## 📋 Checklist Complète

### Phase 1: Préparation ✅

- [x] ✅ 15 agents Cursor exécutés
- [x] ✅ Code review et corrections
- [x] ✅ Tests passés
- [x] ✅ Scripts de déploiement créés
- [x] ✅ Scripts de smoke tests créés
- [x] ✅ Guides de déploiement créés
- [x] ✅ PR #1 créée (Agents implementation)
- [x] ✅ PR #2 créée (Deployment guides)

### Phase 2: Merge PRs ⏳

- [ ] ⏳ **Approuver PR #1** via GitHub UI
  - URL: https://github.com/Luneo19/luneo-platform/pull/1
  - Action: Cliquer sur "Approve" puis "Merge"
  
- [ ] ⏳ **Approuver PR #2** via GitHub UI
  - URL: https://github.com/Luneo19/luneo-platform/pull/2
  - Action: Cliquer sur "Approve" puis "Merge"

**Alternative (si vous avez les droits admin):**
```bash
gh pr merge 1 --admin --squash --delete-branch
gh pr merge 2 --admin --squash --delete-branch
```

### Phase 3: Migrations Prisma ⏳

- [ ] ⏳ **Vérifier migrations disponibles**
  ```bash
  cd apps/backend
  npx prisma migrate status
  ```

- [ ] ⏳ **Créer migration ShopifyInstall** (si nécessaire)
  ```bash
  npx prisma migrate dev --name add_shopify_install
  ```

- [ ] ⏳ **Appliquer migrations sur staging DB**
  ```bash
  export DATABASE_URL="postgresql://user:pass@staging-db:5432/luneo_staging"
  npx prisma migrate deploy
  ```

### Phase 4: Configuration Variables ⏳

- [ ] ⏳ **Configurer variables backend** (Vercel/GitHub Secrets)
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `REDIS_URL`
  - `SHOPIFY_API_KEY`
  - `SHOPIFY_API_SECRET`
  - `MASTER_ENCRYPTION_KEY`
  - `STRIPE_SECRET_KEY`
  - `OPENAI_API_KEY`
  - `SENTRY_DSN`

- [ ] ⏳ **Configurer variables frontend** (Vercel)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_URL`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Phase 5: Déploiement ⏳

- [ ] ⏳ **Exécuter script de déploiement**
  ```bash
  export DATABASE_URL="postgresql://..."
  export JWT_SECRET="..."
  export REDIS_URL="..."
  # ... autres variables
  ./scripts/deploy-staging.sh
  ```

- [ ] ⏳ **Déployer backend**
  ```bash
  cd apps/backend
  vercel --prod --env=staging
  # Ou via Docker
  docker-compose -f docker-compose.staging.yml up -d --build
  ```

- [ ] ⏳ **Déployer frontend**
  ```bash
  cd apps/frontend
  vercel --prod --env=staging
  ```

- [ ] ⏳ **Déployer worker IA**
  ```bash
  cd apps/worker-ia
  # Sur Railway/Render ou Docker
  pnpm install && pnpm build && pnpm start
  ```

### Phase 6: Smoke Tests ⏳

- [ ] ⏳ **Exécuter smoke tests**
  ```bash
  export STAGING_API_URL="https://api-staging.luneo.app"
  export STAGING_FRONTEND_URL="https://staging.luneo.app"
  ./scripts/smoke-tests-staging.sh
  ```

- [ ] ⏳ **Tests manuels**
  - [ ] Test Shopify OAuth flow
  - [ ] Test widget handshake
  - [ ] Test 3D selection tool
  - [ ] Test AR conversion
  - [ ] Test worker render job
  - [ ] Test billing endpoints
  - [ ] Test GDPR endpoints

### Phase 7: Monitoring ⏳

- [ ] ⏳ **Vérifier logs**
  - Backend logs
  - Frontend logs
  - Worker logs

- [ ] ⏳ **Vérifier métriques**
  - Prometheus (si configuré)
  - Grafana (si configuré)
  - Sentry errors

- [ ] ⏳ **Vérifier performance**
  - Temps de réponse API < 200ms
  - Taux d'erreur < 1%
  - Queue wait time < 60s

---

## 🚀 Commandes Rapides

### Déploiement Complet

```bash
# 1. Configurer variables
export DATABASE_URL="postgresql://..."
export JWT_SECRET="..."
# ... autres variables

# 2. Appliquer migrations
cd apps/backend
npx prisma migrate deploy

# 3. Déployer services
cd ../..
./scripts/deploy-staging.sh

# 4. Smoke tests
./scripts/smoke-tests-staging.sh
```

---

## 📚 Documentation

- **Guide complet**: `.github/DEPLOYMENT_STAGING_GUIDE.md`
- **Checklist rapide**: `.github/STAGING_DEPLOYMENT_READY.md`
- **Prochaines étapes**: `.github/NEXT_STEPS.md`

---

## ✅ Une fois Staging Validé

1. ✅ Smoke tests passés
2. ✅ Monitoring actif
3. ✅ Performance OK
4. ⏳ Déployer sur production
5. ⏳ Canary rollout
6. ⏳ Monitoring production (30-60 min)

---

**🎉 Tout est prêt ! Suivez cette checklist étape par étape.**

