# SPÉCIFICATIONS TECHNIQUES — Système de Crédits IA
**Projet:** Luneo.app  
**Date:** 20 décembre 2025  
**Priorité:** 🔴 CRITIQUE (ROI: +50-100€/client/mois)

---

## 1. OBJECTIF

Implémenter un système de **crédits IA achetables séparément** pour augmenter le panier moyen et la flexibilité tarifaire.

**Problème actuel:**
- Users limités à X générations/mois selon plan
- Pas de flexibilité pour acheter plus sans upgrade complet
- Perte de revenue quand user a besoin de 10 crédits ponctuellement

**Solution:**
- Vendre des packs de crédits (100/500/1000)
- Déduction automatique à chaque appel IA
- Upsell intelligent quand crédits < 20%

**ROI Projeté:**
```
30% users achètent pack 100 (19€) = +5.7€/user/mois
10% users achètent pack 500 (79€) = +7.9€/user/mois
5% users achètent pack 1000 (139€) = +6.95€/user/mois
--------------------------------
Total: +20.55€/user/mois → +10k€/mois (500 users)
```

---

## 2. ARCHITECTURE

### 2.1 Schéma Base de Données

**Nouvelles tables (Prisma):**

```prisma
model CreditPack {
  id            String   @id @default(cuid())
  name          String   // "Pack 100", "Pack 500", "Pack 1000"
  credits       Int      // Nombre de crédits
  priceCents    Int      // Prix en centimes (1900 = 19€)
  stripePriceId String?  // ID Stripe Price
  isActive      Boolean  @default(true)
  isFeatured    Boolean  @default(false)
  
  // Marketing
  savings       Int?     // % économie vs pack de base
  badge         String?  // "Best Value", "Most Popular"
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  transactions  CreditTransaction[]
  
  @@index([isActive])
  @@index([isFeatured])
}

model CreditTransaction {
  id          String   @id @default(cuid())
  userId      String
  packId      String?
  
  // Montants
  amount      Int      // Positif = achat, Négatif = dépense
  balanceBefore Int    // Solde avant
  balanceAfter  Int    // Solde après
  
  // Type & Metadata
  type        String   // 'purchase', 'usage', 'refund', 'bonus', 'expiration'
  source      String?  // '/api/ai/generate', 'admin', 'stripe_webhook'
  metadata    Json?    // { endpoint, cost, model, duration, etc. }
  
  // Stripe (pour achats)
  stripeSessionId String?
  stripePaymentId String?
  
  createdAt   DateTime @default(now())
  
  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  pack CreditPack? @relation(fields: [packId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([type])
  @@index([createdAt])
  @@index([stripeSessionId])
}
```

**Modifications table User:**

```prisma
model User {
  // ... champs existants ...
  
  // Crédits IA
  aiCredits           Int       @default(0)       // Solde actuel
  aiCreditsPurchased  Int       @default(0)       // Total acheté (lifetime)
  aiCreditsUsed       Int       @default(0)       // Total dépensé (lifetime)
  lastCreditPurchase  DateTime?                   // Dernière date d'achat
  
  creditTransactions  CreditTransaction[]
}
```

### 2.2 Coûts par Endpoint

**Mapping crédits → endpoints:**

```typescript
// lib/credits/costs.ts
export const ENDPOINT_COSTS: Record<string, number> = {
  // Génération IA
  '/api/ai/generate': 5,                    // DALL-E 3 standard
  '/api/ai/generate/hd': 10,               // DALL-E 3 HD
  '/api/ai/background-removal': 2,         // Remove.bg ou équivalent
  '/api/ai/extract-colors': 1,             // Analyse simple
  '/api/ai/variants': 3,                   // 3 variantes
  
  // Rendus
  '/api/3d/render-highres': 8,             // Rendu 3D haute résolution
  '/api/ar/convert-2d-to-3d': 15,          // Conversion 2D→3D
  '/api/ar/convert-usdz': 5,               // Export AR
  
  // Customization
  '/api/customization/generate': 4,        // Personnalisation IA
};

// Coûts réels estimés (pour analytics)
export const REAL_COSTS_CENTS: Record<string, number> = {
  '/api/ai/generate': 4,        // ~$0.04 DALL-E 3
  '/api/ai/generate/hd': 8,     // ~$0.08 DALL-E 3 HD
  '/api/ai/background-removal': 1,
  // ... etc
};

// Marge = Prix vente - Coût réel
// Exemple: 5 crédits × 0.19€ = 0.95€ vente - 0.04€ coût = 0.91€ marge (2275%)
```

---

## 3. IMPLÉMENTATION BACKEND

### 3.1 Service de Gestion des Crédits

**Fichier:** `apps/backend/src/libs/credits/credits.service.ts`

