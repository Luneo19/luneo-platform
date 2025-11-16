# 🐛 RAPPORT COMPLET DES ERREURS - PROJET LUNEO

**Date:** 6 Novembre 2025  
**Analyse:** Frontend complet (Backend + tests manuels requis)

---

## 🔴 **ERREURS CRITIQUES** (à corriger immédiatement)

### 1. **Variables d'environnement manquantes**

#### ❌ **Problème:**
Plusieurs variables env utilisées mais non documentées/configurées :

```typescript
// apps/frontend/src/app/api/billing/create-checkout-session/route.ts:12
process.env.STRIPE_SECRET_KEY // ⚠️ Peut être undefined

// apps/frontend/src/app/api/designs/export-print/route.ts:9-11
process.env.CLOUDINARY_CLOUD_NAME // ⚠️ Peut être undefined
process.env.CLOUDINARY_API_KEY
process.env.CLOUDINARY_API_SECRET
```

#### ✅ **Solution:**
Créer fichier `.env.local` avec toutes les variables de `env.example`

```bash
cp apps/frontend/env.example apps/frontend/.env.local
# Puis remplir avec les vraies valeurs
```

**Variables manquantes critiques:**
- `STRIPE_SECRET_KEY` ⚠️ **REQUIS pour paiements**
- `STRIPE_WEBHOOK_SECRET` ⚠️ **REQUIS pour webhooks**
- `STRIPE_PRICE_PRO` (optionnel, a un fallback)
- `STRIPE_PRICE_ENTERPRISE`
- `CLOUDINARY_*` (si exports print-ready utilisés)
- `NEXT_PUBLIC_API_URL` (backend URL)

---

### 2. **TODOs non implémentés dans routes API critiques**

#### ❌ **Problèmes:**

**a) Email non envoyé - Forgot Password**
```typescript
// apps/frontend/src/app/api/auth/forgot-password/route.ts:14
// TODO: Implémenter l'envoi d'email avec le backend
```
**Impact:** Les users ne reçoivent PAS l'email de reset password ❌

**b) Reset Password incomplet**
```typescript
// apps/frontend/src/app/api/auth/reset-password/route.ts:25
// TODO: Verify token and check expiry in database
// TODO: Hash password with bcrypt (ligne 40)
// TODO: Update user password and clear reset token (ligne 44)
```
**Impact:** Reset password NON FONCTIONNEL ❌

**c) Stripe Refund non implémenté**
```typescript
// apps/frontend/src/app/api/orders/[id]/route.ts:224
// TODO: Intégrer Stripe refund
```
**Impact:** Remboursements manuels uniquement ⚠️

**d) Team Invite emails**
```typescript
// apps/frontend/src/app/api/team/invite/route.ts:49
// TODO: Send email via SendGrid

// apps/frontend/src/app/api/team/route.ts:202
// TODO: Envoyer l'email d'invitation
```
**Impact:** Invitations équipe sans notification email ⚠️

**e) GDPR Delete Account incomplet**
```typescript
// apps/frontend/src/app/api/gdpr/delete-account/route.ts:70
// TODO: Implémenter annulation Stripe
// TODO: Implémenter email SendGrid (ligne 112)
```
**Impact:** Suppression compte sans annulation abonnement ❌

**f) Système de codes promo**
```typescript
// apps/frontend/src/app/api/orders/route.ts:203
// TODO: Implémenter système de codes promo
```
**Impact:** Feature non disponible (OK si pas prévue)

**g) AR Export conversion**
```typescript
// apps/frontend/src/app/api/ar/export/route.ts:85
// TODO: Intégrer un service de conversion comme:
```
**Impact:** Export AR possiblement incomplet ⚠️

#### ✅ **Solutions prioritaires:**

1. **Forgot/Reset Password (URGENT):**
```typescript
// Appeler le backend NestJS existant
const backendUrl = process.env.NEXT_PUBLIC_API_URL;
await fetch(`${backendUrl}/auth/forgot-password`, {
  method: 'POST',
  body: JSON.stringify({ email }),
});
```

