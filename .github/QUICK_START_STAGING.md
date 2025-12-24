# 🚀 Quick Start - Déploiement Staging

**Temps estimé**: 15-30 minutes

---

## ⚡ Démarrage Rapide

### 1. Prérequis

- [ ] PRs #1 et #2 mergées (ou code sur main)
- [ ] Accès à la DB staging PostgreSQL
- [ ] Accès à Redis staging
- [ ] Variables d'environnement configurées

### 2. Configuration Variables

**Option A: Fichier local**
```bash
# Créer .env.staging depuis template
cat docs/staging-env-template.md | grep -E "^[A-Z]" > .env.staging

# Éditer et remplir les valeurs
nano .env.staging

# Charger les variables
export $(cat .env.staging | xargs)
```

**Option B: Vercel/GitHub Secrets**
- Configurer dans Vercel Dashboard → Settings → Environment Variables
- Ou GitHub Secrets pour CI/CD

### 3. Appliquer Migrations

```bash
cd apps/backend

# Vérifier status
npx prisma migrate status

# Appliquer migrations
npx prisma migrate deploy

# Vérifier table ShopifyInstall
npx prisma studio
# Ou via SQL
psql $DATABASE_URL -c "\d \"ShopifyInstall\""
```

### 4. Déployer Services

**Backend (Vercel):**
```bash
cd apps/backend
vercel --prod --env=staging
```

**Frontend (Vercel):**
```bash
cd apps/frontend
vercel --prod --env=staging
```

**Worker IA (Railway/Render/Docker):**
```bash
cd apps/worker-ia
pnpm install
pnpm build
pnpm start
```

### 5. Smoke Tests

```bash
# Configurer URLs
export STAGING_API_URL="https://api-staging.luneo.app"
export STAGING_FRONTEND_URL="https://staging.luneo.app"

# Exécuter tests
./scripts/smoke-tests-staging.sh
```

---

## ✅ Checklist Rapide

- [ ] Variables configurées
- [ ] Migrations appliquées
- [ ] Backend déployé
- [ ] Frontend déployé
- [ ] Worker IA déployé
- [ ] Smoke tests passés
- [ ] Monitoring actif

---

## 🆘 Dépannage

**Erreur connexion DB:**
```bash
# Tester connexion
psql $DATABASE_URL -c "SELECT 1"
```

**Migrations échouent:**
```bash
# Vérifier status
npx prisma migrate status

# Reset si nécessaire (ATTENTION: perte de données)
npx prisma migrate reset
```

**Services ne démarrent pas:**
- Vérifier logs: `vercel logs` ou `docker-compose logs`
- Vérifier variables d'environnement
- Vérifier health checks

---

**📚 Guide complet**: `.github/DEPLOYMENT_STAGING_GUIDE.md`

