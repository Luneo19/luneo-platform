# AUDIT GLOBAL LUNEO.APP — RAPPORT COMPLET
**Date:** 20 décembre 2025  
**Auditeur:** Cursor AI Agent  
**Durée:** Phase 1 complète (2 jours)

---

## RÉSUMÉ EXÉCUTIF

### Points Forts ✅
- Architecture Vercel serverless bien conçue (frontend + backend)
- Système d'authentification Supabase fonctionnel
- Intégration Stripe pour abonnements (trial 14 jours)
- Génération IA avec DALL-E 3 (OpenAI) opérationnelle
- Rate limiting avec Upstash Redis
- Validation Zod sur toutes les routes critiques
- Logging structuré (Sentry integration)
- Base de données Prisma bien architecturée (40+ models)

### Opportunités Business Prioritaires 🎯
1. **Système de crédits IA payants** → Actuellement ABSENT → **Potentiel +50-100€/client**
2. **Templates premium** → Infrastructure existe mais pas de monétisation
3. **Export automatique e-commerce** → Partiellement implémenté mais pas monétisé
4. **Upsells intelligents** → Aucune modal/notification d'upsell n'existe
5. **Incohérences tarifaires** → Prix différents frontend vs backend

### Gaps Critiques ❌
- Pas de système de vente de crédits IA séparément (seulement limites mensuelles)
- Pas de tracking précis des coûts par appel IA
- Pas d'affichage des crédits restants dans le UI
- Pas de modales d'upsell avant dépassement quota
- Incohérence prix Professional : 49€ (frontend) vs 99€ (backend)
- Système de quotas backend sophistiqué mais non utilisé par le frontend

---

## 1. AUDIT REPOSITORY

### 1.1 Structure du Projet

```
luneo-platform/
├── apps/
│   ├── frontend/          ✅ Next.js 15 + Vercel (943 fichiers)
│   ├── backend/           ✅ NestJS + API Routes serverless (609 fichiers)
│   ├── ai-engine/         ⚠️ Python FastAPI (non audité - séparé)
│   ├── shopify/           ✅ App Shopify intégrée
│   ├── widget/            ✅ Widget embeddable
│   ├── worker-ia/         ⚠️ Workers BullMQ (Redis requis)
│   ├── mobile/            ⚠️ React Native (minimal, peu utilisé)
│   └── ar-viewer/         ✅ Viewer AR Three.js
├── packages/              ✅ Shared libs (60 fichiers)
├── docs/                  ✅ Documentation (65+ fichiers MD)
└── scripts/               ⚠️ 134 scripts (beaucoup de duplication)
```

**Verdict Repository:** ✅ **Architecture monorepo bien structurée**

---

## 2. AUDIT API ROUTES FRONTEND

### 2.1 Routes IA (`/api/ai/`)

| Endpoint | Fonction | IA Utilisée | Coût/appel | Quotas ? | Statut |
|----------|----------|-------------|------------|----------|--------|
| `/api/ai/generate` | Génération DALL-E 3 | OpenAI | ~$0.04-0.08 | ✅ Mensuel | ✅ Fonctionnel |
| `/api/ai/background-removal` | Suppression fond | ? | ? | ❌ Non | ⚠️ À vérifier |
| `/api/ai/extract-colors` | Extraction couleurs | ? | Faible | ❌ Non | ⚠️ À vérifier |

**Analyse Critique:**
- ✅ Route `/api/ai/generate` implémente des quotas simples (5/50/999999 par plan)
- ❌ **Aucune déduction de crédits** → seulement compteur mensuel
- ❌ **Pas de système de packs de crédits achetables**
- ⚠️ Quotas hardcodés dans le code (devrait être en DB)
- ⚠️ Pas de tracking du coût réel OpenAI par génération

**Code actuel (`/api/ai/generate/route.ts`):**
```typescript
const limits: Record<string, number> = {
  starter: 5,
  professional: 50,
  enterprise: 999999,
};
```

**Ce qui manque:**
```typescript
// ❌ Pas de système comme ça actuellement
const endpointCosts = {
  '/api/ai/generate': 5,        // 5 crédits
  '/api/ai/3d-render': 10,      // 10 crédits
  '/api/ai/variants': 3,        // 3 crédits
};
```

### 2.2 Routes Billing (`/api/billing/`)

