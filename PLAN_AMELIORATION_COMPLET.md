# 🎯 PLAN D'AMÉLIORATION COMPLET - LUNEO PLATFORM

**Date:** 29 Octobre 2025  
**Version:** 2.0.0  
**Objectif:** Corriger tous les points critiques et optimiser la plateforme

---

## 📋 TABLE DES MATIÈRES

1. [Points Critiques Immédiats](#critiques-immediats)
2. [Problèmes Identifiés](#problemes)
3. [Plan d'Action par Priorité](#plan-action)
4. [TODOs Complètes](#todos)
5. [Checklist de Validation](#checklist)

---

<a name="critiques-immediats"></a>
## 🔴 POINTS CRITIQUES IMMÉDIATS

### 1. Database Unhealthy ⚠️

**Problème:**
```json
{
  "status": "unhealthy",
  "services": {
    "database": {
      "status": "unhealthy",
      "latency_ms": 1121
    }
  }
}
```

**Cause probable:**
- Query dans `/api/health/route.ts` utilise `.single()` mais la table profiles peut être vide
- Latence élevée (1121ms)

**Solution:**
```typescript
// Remplacer ligne 14:
const { error } = await supabase.from('profiles').select('id').limit(1).single();

// Par:
const { error } = await supabase.from('profiles').select('id').limit(1);
```

**Priorité:** 🔴 URGENTE  
**Temps estimé:** 5 minutes

---

### 2. Supabase URL incorrecte dans vercel.env.example

**Problème:**
Le fichier `vercel.env.example` référence l'ancien projet Supabase `bkasxmzwilkbmszovedc` au lieu du projet production `obrijgptqztacolemsbk`.

**Fichier:** `/apps/frontend/vercel.env.example` ligne 9-10

**Solution:**
```env
# Changer:
NEXT_PUBLIC_SUPABASE_URL=https://bkasxmzwilkbmszovedc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci... (ancien)

# En:
NEXT_PUBLIC_SUPABASE_URL=https://obrijgptqztacolemsbk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9icmlqZ3B0cXp0YWNvbGVtc2JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNjYwMjIsImV4cCI6MjA3Njg0MjAyMn0.0dxttYi1WPLuqdkI52a0Rary81wtYdjnBt4F0q4tYV8
```

**Priorité:** 🔴 CRITIQUE  
**Temps estimé:** 2 minutes

---

### 3. Redis non configuré

**Problème:**
```json
{
  "redis": {
    "status": "not_configured"
  }
}
```

**Impact:**
- Rate limiting désactivé
- Pas de cache
- Performance réduite

**Solution:**
1. Créer compte Upstash: https://upstash.com
2. Créer database Redis
3. Ajouter dans Vercel:
   ```
   UPSTASH_REDIS_REST_URL=https://...
   UPSTASH_REDIS_REST_TOKEN=...
   ```

**Priorité:** 🟡 IMPORTANTE  
**Temps estimé:** 15 minutes  
**Documentation:** `GUIDE_SETUP_REDIS_UPSTASH.md`

---

### 4. Backend non déployé

**Problème:**
Le backend NestJS n'est pas accessible en production.

**Status actuel:**
- Code backend: ✅ Complet
- Build backend: ✅ Réussi
- Déploiement Vercel: ❌ Échoue
- Déploiement Hetzner: ⏳ Non fait

**Solution:**
Déployer le backend sur Hetzner VPS.

**Priorité:** 🟡 IMPORTANTE  
**Temps estimé:** 3-4 heures  
**Documentation:** `apps/backend/HETZNER_DEPLOYMENT_GUIDE_COMPLETE.md`

---

### 5. Metadata OG URL incorrecte

**Problème:**
Dans le HTML généré, on voit:
```html
<meta property="og:url" content="https://app.luneo.app/cd%20frontend%20%26%26%20npx%20vercel%20env%20add%20NEXT_PUBLIC_APP_URL%20production%20%3C%3C%3C%20%22https:/luneo.app%22"/>
```

**Cause:**
Variable `NEXT_PUBLIC_APP_URL` mal configurée dans Vercel.

**Solution:**
Vérifier et corriger dans Vercel Dashboard:
```
NEXT_PUBLIC_APP_URL=https://app.luneo.app
```

**Priorité:** 🟡 IMPORTANTE  
**Temps estimé:** 2 minutes

---

<a name="problemes"></a>
## ⚠️ PROBLÈMES IDENTIFIÉS

### Performance

| Problème | Severity | Solution | Temps |
|----------|----------|----------|-------|
| Latence database 1121ms | 🟡 Moyenne | Optimiser query health check | 5 min |
| Pas de cache Redis | 🟡 Moyenne | Configurer Upstash | 15 min |
| Images non optimisées | 🟢 Basse | Configurer Cloudinary | 30 min |
| Bundle size non analysé | 🟢 Basse | Activer bundle analyzer | 10 min |

### Sécurité

| Problème | Severity | Solution | Temps |
|----------|----------|----------|-------|
| Pas de Sentry configuré | 🟡 Moyenne | Configurer Sentry DSN | 20 min |
| CSRF token non testé | 🟢 Basse | Tests CSRF | 15 min |
| Rate limiting désactivé | 🟡 Moyenne | Configurer Upstash Redis | 15 min |
| 2FA SQL non exécuté | 🟢 Basse | Exécuter SQL dans Supabase | 5 min |

### Features manquantes

| Feature | Severity | Solution | Temps |
|---------|----------|----------|-------|
| Notifications in-app | 🟡 Moyenne | Implémenter système notifications | 3h |
| Email templates SendGrid | 🟡 Moyenne | Configurer templates | 2h |
| WooCommerce integration | 🟢 Basse | Implémenter connector | 4h |
| AR Export GLB/USDZ | 🟢 Basse | Implémenter export | 3h |
| Design versioning | 🟢 Basse | Activer versioning | 2h |
| Design collections UI | 🟢 Basse | Interface collections | 2h |
| Analytics dashboard complet | 🟢 Basse | Charts avancés | 3h |

### Configuration

| Problème | Severity | Solution | Temps |
|----------|----------|----------|-------|
| OpenAI API key manquante | 🟡 Moyenne | Ajouter clé dans Vercel | 2 min |
| Cloudinary non configuré | 🟡 Moyenne | Configurer compte | 15 min |
| SendGrid domain non vérifié | 🟡 Moyenne | Vérifier domaine | 30 min |
| Custom domains non configurés | 🟡 Moyenne | Configurer DNS | 1h |

### Documentation

| Problème | Severity | Solution | Temps |
|----------|----------|----------|-------|
| Trop de fichiers MD redondants | 🟢 Basse | Consolidation | 1h |
| Pas de guide utilisateur final | 🟢 Basse | Créer guide | 2h |
| Vidéos tutorials manquants | 🟢 Basse | Enregistrer vidéos | 4h |

---

<a name="plan-action"></a>
## 📅 PLAN D'ACTION PAR PRIORITÉ

### PHASE 1: Corrections Critiques (30 minutes)

**Objectif:** Corriger les erreurs bloquantes

1. ✅ Corriger health check database
   - Fichier: `/apps/frontend/src/app/api/health/route.ts`
   - Action: Retirer `.single()`
   - Temps: 5 min

2. ✅ Corriger vercel.env.example
   - Fichier: `/apps/frontend/vercel.env.example`
   - Action: Mettre bon projet Supabase
   - Temps: 2 min

3. ✅ Vérifier NEXT_PUBLIC_APP_URL
   - Action: Vercel Dashboard → Env Vars
   - Temps: 2 min

4. ✅ Redéployer frontend
   - Action: `vercel --prod --force`
   - Temps: 3 min

5. ✅ Tester health check
   - Action: `curl https://app.luneo.app/api/health`
   - Temps: 1 min

---

### PHASE 2: Configuration Services (1 heure)

**Objectif:** Activer les services optionnels

1. ⏳ Configurer Upstash Redis
   - URL: https://upstash.com
   - Action: Créer database, ajouter vars Vercel
   - Temps: 15 min
   - Doc: `GUIDE_SETUP_REDIS_UPSTASH.md`

2. ⏳ Configurer OpenAI
   - URL: https://platform.openai.com
   - Action: Créer API key, ajouter dans Vercel
   - Temps: 5 min

3. ⏳ Configurer Cloudinary
   - URL: https://cloudinary.com
   - Action: Créer compte, ajouter credentials
   - Temps: 15 min

4. ⏳ Vérifier domaine SendGrid
   - URL: https://app.sendgrid.com
   - Action: Vérifier domaine luneo.app
   - Temps: 20 min
   - Doc: `apps/backend/SENDGRID_PRODUCTION_GUIDE.md`

5. ⏳ Configurer Sentry
   - URL: https://sentry.io
   - Action: Créer projet, copier DSN
   - Temps: 10 min

---

### PHASE 3: Déploiement Backend (4 heures)

**Objectif:** Backend accessible en production

1. ⏳ Préparer serveur Hetzner
   - Action: Créer VPS, installer Docker
   - Temps: 30 min

2. ⏳ Configurer variables env production
   - Fichier: `.env.production`
   - Temps: 15 min

3. ⏳ Déployer avec Docker
   - Script: `apps/backend/deploy-production.sh`
   - Temps: 30 min

4. ⏳ Configurer Nginx reverse proxy
   - Config: `apps/backend/nginx.conf`
   - Temps: 20 min

5. ⏳ Configurer SSL (Let's Encrypt)
   - Script: `apps/backend/setup-ssl-complete.sh`
   - Temps: 15 min

6. ⏳ Configurer DNS (api.luneo.app)
   - Action: Cloudflare DNS records
   - Temps: 10 min

7. ⏳ Tests backend production
   - Action: Smoke tests
   - Temps: 30 min

8. ⏳ Monitoring & logs
   - Action: Configurer PM2, logs
   - Temps: 30 min

**Documentation:** `apps/backend/HETZNER_DEPLOYMENT_GUIDE_COMPLETE.md`

---

### PHASE 4: Features Manquantes (10 heures)

**Objectif:** Implémenter features importantes

#### 4.1 Notifications (3 heures)

1. ⏳ Créer API routes notifications
   - `/api/notifications` (GET, POST)
   - `/api/notifications/:id` (PUT, DELETE)
   - Temps: 1h

2. ⏳ Component UI notifications
   - Bell icon avec badge
   - Dropdown liste notifications
   - Temps: 1h

3. ⏳ Webhooks sortants
   - Table webhook_endpoints OK
   - Trigger notifications
   - Temps: 1h

#### 4.2 Email Templates (2 heures)

1. ⏳ Créer templates SendGrid
   - Welcome email
   - Order confirmation
   - Production ready
   - Temps: 1h

2. ⏳ Intégrer dans le code
   - Modifier email.service.ts
   - Ajouter template IDs
   - Temps: 30 min

3. ⏳ Tester emails
   - Test welcome
   - Test order
   - Temps: 30 min

#### 4.3 WooCommerce Integration (3 heures)

1. ⏳ OAuth WooCommerce
   - API routes connect/callback
   - Temps: 1h

2. ⏳ Sync produits
   - API sync
   - Background job
   - Temps: 1h

3. ⏳ Webhooks WooCommerce
   - Recevoir commandes
   - Sync status
   - Temps: 1h

#### 4.4 Design Collections UI (2 heures)

1. ⏳ Page collections
   - Liste collections
   - Créer/Modifier
   - Temps: 1h

2. ⏳ Ajouter designs à collections
   - UI drag & drop
   - API integration
   - Temps: 1h

---

### PHASE 5: Optimisations (6 heures)

**Objectif:** Améliorer performance

#### 5.1 Redis Caching (2 heures)

1. ⏳ Implémenter cache dashboard stats
   - Cache 5 minutes
   - Invalidation intelligente
   - Temps: 1h

2. ⏳ Implémenter cache templates/cliparts
   - Cache 1 heure
   - Temps: 30 min

3. ⏳ Implémenter cache products
   - Cache 10 minutes
   - Temps: 30 min

#### 5.2 Image Optimization (1 heure)

1. ⏳ Configurer Cloudinary transformations
   - Auto WebP/AVIF
   - Responsive images
   - Temps: 30 min

2. ⏳ Optimiser images existantes
   - Compresser assets
   - Lazy loading
   - Temps: 30 min

#### 5.3 Code Splitting (2 heures)

1. ⏳ Lazy load composants lourds
   - 3D Configurator
   - AR Viewer
   - Virtual Try-On
   - Temps: 1h

2. ⏳ Dynamic imports
   - Charts
   - Heavy libraries
   - Temps: 1h

#### 5.4 Database Optimization (1 heure)

1. ⏳ Analyser queries lentes
   - Enable pg_stat_statements
   - Identifier bottlenecks
   - Temps: 30 min

2. ⏳ Ajouter indexes manquants
   - Analyzer explain plans
   - Créer indexes
   - Temps: 30 min

---

### PHASE 6: Monitoring & Analytics (3 heures)

#### 6.1 Sentry (1 heure)

1. ⏳ Configurer Sentry frontend
   - sentry.client.config.ts
   - sentry.server.config.ts
   - Temps: 30 min

2. ⏳ Configurer Sentry backend
   - instrument.ts
   - Error tracking
   - Temps: 30 min

#### 6.2 Uptime Monitoring (1 heure)

1. ⏳ Configurer Better Uptime
   - URL: https://betteruptime.com
   - Monitors: /api/health, homepage
   - Temps: 30 min
   - Doc: `GUIDE_SETUP_BETTERUPTIME.md`

2. ⏳ Configurer alertes
   - Email alerts
   - Slack integration
   - Temps: 30 min

#### 6.3 Analytics Dashboard (1 heure)

1. ⏳ Implémenter Vercel Analytics
   - Déjà installé, activer tracking
   - Temps: 15 min

2. ⏳ Compléter analytics page
   - Charts avancés
   - Exports
   - Temps: 45 min

---

### PHASE 7: Features Enterprise (8 heures)

#### 7.1 White-Label (3 heures)

1. ⏳ Custom domains support
   - Table custom_domains
   - DNS verification
   - Temps: 1h30

2. ⏳ Custom branding
   - Logo upload
   - Color scheme
   - Temps: 1h30

#### 7.2 SSO (SAML/OIDC) (3 heures)

1. ⏳ SAML integration
   - Passport strategy
   - Metadata endpoint
   - Temps: 1h30

2. ⏳ OIDC integration
   - OpenID Connect
   - Azure AD support
   - Temps: 1h30

#### 7.3 RBAC Granulaire (2 heures)

1. ⏳ Permissions UI
   - Role management
   - Permissions editor
   - Temps: 1h

2. ⏳ Enforcement
   - Guards backend
   - UI conditionnelle
   - Temps: 1h

---

### PHASE 8: Polish & UX (4 heures)

#### 8.1 Loading States (1 heure)

1. ⏳ Skeletons partout
   - Dashboard cards
   - Lists
   - Forms
   - Temps: 1h

#### 8.2 Error Handling (1 heure)

1. ⏳ Error boundaries
   - Global error
   - Component errors
   - Temps: 30 min

2. ⏳ Toast notifications
   - Success/Error messages
   - Better UX
   - Temps: 30 min

#### 8.3 Onboarding (2 heures)

1. ⏳ Welcome wizard
   - First login flow
   - Product tour
   - Temps: 1h

2. ⏳ Empty states
   - Designs vides
   - Products vides
   - Temps: 1h

---

<a name="todos"></a>
## ✅ TODOS COMPLÈTES

### CRITIQUES (Faire en premier)

- [ ] **TODO-001** Corriger health check database
  - Fichier: `apps/frontend/src/app/api/health/route.ts`
  - Action: Retirer `.single()` ligne 14
  - Priorité: 🔴 URGENTE
  - Temps: 5 min

- [ ] **TODO-002** Corriger vercel.env.example
  - Fichier: `apps/frontend/vercel.env.example`
  - Action: Mettre bon projet Supabase
  - Priorité: 🔴 CRITIQUE
  - Temps: 2 min

- [ ] **TODO-003** Vérifier NEXT_PUBLIC_APP_URL dans Vercel
  - Action: Vercel Dashboard → Environment Variables
  - Vérifier que la valeur est: `https://app.luneo.app`
  - Priorité: 🔴 CRITIQUE
  - Temps: 2 min

- [ ] **TODO-004** Redéployer frontend avec corrections
  - Action: `cd apps/frontend && vercel --prod --force --yes`
  - Priorité: 🔴 URGENTE
  - Temps: 3 min

- [ ] **TODO-005** Tester health check corrigé
  - Action: `curl https://app.luneo.app/api/health`
  - Vérifier: `"status": "healthy"`
  - Priorité: 🔴 URGENTE
  - Temps: 1 min

### IMPORTANTES (Configuration)

- [ ] **TODO-006** Configurer Upstash Redis
  - URL: https://upstash.com
  - Action: Créer database → Copier vars → Ajouter Vercel
  - Priorité: 🟡 IMPORTANTE
  - Temps: 15 min
  - Doc: `GUIDE_SETUP_REDIS_UPSTASH.md`

- [ ] **TODO-007** Ajouter OpenAI API key
  - URL: https://platform.openai.com/api-keys
  - Action: Créer clé → Ajouter `OPENAI_API_KEY` dans Vercel
  - Priorité: 🟡 IMPORTANTE
  - Temps: 5 min

- [ ] **TODO-008** Configurer Cloudinary
  - URL: https://cloudinary.com
  - Action: Créer compte → Copier credentials → Vercel
  - Variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
  - Priorité: 🟡 IMPORTANTE
  - Temps: 15 min

- [ ] **TODO-009** Vérifier domaine SendGrid
  - URL: https://app.sendgrid.com/settings/sender_auth
  - Action: Vérifier domaine luneo.app
  - DNS records à ajouter (fournis par SendGrid)
  - Priorité: 🟡 IMPORTANTE
  - Temps: 30 min

- [ ] **TODO-010** Configurer Sentry
  - URL: https://sentry.io
  - Action: Créer projet → Copier DSN → Vercel
  - Variable: `NEXT_PUBLIC_SENTRY_DSN`
  - Priorité: 🟡 IMPORTANTE
  - Temps: 20 min

### BACKEND (Déploiement)

- [ ] **TODO-011** Préparer serveur Hetzner
  - Action: Créer VPS Ubuntu 22.04
  - Installer: Docker, Docker Compose, Nginx
  - Priorité: 🟡 IMPORTANTE
  - Temps: 30 min

- [ ] **TODO-012** Transférer code backend
  - Action: Git clone ou rsync
  - Temps: 10 min

- [ ] **TODO-013** Configurer .env.production
  - Fichier: `apps/backend/.env.production`
  - Copier toutes les variables depuis `env.example`
  - Priorité: 🔴 CRITIQUE
  - Temps: 15 min

- [ ] **TODO-014** Build Docker image
  - Action: `docker build -f Dockerfile.production -t luneo-backend .`
  - Temps: 10 min

- [ ] **TODO-015** Déployer avec Docker Compose
  - Action: `docker-compose -f docker-compose.production.yml up -d`
  - Temps: 5 min

- [ ] **TODO-016** Configurer Nginx reverse proxy
  - Fichier: `nginx.conf`
  - Copier sur serveur: `/etc/nginx/sites-available/luneo-api`
  - Temps: 15 min

- [ ] **TODO-017** Configurer SSL Let's Encrypt
  - Script: `setup-ssl-complete.sh`
  - Temps: 10 min

- [ ] **TODO-018** Configurer DNS api.luneo.app
  - Cloudflare: A record → IP Hetzner
  - Temps: 5 min

- [ ] **TODO-019** Tester backend production
  - Action: `curl https://api.luneo.app/health`
  - Temps: 5 min

- [ ] **TODO-020** Configurer PM2 process manager
  - Action: PM2 setup, auto-restart
  - Temps: 15 min

### FEATURES - Notifications

- [ ] **TODO-021** Créer API route GET /api/notifications
  - Fichier: `apps/frontend/src/app/api/notifications/route.ts`
  - Fetch depuis table `notifications`
  - Pagination
  - Priorité: 🟡 MOYENNE
  - Temps: 30 min

- [ ] **TODO-022** Créer API route PUT /api/notifications/:id
  - Marquer comme lu
  - Temps: 20 min

- [ ] **TODO-023** Component NotificationBell
  - Fichier: `apps/frontend/src/components/NotificationBell.tsx`
  - Bell icon avec badge count
  - Dropdown liste
  - Temps: 1h

- [ ] **TODO-024** Intégrer dans Header
  - Ajouter NotificationBell
  - Hook useNotifications
  - Temps: 30 min

- [ ] **TODO-025** Webhook notifications sortantes
  - Trigger lors d'events
  - Temps: 1h

### FEATURES - Email Templates

- [ ] **TODO-026** Créer template Welcome SendGrid
  - SendGrid Dashboard → Templates
  - Design email
  - Copier template ID
  - Temps: 30 min

- [ ] **TODO-027** Créer template Order Confirmation
  - Template avec order details
  - Temps: 30 min

- [ ] **TODO-028** Créer template Production Ready
  - Template avec download links
  - Temps: 30 min

- [ ] **TODO-029** Configurer template IDs dans .env
  - Variables: `EMAIL_TEMPLATE_WELCOME`, etc.
  - Temps: 5 min

- [ ] **TODO-030** Modifier sendgrid.service.ts
  - Utiliser templates
  - Temps: 30 min

### FEATURES - WooCommerce

- [ ] **TODO-031** API route connect WooCommerce
  - `/api/integrations/woocommerce/connect`
  - OAuth flow
  - Temps: 1h

- [ ] **TODO-032** API route sync WooCommerce
  - `/api/integrations/woocommerce/sync`
  - Sync products
  - Temps: 1h30

- [ ] **TODO-033** Webhooks WooCommerce
  - Recevoir orders
  - Update status
  - Temps: 1h30

### FEATURES - AR Export

- [ ] **TODO-034** API route export GLB
  - `/api/3d/export-ar`
  - Export Three.js → GLB
  - Temps: 1h30

- [ ] **TODO-035** API route export USDZ (iOS)
  - Conversion GLB → USDZ
  - Temps: 1h30

### FEATURES - Design Versioning

- [ ] **TODO-036** Activer versioning automatique
  - Trigger sur update designs
  - Table design_versions OK
  - Temps: 1h

- [ ] **TODO-037** UI historique versions
  - Timeline versions
  - Preview diff
  - Restore version
  - Temps: 1h

### FEATURES - Collections UI

- [ ] **TODO-038** Page /dashboard/collections
  - Liste collections
  - Grid view
  - Temps: 1h

- [ ] **TODO-039** Créer/Modifier collection
  - Modal form
  - Temps: 30 min

- [ ] **TODO-040** Ajouter designs à collection
  - Drag & drop
  - Multi-select
  - Temps: 30 min

### PERFORMANCE

- [ ] **TODO-041** Lazy load 3D Configurator
  - Dynamic import
  - Loading skeleton
  - Temps: 20 min

- [ ] **TODO-042** Lazy load AR components
  - Dynamic import MediaPipe
  - Temps: 20 min

- [ ] **TODO-043** Infinite scroll designs
  - Hook useDesignsInfinite OK
  - Intégrer dans library page
  - Temps: 30 min

- [ ] **TODO-044** Infinite scroll orders
  - Hook useOrdersInfinite OK
  - Intégrer dans orders page
  - Temps: 30 min

- [ ] **TODO-045** Bundle analyzer
  - Activer: `ANALYZE=true npm run build`
  - Identifier gros bundles
  - Temps: 30 min

- [ ] **TODO-046** Compression images
  - Next/image partout
  - Formats WebP/AVIF
  - Temps: 1h

### SÉCURITÉ

- [ ] **TODO-047** Exécuter SQL 2FA
  - Fichier: `supabase-2fa-system.sql`
  - Exécuter dans Supabase SQL Editor
  - Temps: 5 min

- [ ] **TODO-048** Tester CSRF protection
  - Test formulaires
  - Vérifier tokens
  - Temps: 15 min

- [ ] **TODO-049** Audit sécurité complet
  - Vérifier CSP
  - Vérifier CORS
  - Vérifier rate limits
  - Temps: 1h

### DOCUMENTATION

- [ ] **TODO-050** Consolidation docs
  - Merger fichiers redondants
  - Supprimer doublons
  - Temps: 1h

- [ ] **TODO-051** Guide utilisateur final
  - Documentation pour clients
  - Screenshots
  - Temps: 2h

- [ ] **TODO-052** Guide admin
  - Administration plateforme
  - Gestion utilisateurs
  - Temps: 1h

### TESTING

- [ ] **TODO-053** Tests E2E Pricing
  - Playwright test
  - Parcours complet paiement
  - Temps: 1h

- [ ] **TODO-054** Tests E2E Dashboard
  - Login → Dashboard → Actions
  - Temps: 1h

- [ ] **TODO-055** Tests API routes
  - Tous les endpoints
  - Status codes
  - Temps: 2h

### POLISH

- [ ] **TODO-056** Skeletons loading partout
  - Dashboard
  - Lists
  - Forms
  - Temps: 1h

- [ ] **TODO-057** Error boundaries
  - Global error
  - Component errors
  - Temps: 30 min

- [ ] **TODO-058** Toast notifications
  - Success messages
  - Error messages
  - Temps: 30 min

- [ ] **TODO-059** Empty states
  - Designs vides
  - Products vides
  - Orders vides
  - Temps: 1h

- [ ] **TODO-060** Responsive mobile
  - Vérifier toutes les pages
  - Adapter layouts
  - Temps: 2h

---

<a name="checklist"></a>
## ✅ CHECKLIST DE VALIDATION

### Phase 1: Corrections Critiques

- [ ] Health check retourne `"status": "healthy"`
- [ ] Metadata OG URL correcte
- [ ] vercel.env.example à jour
- [ ] Aucune erreur console sur homepage
- [ ] Aucune erreur console sur /pricing

### Phase 2: Services

- [ ] Redis ping successful
- [ ] OpenAI API accessible (si configuré)
- [ ] Cloudinary upload fonctionne (si configuré)
- [ ] SendGrid emails envoyés (si configuré)
- [ ] Sentry capture errors (si configuré)

### Phase 3: Backend

- [ ] Backend accessible: `https://api.luneo.app/health`
- [ ] Swagger docs: `https://api.luneo.app/api/docs`
- [ ] SSL certificate valide
- [ ] CORS configuré correctement
- [ ] Rate limiting actif

### Phase 4: Features

- [ ] Notifications affichées
- [ ] Emails templates fonctionnent
- [ ] WooCommerce connection OK
- [ ] AR export GLB fonctionne
- [ ] Design versioning actif
- [ ] Collections UI complète

### Phase 5: Performance

- [ ] Redis cache actif
- [ ] Images optimisées
- [ ] Code splitting actif
- [ ] Lighthouse score > 90
- [ ] First Load JS < 150kB
- [ ] Time to Interactive < 3s

### Phase 6: Monitoring

- [ ] Sentry capture errors
- [ ] Uptime monitoring actif
- [ ] Analytics dashboard complet
- [ ] Logs accessibles

### Phase 7: Enterprise

- [ ] Custom domains fonctionnent
- [ ] White-label branding
- [ ] SSO SAML/OIDC
- [ ] RBAC permissions

### Phase 8: Polish

- [ ] Skeletons partout
- [ ] Error boundaries
- [ ] Toast notifications
- [ ] Empty states
- [ ] Responsive mobile

---

## 📊 PROGRESSION

### Estimation temps total

| Phase | Temps | Priorité |
|-------|-------|----------|
| Phase 1: Corrections Critiques | 30 min | 🔴 URGENTE |
| Phase 2: Configuration Services | 1h | 🟡 IMPORTANTE |
| Phase 3: Déploiement Backend | 4h | 🟡 IMPORTANTE |
| Phase 4: Features Manquantes | 10h | 🟡 MOYENNE |
| Phase 5: Optimisations | 6h | 🟢 BASSE |
| Phase 6: Monitoring | 3h | 🟡 MOYENNE |
| Phase 7: Enterprise | 8h | 🟢 BASSE |
| Phase 8: Polish | 4h | 🟢 BASSE |

**Total:** ~36-40 heures

### Recommandation

**Pour production immédiate (1-2 jours):**
- Phase 1: Corrections Critiques ✅
- Phase 2: Configuration Services ✅
- Phase 3: Backend Déploiement ✅

**Pour plateforme complète (1 semaine):**
- Phases 1-6 ✅

**Pour version enterprise premium (2 semaines):**
- Toutes les phases ✅

---

## 🎯 PROCHAINES ACTIONS

### Aujourd'hui (2 heures)

1. Corriger health check (5 min)
2. Corriger vercel.env.example (2 min)
3. Vérifier Vercel vars (2 min)
4. Redéployer (3 min)
5. Tester (1 min)
6. Configurer Redis (15 min)
7. Configurer OpenAI (5 min)
8. Configurer Cloudinary (15 min)
9. Configurer Sentry (20 min)
10. Redéployer et tester (10 min)

### Cette semaine (10 heures)

1. Déployer backend Hetzner (4h)
2. Implémenter notifications (3h)
3. Configurer email templates (2h)
4. Optimisations performance (1h)

### Ce mois (30 heures)

1. Features manquantes (10h)
2. Optimisations complètes (6h)
3. Monitoring complet (3h)
4. Features enterprise (8h)
5. Polish & UX (4h)

---

## 🎉 OBJECTIFS

**Court terme (24h):**
- ✅ Tous les points critiques corrigés
- ✅ Services optionnels configurés
- ✅ Health check OK
- ✅ Monitoring de base actif

**Moyen terme (1 semaine):**
- ✅ Backend déployé
- ✅ Notifications fonctionnelles
- ✅ Emails templates
- ✅ Performance optimisée

**Long terme (1 mois):**
- ✅ Toutes les features implémentées
- ✅ Enterprise features
- ✅ Tests complets
- ✅ Documentation utilisateur

---

*Plan d'amélioration créé le 29 Oct 2025 - 60 TODOs identifiées*

