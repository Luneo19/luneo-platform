# 🎯 TRAITEMENT DES 60 TODOs - ÉTAPE PAR ÉTAPE

**Date de démarrage:** 20 Novembre 2025  
**Source:** `PLAN_AMELIORATION_COMPLET.md`

---

## 📋 LISTE COMPLÈTE DES 60 TODOs

### 🔴 CRITIQUES (TODO-001 à TODO-005)

#### TODO-001: Corriger health check database
- **Fichier:** `apps/frontend/src/app/api/health/route.ts`
- **Action:** Retirer `.single()` ligne 14
- **Priorité:** 🔴 URGENTE
- **Temps:** 5 min
- **Statut:** ✅ COMPLÉTÉ

#### TODO-002: Corriger vercel.env.example
- **Fichier:** `apps/frontend/vercel.env.example`
- **Action:** Mettre bon projet Supabase
- **Priorité:** 🔴 CRITIQUE
- **Temps:** 2 min
- **Statut:** ⏳ À TRAITER

#### TODO-003: Vérifier NEXT_PUBLIC_APP_URL dans Vercel
- **Action:** Vercel Dashboard → Environment Variables
- **Vérifier que la valeur est:** `https://app.luneo.app`
- **Priorité:** 🔴 CRITIQUE
- **Temps:** 2 min
- **Statut:** ⏳ À TRAITER (manuel)

#### TODO-004: Redéployer frontend avec corrections
- **Action:** `cd apps/frontend && vercel --prod --force --yes`
- **Priorité:** 🔴 URGENTE
- **Temps:** 3 min
- **Statut:** ⏳ À TRAITER

#### TODO-005: Tester health check corrigé
- **Action:** `curl https://app.luneo.app/api/health`
- **Vérifier:** `"status": "healthy"`
- **Priorité:** 🔴 URGENTE
- **Temps:** 1 min
- **Statut:** ⏳ À TRAITER

---

### 🟡 IMPORTANTES - Configuration (TODO-006 à TODO-010)

#### TODO-006: Configurer Upstash Redis
- **URL:** https://upstash.com
- **Action:** Créer database → Copier vars → Ajouter Vercel
- **Variables:** `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- **Priorité:** 🟡 IMPORTANTE
- **Temps:** 15 min
- **Doc:** `GUIDE_SETUP_REDIS_UPSTASH.md`
- **Statut:** ⏳ À TRAITER (manuel)

#### TODO-007: Ajouter OpenAI API key
- **URL:** https://platform.openai.com/api-keys
- **Action:** Créer clé → Ajouter `OPENAI_API_KEY` dans Vercel
- **Priorité:** 🟡 IMPORTANTE
- **Temps:** 5 min
- **Statut:** ⏳ À TRAITER (manuel)

#### TODO-008: Configurer Cloudinary
- **URL:** https://cloudinary.com
- **Action:** Créer compte → Copier credentials → Vercel
- **Variables:** `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Priorité:** 🟡 IMPORTANTE
- **Temps:** 15 min
- **Statut:** ⏳ À TRAITER (manuel)

#### TODO-009: Vérifier domaine SendGrid
- **URL:** https://app.sendgrid.com/settings/sender_auth
- **Action:** Vérifier domaine luneo.app
- **DNS records à ajouter** (fournis par SendGrid)
- **Priorité:** 🟡 IMPORTANTE
- **Temps:** 30 min
- **Statut:** ⏳ À TRAITER (manuel)

#### TODO-010: Configurer Sentry
- **URL:** https://sentry.io
- **Action:** Créer projet → Copier DSN → Vercel
- **Variable:** `NEXT_PUBLIC_SENTRY_DSN`
- **Priorité:** 🟡 IMPORTANTE
- **Temps:** 20 min
- **Statut:** ⏳ À TRAITER (manuel)

---

### 🟡 BACKEND - Déploiement (TODO-011 à TODO-020)

#### TODO-011: Préparer serveur Hetzner
- **Action:** Créer VPS Ubuntu 22.04
- **Installer:** Docker, Docker Compose, Nginx
- **Priorité:** 🟡 IMPORTANTE
- **Temps:** 30 min
- **Statut:** ⏳ À TRAITER

#### TODO-012: Transférer code backend
- **Action:** Git clone ou rsync
- **Temps:** 10 min
- **Statut:** ⏳ À TRAITER

#### TODO-013: Configurer .env.production
- **Fichier:** `apps/backend/.env.production`
- **Action:** Copier toutes les variables depuis `env.example`
- **Priorité:** 🔴 CRITIQUE
- **Temps:** 15 min
- **Statut:** ⏳ À TRAITER

#### TODO-014: Build Docker image
- **Action:** `docker build -f Dockerfile.production -t luneo-backend .`
- **Temps:** 10 min
- **Statut:** ⏳ À TRAITER