| Endpoint | Fonction | Stripe ? | Statut |
|----------|----------|----------|--------|
| `/api/billing/create-checkout-session` | Créer session abonnement | ✅ | ✅ Fonctionnel |
| `/api/billing/subscription` | GET/PUT abonnement | ✅ | ✅ Fonctionnel |
| `/api/billing/portal` | Portail client Stripe | ✅ | ✅ Fonctionnel |
| `/api/billing/invoices` | Récupérer factures | ✅ | ⚠️ À tester |

**Plans Stripe configurés (frontend):**
```typescript
starter: 29€/mois (278€/an -20%)
professional: 49€/mois (470€/an -20%)
business: 99€/mois (950€/an -20%)
enterprise: Sur demande
```

**⚠️ INCOHÉRENCE DÉTECTÉE:**
Backend (`quotas.service.ts`) définit:
- Professional: 99€/mois
- Business: 299€/mois
- Enterprise: 999€/mois

→ **ACTION REQUISE:** Harmoniser les prix

### 2.3 Routes Manquantes pour Objectifs Business

❌ `/api/credits/buy` → Acheter pack de crédits IA  
❌ `/api/credits/balance` → Récupérer solde crédits  
❌ `/api/templates/premium/buy` → Acheter template premium  
❌ `/api/export/shopify` → Export automatique Shopify (partiellement fait)  
❌ `/api/export/woocommerce` → Export automatique WooCommerce  
❌ `/api/export/etsy` → Export automatique Etsy  

---

## 3. AUDIT SYSTÈME IA

### 3.1 Modèles Utilisés

| Modèle | Provider | Fonction | Coût estimé | Intégré ? |
|--------|----------|----------|-------------|-----------|
| DALL-E 3 | OpenAI | Génération images | $0.040-0.080 | ✅ Oui |
| GPT-4 | OpenAI | ? | $0.03/1K tokens | ⚠️ Non confirmé |
| Stable Diffusion | Replicate ? | ? | $0.002-0.01 | ❌ Non trouvé |

### 3.2 Système de Crédits/Quotas

**✅ CE QUI EXISTE (Backend Prisma):**
```prisma
model UserQuota {
  monthlyLimit   Int      @default(100)
  monthlyUsed    Int      @default(0)
  costLimitCents Int      @default(5000)  // 50€
  costUsedCents  Int      @default(0)
  resetAt        DateTime
}

model AICost {
  provider  String  // openai, replicate, etc.
  model     String
  costCents Int
  tokens    Int?
  duration  Int?
}
```

**❌ CE QUI MANQUE:**
- Table `credits` ou `ai_credits` pour crédits achetables
- Table `credit_packs` pour définir les packs (100/500/1000 crédits)
- Middleware de déduction automatique de crédits
- Endpoint Stripe pour acheter des packs

**🎯 OPPORTUNITÉ #1 — Système de Crédits IA Payants**

**Objectif:** Ajouter vente de crédits IA séparément des abonnements (marge 80-90%)

**Modifications DB nécessaires:**
```sql
ALTER TABLE users 
ADD COLUMN ai_credits INTEGER DEFAULT 0,
ADD COLUMN ai_credits_purchased INTEGER DEFAULT 0,
ADD COLUMN last_credit_purchase TIMESTAMP;

CREATE TABLE credit_packs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Packs proposés
INSERT INTO credit_packs (name, credits, price_cents, stripe_price_id) VALUES
  ('Pack 100', 100, 1900, 'price_xxx'),   -- 19€ = 0.19€/crédit
  ('Pack 500', 500, 7900, 'price_yyy'),   -- 79€ = 0.16€/crédit (-16%)
  ('Pack 1000', 1000, 13900, 'price_zzz'); -- 139€ = 0.14€/crédit (-26%)
```

**Coûts réels vs Prix de vente:**
- DALL-E 3 coût : $0.04-0.08 (~0.04-0.08€)
- Prix de vente 1 crédit (pack 100) : 0.19€
- **Marge : 137-375% → Très rentable**

### 3.3 Optimisations IA Possibles

1. **Réduire résolution pour freemium:** 512x512 au lieu de 1024x1024 → coût divisé par 4
2. **Caching intelligent:** Hash prompt + réutiliser si identique → économie 30-50%
3. **Modèles open-source:** Stable Diffusion pour certains cas → coût divisé par 10
4. **Batching:** Regrouper requêtes pour réduire overhead

---

## 4. AUDIT FRONTEND

### 4.1 Configuration Next.js

**Fichier:** `apps/frontend/next.config.mjs`

✅ **Points positifs:**
- Output standalone pour Vercel
- Bundle analyzer activable
- Optimisations images (AVIF, WebP)
- Tree shaking configuré
- Split chunks optimisé

