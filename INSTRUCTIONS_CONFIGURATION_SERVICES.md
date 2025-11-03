# ⚙️ INSTRUCTIONS - CONFIGURATION DES SERVICES

**Date:** 29 Octobre 2025  
**Phase:** Configuration Services Professionnelle  
**Durée estimée:** 1-2 heures

---

## 🎯 SERVICES À CONFIGURER

### 1. Upstash Redis (PRIORITAIRE)

**Impact:**
- ✅ Rate limiting actif
- ✅ Cache performances (5-10x plus rapide)
- ✅ Protection DDoS
- ✅ Scalabilité illimitée

**URL:** https://console.upstash.com

**Steps:**
1. Créer compte (gratuit pour commencer)
2. Create Database:
   - Name: `luneo-production-redis`
   - Region: `us-east-1` (même que Vercel)
   - Type: Global Database
   - Eviction: `allkeys-lru`

3. Copier credentials:
   ```
   UPSTASH_REDIS_REST_URL=https://us1-xxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXXXxxxxx
   ```

4. Ajouter dans Vercel:
   - https://vercel.com/luneos-projects/frontend/settings/environment-variables
   - Add New → Name: `UPSTASH_REDIS_REST_URL`
   - Add New → Name: `UPSTASH_REDIS_REST_TOKEN`
   - Environments: Production, Preview, Development

5. Redéployer:
   ```bash
   cd apps/frontend
   vercel --prod
   ```

**Vérification:**
```bash
curl https://app.luneo.app/api/health
# Devrait montrer "redis": { "status": "healthy" }
```

**Documentation:** `GUIDE_UPSTASH_REDIS_PROFESSIONNEL.md`

---

### 2. OpenAI API (Pour AI Studio)

**Impact:**
- ✅ Génération designs IA
- ✅ DALL-E 3 pour images
- ✅ GPT-4 pour prompts

**URL:** https://platform.openai.com/api-keys

**Steps:**
1. Créer compte OpenAI
2. Acheter crédits ($10 minimum recommandé)
3. Create API Key:
   - Name: `luneo-production`
   - Permissions: All

4. Copier clé:
   ```
   OPENAI_API_KEY=sk-proj-xxxxx
   ```

5. Ajouter dans Vercel:
   - Variable: `OPENAI_API_KEY`
   - Value: `sk-proj-xxxxx`
   - Environments: Production

**Pricing:**
- GPT-4: ~$0.03 par requête
- DALL-E 3: ~$0.04 par image
- Budget recommandé: $50-100/mois

**Vérification:**
```bash
curl -X POST https://app.luneo.app/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Test"}' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. Cloudinary (Pour images)

**Impact:**
- ✅ Upload images optimisé
- ✅ Transformations automatiques (WebP, AVIF)
- ✅ CDN global ultra-rapide
- ✅ Responsive images automatique

**URL:** https://cloudinary.com

**Steps:**
1. Créer compte (Free tier: 25GB, 25k transformations/mois)

2. Dashboard → Settings → Access Keys

3. Copier credentials:
   ```
   CLOUDINARY_CLOUD_NAME=dxxxxx
   CLOUDINARY_API_KEY=123456789
   CLOUDINARY_API_SECRET=xxxxx
   ```

4. Ajouter dans Vercel:
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

5. Mettre à jour Next.config:
   ```javascript
   images: {
     domains: ['res.cloudinary.com'],
     loader: 'cloudinary',
     path: 'https://res.cloudinary.com/dxxxxx/image/upload/',
   }
   ```

**Transformations automatiques:**
```typescript
// Image component
<Image
  src="sample.jpg"
  width={800}
  height={600}
  quality="auto"
  format="auto" // WebP/AVIF automatique