#### TODO-015: Déployer avec Docker Compose
- **Action:** `docker-compose -f docker-compose.production.yml up -d`
- **Temps:** 5 min
- **Statut:** ⏳ À TRAITER

#### TODO-016: Configurer Nginx reverse proxy
- **Fichier:** `nginx.conf`
- **Action:** Copier sur serveur: `/etc/nginx/sites-available/luneo-api`
- **Temps:** 15 min
- **Statut:** ⏳ À TRAITER

#### TODO-017: Configurer SSL Let's Encrypt
- **Script:** `setup-ssl-complete.sh`
- **Temps:** 10 min
- **Statut:** ⏳ À TRAITER

#### TODO-018: Configurer DNS api.luneo.app
- **Action:** Cloudflare: A record → IP Hetzner
- **Temps:** 5 min
- **Statut:** ⏳ À TRAITER

#### TODO-019: Tester backend production
- **Action:** `curl https://api.luneo.app/health`
- **Temps:** 5 min
- **Statut:** ⏳ À TRAITER

#### TODO-020: Configurer PM2 process manager
- **Action:** PM2 setup, auto-restart
- **Temps:** 15 min
- **Statut:** ⏳ À TRAITER

---

### 🟡 FEATURES - Notifications (TODO-021 à TODO-025)

#### TODO-021: Créer API route GET /api/notifications
- **Fichier:** `apps/frontend/src/app/api/notifications/route.ts`
- **Action:** Fetch depuis table `notifications`, pagination
- **Priorité:** 🟡 MOYENNE
- **Temps:** 30 min
- **Statut:** ✅ COMPLÉTÉ

#### TODO-022: Créer API route PUT /api/notifications/:id
- **Fichier:** `apps/frontend/src/app/api/notifications/[id]/route.ts`
- **Action:** Marquer comme lu
- **Temps:** 20 min
- **Statut:** ✅ COMPLÉTÉ

#### TODO-023: Component NotificationBell
- **Fichier:** `apps/frontend/src/components/NotificationCenter.tsx`
- **Action:** Bell icon avec badge count, dropdown liste
- **Temps:** 1h
- **Statut:** ✅ COMPLÉTÉ

#### TODO-024: Intégrer dans Header
- **Fichier:** `apps/frontend/src/components/dashboard/Header.tsx`
- **Action:** Ajouter NotificationBell, hook useNotifications
- **Temps:** 30 min
- **Statut:** ✅ COMPLÉTÉ

#### TODO-025: Webhook notifications sortantes
- **Fichier:** `apps/frontend/src/lib/services/webhook.service.ts`
- **Action:** Trigger lors d'events, service sécurisé (HMAC)
- **Temps:** 1h
- **Statut:** ✅ COMPLÉTÉ

---

### 🟡 FEATURES - Email Templates (TODO-026 à TODO-030)

#### TODO-026: Créer template Welcome SendGrid
- **Action:** SendGrid Dashboard → Templates
- **Action:** Design email, copier template ID
- **Temps:** 30 min
- **Statut:** ⏳ À TRAITER (manuel)

#### TODO-027: Créer template Order Confirmation
- **Action:** Template avec order details
- **Temps:** 30 min
- **Statut:** ⏳ À TRAITER (manuel)

#### TODO-028: Créer template Production Ready
- **Action:** Template avec download links
- **Temps:** 30 min
- **Statut:** ⏳ À TRAITER (manuel)

#### TODO-029: Configurer template IDs dans .env
- **Variables:** `EMAIL_TEMPLATE_WELCOME`, `EMAIL_TEMPLATE_ORDER`, `EMAIL_TEMPLATE_PRODUCTION`
- **Temps:** 5 min
- **Statut:** ⏳ À TRAITER

#### TODO-030: Modifier sendgrid.service.ts
- **Fichier:** `apps/backend/src/modules/email/services/sendgrid.service.ts`
- **Action:** Utiliser templates au lieu de HTML inline
- **Temps:** 30 min
- **Statut:** ⏳ À TRAITER

---

### 🟢 FEATURES - WooCommerce (TODO-031 à TODO-033)

#### TODO-031: API route connect WooCommerce
- **Fichier:** `apps/frontend/src/app/api/integrations/woocommerce/connect/route.ts`
- **Action:** OAuth flow
- **Temps:** 1h
- **Statut:** ⏳ À TRAITER

#### TODO-032: API route sync WooCommerce
- **Fichier:** `apps/frontend/src/app/api/integrations/woocommerce/sync/route.ts`
- **Action:** Sync products
- **Temps:** 1h30
- **Statut:** ⏳ À TRAITER