```typescript
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ENDPOINT_COSTS, REAL_COSTS_CENTS } from './costs';

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Vérifier si l'utilisateur a assez de crédits
   */
  async checkCredits(
    userId: string,
    endpoint: string,
    amount?: number,
  ): Promise<{
    sufficient: boolean;
    balance: number;
    required: number;
    missing: number;
  }> {
    const required = amount || ENDPOINT_COSTS[endpoint] || 1;
    
    // Cache Redis (5 secondes) pour éviter queries répétées
    const cacheKey = `credits:${userId}`;
    let balance = await this.cache.get<number>(cacheKey);
    
    if (balance === null) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { aiCredits: true },
      });
      balance = user?.aiCredits || 0;
      await this.cache.set(cacheKey, balance, 5);
    }

    const sufficient = balance >= required;
    const missing = sufficient ? 0 : required - balance;

    return { sufficient, balance, required, missing };
  }

  /**
   * Déduire des crédits (transaction atomique)
   */
  async deductCredits(
    userId: string,
    endpoint: string,
    metadata?: Record<string, any>,
  ): Promise<{
    success: boolean;
    newBalance: number;
    transaction: any;
  }> {
    const cost = ENDPOINT_COSTS[endpoint] || 1;

    try {
      // Transaction Prisma pour garantir atomicité
      const result = await this.prisma.$transaction(async (tx) => {
        // Lock user row
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { aiCredits: true, aiCreditsUsed: true },
        });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        if (user.aiCredits < cost) {
          throw new BadRequestException(
            `Insufficient credits. Required: ${cost}, Available: ${user.aiCredits}`,
          );
        }

        // Déduire crédits
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            aiCredits: { decrement: cost },
            aiCreditsUsed: { increment: cost },
          },
          select: { aiCredits: true },
        });

        // Enregistrer transaction
        const transaction = await tx.creditTransaction.create({
          data: {
            userId,
            amount: -cost,
            balanceBefore: user.aiCredits,
            balanceAfter: updatedUser.aiCredits,
            type: 'usage',
            source: endpoint,
            metadata: {
              ...metadata,
              realCostCents: REAL_COSTS_CENTS[endpoint] || 0,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return { newBalance: updatedUser.aiCredits, transaction };
      });

      // Invalider cache
      await this.cache.delete(`credits:${userId}`);

      this.logger.log(
        `Credits deducted: ${cost} for ${userId} on ${endpoint}. New balance: ${result.newBalance}`,
      );

      return { success: true, ...result };
    } catch (error) {
      this.logger.error(`Failed to deduct credits: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Ajouter des crédits (achat)
   */
  async addCredits(
    userId: string,
    amount: number,
    packId?: string,
    stripeSessionId?: string,
  ): Promise<{ newBalance: number; transaction: any }> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { aiCredits: true, aiCreditsPurchased: true },
        });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            aiCredits: { increment: amount },
            aiCreditsPurchased: { increment: amount },
            lastCreditPurchase: new Date(),
          },
          select: { aiCredits: true },
        });

        const transaction = await tx.creditTransaction.create({
          data: {
            userId,
            packId,
            amount,
            balanceBefore: user.aiCredits,
            balanceAfter: updatedUser.aiCredits,
            type: 'purchase',
            source: 'stripe',
            stripeSessionId,
            metadata: {
              timestamp: new Date().toISOString(),
            },
          },
        });

        return { newBalance: updatedUser.aiCredits, transaction };
      });

      await this.cache.delete(`credits:${userId}`);

      this.logger.log(`Credits added: ${amount} for ${userId}. New balance: ${result.newBalance}`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to add credits: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupérer l'historique des transactions
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
  ): Promise<any[]> {
    return this.prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        pack: {
          select: { name: true, credits: true },
        },
      },
    });
  }
}
```

### 3.2 Middleware de Vérification

**Fichier:** `apps/backend/src/common/middleware/credits.middleware.ts`

```typescript
import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CreditsService } from '@/libs/credits/credits.service';

@Injectable()
export class CreditsMiddleware implements NestMiddleware {
  constructor(private readonly creditsService: CreditsService) {}

  async use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    const user = req.user;
    const endpoint = req.path;

    if (!user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Vérifier crédits
    const check = await this.creditsService.checkCredits(user.id, endpoint);

    if (!check.sufficient) {
      throw new HttpException(
        {
          message: 'Crédits insuffisants',
          code: 'INSUFFICIENT_CREDITS',
          balance: check.balance,
          required: check.required,
          missing: check.missing,
          upsell: {
            packs: [
              { credits: 100, price: 19, priceId: 'price_xxx' },
              { credits: 500, price: 79, priceId: 'price_yyy', badge: 'Best Value' },
              { credits: 1000, price: 139, priceId: 'price_zzz' },
            ],
          },
        },
        HttpStatus.PAYMENT_REQUIRED, // 402
      );
    }

    // Attacher info au request pour tracking
    req['creditsRequired'] = check.required;
    req['creditsBalance'] = check.balance;

    next();
  }
}
```

---

## 4. IMPLÉMENTATION FRONTEND

### 4.1 API Route — Acheter Crédits

**Fichier:** `apps/frontend/src/app/api/credits/buy/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { packSize } = await request.json();

    // Validation
    const validPacks = [100, 500, 1000];
    if (!validPacks.includes(packSize)) {
      throw { status: 400, message: 'Pack invalide', code: 'INVALID_PACK' };
    }

    // Stripe Price IDs
    const packPrices: Record<number, string> = {
      100: process.env.STRIPE_PRICE_CREDITS_100!,
      500: process.env.STRIPE_PRICE_CREDITS_500!,
      1000: process.env.STRIPE_PRICE_CREDITS_1000!,
    };

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: packPrices[packSize],
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment (pas subscription)
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits_purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits_purchase=cancel`,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        packSize: packSize.toString(),
        credits: packSize.toString(),
      },
    });

    logger.info('Credit purchase session created', {
      userId: user.id,
      packSize,
      sessionId: session.id,
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  }, '/api/credits/buy', 'POST');
}
```

### 4.2 Webhook Stripe — Confirmer Achat

**Fichier:** `apps/frontend/src/app/api/webhooks/stripe/route.ts` (modifier existant)