/>
```

---

### 4. SendGrid (Email Production)

**Impact:**
- ✅ Emails transactionnels professionnels
- ✅ Taux de délivrabilité >98%
- ✅ Templates visuels
- ✅ Analytics emails

**URL:** https://app.sendgrid.com

**Steps:**
1. Créer compte SendGrid

2. Verify Sender:
   - Sender Management → Create Sender
   - Email: no-reply@luneo.app
   - Reply-to: support@luneo.app

3. Domain Authentication (IMPORTANT):
   - Settings → Sender Authentication → Authenticate Domain
   - Domain: luneo.app
   - **Copier les 3 DNS records fournis**

4. Ajouter DNS records dans Cloudflare:
   ```
   Type: CNAME, Name: em1234, Value: u1234.wl.sendgrid.net
   Type: CNAME, Name: s1._domainkey, Value: s1.domainkey.u1234.wl.sendgrid.net
   Type: CNAME, Name: s2._domainkey, Value: s2.domainkey.u1234.wl.sendgrid.net
   ```

5. Attendre vérification (5-30 minutes)

6. Create API Key:
   - Settings → API Keys → Create API Key
   - Name: `luneo-production`
   - Permissions: Full Access

7. Copier et ajouter dans Vercel:
   ```
   SENDGRID_API_KEY=SG.xxxxx
   SENDGRID_FROM_EMAIL=no-reply@luneo.app
   SENDGRID_FROM_NAME=Luneo
   ```

**Vérification:**
```bash
curl -X POST https://app.luneo.app/api/emails/send-welcome \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com"}'
```

**Documentation:** `apps/backend/SENDGRID_PRODUCTION_GUIDE.md`

---

### 5. Sentry (Error Tracking)

**Impact:**
- ✅ Tracking erreurs temps réel
- ✅ Stack traces détaillées
- ✅ Performance monitoring
- ✅ Release tracking

**URL:** https://sentry.io

**Steps:**
1. Créer compte Sentry

2. Create Project:
   - Platform: Next.js
   - Name: `luneo-frontend`

3. Copier DSN:
   ```
   NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/789012
   ```

4. Ajouter dans Vercel:
   - Variable: `NEXT_PUBLIC_SENTRY_DSN`
   - Environments: Production

5. Créer projet backend:
   - Platform: Node.js
   - Name: `luneo-backend`

6. Copier DSN backend:
   ```
   SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/789013
   ```

**Vérification:**
- Sentry Dashboard → Projects
- Devrait voir des events après déploiement

**Configuration avancée:**
```typescript
// sentry.server.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0, // 100% des transactions
  profilesSampleRate: 1.0,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  replaysSessionSampleRate: 0.1, // 10% des sessions
  replaysOnErrorSampleRate: 1.0, // 100% des erreurs
});
```

---

### 6. Vercel Analytics & Speed Insights

**Impact:**
- ✅ Web Vitals monitoring
- ✅ Real user metrics
- ✅ Performance insights

**Steps:**
1. Aller sur projet Vercel
2. Analytics → Enable Analytics
3. Speed Insights → Enable

**Déjà installé:**
```typescript
// layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

// Dans le JSX:
<Analytics />
<SpeedInsights />
```

**Vérification:**
- Vercel Dashboard → Analytics
- Metrics après quelques visites

---

## 📊 PRIORITÉS

### Immédiat (Aujourd'hui)

1. 🔴 Upstash Redis
2. 🔴 Sentry

### Important (Cette semaine)

3. 🟡 OpenAI (si AI Studio utilisé)
4. 🟡 Cloudinary (si upload images)
5. 🟡 SendGrid (si emails transactionnels)

### Optionnel

6. 🟢 Analytics (déjà installé)
7. 🟢 Speed Insights (déjà installé)

---

## ✅ CHECKLIST FINALE

**Après configuration de tous les services:**

- [ ] Redis: healthy dans /api/health
- [ ] Rate limiting actif (tester avec 100+ requêtes)
- [ ] Cache dashboard stats (vérifier latence)
- [ ] OpenAI génération fonctionne
- [ ] Cloudinary upload fonctionne
- [ ] SendGrid emails envoyés
- [ ] Sentry capture errors
- [ ] Analytics actives
- [ ] Speed Insights actives

---

*Instructions créées le 29 Oct 2025 - Configuration professionnelle*