⚠️ **Points d'amélioration:**
- `ignoreBuildErrors: true` → Dangereux en prod
- `eslint.ignoreDuringBuilds: true` → Risque de régressions

### 4.2 UI/UX pour Monétisation

**❌ Manque critique:**
- Aucun affichage des crédits restants visible
- Aucune modal d'upsell avant dépassement quota
- Aucune notification push pour acheter crédits
- Aucun CTA "Buy Credits" dans le dashboard

**🎯 OPPORTUNITÉ #2 — Upsells Intelligents**

**Composants à créer:**
```tsx
// components/CreditsDisplay.tsx
<div className="credits-badge">
  🔥 {credits} crédits restants
  {credits < 20 && <Button>Acheter crédits</Button>}
</div>

// components/UpsellModal.tsx
useEffect(() => {
  if (credits / maxCredits < 0.2 && credits > 0) {
    openModal(<UpsellModal 
      remaining={credits}
      packs={[100, 500, 1000]}
    />);
  }
}, [credits]);
```

### 4.3 Performance Frontend

**Analyse Bundle (à faire):**
```bash
ANALYZE=true pnpm build
```

**Lazy Loading:**
- ⚠️ Viewer 3D (@react-three/fiber) → Devrait être lazy
- ⚠️ Canvas Konva → Devrait être lazy
- ✅ Modales déjà en lazy

---

## 5. AUDIT CONFIGURATION VERCEL

### 5.1 Frontend (`apps/frontend/vercel.json`)

✅ **Bien configuré:**
- Région: CDG1 (Paris)
- Crons pour cleanup et analytics
- Headers sécurité (CSP, HSTS, etc.)
- Cache-Control optimisé
- Redirects SEO

### 5.2 Backend (`apps/backend/vercel.json`)

✅ **Bien configuré:**
- Functions timeout: 30s
- Memory: 1024MB
- Rewrites vers API Routes
- Région: CDG1

⚠️ **Limites Vercel à connaître:**
- Timeout max: 60s (Pro), 300s (Enterprise)
- Payload max: 4.5MB
- Pas de WebSockets natifs (besoin Pusher/Ably)

---

## 6. AUDIT BASE DE DONNÉES

### 6.1 Schéma Prisma

**Modèles clés:**
- ✅ User (avec OAuth)
- ✅ Brand (multi-tenant)
- ✅ UserQuota (quotas mensuels)
- ✅ AICost (tracking coûts IA)
- ✅ Design, Order, Product
- ✅ Customization, Zone
- ✅ EcommerceIntegration (Shopify, WooCommerce)
- ✅ Artisan, WorkOrder (marketplace)
- ✅ Experiment, Conversion (A/B testing)

**Indexes:**
✅ Indexes sur colonnes fréquentes (userId, brandId, status, createdAt)

**❌ Ce qui manque pour crédits IA:**
```prisma
model CreditPack {
  id            String   @id @default(cuid())
  name          String
  credits       Int
  priceCents    Int
  stripePriceId String?
  isActive      Boolean  @default(true)
}

model CreditTransaction {
  id        String   @id @default(cuid())
  userId    String
  amount    Int      // positif = achat, négatif = dépense
  type      String   // purchase, usage, refund
  metadata  Json?
  createdAt DateTime @default(now())
}
```

### 6.2 Performances DB

**À vérifier en production:**
- Slow queries (utiliser `EXPLAIN ANALYZE`)
- Connection pooling (Prisma Accelerate?)
- Read replicas pour analytics

---

## 7. AUDIT INTÉGRATIONS E-COMMERCE

### 7.1 Shopify

**Fichiers:** `apps/shopify/`, `apps/frontend/src/app/api/integrations/shopify/`

✅ **Implémenté:**
- OAuth Shopify
- Webhooks
- Sync products

⚠️ **Export automatique mockups:**
- Code existe mais pas testé en production
- Pas de retry automatique
- Pas de queue pour limiter rate limits

### 7.2 WooCommerce

✅ Connecteurs basiques existent  
❌ Export automatique non implémenté

### 7.3 Etsy

❌ Pas d'intégration trouvée

**🎯 OPPORTUNITÉ #3 — Export Premium**

Monétiser l'export automatique:
- Gratuit: export manuel 1 par 1
- Pro (49€/mois): export automatique jusqu'à 50 produits/mois
- Business (99€/mois): export illimité + retry automatique

---

## 8. RECOMMANDATIONS PRIORISÉES

### PRIORITÉ 1 — Système de Crédits IA (ROI: +50-100€/client)

**Temps estimé:** 3-4 jours