```typescript
// Ajouter ce handler dans le webhook existant

if (event.type === 'checkout.session.completed') {
  const session = event.data.object as Stripe.Checkout.Session;
  
  // Vérifier si c'est un achat de crédits (mode=payment vs subscription)
  if (session.mode === 'payment' && session.metadata?.credits) {
    const userId = session.client_reference_id || session.metadata.userId;
    const credits = parseInt(session.metadata.credits, 10);
    const packSize = parseInt(session.metadata.packSize, 10);

    // Ajouter crédits via backend API
    const response = await fetch(`${process.env.BACKEND_URL}/credits/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        amount: credits,
        packId: `pack_${packSize}`,
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent,
      }),
    });

    if (!response.ok) {
      logger.error('Failed to add credits after payment', {
        userId,
        sessionId: session.id,
      });
      // TODO: Alert admin + retry queue
    } else {
      logger.info('Credits added successfully', { userId, credits });
      
      // Envoyer email confirmation
      await sendEmail({
        to: session.customer_email!,
        template: 'credit_purchase_confirmation',
        data: { credits, amount: session.amount_total! / 100 },
      });
    }
  }
}
```

### 4.3 Composant UI — Affichage Crédits

**Fichier:** `apps/frontend/src/components/credits/CreditsDisplay.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreditsDisplayProps {
  userId: string;
  inline?: boolean;
}

export function CreditsDisplay({ userId, inline = false }: CreditsDisplayProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch('/api/credits/balance');
        const data = await res.json();
        setCredits(data.balance);
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
    
    // Refresh every 30s
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || credits === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="w-4 h-4 animate-pulse" />
        <span>...</span>
      </div>
    );
  }

  const isLow = credits < 20;
  const isCritical = credits < 5;

  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <Zap className={`w-4 h-4 ${isCritical ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-yellow-500'}`} />
        <span className="text-sm font-medium">{credits} crédits</span>
        {isLow && (
          <Button size="sm" variant="outline" onClick={() => router.push('/dashboard/credits')}>
            Acheter
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${isCritical ? 'bg-red-50 border-red-200' : isLow ? 'bg-orange-50 border-orange-200' : 'bg-card'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isCritical ? 'bg-red-100' : isLow ? 'bg-orange-100' : 'bg-yellow-100'}`}>
            <Zap className={`w-5 h-5 ${isCritical ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-yellow-600'}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{credits}</p>
            <p className="text-sm text-muted-foreground">Crédits IA restants</p>
          </div>
        </div>
        
        {isLow && (
          <Button onClick={() => router.push('/dashboard/credits')}>
            <Zap className="w-4 h-4 mr-2" />
            Recharger
          </Button>
        )}
      </div>
      
      {isCritical && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <p>Crédits presque épuisés! Rechargez maintenant pour continuer à utiliser l'IA.</p>
        </div>
      )}
    </div>
  );
}
```

### 4.4 Modal Upsell

**Fichier:** `apps/frontend/src/components/credits/UpsellModal.tsx`

```tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Check } from 'lucide-react';
import { useState } from 'react';

interface Pack {
  credits: number;
  price: number;
  priceId: string;
  badge?: string;
  savings?: number;
}

interface UpsellModalProps {
  open: boolean;
  onClose: () => void;
  remainingCredits: number;
}

const PACKS: Pack[] = [
  { credits: 100, price: 19, priceId: 'price_xxx', savings: 0 },
  { credits: 500, price: 79, priceId: 'price_yyy', badge: 'Best Value', savings: 16 },
  { credits: 1000, price: 139, priceId: 'price_zzz', savings: 26 },
];

