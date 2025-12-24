# 🎯 SYSTÈME CRÉDITS IA — GUIDE COMPLET

**Statut:** ✅ **100% IMPLÉMENTÉ**  
**Date:** 20 décembre 2025  
**Fichiers créés:** 13 fichiers backend + frontend

---

## 🚀 DÉMARRAGE RAPIDE (5 minutes)

### 1. Appliquer Migration DB

```bash
cd apps/backend

# Option A: Via Prisma (recommandé)
npx prisma migrate dev --name add_credits_system

# Option B: SQL direct (Supabase)
psql $DATABASE_URL < prisma/migrations/add_credits_system.sql
```

### 2. Créer Stripe Products

**Via Stripe Dashboard:**
1. Aller sur https://dashboard.stripe.com/test/products
2. Créer 3 produits:
   - Pack 100: 19€
   - Pack 500: 79€ (Best Value)
   - Pack 1000: 139€
3. Copier les Price IDs

**Via Stripe CLI:**
```bash
stripe products create --name="Pack 100 Crédits IA" --description="100 crédits"
stripe prices create --product=prod_XXX --unit-amount=1900 --currency=eur
# Répéter pour 500 et 1000
```

### 3. Configurer Env Vars

```bash
# Frontend
cd apps/frontend
vercel env add STRIPE_PRICE_CREDITS_100
# Coller price_xxx
# Production + Preview

# Répéter pour 500 et 1000
```

### 4. Seed Packs (optionnel)

```bash
cd apps/backend
npx ts-node prisma/seed-credits.ts
```

### 5. Déployer

```bash
# Backend
vercel --prod

# Frontend
vercel --prod
```

**✅ C'est tout! Le système est opérationnel.**

---

## 📁 STRUCTURE DES FICHIERS

```
apps/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                    ✅ Modifié (champs crédits)
│   │   ├── migrations/
│   │   │   └── add_credits_system.sql       ✅ Migration SQL
│   │   └── seed-credits.ts                 ✅ Script seed
│   └── src/
│       ├── libs/credits/
│       │   ├── costs.ts                     ✅ Coûts par endpoint
│       │   ├── credits.service.ts            ✅ Service principal
│       │   └── credits.module.ts            ✅ Module lib
│       ├── modules/credits/
│       │   ├── credits.controller.ts        ✅ REST API
│       │   └── credits.module.ts            ✅ Module feature
│       └── common/middleware/
│           └── credits.middleware.ts        ✅ Middleware vérification
│
└── frontend/
    └── src/
        ├── app/api/credits/
        │   ├── balance/route.ts               ✅ GET balance
        │   ├── buy/route.ts                  ✅ POST achat
        │   ├── packs/route.ts                ✅ GET packs
        │   └── transactions/route.ts         ✅ GET historique
        ├── components/credits/
        │   ├── CreditsDisplay.tsx             ✅ Badge crédits
        │   ├── UpsellModal.tsx               ✅ Modal achat
        │   └── index.ts                      ✅ Exports
        └── hooks/
            └── useCredits.ts                 ✅ Hook personnalisé
```

---

## 💻 UTILISATION

### Afficher crédits dans Header

```tsx
import { CreditsDisplay } from '@/components/credits';

<CreditsDisplay userId={user.id} inline showBuyButton />
```

### Modal Upsell automatique

```tsx
import { useCredits } from '@/hooks/useCredits';
import { UpsellModal } from '@/components/credits';

const { credits, isLow } = useCredits();
const [showUpsell, setShowUpsell] = useState(false);

useEffect(() => {
  if (isLow && credits?.balance > 0) {
    setShowUpsell(true);
  }
}, [isLow, credits]);

<UpsellModal
  open={showUpsell}
  onClose={() => setShowUpsell(false)}
  remainingCredits={credits?.balance || 0}
/>
```

### Vérifier crédits avant action IA

```tsx
// Dans /api/ai/generate/route.ts
const creditsRes = await fetch(`${BACKEND_URL}/credits/check`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${user.id}` },
  body: JSON.stringify({ endpoint: '/api/ai/generate' }),
});

if (!creditsRes.ok) {
  throw { status: 402, message: 'Crédits insuffisants', code: 'INSUFFICIENT_CREDITS' };
}
```

---

## 📊 COÛTS PAR ENDPOINT

| Endpoint | Crédits | Coût réel | Prix vente | Marge |
|----------|---------|-----------|------------|-------|
| `/api/ai/generate` | 5 | 0.04€ | 0.95€ | **2275%** |
| `/api/ai/generate/hd` | 10 | 0.08€ | 1.90€ | **2275%** |
| `/api/3d/render-highres` | 8 | 0.02€ | 1.52€ | **7500%** |
| `/api/ar/convert-2d-to-3d` | 15 | 0.03€ | 2.85€ | **9400%** |

**Marge moyenne: 3000-5000%** 🚀

---

## 🔧 CONFIGURATION

### Variables d'Environnement Requises

**Frontend:**
```bash
STRIPE_SECRET_KEY=sk_xxx
STRIPE_PRICE_CREDITS_100=price_xxx
STRIPE_PRICE_CREDITS_500=price_yyy
STRIPE_PRICE_CREDITS_1000=price_zzz
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_APP_URL=https://luneo.app
```

**Backend:**
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_xxx
```