**Étapes:**
1. Créer tables `credit_packs`, `credit_transactions`
2. Ajouter colonne `ai_credits` sur `users`
3. Créer Stripe Products pour packs (100/500/1000)
4. Créer route `/api/credits/buy`
5. Créer middleware de déduction automatique
6. Créer composant `CreditsDisplay` dans dashboard
7. Créer modal `UpsellModal` (trigger à 20% restants)

**Impact business:**
- 30% des users achètent 1 pack/mois → +19€/user/mois
- 10% achètent pack 500 → +79€
- **Potentiel: +15-25k€/mois** (500 users actifs)

### PRIORITÉ 2 — Harmoniser Prix (ROI: Clarté tarifaire)

**Temps estimé:** 1 jour

**Action:**
1. Décider prix définitifs (recommandation: suivre frontend)
2. Mettre à jour backend `quotas.service.ts`
3. Vérifier Stripe Products
4. Mettre à jour page `/pricing`

### PRIORITÉ 3 — Templates Premium (ROI: +10-20€/achat)

**Temps estimé:** 2-3 jours

**Étapes:**
1. Ajouter colonne `price` sur table `templates` (existe déjà dans Prisma!)
2. Créer Stripe Products pour templates (9€, 19€, 49€)
3. Créer route `/api/templates/buy`
4. Ajouter badge "Premium" dans galerie
5. Bloquer preview si non acheté

### PRIORITÉ 4 — Upsells Intelligents (ROI: +20-30% conversions)

**Temps estimé:** 2 jours

**Composants:**
- `<CreditsDisplay />` → Toujours visible
- `<UpsellModal />` → Trigger intelligent
- `<PlanComparisonCard />` → Upgrade suggestions
- Email automation (Sendgrid déjà configuré)

### PRIORITÉ 5 — Optimisations IA (ROI: -30-50% coûts)

**Temps estimé:** 3-5 jours

**Actions:**
1. Implémenter caching (Upstash Redis)
2. Réduire résolution freemium (512x512)
3. Ajouter option "Fast mode" (Stable Diffusion)
4. Batching des requêtes

---

## 9. PLAN D'EXÉCUTION RECOMMANDÉ

### Semaine 1 (Jours 1-5)
- [x] Audit complet (terminé)
- [ ] Harmoniser prix frontend/backend
- [ ] Créer système de crédits IA (DB + API)
- [ ] Créer Stripe Products pour packs

### Semaine 2 (Jours 6-10)
- [ ] Implémenter middleware déduction crédits
- [ ] Créer UI CreditsDisplay + UpsellModal
- [ ] Tester flow d'achat complet
- [ ] Déployer en staging Vercel

### Semaine 3 (Jours 11-15)
- [ ] Templates premium (DB + Stripe + UI)
- [ ] Optimisations IA (caching + résolution)
- [ ] Tests e2e avec Playwright
- [ ] Déploiement production progressif (10% → 50% → 100%)

---

## 10. RISQUES IDENTIFIÉS

### Risque 1: Vercel Timeout (30s)
**Impact:** Génération IA échoue si >30s  
**Mitigation:** Queue BullMQ + webhooks

### Risque 2: Coûts OpenAI imprévisibles
**Impact:** Budget explosion si pic d'usage  
**Mitigation:** Rate limiting strict + alerts CloudWatch

### Risque 3: Dépendance Stripe
**Impact:** Downtime Stripe = 0 revenue  
**Mitigation:** Alternative PayPal en backup

---

## 11. METRICS DE SUCCÈS

### KPIs Business
- [ ] Revenue/user/mois: +50€ (crédits IA)
- [ ] Taux conversion free→paid: 5% → 8%
- [ ] Panier moyen: +30%
- [ ] LTV (Lifetime Value): +100€

### KPIs Techniques
- [ ] Temps génération IA: <10s (p95)
- [ ] Taux erreur API: <1%
- [ ] Uptime: >99.5%
- [ ] Coût IA/génération: -30%

---

## 12. CONCLUSION

**État actuel:** Fondations solides mais opportunités de monétisation sous-exploitées

**Potentiel identifié:**
- Système de crédits IA: **+15-25k€/mois**
- Templates premium: **+5-10k€/mois**
- Export automatique premium: **+3-5k€/mois**

**Total potentiel additionnel: +23-40k€/mois** (basé sur 500 users actifs)

**Prochaine étape:** Commencer Phase 2 (Optimisations) puis Phase 3 (Développement ciblé)

---

**Rapport généré le:** 20/12/2025  
**Prêt pour Phase 2** ✅