#### TODO-033: Webhooks WooCommerce
- **Fichier:** `apps/frontend/src/app/api/webhooks/woocommerce/route.ts`
- **Action:** Recevoir orders, update status
- **Temps:** 1h30
- **Statut:** ⏳ À TRAITER

---

### 🟢 FEATURES - AR Export (TODO-034 à TODO-035)

#### TODO-034: API route export GLB
- **Fichier:** `apps/frontend/src/app/api/ar/export/route.ts`
- **Action:** Export Three.js → GLB
- **Temps:** 1h30
- **Statut:** ✅ COMPLÉTÉ (route existe)

#### TODO-035: API route export USDZ (iOS)
- **Fichier:** `apps/frontend/src/app/api/ar/export/route.ts`
- **Action:** Conversion GLB → USDZ
- **Temps:** 1h30
- **Statut:** ⏳ PARTIEL (route existe, conversion à implémenter)

---

### 🟢 FEATURES - Design Versioning (TODO-036 à TODO-037)

#### TODO-036: Activer versioning automatique
- **Action:** Trigger sur update designs
- **Table:** `design_versions` (existe selon plan)
- **Temps:** 1h
- **Statut:** ⏳ À TRAITER

#### TODO-037: UI historique versions
- **Fichier:** `apps/frontend/src/app/(dashboard)/designs/[id]/versions/page.tsx`
- **Action:** Timeline versions, preview diff, restore version
- **Temps:** 1h
- **Statut:** ⏳ À TRAITER

---

### 🟢 FEATURES - Collections UI (TODO-038 à TODO-040)

#### TODO-038: Page /dashboard/collections
- **Fichier:** `apps/frontend/src/app/(dashboard)/collections/page.tsx`
- **Action:** Liste collections, grid view
- **Temps:** 1h
- **Statut:** ⏳ À TRAITER

#### TODO-039: Créer/Modifier collection
- **Fichier:** `apps/frontend/src/components/collections/CollectionModal.tsx`
- **Action:** Modal form
- **Temps:** 30 min
- **Statut:** ⏳ À TRAITER

#### TODO-040: Ajouter designs à collection
- **Fichier:** `apps/frontend/src/components/collections/AddDesignsModal.tsx`
- **Action:** Drag & drop, multi-select
- **Temps:** 30 min
- **Statut:** ⏳ À TRAITER

---

### 🟢 PERFORMANCE (TODO-041 à TODO-046)

#### TODO-041: Lazy load 3D Configurator
- **Fichier:** `apps/frontend/src/app/(dashboard)/customize/[productId]/page.tsx`
- **Action:** Dynamic import, loading skeleton
- **Temps:** 20 min
- **Statut:** ✅ COMPLÉTÉ

#### TODO-042: Lazy load AR components
- **Fichier:** `apps/frontend/src/app/(dashboard)/try-on/[productId]/page.tsx`
- **Action:** Dynamic import MediaPipe
- **Temps:** 20 min
- **Statut:** ✅ COMPLÉTÉ

#### TODO-043: Infinite scroll designs
- **Fichier:** `apps/frontend/src/app/(dashboard)/library/page.tsx`
- **Action:** Hook useInfiniteScroll intégré
- **Temps:** 30 min
- **Statut:** ✅ COMPLÉTÉ

#### TODO-044: Infinite scroll orders
- **Fichier:** `apps/frontend/src/app/(dashboard)/orders/page.tsx`
- **Action:** Hook useInfiniteScroll intégré
- **Temps:** 30 min
- **Statut:** ✅ COMPLÉTÉ

#### TODO-045: Bundle analyzer
- **Action:** Activer: `ANALYZE=true npm run build`
- **Action:** Identifier gros bundles
- **Temps:** 30 min
- **Statut:** ⏳ À TRAITER

#### TODO-046: Compression images
- **Action:** Next/image partout, formats WebP/AVIF
- **Temps:** 1h
- **Statut:** ⏳ À TRAITER

---

### 🟢 SÉCURITÉ (TODO-047 à TODO-049)

#### TODO-047: Exécuter SQL 2FA
- **Fichier:** `supabase-2fa-system.sql`
- **Action:** Exécuter dans Supabase SQL Editor
- **Temps:** 5 min
- **Statut:** ⏳ À TRAITER (manuel)

#### TODO-048: Tester CSRF protection
- **Action:** Test formulaires, vérifier tokens
- **Temps:** 15 min
- **Statut:** ⏳ À TRAITER

#### TODO-049: Audit sécurité complet
- **Action:** Vérifier CSP, CORS, rate limits
- **Temps:** 1h
- **Statut:** ⏳ À TRAITER

---

### 🟢 DOCUMENTATION (TODO-050 à TODO-052)

