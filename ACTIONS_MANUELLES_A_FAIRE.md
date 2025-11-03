# ⏳ ACTIONS MANUELLES À FAIRE PLUS TARD

**Date:** 29 Octobre 2025  
**Status:** EN ATTENTE - Configuration services externes

---

## 🔴 ACTIONS MANUELLES REQUISES

### 1. Upstash Redis

**URL:** https://console.upstash.com

**Actions:**
1. Créer compte
2. Create Database (name: luneo-production-redis, region: us-east-1)
3. Copier: `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`
4. Ajouter dans Vercel Environment Variables

**Impact:** Rate limiting + Cache (5-10x performance)

**Documentation:** `GUIDE_UPSTASH_REDIS_PROFESSIONNEL.md`

---

### 2. Sentry Error Tracking

**URL:** https://sentry.io

**Actions:**
1. Créer compte
2. Create Project (Platform: Next.js, Name: luneo-frontend)
3. Copier DSN
4. Ajouter `NEXT_PUBLIC_SENTRY_DSN` dans Vercel

**Impact:** Error tracking temps réel

**Temps:** 20 minutes

---

### 3. OpenAI (Optionnel - Si AI Studio utilisé)

**URL:** https://platform.openai.com/api-keys

**Actions:**
1. Créer compte
2. Acheter crédits ($10 minimum)
3. Create API Key
4. Ajouter `OPENAI_API_KEY` dans Vercel

**Impact:** Génération designs IA

**Temps:** 5 minutes

---

### 4. Cloudinary (Optionnel - Si upload images)

**URL:** https://cloudinary.com

**Actions:**
1. Créer compte (Free tier: 25GB)
2. Dashboard → Settings → Access Keys
3. Copier Cloud Name, API Key, API Secret
4. Ajouter dans Vercel

**Impact:** Images CDN optimisées

**Temps:** 15 minutes

---

### 5. SendGrid Domain Verification

**URL:** https://app.sendgrid.com

**Actions:**
1. Settings → Sender Authentication
2. Authenticate Domain: luneo.app
3. Copier les 3 DNS records (CNAME)
4. Ajouter dans Cloudflare DNS
5. Attendre vérification (5-30 min)

**Impact:** Emails transactionnels professionnels

**Temps:** 30 minutes

**Documentation:** `apps/backend/SENDGRID_PRODUCTION_GUIDE.md`

---

### 6. Backend Hetzner (Plus tard)

**Actions:**
1. Créer VPS Hetzner
2. Installer Docker
3. Déployer backend
4. Configurer Nginx
5. SSL Let's Encrypt
6. DNS api.luneo.app

**Impact:** Backend API accessible

**Temps:** 4 heures

**Documentation:** `apps/backend/HETZNER_DEPLOYMENT_GUIDE_COMPLETE.md`

---

## 📋 CHECKLIST

- [ ] Upstash Redis configuré
- [ ] Sentry configuré
- [ ] OpenAI configuré (optionnel)
- [ ] Cloudinary configuré (optionnel)
- [ ] SendGrid domain vérifié
- [ ] Backend Hetzner déployé

---

**NOTE:** Une fois ces configurations faites, revenir ici et cocher les items.

*Fichier de suivi créé le 29 Oct 2025*