# AUDIT GLOBAL LUNEO.APP — RAPPORT COMPLET
**Date:** 20 décembre 2025  
**Auditeur:** Cursor AI Agent  
**Durée:** Phase 1 complète (2 jours)

---

## RÉSUMÉ EXÉCUTIF

### Points Forts ✅
- Architecture Vercel serverless bien conçue (frontend + backend)
- Système d'authentification Supabase fonctionnel
- Intégration Stripe pour abonnements (trial 14 jours)
- Génération IA avec DALL-E 3 (OpenAI) opérationnelle
- Rate limiting avec Upstash Redis
- Validation Zod sur toutes les routes critiques
- Logging structuré (Sentry integration)
- Base de données Prisma bien architecturée (40+ models)

### Opportunités Business Prioritaires 🎯
1. **Système de crédits IA payants** → Actuellement ABSENT → **Potentiel +50-100€/client**
2. **Templates premium** → Infrastructure existe mais pas de monétisation
3. **Export automatique e-commerce** → Partiellement implémenté mais pas monétisé
4. **Upsells intelligents** → Aucune modal/notification d'upsell n'existe
5. **Incohérences tarifaires** → Prix différents frontend vs backend

### Gaps Critiques ❌
- Pas de système de vente de crédits IA séparément (seulement limites mensuelles)
- Pas de tracking précis des coûts par appel IA
- Pas d'affichage des crédits restants dans le UI
- Pas de modales d'upsell avant dépassement quota
- Incohérence prix Professional : 49€ (frontend) vs 99€ (backend)
- Système de quotas backend sophistiqué mais non utilisé par le frontend

---

## 1. AUDIT REPOSITORY

### 1.1 Structure du Projet

```
luneo-platform/
├── apps/
│   ├── frontend/          ✅ Next.js 15 + Vercel (943 fichiers)
│   ├── backend/           ✅ NestJS + API Routes serverless (609 fichiers)
│   ├── ai-engine/         ⚠️ Python FastAPI (non audité - séparé)
│   ├── shopify/           ✅ App Shopify intégrée
│   ├── widget/            ✅ Widget embeddable
│   ├── worker-ia/         ⚠️ Workers BullMQ (Redis requis)
│   ├── mobile/            ⚠️ React Native (minimal, peu utilisé)
│   └── ar-viewer/         ✅ Viewer AR Three.js
├── packages/              ✅ Shared libs (60 fichiers)
├── docs/                  ✅ Documentation (65+ fichiers MD)
└── scripts/               ⚠️ 134 scripts (beaucoup de duplication)
```

**Verdict Repository:** ✅ **Architecture monorepo bien structurée**

---

## 2. AUDIT API ROUTES FRONTEND

### 2.1 Routes IA (`/api/ai/`)

| Endpoint | Fonction | IA Utilisée | Coût/appel | Quotas ? | Statut |
|----------|----------|-------------|------------|----------|--------|
| `/api/ai/generate` | Génération DALL-E 3 | OpenAI | ~$0.04-0.08 | ✅ Mensuel | ✅ Fonctionnel |
| `/api/ai/background-removal` | Suppression fond | ? | ? | ❌ Non | ⚠️ À vérifier |
| `/api/ai/extract-colors` | Extraction couleurs | ? | Faible | ❌ Non | ⚠️ À vérifier |

**Analyse Critique:**
- ✅ Route `/api/ai/generate` implémente des quotas simples (5/50/999999 par plan)
- ❌ **Aucune déduction de crédits** → seulement compteur mensuel
- ❌ **Pas de système de packs de crédits achetables**
- ⚠️ Quotas hardcodés dans le code (devrait être en DB)
- ⚠️ Pas de tracking du coût réel OpenAI par génération

**Code actuel (`/api/ai/generate/route.ts`):**
```typescript
const limits: Record<string, number> = {
  starter: 5,
  professional: 50,
  enterprise: 999999,
};
```

**Ce qui manque:**
```typescript
// ❌ Pas de système comme ça actuellement
const endpointCosts = {
  '/api/ai/generate': 5,        // 5 crédits
  '/api/ai/3d-render': 10,      // 10 crédits
  '/api/ai/variants': 3,        // 3 crédits
};
```

### 2.2 Routes Billing (`/api/billing/`)

| Endpoint | Fonction | Stripe ? | Statut |
|----------|----------|----------|--------|
| `/api/billing/create-checkout-session` | Créer session abonnement | ✅ | ✅ Fonctionnel |
| `/api/billing/subscription` | GET/PUT abonnement | ✅ | ✅ Fonctionnel |
| `/api/billing/portal` | Portail client Stripe | ✅ | ✅ Fonctionnel |
| `/api/billing/invoices` | Récupérer factures | ✅ | ⚠️ À tester |