---

## 🧪 TESTS

### Test Backend

```bash
cd apps/backend
npm run test -- credits.service.spec.ts
```

### Test Frontend E2E

```bash
cd apps/frontend
npm run test:e2e -- credits-purchase.spec.ts
```

### Test Manuel

1. Acheter pack 100 via Stripe test mode
2. Vérifier crédits ajoutés dans DB
3. Utiliser crédits (génération IA)
4. Vérifier déduction automatique

---

## 📈 MONITORING

### Metrics à suivre

- **Taux conversion:** Views → Achats (objectif: 3-5%)
- **Panier moyen:** Pack 500 (objectif: 79€)
- **Revenue/user:** +19-79€/mois
- **Webhook success rate:** >99%

### Logs importants

```typescript
// À logger dans chaque transaction
logger.info('Credit purchase', { userId, packSize, revenue });
logger.info('Credit usage', { userId, endpoint, cost, balanceAfter });
```

---

## 🐛 TROUBLESHOOTING

**Q: Webhook ne se déclenche pas**
- Vérifier URL dans Stripe Dashboard
- Vérifier `STRIPE_WEBHOOK_SECRET`
- Tester avec `stripe listen`

**Q: Crédits non ajoutés**
- Vérifier logs webhook
- Vérifier idempotency (pas de doublon)
- Vérifier migration DB appliquée

**Q: Balance toujours 0**
- Vérifier colonnes `aiCredits` sur `users`
- Invalider cache Redis
- Vérifier webhook reçu

---

## ✅ CHECKLIST DÉPLOIEMENT

- [ ] Migration DB appliquée
- [ ] Stripe Products créés
- [ ] Env vars configurées
- [ ] Seed packs exécuté
- [ ] Tests passent
- [ ] Déployé staging
- [ ] Testé achat complet
- [ ] Déployé production
- [ ] Monitoring actif

---

**🎉 Système prêt pour production!**

*Pour plus de détails, voir `IMPLEMENTATION_COMPLETE.md`*






# 🎯 SYSTÈME CRÉDITS IA — GUIDE COMPLET

**Statut:** ✅ **100% IMPLÉMENTÉ**  
**Date:** 20 décembre 2025  
**Fichiers créés:** 13 fichiers backend + frontend

---

## 🚀 DÉMARRAGE RAPIDE (5 minutes)

### 1. Appliquer Migration DB

```bash
cd apps/backend

# Option A: Via Prisma (recommandé)
npx prisma migrate dev --name add_credits_system

# Option B: SQL direct (Supabase)
psql $DATABASE_URL < prisma/migrations/add_credits_system.sql
```

### 2. Créer Stripe Products

**Via Stripe Dashboard:**
1. Aller sur https://dashboard.stripe.com/test/products
2. Créer 3 produits:
   - Pack 100: 19€
   - Pack 500: 79€ (Best Value)
   - Pack 1000: 139€
3. Copier les Price IDs

**Via Stripe CLI:**
```bash
stripe products create --name="Pack 100 Crédits IA" --description="100 crédits"
stripe prices create --product=prod_XXX --unit-amount=1900 --currency=eur
# Répéter pour 500 et 1000
```

### 3. Configurer Env Vars

```bash
# Frontend
cd apps/frontend
vercel env add STRIPE_PRICE_CREDITS_100
# Coller price_xxx
# Production + Preview

# Répéter pour 500 et 1000
```

### 4. Seed Packs (optionnel)

```bash
cd apps/backend
npx ts-node prisma/seed-credits.ts
```

### 5. Déployer

```bash
# Backend
vercel --prod

# Frontend
vercel --prod
```

**✅ C'est tout! Le système est opérationnel.**

---

## 📁 STRUCTURE DES FICHIERS

```
apps/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma                    ✅ Modifié (champs crédits)
│   │   ├── migrations/
│   │   │   └── add_credits_system.sql       ✅ Migration SQL
│   │   └── seed-credits.ts                 ✅ Script seed
│   └── src/
│       ├── libs/credits/
│       │   ├── costs.ts                     ✅ Coûts par endpoint
│       │   ├── credits.service.ts            ✅ Service principal
│       │   └── credits.module.ts            ✅ Module lib
│       ├── modules/credits/
│       │   ├── credits.controller.ts        ✅ REST API
│       │   └── credits.module.ts            ✅ Module feature
│       └── common/middleware/
│           └── credits.middleware.ts        ✅ Middleware vérification
│
└── frontend/
    └── src/
        ├── app/api/credits/
        │   ├── balance/route.ts               ✅ GET balance
        │   ├── buy/route.ts                  ✅ POST achat
        │   ├── packs/route.ts                ✅ GET packs
        │   └── transactions/route.ts         ✅ GET historique
        ├── components/credits/
        │   ├── CreditsDisplay.tsx             ✅ Badge crédits
        │   ├── UpsellModal.tsx               ✅ Modal achat
        │   └── index.ts                      ✅ Exports
        └── hooks/
            └── useCredits.ts                 ✅ Hook personnalisé
```