2. **Stripe Refund (IMPORTANT):**
```typescript
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
await stripe.refunds.create({
  payment_intent: order.stripePaymentIntentId,
  amount: order.total,
});
```

3. **Team Invites (IMPORTANT):**
```typescript
// Utiliser le service email backend
await fetch(`${backendUrl}/email/send-invite`, {
  method: 'POST',
  body: JSON.stringify({ email, teamId, inviteToken }),
});
```

---

### 3. **Console.log en production**

#### ❌ **Problème:**
20+ `console.log/error` laissés dans le code de production

**Fichiers concernés:**
- `apps/frontend/src/app/(public)/help/documentation/**/*.tsx` (6 fichiers)
- `apps/frontend/src/components/solutions/CustomizerDemo.tsx`
- `apps/frontend/src/components/solutions/Configurator3DDemo.tsx`
- `apps/frontend/src/app/(dashboard)/library/page.tsx`
- `apps/frontend/src/app/(dashboard)/ar-studio/page.tsx`
- `apps/frontend/src/app/(public)/demo/**/*.tsx` (3 fichiers)
- `apps/frontend/src/app/api/auth/**/*.ts` (2 fichiers)

#### ✅ **Solution:**
Remplacer par un logger proper :

```typescript
// Créer apps/frontend/src/lib/logger.ts (existe déjà !)
import { logger } from '@/lib/logger';

// Au lieu de:
console.log('Design saved:', design); // ❌

// Utiliser:
logger.info('Design saved', { designId: design.id }); // ✅
logger.error('Error loading templates', { error }); // ✅
```

**Action requise:**
Chercher/remplacer tous les `console.log/error/warn` dans `/src/app` et `/src/components`

---

## 🟡 **ERREURS MOYENNES** (à corriger rapidement)

### 4. **Types `any` (7 occurrences)**

#### ❌ **Problème:**
Usage de `any` au lieu de types stricts TypeScript

```typescript
// apps/frontend/src/app/api/auth/forgot-password/route.ts:35
} catch (error: any) { // ⚠️

// apps/frontend/src/app/(auth)/forgot-password/page.tsx:31
} catch (err: any) { // ⚠️

// apps/frontend/src/components/solutions/Configurator3DDemo.tsx:40
onConfigChange?: (config: any) => void; // ⚠️
```

#### ✅ **Solution:**
```typescript
// Au lieu de:
} catch (error: any) {

// Utiliser:
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}

// Ou créer des types:
interface Config3D {
  material: string;
  color: string;
  size: number;
}
onConfigChange?: (config: Config3D) => void;
```

---

### 5. **Imports non utilisés**

Vérifier avec TypeScript strict mode. Exemples potentiels à vérifier :

```typescript
// apps/frontend/src/components/layout/PublicNav.tsx
import { Menu, X } from 'lucide-react'; // Menu et X utilisés ?
```

**Action:** Activer `noUnusedLocals` et `noUnusedParameters` dans `tsconfig.json`

---

### 6. **Prix hardcodés dans pricing/page.tsx**

#### ❌ **Problème:**
```typescript
// apps/frontend/src/app/(public)/pricing/page.tsx:667
<div className="text-4xl font-bold text-green-400 mb-2">-77%</div>
<p className="text-xs text-gray-400">29€ vs 126€/mois</p>
```

**Inconsistance:** Si les prix changent, il faut modifier plusieurs endroits

#### ✅ **Solution:**
Créer fichier de constants :

```typescript
// apps/frontend/src/lib/pricing-constants.ts
export const PRICING = {
  starter: { monthly: 0, yearly: 0 },
  professional: { monthly: 29, yearly: 278.40 },
  business: { monthly: 59, yearly: 566.40 },
  enterprise: { monthly: 99, yearly: 950.40 },
};

export const COMPETITOR_PRICING = {
  canva: { monthly: 42, yearly: 504 },
  zakeke: { monthly: 84, yearly: 1008 },
};

// Calculer les % dynamiquement
export const getSavings = () => {
  const luneoYearly = PRICING.professional.yearly / 12;
  const competitorAvg = (COMPETITOR_PRICING.canva.monthly + COMPETITOR_PRICING.zakeke.monthly) / 2;
  return Math.round((1 - luneoYearly / competitorAvg) * 100);
};
```