export function UpsellModal({ open, onClose, remainingCredits }: UpsellModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (pack: Pack) => {
    setLoading(pack.priceId);
    try {
      const res = await fetch('/api/credits/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packSize: pack.credits }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Rechargez vos crédits IA
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Il vous reste {remainingCredits} crédits. Choisissez un pack pour continuer à créer.
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {PACKS.map((pack) => (
            <div
              key={pack.priceId}
              className={`relative border rounded-lg p-6 hover:shadow-lg transition-shadow ${
                pack.badge ? 'border-primary shadow-md' : ''
              }`}
            >
              {pack.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  {pack.badge}
                </div>
              )}
              
              <div className="text-center mb-4">
                <p className="text-3xl font-bold">{pack.credits}</p>
                <p className="text-sm text-muted-foreground">crédits IA</p>
              </div>
              
              <div className="text-center mb-4">
                <p className="text-2xl font-bold">{pack.price}€</p>
                {pack.savings > 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    Économisez {pack.savings}%
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {(pack.price / pack.credits).toFixed(2)}€ par crédit
                </p>
              </div>
              
              <Button
                className="w-full"
                variant={pack.badge ? 'default' : 'outline'}
                onClick={() => handleBuy(pack)}
                disabled={loading !== null}
              >
                {loading === pack.priceId ? 'Chargement...' : 'Acheter'}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">✨ Que pouvez-vous faire avec vos crédits ?</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Génération IA (DALL-E 3) : 5 crédits
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Rendu 3D haute résolution : 8 crédits
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Personnalisation IA : 4 crédits
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. CONFIGURATION STRIPE

### 5.1 Créer les Products & Prices

**Via Stripe Dashboard ou CLI:**

```bash
# Pack 100 crédits - 19€
stripe products create \
  --name="Pack 100 Crédits IA" \
  --description="100 crédits pour générations IA et rendus 3D"

stripe prices create \
  --product=prod_XXX \
  --unit-amount=1900 \
  --currency=eur \
  --nickname="pack_100"

# Pack 500 crédits - 79€ (Best Value)
stripe products create \
  --name="Pack 500 Crédits IA" \
  --description="500 crédits - Économisez 16%"

stripe prices create \
  --product=prod_YYY \
  --unit-amount=7900 \
  --currency=eur \
  --nickname="pack_500"

# Pack 1000 crédits - 139€
stripe products create \
  --name="Pack 1000 Crédits IA" \
  --description="1000 crédits - Économisez 26%"

stripe prices create \
  --product=prod_ZZZ \
  --unit-amount=13900 \
  --currency=eur \
  --nickname="pack_1000"
```

### 5.2 Variables d'Environnement

**Ajouter à `.env.local` (frontend) et Vercel:**

```bash
# Stripe Credit Packs
STRIPE_PRICE_CREDITS_100=price_xxx
STRIPE_PRICE_CREDITS_500=price_yyy
STRIPE_PRICE_CREDITS_1000=price_zzz
```

---

## 6. TESTS

### 6.1 Tests Backend (Jest)

```typescript
// credits.service.spec.ts
describe('CreditsService', () => {
  it('should deduct credits atomically', async () => {
    const result = await service.deductCredits('user123', '/api/ai/generate');
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(95); // Assuming 100 initial
  });

  it('should throw error on insufficient credits', async () => {
    await expect(
      service.deductCredits('user_with_2_credits', '/api/ai/generate'),
    ).rejects.toThrow('Insufficient credits');
  });

  it('should add credits after purchase', async () => {
    const result = await service.addCredits('user123', 100, 'pack_100', 'cs_xxx');
    expect(result.newBalance).toBe(200);
  });
});
```

### 6.2 Tests Frontend (Playwright)

```typescript
// credits-purchase.spec.ts
test('should purchase credits successfully', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Click on credits display
  await page.click('[data-testid="credits-display"]');
  
  // Open upsell modal
  await page.click('button:has-text("Recharger")');
  
  // Select pack 500
  await page.click('[data-pack="500"]');
  
  // Should redirect to Stripe
  await page.waitForURL(/checkout.stripe.com/);
  
  // (Stripe Test Mode)
  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.fill('[name="cardExpiry"]', '12/34');
  await page.fill('[name="cardCvc"]', '123');
  await page.click('button:has-text("Pay")');
  
  // Should redirect back with success
  await page.waitForURL(/dashboard\?credits_purchase=success/);
  
  // Verify balance updated
  const balance = await page.textContent('[data-testid="credits-balance"]');
  expect(parseInt(balance!)).toBeGreaterThan(500);
});
```

---

## 7. DÉPLOIEMENT

### Étape 1: Database Migration

```bash
# Générer migration Prisma
cd apps/backend
npx prisma migrate dev --name add_credits_system

# Appliquer en production
npx prisma migrate deploy
```

### Étape 2: Seed Packs

```typescript
// prisma/seed-credits.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.creditPack.createMany({
    data: [
      {
        name: 'Pack 100',
        credits: 100,
        priceCents: 1900,
        stripePriceId: process.env.STRIPE_PRICE_CREDITS_100,
        isActive: true,
      },
      {
        name: 'Pack 500',
        credits: 500,
        priceCents: 7900,
        stripePriceId: process.env.STRIPE_PRICE_CREDITS_500,
        isFeatured: true,
        badge: 'Best Value',
        savings: 16,
        isActive: true,
      },
      {
        name: 'Pack 1000',
        credits: 1000,
        priceCents: 13900,
        stripePriceId: process.env.STRIPE_PRICE_CREDITS_1000,
        savings: 26,
        isActive: true,
      },
    ],
  });
}

main();
```

### Étape 3: Déploiement Vercel

```bash
# Frontend
cd apps/frontend
vercel env pull .env.local
vercel --prod

# Backend
cd apps/backend
vercel env pull .env.production
vercel --prod
```

### Étape 4: Monitoring

**Metrics à suivre:**
- Taux de conversion (views → achats) → Objectif: 3-5%
- Panier moyen → Objectif: pack 500 (79€)
- Credits purchased / Credits used → Objectif: ratio >1.2
- Time to first purchase → Objectif: <7 jours

**Alerts:**
- Stripe webhook failures → PagerDuty
- Credits balance negative → Impossible mais logger
- Purchase success rate < 95% → Alert Slack

---

## 8. ROLLOUT PROGRESSIF

**Phase 1 (10% users):** 
- Activer pour 10% users aléatoires
- Monitorer bugs 48h

**Phase 2 (50% users):**
- Si metrics OK → 50%
- A/B test prix packs (±10%)

**Phase 3 (100% users):**
- Full rollout
- Marketing push (email blast)

---

## 9. OPTIMISATIONS FUTURES

### V2 Features:
- [ ] Crédits bonus pour gros achats (achat 1000 → +100 bonus)
- [ ] Programme de parrainage (invite ami → 50 crédits gratuits)
- [ ] Crédits expirants (6 mois) pour inciter usage
- [ ] Packs saisonniers (Black Friday: 1000 crédits à 99€)
- [ ] Credits auto-refill (recharge auto quand <10)

---

**Prêt pour implémentation** ✅






# SPÉCIFICATIONS TECHNIQUES — Système de Crédits IA
**Projet:** Luneo.app  
**Date:** 20 décembre 2025  
**Priorité:** 🔴 CRITIQUE (ROI: +50-100€/client/mois)

---

## 1. OBJECTIF

Implémenter un système de **crédits IA achetables séparément** pour augmenter le panier moyen et la flexibilité tarifaire.

**Problème actuel:**
- Users limités à X générations/mois selon plan
- Pas de flexibilité pour acheter plus sans upgrade complet
- Perte de revenue quand user a besoin de 10 crédits ponctuellement

**Solution:**
- Vendre des packs de crédits (100/500/1000)
- Déduction automatique à chaque appel IA
- Upsell intelligent quand crédits < 20%

**ROI Projeté:**
```
30% users achètent pack 100 (19€) = +5.7€/user/mois
10% users achètent pack 500 (79€) = +7.9€/user/mois
5% users achètent pack 1000 (139€) = +6.95€/user/mois
--------------------------------
Total: +20.55€/user/mois → +10k€/mois (500 users)
```

---

## 2. ARCHITECTURE

### 2.1 Schéma Base de Données

**Nouvelles tables (Prisma):**

```prisma
model CreditPack {
  id            String   @id @default(cuid())
  name          String   // "Pack 100", "Pack 500", "Pack 1000"
  credits       Int      // Nombre de crédits
  priceCents    Int      // Prix en centimes (1900 = 19€)
  stripePriceId String?  // ID Stripe Price
  isActive      Boolean  @default(true)
  isFeatured    Boolean  @default(false)
  
  // Marketing
  savings       Int?     // % économie vs pack de base
  badge         String?  // "Best Value", "Most Popular"
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  transactions  CreditTransaction[]
  
  @@index([isActive])
  @@index([isFeatured])
}

model CreditTransaction {
  id          String   @id @default(cuid())
  userId      String
  packId      String?
  
  // Montants
  amount      Int      // Positif = achat, Négatif = dépense
  balanceBefore Int    // Solde avant
  balanceAfter  Int    // Solde après
  
  // Type & Metadata
  type        String   // 'purchase', 'usage', 'refund', 'bonus', 'expiration'
  source      String?  // '/api/ai/generate', 'admin', 'stripe_webhook'
  metadata    Json?    // { endpoint, cost, model, duration, etc. }
  
  // Stripe (pour achats)
  stripeSessionId String?
  stripePaymentId String?
  
  createdAt   DateTime @default(now())
  
  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  pack CreditPack? @relation(fields: [packId], references: [id], onDelete: SetNull)
  
  @@index([userId])
  @@index([type])
  @@index([createdAt])
  @@index([stripeSessionId])
}
```

**Modifications table User:**

```prisma
model User {
  // ... champs existants ...
  
  // Crédits IA
  aiCredits           Int       @default(0)       // Solde actuel
  aiCreditsPurchased  Int       @default(0)       // Total acheté (lifetime)
  aiCreditsUsed       Int       @default(0)       // Total dépensé (lifetime)
  lastCreditPurchase  DateTime?                   // Dernière date d'achat
  
  creditTransactions  CreditTransaction[]
}
```

### 2.2 Coûts par Endpoint

**Mapping crédits → endpoints:**

```typescript
// lib/credits/costs.ts
export const ENDPOINT_COSTS: Record<string, number> = {
  // Génération IA
  '/api/ai/generate': 5,                    // DALL-E 3 standard
  '/api/ai/generate/hd': 10,               // DALL-E 3 HD
  '/api/ai/background-removal': 2,         // Remove.bg ou équivalent
  '/api/ai/extract-colors': 1,             // Analyse simple
  '/api/ai/variants': 3,                   // 3 variantes
  
  // Rendus
  '/api/3d/render-highres': 8,             // Rendu 3D haute résolution
  '/api/ar/convert-2d-to-3d': 15,          // Conversion 2D→3D
  '/api/ar/convert-usdz': 5,               // Export AR
  
  // Customization
  '/api/customization/generate': 4,        // Personnalisation IA
};

// Coûts réels estimés (pour analytics)
export const REAL_COSTS_CENTS: Record<string, number> = {
  '/api/ai/generate': 4,        // ~$0.04 DALL-E 3
  '/api/ai/generate/hd': 8,     // ~$0.08 DALL-E 3 HD
  '/api/ai/background-removal': 1,
  // ... etc
};

// Marge = Prix vente - Coût réel
// Exemple: 5 crédits × 0.19€ = 0.95€ vente - 0.04€ coût = 0.91€ marge (2275%)
```

---

## 3. IMPLÉMENTATION BACKEND

### 3.1 Service de Gestion des Crédits

**Fichier:** `apps/backend/src/libs/credits/credits.service.ts`

```typescript
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ENDPOINT_COSTS, REAL_COSTS_CENTS } from './costs';

@Injectable()
export class CreditsService {
  private readonly logger = new Logger(CreditsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
  ) {}

  /**
   * Vérifier si l'utilisateur a assez de crédits
   */
  async checkCredits(
    userId: string,
    endpoint: string,
    amount?: number,
  ): Promise<{
    sufficient: boolean;
    balance: number;
    required: number;
    missing: number;
  }> {
    const required = amount || ENDPOINT_COSTS[endpoint] || 1;
    
    // Cache Redis (5 secondes) pour éviter queries répétées
    const cacheKey = `credits:${userId}`;
    let balance = await this.cache.get<number>(cacheKey);
    
    if (balance === null) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { aiCredits: true },
      });
      balance = user?.aiCredits || 0;
      await this.cache.set(cacheKey, balance, 5);
    }

    const sufficient = balance >= required;
    const missing = sufficient ? 0 : required - balance;

    return { sufficient, balance, required, missing };
  }

  /**
   * Déduire des crédits (transaction atomique)
   */
  async deductCredits(
    userId: string,
    endpoint: string,
    metadata?: Record<string, any>,
  ): Promise<{
    success: boolean;
    newBalance: number;
    transaction: any;
  }> {
    const cost = ENDPOINT_COSTS[endpoint] || 1;

    try {
      // Transaction Prisma pour garantir atomicité
      const result = await this.prisma.$transaction(async (tx) => {
        // Lock user row
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { aiCredits: true, aiCreditsUsed: true },
        });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        if (user.aiCredits < cost) {
          throw new BadRequestException(
            `Insufficient credits. Required: ${cost}, Available: ${user.aiCredits}`,
          );
        }

        // Déduire crédits
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            aiCredits: { decrement: cost },
            aiCreditsUsed: { increment: cost },
          },
          select: { aiCredits: true },
        });

        // Enregistrer transaction
        const transaction = await tx.creditTransaction.create({
          data: {
            userId,
            amount: -cost,
            balanceBefore: user.aiCredits,
            balanceAfter: updatedUser.aiCredits,
            type: 'usage',
            source: endpoint,
            metadata: {
              ...metadata,
              realCostCents: REAL_COSTS_CENTS[endpoint] || 0,
              timestamp: new Date().toISOString(),
            },
          },
        });

        return { newBalance: updatedUser.aiCredits, transaction };
      });

      // Invalider cache
      await this.cache.delete(`credits:${userId}`);

      this.logger.log(
        `Credits deducted: ${cost} for ${userId} on ${endpoint}. New balance: ${result.newBalance}`,
      );

      return { success: true, ...result };
    } catch (error) {
      this.logger.error(`Failed to deduct credits: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Ajouter des crédits (achat)
   */
  async addCredits(
    userId: string,
    amount: number,
    packId?: string,
    stripeSessionId?: string,
  ): Promise<{ newBalance: number; transaction: any }> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { aiCredits: true, aiCreditsPurchased: true },
        });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            aiCredits: { increment: amount },
            aiCreditsPurchased: { increment: amount },
            lastCreditPurchase: new Date(),
          },
          select: { aiCredits: true },
        });

        const transaction = await tx.creditTransaction.create({
          data: {
            userId,
            packId,
            amount,
            balanceBefore: user.aiCredits,
            balanceAfter: updatedUser.aiCredits,
            type: 'purchase',
            source: 'stripe',
            stripeSessionId,
            metadata: {
              timestamp: new Date().toISOString(),
            },
          },
        });

        return { newBalance: updatedUser.aiCredits, transaction };
      });

      await this.cache.delete(`credits:${userId}`);

      this.logger.log(`Credits added: ${amount} for ${userId}. New balance: ${result.newBalance}`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to add credits: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Récupérer l'historique des transactions
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 50,
  ): Promise<any[]> {
    return this.prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        pack: {
          select: { name: true, credits: true },
        },
      },
    });
  }
}
```

### 3.2 Middleware de Vérification

**Fichier:** `apps/backend/src/common/middleware/credits.middleware.ts`

```typescript
import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CreditsService } from '@/libs/credits/credits.service';

