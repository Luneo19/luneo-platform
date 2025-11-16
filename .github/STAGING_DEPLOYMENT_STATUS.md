# 📊 Status Déploiement Staging

**Date**: 16 novembre 2025  
**Dernière exécution**: Scripts de déploiement exécutés

---

## ✅ Exécution Complétée

### Scripts Exécutés ✅
- [x] ✅ Guide rapide consulté (`.github/QUICK_START_STAGING.md`)
- [x] ✅ Template variables consulté (`docs/staging-env-template.md`)
- [x] ✅ Migrations Prisma vérifiées (DB locale à jour)
- [x] ✅ Script de déploiement exécuté (`scripts/deploy-staging.sh`)
- [x] ✅ Smoke tests exécutés (`scripts/smoke-tests-staging.sh`)

### Résultats ⚠️

**Migrations Prisma:**
- ✅ Status: À jour (2 migrations trouvées)
- ✅ DB locale: Schema synchronisé
- ⏳ Staging DB: Nécessite configuration DATABASE_URL

**Script de Déploiement:**
- ⚠️ Échec: DATABASE_URL non configuré
- ℹ️ Normal: Nécessite variables staging réelles

**Smoke Tests:**
- ⚠️ Échec: Services non déployés
- ℹ️ Normal: Nécessite déploiement préalable

---

## ⏳ Prochaines Étapes

### 1. Configurer Variables Staging

**Créer fichier `.env.staging`** (ne pas commiter):
```bash
# Depuis template
cat docs/staging-env-template.md | grep -E "^[A-Z]" > .env.staging

# Éditer avec vos vraies valeurs
nano .env.staging

# Charger variables
export $(cat .env.staging | xargs)
```

**Ou configurer dans Vercel:**
- Vercel Dashboard → Settings → Environment Variables
- Ajouter toutes les variables du template

### 2. Appliquer Migrations sur Staging DB

```bash
# Configurer DATABASE_URL staging
export DATABASE_URL="postgresql://user:pass@staging-host:5432/luneo_staging"

# Appliquer migrations
cd apps/backend
npx prisma migrate deploy

# Vérifier table ShopifyInstall
npx prisma studio
```

### 3. Déployer Services

**Backend:**
```bash
cd apps/backend
vercel --prod --env=staging
# Ou via Docker
docker-compose -f docker-compose.staging.yml up -d --build
```

**Frontend:**
```bash
cd apps/frontend
vercel --prod --env=staging
```

**Worker IA:**
```bash
cd apps/worker-ia
# Sur Railway/Render ou Docker
pnpm install && pnpm build && pnpm start
```

### 4. Ré-exécuter Smoke Tests

```bash
# Configurer URLs staging réelles
export STAGING_API_URL="https://api-staging.luneo.app"
export STAGING_FRONTEND_URL="https://staging.luneo.app"

# Exécuter tests
./scripts/smoke-tests-staging.sh
```

---

## 📋 Checklist

- [x] ✅ Scripts exécutés
- [x] ✅ Migrations vérifiées (locale)
- [ ] ⏳ Variables staging configurées
- [ ] ⏳ Migrations appliquées (staging DB)
- [ ] ⏳ Backend déployé
- [ ] ⏳ Frontend déployé
- [ ] ⏳ Worker IA déployé
- [ ] ⏳ Smoke tests passés

---

## 🆘 Dépannage

**Si DATABASE_URL non configuré:**
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/db"
```

**Si connexion DB échoue:**
```bash
# Tester connexion
psql $DATABASE_URL -c "SELECT 1"
```

**Si migrations échouent:**
```bash
# Vérifier status
npx prisma migrate status

# Vérifier schéma
npx prisma studio
```

---

**📚 Documentation**: `.github/QUICK_START_STAGING.md`