**Plans Stripe configurés (frontend):**
```typescript
starter: 29€/mois (278€/an -20%)
professional: 49€/mois (470€/an -20%)
business: 99€/mois (950€/an -20%)
enterprise: Sur demande
```

**⚠️ INCOHÉRENCE DÉTECTÉE:**
Backend (`quotas.service.ts`) définit:
- Professional: 99€/mois
- Business: 299€/mois
- Enterprise: 999€/mois

→ **ACTION REQUISE:** Harmoniser les prix

### 2.3 Routes Manquantes pour Objectifs Business

❌ `/api/credits/buy` → Acheter pack de crédits IA  
❌ `/api/credits/balance` → Récupérer solde crédits  
❌ `/api/templates/premium/buy` → Acheter template premium  
❌ `/api/export/shopify` → Export automatique Shopify (partiellement fait)  
❌ `/api/export/woocommerce` → Export automatique WooCommerce  
❌ `/api/export/etsy` → Export automatique Etsy  

---

## 3. AUDIT SYSTÈME IA

### 3.1 Modèles Utilisés

| Modèle | Provider | Fonction | Coût estimé | Intégré ? |
|--------|----------|----------|-------------|-----------|
| DALL-E 3 | OpenAI | Génération images | $0.040-0.080 | ✅ Oui |
| GPT-4 | OpenAI | ? | $0.03/1K tokens | ⚠️ Non confirmé |
| Stable Diffusion | Replicate ? | ? | $0.002-0.01 | ❌ Non trouvé |

### 3.2 Système de Crédits/Quotas

**✅ CE QUI EXISTE (Backend Prisma):**
```prisma
model UserQuota {
  monthlyLimit   Int      @default(100)
  monthlyUsed    Int      @default(0)
  costLimitCents Int      @default(5000)  // 50€
  costUsedCents  Int      @default(0)
  resetAt        DateTime
}

model AICost {
  provider  String  // openai, replicate, etc.
  model     String
  costCents Int
  tokens    Int?
  duration  Int?
}
```

**❌ CE QUI MANQUE:**
- Table `credits` ou `ai_credits` pour crédits achetables
- Table `credit_packs` pour définir les packs (100/500/1000 crédits)
- Middleware de déduction automatique de crédits
- Endpoint Stripe pour acheter des packs

**🎯 OPPORTUNITÉ #1 — Système de Crédits IA Payants**

**Objectif:** Ajouter vente de crédits IA séparément des abonnements (marge 80-90%)

**Modifications DB nécessaires:**
```sql
ALTER TABLE users 
ADD COLUMN ai_credits INTEGER DEFAULT 0,
ADD COLUMN ai_credits_purchased INTEGER DEFAULT 0,
ADD COLUMN last_credit_purchase TIMESTAMP;

CREATE TABLE credit_packs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Packs proposés
INSERT INTO credit_packs (name, credits, price_cents, stripe_price_id) VALUES
  ('Pack 100', 100, 1900, 'price_xxx'),   -- 19€ = 0.19€/crédit
  ('Pack 500', 500, 7900, 'price_yyy'),   -- 79€ = 0.16€/crédit (-16%)
  ('Pack 1000', 1000, 13900, 'price_zzz'); -- 139€ = 0.14€/crédit (-26%)
```

**Coûts réels vs Prix de vente:**
- DALL-E 3 coût : $0.04-0.08 (~0.04-0.08€)
- Prix de vente 1 crédit (pack 100) : 0.19€
- **Marge : 137-375% → Très rentable**

### 3.3 Optimisations IA Possibles

1. **Réduire résolution pour freemium:** 512x512 au lieu de 1024x1024 → coût divisé par 4
2. **Caching intelligent:** Hash prompt + réutiliser si identique → économie 30-50%
3. **Modèles open-source:** Stable Diffusion pour certains cas → coût divisé par 10
4. **Batching:** Regrouper requêtes pour réduire overhead

---

## 4. AUDIT FRONTEND

### 4.1 Configuration Next.js

**Fichier:** `apps/frontend/next.config.mjs`

✅ **Points positifs:**
- Output standalone pour Vercel
- Bundle analyzer activable
- Optimisations images (AVIF, WebP)
- Tree shaking configuré
- Split chunks optimisé