@Injectable()
export class CreditsMiddleware implements NestMiddleware {
  constructor(private readonly creditsService: CreditsService) {}

  async use(req: Request & { user?: any }, res: Response, next: NextFunction) {
    const user = req.user;
    const endpoint = req.path;

    if (!user?.id) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    // Vérifier crédits
    const check = await this.creditsService.checkCredits(user.id, endpoint);

    if (!check.sufficient) {
      throw new HttpException(
        {
          message: 'Crédits insuffisants',
          code: 'INSUFFICIENT_CREDITS',
          balance: check.balance,
          required: check.required,
          missing: check.missing,
          upsell: {
            packs: [
              { credits: 100, price: 19, priceId: 'price_xxx' },
              { credits: 500, price: 79, priceId: 'price_yyy', badge: 'Best Value' },
              { credits: 1000, price: 139, priceId: 'price_zzz' },
            ],
          },
        },
        HttpStatus.PAYMENT_REQUIRED, // 402
      );
    }

    // Attacher info au request pour tracking
    req['creditsRequired'] = check.required;
    req['creditsBalance'] = check.balance;

    next();
  }
}
```

---

## 4. IMPLÉMENTATION FRONTEND

### 4.1 API Route — Acheter Crédits

**Fichier:** `apps/frontend/src/app/api/credits/buy/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import Stripe from 'stripe';

