# ✅ Checklist de Déploiement Production

## 🌐 FRONTEND (Vercel)

### Configuration initiale
- [ ] Vercel CLI installé : `npm install -g vercel`
- [ ] Connecté à Vercel : `vercel login`
- [ ] Projet créé/lié : `vercel link` (dans `apps/frontend`)
- [ ] Root Directory configuré : `apps/frontend` (via Dashboard)

### Variables d'environnement Vercel
- [ ] `NEXT_PUBLIC_API_URL` = URL du backend Railway
- [ ] `NEXT_PUBLIC_APP_URL` = URL de production frontend
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Clé publique Stripe
- [ ] `NODE_ENV` = `production`
- [ ] Autres variables nécessaires (Supabase, Sentry, etc.)

### Déploiement
- [ ] Build local réussi : `cd apps/frontend && npm run build`
- [ ] Déploiement : `vercel --prod`
- [ ] URL accessible et fonctionnelle
- [ ] Health check OK

---

## 🚂 BACKEND (Railway)

### Configuration initiale
- [ ] Railway CLI installé : `npm install -g @railway/cli`
- [ ] Connecté à Railway : `railway login`
- [ ] Projet créé/lié : `railway link` (dans `apps/backend`)
- [ ] Root Directory configuré : `apps/backend` (via Dashboard)

### Services Railway
- [ ] PostgreSQL ajouté
- [ ] Redis ajouté (optionnel mais recommandé)

### Variables d'environnement Railway

#### OBLIGATOIRES
- [ ] `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `3001`
- [ ] `JWT_SECRET` = (généré avec `openssl rand -base64 32`)
- [ ] `JWT_REFRESH_SECRET` = (généré avec `openssl rand -base64 32`)
- [ ] `JWT_EXPIRES_IN` = `15m`
- [ ] `JWT_REFRESH_EXPIRES_IN` = `7d`
- [ ] `API_PREFIX` = `/api`
- [ ] `FRONTEND_URL` = URL frontend Vercel
- [ ] `CORS_ORIGIN` = URLs autorisées (frontend)

#### IMPORTANTES
- [ ] `REDIS_URL` = `${{Redis.REDIS_URL}}` (si Redis ajouté)
- [ ] `STRIPE_SECRET_KEY` = Clé secrète Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` = Secret webhook Stripe
- [ ] `SENDGRID_API_KEY` = Clé API SendGrid
- [ ] `SENDGRID_DOMAIN` = Domaine SendGrid
- [ ] `SENDGRID_FROM_EMAIL` = Email expéditeur
- [ ] `OPENAI_API_KEY` = Clé API OpenAI
- [ ] `CLOUDINARY_CLOUD_NAME` = (si utilisé)
- [ ] `CLOUDINARY_API_KEY` = (si utilisé)
- [ ] `CLOUDINARY_API_SECRET` = (si utilisé)

### Migrations
- [ ] Migrations Prisma exécutées : `railway run "pnpm prisma migrate deploy"`

### Déploiement
- [ ] Déploiement : `railway up`
- [ ] Health check OK : `https://votre-backend.railway.app/api/health`
- [ ] Logs sans erreurs critiques

---

## 🔗 CONFIGURATION CROSS-PLATFORM

### Lien Frontend ↔ Backend
- [ ] Frontend pointe vers Backend : `NEXT_PUBLIC_API_URL`
- [ ] Backend autorise Frontend : `CORS_ORIGIN`

### Webhooks
- [ ] Webhook Stripe configuré dans Stripe Dashboard
- [ ] URL webhook : `https://votre-backend.railway.app/api/webhooks/stripe`
- [ ] Secret webhook configuré dans Railway : `STRIPE_WEBHOOK_SECRET`

### Domaines
- [ ] Domaine frontend configuré (Vercel)
- [ ] Domaine backend configuré (Railway, optionnel)
- [ ] DNS configuré correctement

---

## 🧪 TESTS POST-DÉPLOIEMENT

### Frontend
- [ ] Page d'accueil accessible
- [ ] Authentification fonctionnelle (login/register)
- [ ] Dashboard accessible après login
- [ ] Pas d'erreurs console (F12)

### Backend
- [ ] Health check : `/api/health`
- [ ] Authentification : `POST /api/v1/auth/login`
- [ ] API accessible depuis frontend
- [ ] Logs sans erreurs

### Intégrations
- [ ] Stripe checkout fonctionnel
- [ ] Emails envoyés (SendGrid)
- [ ] Base de données accessible
- [ ] Redis accessible (si utilisé)

---

## 📋 COMMANDES UTILES

### Vercel
```bash
# Logs
vercel logs

# Variables d'environnement
vercel env ls

# Redéployer
cd apps/frontend && vercel --prod
```

### Railway
```bash
# Logs
railway logs

# Variables d'environnement
railway variables

# Redéployer
cd apps/backend && railway up

# Migrations
railway run "pnpm prisma migrate deploy"
```

---

## 🚀 DÉPLOIEMENT RAPIDE

### Tout déployer
```bash
./scripts/deploy-production.sh
```

### Frontend uniquement
```bash
./scripts/deploy-vercel-frontend.sh
```

### Backend uniquement
```bash
./scripts/deploy-railway-backend.sh
```

---

**Status** : ✅ Prêt pour déploiement  
**Dernière mise à jour** : Décembre 2024