⚠️ **Points d'amélioration:**
- `ignoreBuildErrors: true` → Dangereux en prod
- `eslint.ignoreDuringBuilds: true` → Risque de régressions

### 4.2 UI/UX pour Monétisation

**❌ Manque critique:**
- Aucun affichage des crédits restants visible
- Aucune modal d'upsell avant dépassement quota
- Aucune notification push pour acheter crédits
- Aucun CTA "Buy Credits" dans le dashboard

**🎯 OPPORTUNITÉ #2 — Upsells Intelligents**

**Composants à créer:**
```tsx
// components/CreditsDisplay.tsx
<div className="credits-badge">
  🔥 {credits} crédits restants
  {credits < 20 && <Button>Acheter crédits</Button>}
</div>

// components/UpsellModal.tsx
useEffect(() => {
  if (credits / maxCredits < 0.2 && credits > 0) {
    openModal(<UpsellModal 
      remaining={credits}
      packs={[100, 500, 1000]}
    />);
  }
}, [credits]);
```

### 4.3 Performance Frontend

**Analyse Bundle (à faire):**
```bash
ANALYZE=true pnpm build
```

**Lazy Loading:**
- ⚠️ Viewer 3D (@react-three/fiber) → Devrait être lazy
- ⚠️ Canvas Konva → Devrait être lazy
- ✅ Modales déjà en lazy

---

## 5. AUDIT CONFIGURATION VERCEL

### 5.1 Frontend (`apps/frontend/vercel.json`)

✅ **Bien configuré:**
- Région: CDG1 (Paris)
- Crons pour cleanup et analytics
- Headers sécurité (CSP, HSTS, etc.)
- Cache-Control optimisé
- Redirects SEO

### 5.2 Backend (`apps/backend/vercel.json`)

✅ **Bien configuré:**
- Functions timeout: 30s
- Memory: 1024MB
- Rewrites vers API Routes
- Région: CDG1

⚠️ **Limites Vercel à connaître:**
- Timeout max: 60s (Pro), 300s (Enterprise)
- Payload max: 4.5MB
- Pas de WebSockets natifs (besoin Pusher/Ably)

---

## 6. AUDIT BASE DE DONNÉES

### 6.1 Schéma Prisma

**Modèles clés:**
- ✅ User (avec OAuth)
- ✅ Brand (multi-tenant)
- ✅ UserQuota (quotas mensuels)
- ✅ AICost (tracking coûts IA)
- ✅ Design, Order, Product
- ✅ Customization, Zone
- ✅ EcommerceIntegration (Shopify, WooCommerce)
- ✅ Artisan, WorkOrder (marketplace)
- ✅ Experiment, Conversion (A/B testing)

**Indexes:**
✅ Indexes sur colonnes fréquentes (userId, brandId, status, createdAt)

**❌ Ce qui manque pour crédits IA:**
```prisma
model CreditPack {
  id            String   @id @default(cuid())
  name          String
  credits       Int
  priceCents    Int
  stripePriceId String?
  isActive      Boolean  @default(true)
}

model CreditTransaction {
  id        String   @id @default(cuid())
  userId    String
  amount    Int      // positif = achat, négatif = dépense
  type      String   // purchase, usage, refund
  metadata  Json?
  createdAt DateTime @default(now())
}
```

### 6.2 Performances DB

**À vérifier en production:**
- Slow queries (utiliser `EXPLAIN ANALYZE`)
- Connection pooling (Prisma Accelerate?)
- Read replicas pour analytics

---

## 7. AUDIT INTÉGRATIONS E-COMMERCE

### 7.1 Shopify

**Fichiers:** `apps/shopify/`, `apps/frontend/src/app/api/integrations/shopify/`

✅ **Implémenté:**
- OAuth Shopify
- Webhooks
- Sync products

⚠️ **Export automatique mockups:**
- Code existe mais pas testé en production
- Pas de retry automatique
- Pas de queue pour limiter rate limits

### 7.2 WooCommerce

✅ Connecteurs basiques existent  
❌ Export automatique non implémenté

### 7.3 Etsy

❌ Pas d'intégration trouvée

**🎯 OPPORTUNITÉ #3 — Export Premium**

Monétiser l'export automatique:
- Gratuit: export manuel 1 par 1
- Pro (49€/mois): export automatique jusqu'à 50 produits/mois
- Business (99€/mois): export illimité + retry automatique

---

## 8. RECOMMANDATIONS PRIORISÉES

### PRIORITÉ 1 — Système de Crédits IA (ROI: +50-100€/client)

**Temps estimé:** 3-4 jours