export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    // Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { packSize } = await request.json();

    // Validation
    const validPacks = [100, 500, 1000];
    if (!validPacks.includes(packSize)) {
      throw { status: 400, message: 'Pack invalide', code: 'INVALID_PACK' };
    }

    // Stripe Price IDs
    const packPrices: Record<number, string> = {
      100: process.env.STRIPE_PRICE_CREDITS_100!,
      500: process.env.STRIPE_PRICE_CREDITS_500!,
      1000: process.env.STRIPE_PRICE_CREDITS_1000!,
    };

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: packPrices[packSize],
          quantity: 1,
        },
      ],
      mode: 'payment', // One-time payment (pas subscription)
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits_purchase=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?credits_purchase=cancel`,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        packSize: packSize.toString(),
        credits: packSize.toString(),
      },
    });

    logger.info('Credit purchase session created', {
      userId: user.id,
      packSize,
      sessionId: session.id,
    });

    return {
      url: session.url,
      sessionId: session.id,
    };
  }, '/api/credits/buy', 'POST');
}
```

### 4.2 Webhook Stripe — Confirmer Achat

**Fichier:** `apps/frontend/src/app/api/webhooks/stripe/route.ts` (modifier existant)

```typescript
// Ajouter ce handler dans le webhook existant

if (event.type === 'checkout.session.completed') {
  const session = event.data.object as Stripe.Checkout.Session;
  
  // Vérifier si c'est un achat de crédits (mode=payment vs subscription)
  if (session.mode === 'payment' && session.metadata?.credits) {
    const userId = session.client_reference_id || session.metadata.userId;
    const credits = parseInt(session.metadata.credits, 10);
    const packSize = parseInt(session.metadata.packSize, 10);

    // Ajouter crédits via backend API
    const response = await fetch(`${process.env.BACKEND_URL}/credits/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        amount: credits,
        packId: `pack_${packSize}`,
        stripeSessionId: session.id,
        stripePaymentId: session.payment_intent,
      }),
    });

    if (!response.ok) {
      logger.error('Failed to add credits after payment', {
        userId,
        sessionId: session.id,
      });
      // TODO: Alert admin + retry queue
    } else {
      logger.info('Credits added successfully', { userId, credits });
      
      // Envoyer email confirmation
      await sendEmail({
        to: session.customer_email!,
        template: 'credit_purchase_confirmation',
        data: { credits, amount: session.amount_total! / 100 },
      });
    }
  }
}
```

### 4.3 Composant UI — Affichage Crédits

**Fichier:** `apps/frontend/src/components/credits/CreditsDisplay.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CreditsDisplayProps {
  userId: string;
  inline?: boolean;
}