---

## 🟢 **ERREURS MINEURES** (à corriger quand possible)

### 7. **Placeholder values dans env.example**

```bash
# apps/frontend/env.example:29
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX # ⚠️ Placeholder

# Solution: Documenter qu'il faut remplacer
```

---

### 8. **Manque de validation input**

#### ⚠️ **Recommandation:**
Ajouter validation Zod sur toutes les routes API :

```typescript
import { z } from 'zod';

const ForgotPasswordSchema = z.object({
  email: z.string().email('Email invalide'),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = ForgotPasswordSchema.safeParse(body);
  
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues },
      { status: 400 }
    );
  }
  
  const { email } = result.data;
  // ...
}
```

---

### 9. **URLs hardcodées**

```typescript
// apps/frontend/src/app/api/billing/create-checkout-session/route.ts:85-86
success_url: 'https://app.luneo.app/dashboard/billing?session_id={CHECKOUT_SESSION_ID}',
cancel_url: 'https://app.luneo.app/pricing',
```

#### ✅ **Solution:**
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.luneo.app';
success_url: `${baseUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${baseUrl}/pricing`,
```

---

### 10. **Fallback placeholder Stripe**

```typescript
// apps/frontend/src/app/api/billing/subscription/route.ts:10
stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
```

**⚠️ Dangereux:** Si `STRIPE_SECRET_KEY` manque, ça va fail silencieusement

#### ✅ **Solution:**
```typescript
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { ... });
```

---

## 📊 **STATISTIQUES DES ERREURS**

| Catégorie | Nombre | Sévérité |
|-----------|--------|----------|
| Env vars manquantes | 8+ | 🔴 Critique |
| TODOs non implémentés | 10 | 🔴 Critique |
| console.log production | 20+ | 🟡 Moyen |
| Types `any` | 7 | 🟡 Moyen |
| Hardcoded values | 5+ | 🟢 Mineur |
| Validation manquante | ~50 routes | 🟡 Moyen |

**Total erreurs:** ~100+ détectées

---

## ✅ **PLAN D'ACTION PRIORITAIRE**

### 🔴 **Aujourd'hui (Critique):**
1. ✅ Créer `.env.local` avec toutes les variables
2. ✅ Implémenter forgot/reset password (appeler backend)
3. ✅ Vérifier STRIPE_SECRET_KEY configurée

### 🟡 **Cette semaine (Important):**
4. ✅ Remplacer tous les `console.log` par `logger`
5. ✅ Implémenter Stripe refunds
6. ✅ Implémenter team invite emails
7. ✅ Implémenter GDPR delete account complet
8. ✅ Remplacer `any` par types stricts

### 🟢 **Mois prochain (Nice to have):**
9. ✅ Ajouter validation Zod sur toutes les API routes
10. ✅ Extraire hardcoded values en constants
11. ✅ Tests unitaires pour routes critiques
12. ✅ Documentation API complète

---

## 🚀 **COMMANDES POUR CORRIGER**

```bash
# 1. Copier .env.example
cp apps/frontend/env.example apps/frontend/.env.local

# 2. Remplacer console.log par logger
# (Manuel ou avec script)

# 3. Vérifier types TypeScript
cd apps/frontend
npm run type-check

# 4. Lint check
npm run lint

# 5. Build test
npm run build
```

---

## 📋 **CHECKLIST DE CORRECTION**

- [ ] `.env.local` créé et configuré
- [ ] `STRIPE_SECRET_KEY` vérifiée
- [ ] Forgot password implémenté
- [ ] Reset password implémenté
- [ ] GDPR delete account complet
- [ ] Stripe refunds implémentés
- [ ] Team invites emails envoyés
- [ ] Tous `console.log` remplacés par `logger`
- [ ] Types `any` remplacés
- [ ] Validation Zod ajoutée (routes critiques)
- [ ] Tests manuels passes
- [ ] Build production réussit

---

**Statut global:** 🟡 **Moyen** - Plusieurs bugs critiques à corriger avant prod