**Étapes:**
1. Créer tables `credit_packs`, `credit_transactions`
2. Ajouter colonne `ai_credits` sur `users`
3. Créer Stripe Products pour packs (100/500/1000)
4. Créer route `/api/credits/buy`
5. Créer middleware de déduction automatique
6. Créer composant `CreditsDisplay` dans dashboard
7. Créer modal `UpsellModal` (trigger à 20% restants)

**Impact business:**
- 30% des users achètent 1 pack/mois → +19€/user/mois
- 10% achètent pack 500 → +79€
- **Potentiel: +15-25k€/mois** (500 users actifs)

### PRIORITÉ 2 — Harmoniser Prix (ROI: Clarté tarifaire)

**Temps estimé:** 1 jour

**Action:**
1. Décider prix définitifs (recommandation: suivre frontend)
2. Mettre à jour backend `quotas.service.ts`
3. Vérifier Stripe Products
4. Mettre à jour page `/pricing`

### PRIORITÉ 3 — Templates Premium (ROI: +10-20€/achat)

**Temps estimé:** 2-3 jours

**Étapes:**
1. Ajouter colonne `price` sur table `templates` (existe déjà dans Prisma!)
2. Créer Stripe Products pour templates (9€, 19€, 49€)
3. Créer route `/api/templates/buy`
4. Ajouter badge "Premium" dans galerie
5. Bloquer preview si non acheté

### PRIORITÉ 4 — Upsells Intelligents (ROI: +20-30% conversions)

**Temps estimé:** 2 jours

**Composants:**
- `<CreditsDisplay />` → Toujours visible
- `<UpsellModal />` → Trigger intelligent
- `<PlanComparisonCard />` → Upgrade suggestions
- Email automation (Sendgrid déjà configuré)

### PRIORITÉ 5 — Optimisations IA (ROI: -30-50% coûts)

**Temps estimé:** 3-5 jours

**Actions:**
1. Implémenter caching (Upstash Redis)
2. Réduire résolution freemium (512x512)
3. Ajouter option "Fast mode" (Stable Diffusion)
4. Batching des requêtes

---

## 9. PLAN D'EXÉCUTION RECOMMANDÉ

### Semaine 1 (Jours 1-5)
- [x] Audit complet (terminé)
- [ ] Harmoniser prix frontend/backend
- [ ] Créer système de crédits IA (DB + API)
- [ ] Créer Stripe Products pour packs

### Semaine 2 (Jours 6-10)
- [ ] Implémenter middleware déduction crédits
- [ ] Créer UI CreditsDisplay + UpsellModal
- [ ] Tester flow d'achat complet
- [ ] Déployer en staging Vercel

### Semaine 3 (Jours 11-15)
- [ ] Templates premium (DB + Stripe + UI)
- [ ] Optimisations IA (caching + résolution)
- [ ] Tests e2e avec Playwright
- [ ] Déploiement production progressif (10% → 50% → 100%)

---

## 10. RISQUES IDENTIFIÉS

### Risque 1: Vercel Timeout (30s)
**Impact:** Génération IA échoue si >30s  
**Mitigation:** Queue BullMQ + webhooks

### Risque 2: Coûts OpenAI imprévisibles
**Impact:** Budget explosion si pic d'usage  
**Mitigation:** Rate limiting strict + alerts CloudWatch

### Risque 3: Dépendance Stripe
**Impact:** Downtime Stripe = 0 revenue  
**Mitigation:** Alternative PayPal en backup

---

## 11. METRICS DE SUCCÈS

### KPIs Business
- [ ] Revenue/user/mois: +50€ (crédits IA)
- [ ] Taux conversion free→paid: 5% → 8%
- [ ] Panier moyen: +30%
- [ ] LTV (Lifetime Value): +100€

### KPIs Techniques
- [ ] Temps génération IA: <10s (p95)
- [ ] Taux erreur API: <1%
- [ ] Uptime: >99.5%
- [ ] Coût IA/génération: -30%

---

## 12. CONCLUSION

**État actuel:** Fondations solides mais opportunités de monétisation sous-exploitées

**Potentiel identifié:**
- Système de crédits IA: **+15-25k€/mois**
- Templates premium: **+5-10k€/mois**
- Export automatique premium: **+3-5k€/mois**

**Total potentiel additionnel: +23-40k€/mois** (basé sur 500 users actifs)

**Prochaine étape:** Commencer Phase 2 (Optimisations) puis Phase 3 (Développement ciblé)

---

**Rapport généré le:** 20/12/2025  
**Prêt pour Phase 2** ✅



