export function CreditsDisplay({ userId, inline = false }: CreditsDisplayProps) {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch('/api/credits/balance');
        const data = await res.json();
        setCredits(data.balance);
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
    
    // Refresh every 30s
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || credits === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Zap className="w-4 h-4 animate-pulse" />
        <span>...</span>
      </div>
    );
  }

  const isLow = credits < 20;
  const isCritical = credits < 5;

  if (inline) {
    return (
      <div className="flex items-center gap-2">
        <Zap className={`w-4 h-4 ${isCritical ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-yellow-500'}`} />
        <span className="text-sm font-medium">{credits} crédits</span>
        {isLow && (
          <Button size="sm" variant="outline" onClick={() => router.push('/dashboard/credits')}>
            Acheter
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${isCritical ? 'bg-red-50 border-red-200' : isLow ? 'bg-orange-50 border-orange-200' : 'bg-card'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isCritical ? 'bg-red-100' : isLow ? 'bg-orange-100' : 'bg-yellow-100'}`}>
            <Zap className={`w-5 h-5 ${isCritical ? 'text-red-600' : isLow ? 'text-orange-600' : 'text-yellow-600'}`} />
          </div>
          <div>
            <p className="text-2xl font-bold">{credits}</p>
            <p className="text-sm text-muted-foreground">Crédits IA restants</p>
          </div>
        </div>
        
        {isLow && (
          <Button onClick={() => router.push('/dashboard/credits')}>
            <Zap className="w-4 h-4 mr-2" />
            Recharger
          </Button>
        )}
      </div>
      
      {isCritical && (
        <div className="mt-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5" />
          <p>Crédits presque épuisés! Rechargez maintenant pour continuer à utiliser l'IA.</p>
        </div>
      )}
    </div>
  );
}
```

### 4.4 Modal Upsell

**Fichier:** `apps/frontend/src/components/credits/UpsellModal.tsx`

```tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Check } from 'lucide-react';
import { useState } from 'react';

interface Pack {
  credits: number;
  price: number;
  priceId: string;
  badge?: string;
  savings?: number;
}

interface UpsellModalProps {
  open: boolean;
  onClose: () => void;
  remainingCredits: number;
}

const PACKS: Pack[] = [
  { credits: 100, price: 19, priceId: 'price_xxx', savings: 0 },
  { credits: 500, price: 79, priceId: 'price_yyy', badge: 'Best Value', savings: 16 },
  { credits: 1000, price: 139, priceId: 'price_zzz', savings: 26 },
];

export function UpsellModal({ open, onClose, remainingCredits }: UpsellModalProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (pack: Pack) => {
    setLoading(pack.priceId);
    try {
      const res = await fetch('/api/credits/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packSize: pack.credits }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            Rechargez vos crédits IA
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Il vous reste {remainingCredits} crédits. Choisissez un pack pour continuer à créer.
          </p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {PACKS.map((pack) => (
            <div
              key={pack.priceId}
              className={`relative border rounded-lg p-6 hover:shadow-lg transition-shadow ${
                pack.badge ? 'border-primary shadow-md' : ''
              }`}
            >
              {pack.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                  {pack.badge}
                </div>
              )}
              
              <div className="text-center mb-4">
                <p className="text-3xl font-bold">{pack.credits}</p>
                <p className="text-sm text-muted-foreground">crédits IA</p>
              </div>
              
              <div className="text-center mb-4">
                <p className="text-2xl font-bold">{pack.price}€</p>
                {pack.savings > 0 && (
                  <p className="text-xs text-green-600 font-medium">
                    Économisez {pack.savings}%
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {(pack.price / pack.credits).toFixed(2)}€ par crédit
                </p>
              </div>
              
              <Button
                className="w-full"
                variant={pack.badge ? 'default' : 'outline'}
                onClick={() => handleBuy(pack)}
                disabled={loading !== null}
              >
                {loading === pack.priceId ? 'Chargement...' : 'Acheter'}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">✨ Que pouvez-vous faire avec vos crédits ?</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Génération IA (DALL-E 3) : 5 crédits
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Rendu 3D haute résolution : 8 crédits
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              Personnalisation IA : 4 crédits
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 5. CONFIGURATION STRIPE

### 5.1 Créer les Products & Prices

**Via Stripe Dashboard ou CLI:**

```bash
# Pack 100 crédits - 19€
stripe products create \
  --name="Pack 100 Crédits IA" \
  --description="100 crédits pour générations IA et rendus 3D"

stripe prices create \
  --product=prod_XXX \
  --unit-amount=1900 \
  --currency=eur \
  --nickname="pack_100"

# Pack 500 crédits - 79€ (Best Value)
stripe products create \
  --name="Pack 500 Crédits IA" \
  --description="500 crédits - Économisez 16%"

stripe prices create \
  --product=prod_YYY \
  --unit-amount=7900 \
  --currency=eur \
  --nickname="pack_500"

# Pack 1000 crédits - 139€
stripe products create \
  --name="Pack 1000 Crédits IA" \
  --description="1000 crédits - Économisez 26%"

stripe prices create \
  --product=prod_ZZZ \
  --unit-amount=13900 \
  --currency=eur \
  --nickname="pack_1000"
```

### 5.2 Variables d'Environnement

**Ajouter à `.env.local` (frontend) et Vercel:**

```bash
# Stripe Credit Packs
STRIPE_PRICE_CREDITS_100=price_xxx
STRIPE_PRICE_CREDITS_500=price_yyy
STRIPE_PRICE_CREDITS_1000=price_zzz
```

---

## 6. TESTS

### 6.1 Tests Backend (Jest)

```typescript
// credits.service.spec.ts
describe('CreditsService', () => {
  it('should deduct credits atomically', async () => {
    const result = await service.deductCredits('user123', '/api/ai/generate');
    expect(result.success).toBe(true);
    expect(result.newBalance).toBe(95); // Assuming 100 initial
  });

  it('should throw error on insufficient credits', async () => {
    await expect(
      service.deductCredits('user_with_2_credits', '/api/ai/generate'),
    ).rejects.toThrow('Insufficient credits');
  });

  it('should add credits after purchase', async () => {
    const result = await service.addCredits('user123', 100, 'pack_100', 'cs_xxx');
    expect(result.newBalance).toBe(200);
  });
});
```

### 6.2 Tests Frontend (Playwright)

```typescript
// credits-purchase.spec.ts
test('should purchase credits successfully', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Click on credits display
  await page.click('[data-testid="credits-display"]');
  
  // Open upsell modal
  await page.click('button:has-text("Recharger")');
  
  // Select pack 500
  await page.click('[data-pack="500"]');
  
  // Should redirect to Stripe
  await page.waitForURL(/checkout.stripe.com/);
  
  // (Stripe Test Mode)
  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.fill('[name="cardExpiry"]', '12/34');
  await page.fill('[name="cardCvc"]', '123');
  await page.click('button:has-text("Pay")');
  
  // Should redirect back with success
  await page.waitForURL(/dashboard\?credits_purchase=success/);
  
  // Verify balance updated
  const balance = await page.textContent('[data-testid="credits-balance"]');
  expect(parseInt(balance!)).toBeGreaterThan(500);
});
```

---

## 7. DÉPLOIEMENT

### Étape 1: Database Migration

```bash
# Générer migration Prisma
cd apps/backend
npx prisma migrate dev --name add_credits_system

# Appliquer en production
npx prisma migrate deploy
```

### Étape 2: Seed Packs

```typescript
// prisma/seed-credits.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.creditPack.createMany({
    data: [
      {
        name: 'Pack 100',
        credits: 100,
        priceCents: 1900,
        stripePriceId: process.env.STRIPE_PRICE_CREDITS_100,
        isActive: true,
      },
      {
        name: 'Pack 500',
        credits: 500,
        priceCents: 7900,
        stripePriceId: process.env.STRIPE_PRICE_CREDITS_500,
        isFeatured: true,
        badge: 'Best Value',
        savings: 16,
        isActive: true,
      },
      {
        name: 'Pack 1000',
        credits: 1000,
        priceCents: 13900,
        stripePriceId: process.env.STRIPE_PRICE_CREDITS_1000,
        savings: 26,
        isActive: true,
      },
    ],
  });
}