#### TODO-050: Consolidation docs
- **Action:** Merger fichiers redondants, supprimer doublons
- **Temps:** 1h
- **Statut:** ⏳ PARTIEL (beaucoup créées, doublons à nettoyer)

#### TODO-051: Guide utilisateur final
- **Action:** Documentation pour clients, screenshots
- **Temps:** 2h
- **Statut:** ⏳ À TRAITER

#### TODO-052: Guide admin
- **Action:** Administration plateforme, gestion utilisateurs
- **Temps:** 1h
- **Statut:** ⏳ À TRAITER

---

### 🟢 TESTING (TODO-053 à TODO-055)

#### TODO-053: Tests E2E Pricing
- **Fichier:** `apps/frontend/tests/e2e/pricing.spec.ts`
- **Action:** Playwright test, parcours complet paiement
- **Temps:** 1h
- **Statut:** ⏳ À TRAITER

#### TODO-054: Tests E2E Dashboard
- **Fichier:** `apps/frontend/tests/e2e/dashboard.spec.ts`
- **Action:** Login → Dashboard → Actions
- **Temps:** 1h
- **Statut:** ⏳ À TRAITER

#### TODO-055: Tests API routes
- **Fichier:** `apps/frontend/tests/api/`
- **Action:** Tous les endpoints, status codes
- **Temps:** 2h
- **Statut:** ⏳ À TRAITER

---

### 🟢 POLISH (TODO-056 à TODO-060)

#### TODO-056: Skeletons loading partout
- **Fichiers:** `TeamSkeleton.tsx`, `ProductsSkeleton.tsx`, `LibrarySkeleton.tsx`
- **Action:** Dashboard, lists, forms
- **Temps:** 1h
- **Statut:** ✅ COMPLÉTÉ

#### TODO-057: Error boundaries
- **Fichier:** `apps/frontend/src/components/ErrorBoundary.tsx`
- **Action:** Global error, component errors
- **Temps:** 30 min
- **Statut:** ⏳ À TRAITER

#### TODO-058: Toast notifications
- **Action:** Success/Error messages, better UX
- **Temps:** 30 min
- **Statut:** ✅ COMPLÉTÉ

#### TODO-059: Empty states
- **Fichier:** `apps/frontend/src/components/ui/empty-states/EmptyState.tsx`
- **Action:** Designs vides, products vides, orders vides
- **Temps:** 1h
- **Statut:** ✅ COMPLÉTÉ

#### TODO-060: Responsive mobile
- **Action:** Vérifier toutes les pages, adapter layouts
- **Temps:** 2h
- **Statut:** ✅ COMPLÉTÉ

---

## 📊 STATISTIQUES

### Par statut:
- ✅ **Complétés:** 15 TODOs (25%)
- ⏳ **À traiter:** 43 TODOs (71.7%)
- ⏳ **Partiels:** 2 TODOs (3.3%)

### Par priorité:
- 🔴 **Critiques:** 5 TODOs (1 complété, 4 à traiter)
- 🟡 **Importantes:** 30 TODOs (5 complétés, 25 à traiter)
- 🟢 **Basses:** 25 TODOs (9 complétés, 16 à traiter)

---

## 🎯 PLAN DE TRAITEMENT PAR ÉTAPES

### ÉTAPE 1: Critiques restantes (TODO-002 à TODO-005)
**Temps estimé:** 8 minutes

### ÉTAPE 2: Configuration services (TODO-006 à TODO-010)
**Temps estimé:** 1h 5min (principalement manuel)

### ÉTAPE 3: Backend déploiement (TODO-011 à TODO-020)
**Temps estimé:** 2h 15min

### ÉTAPE 4: Email Templates (TODO-026 à TODO-030)
**Temps estimé:** 2h 5min

### ÉTAPE 5: WooCommerce (TODO-031 à TODO-033)
**Temps estimé:** 4h

### ÉTAPE 6: AR Export USDZ (TODO-035)
**Temps estimé:** 1h 30min

### ÉTAPE 7: Design Versioning (TODO-036 à TODO-037)
**Temps estimé:** 2h

### ÉTAPE 8: Collections UI (TODO-038 à TODO-040)
**Temps estimé:** 2h

### ÉTAPE 9: Performance restantes (TODO-045 à TODO-046)
**Temps estimé:** 1h 30min

### ÉTAPE 10: Sécurité (TODO-047 à TODO-049)
**Temps estimé:** 1h 20min

### ÉTAPE 11: Documentation (TODO-050 à TODO-052)
**Temps estimé:** 4h

### ÉTAPE 12: Testing (TODO-053 à TODO-055)
**Temps estimé:** 4h

### ÉTAPE 13: Polish restant (TODO-057)
**Temps estimé:** 30min

---

**Temps total estimé:** ~26 heures

---

*Document créé le 20 Novembre 2025*