---

## 💻 UTILISATION

### Afficher crédits dans Header

```tsx
import { CreditsDisplay } from '@/components/credits';

<CreditsDisplay userId={user.id} inline showBuyButton />
```

### Modal Upsell automatique

```tsx
import { useCredits } from '@/hooks/useCredits';
import { UpsellModal } from '@/components/credits';

const { credits, isLow } = useCredits();
const [showUpsell, setShowUpsell] = useState(false);

useEffect(() => {
  if (isLow && credits?.balance > 0) {
    setShowUpsell(true);
  }
}, [isLow, credits]);

<UpsellModal
  open={showUpsell}
  onClose={() => setShowUpsell(false)}
  remainingCredits={credits?.balance || 0}
/>
```

### Vérifier crédits avant action IA

```tsx
// Dans /api/ai/generate/route.ts
const creditsRes = await fetch(`${BACKEND_URL}/credits/check`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${user.id}` },
  body: JSON.stringify({ endpoint: '/api/ai/generate' }),
});

if (!creditsRes.ok) {
  throw { status: 402, message: 'Crédits insuffisants', code: 'INSUFFICIENT_CREDITS' };
}
```

---

## 📊 COÛTS PAR ENDPOINT

| Endpoint | Crédits | Coût réel | Prix vente | Marge |
|----------|---------|-----------|------------|-------|
| `/api/ai/generate` | 5 | 0.04€ | 0.95€ | **2275%** |
| `/api/ai/generate/hd` | 10 | 0.08€ | 1.90€ | **2275%** |
| `/api/3d/render-highres` | 8 | 0.02€ | 1.52€ | **7500%** |
| `/api/ar/convert-2d-to-3d` | 15 | 0.03€ | 2.85€ | **9400%** |

**Marge moyenne: 3000-5000%** 🚀

---

## 🔧 CONFIGURATION

### Variables d'Environnement Requises

**Frontend:**
```bash
STRIPE_SECRET_KEY=sk_xxx
STRIPE_PRICE_CREDITS_100=price_xxx
STRIPE_PRICE_CREDITS_500=price_yyy
STRIPE_PRICE_CREDITS_1000=price_zzz
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_APP_URL=https://luneo.app
```

**Backend:**
```bash
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_xxx
```

---

## 🧪 TESTS

### Test Backend

```bash
cd apps/backend
npm run test -- credits.service.spec.ts
```

### Test Frontend E2E

```bash
cd apps/frontend
npm run test:e2e -- credits-purchase.spec.ts
```

### Test Manuel

1. Acheter pack 100 via Stripe test mode
2. Vérifier crédits ajoutés dans DB
3. Utiliser crédits (génération IA)
4. Vérifier déduction automatique

---

## 📈 MONITORING

### Metrics à suivre

- **Taux conversion:** Views → Achats (objectif: 3-5%)
- **Panier moyen:** Pack 500 (objectif: 79€)
- **Revenue/user:** +19-79€/mois
- **Webhook success rate:** >99%

### Logs importants

```typescript
// À logger dans chaque transaction
logger.info('Credit purchase', { userId, packSize, revenue });
logger.info('Credit usage', { userId, endpoint, cost, balanceAfter });
```

---

## 🐛 TROUBLESHOOTING

**Q: Webhook ne se déclenche pas**
- Vérifier URL dans Stripe Dashboard
- Vérifier `STRIPE_WEBHOOK_SECRET`
- Tester avec `stripe listen`

**Q: Crédits non ajoutés**
- Vérifier logs webhook
- Vérifier idempotency (pas de doublon)
- Vérifier migration DB appliquée

**Q: Balance toujours 0**
- Vérifier colonnes `aiCredits` sur `users`
- Invalider cache Redis
- Vérifier webhook reçu

---

## ✅ CHECKLIST DÉPLOIEMENT

- [ ] Migration DB appliquée
- [ ] Stripe Products créés
- [ ] Env vars configurées
- [ ] Seed packs exécuté
- [ ] Tests passent
- [ ] Déployé staging
- [ ] Testé achat complet
- [ ] Déployé production
- [ ] Monitoring actif

---

**🎉 Système prêt pour production!**

*Pour plus de détails, voir `IMPLEMENTATION_COMPLETE.md`*



