main();
```

### Étape 3: Déploiement Vercel

```bash
# Frontend
cd apps/frontend
vercel env pull .env.local
vercel --prod

# Backend
cd apps/backend
vercel env pull .env.production
vercel --prod
```

### Étape 4: Monitoring

**Metrics à suivre:**
- Taux de conversion (views → achats) → Objectif: 3-5%
- Panier moyen → Objectif: pack 500 (79€)
- Credits purchased / Credits used → Objectif: ratio >1.2
- Time to first purchase → Objectif: <7 jours

**Alerts:**
- Stripe webhook failures → PagerDuty
- Credits balance negative → Impossible mais logger
- Purchase success rate < 95% → Alert Slack

---

## 8. ROLLOUT PROGRESSIF

**Phase 1 (10% users):** 
- Activer pour 10% users aléatoires
- Monitorer bugs 48h

**Phase 2 (50% users):**
- Si metrics OK → 50%
- A/B test prix packs (±10%)

**Phase 3 (100% users):**
- Full rollout
- Marketing push (email blast)

---

## 9. OPTIMISATIONS FUTURES

### V2 Features:
- [ ] Crédits bonus pour gros achats (achat 1000 → +100 bonus)
- [ ] Programme de parrainage (invite ami → 50 crédits gratuits)
- [ ] Crédits expirants (6 mois) pour inciter usage
- [ ] Packs saisonniers (Black Friday: 1000 crédits à 99€)
- [ ] Credits auto-refill (recharge auto quand <10)

---

**Prêt pour implémentation** ✅



















