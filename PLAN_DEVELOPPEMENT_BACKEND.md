# 🚀 PLAN DE DÉVELOPPEMENT BACKEND - RENDRE LES PAGES OPÉRATIONNELLES

**Date** : 5 janvier 2026  
**Objectif** : Développer tous les endpoints backend manquants pour rendre les 29 pages dashboard 100% fonctionnelles  
**Durée estimée** : 37 jours (7-8 semaines)

---

## 📋 PHASE 1 : CRITIQUE (Semaine 1-2) - 12 jours

### 1.1 Analytics Advanced (5 jours)

#### Backend NestJS
**Fichiers à créer** :
```
apps/backend/src/modules/analytics/services/analytics-advanced.service.ts
apps/backend/src/modules/analytics/controllers/analytics-advanced.controller.ts
apps/backend/src/modules/analytics/dto/funnel-analysis.dto.ts
apps/backend/src/modules/analytics/dto/cohort-analysis.dto.ts
apps/backend/src/modules/analytics/dto/segment.dto.ts
apps/backend/src/modules/analytics/dto/geographic-analysis.dto.ts
```

**Fonctionnalités** :
- Funnel analysis (calcul conversion rates par étape)
- Cohort analysis (retention par cohorte)
- Segmentation (création segments utilisateurs)
- Geographic analysis (données par pays/région)
- Behavioral events (tracking événements)

**Endpoints à créer** :
- `GET /api/analytics/funnel?timeRange=30d&steps=view,add-to-cart,checkout,payment`
- `GET /api/analytics/cohorts?timeRange=90d&metric=retention`
- `GET /api/analytics/segments`
- `POST /api/analytics/segments` (créer segment)
- `GET /api/analytics/geographic?timeRange=30d`
- `GET /api/analytics/events?timeRange=30d&eventType=click`

#### Frontend API Routes
**Fichiers à créer** :
```
apps/frontend/src/app/api/analytics/funnel/route.ts
apps/frontend/src/app/api/analytics/cohorts/route.ts
apps/frontend/src/app/api/analytics/segments/route.ts
apps/frontend/src/app/api/analytics/geographic/route.ts
apps/frontend/src/app/api/analytics/events/route.ts
```

**Code exemple** (`apps/frontend/src/app/api/analytics/funnel/route.ts`) :
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié' };
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const steps = searchParams.get('steps')?.split(',') || ['view', 'add-to-cart', 'checkout', 'payment'];

    // Appel backend NestJS
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${backendUrl}/api/analytics/funnel?timeRange=${timeRange}&steps=${steps.join(',')}`, {
      headers: {
        'Authorization': `Bearer ${await getAccessToken(supabase)}`,
      },
    });

    if (!response.ok) {
      throw { status: response.status, message: 'Erreur backend' };
    }

    const data = await response.json();
    return data;
  }, '/api/analytics/funnel', 'GET');
}
```

---

### 1.2 AR Studio - Upload & Preview (4 jours)

#### Backend NestJS
**Fichiers à créer** :
```
apps/backend/src/modules/ar/ar-studio.module.ts
apps/backend/src/modules/ar/ar-studio.service.ts
apps/backend/src/modules/ar/ar-studio.controller.ts
apps/backend/src/modules/ar/dto/upload-model.dto.ts
apps/backend/src/modules/ar/dto/qr-code.dto.ts
```

**Fonctionnalités** :
- Upload modèles USDZ/GLB (validation, storage S3/Cloudinary)
- Preview AR (génération URL WebAR)
- QR Code generation (pour partage AR)
- Analytics AR (tracking views, try-ons, conversions)

**Endpoints à créer** :
- `POST /api/ar-studio/models/upload` (multipart/form-data)
- `GET /api/ar-studio/models/:id/preview`
- `POST /api/ar-studio/models/:id/qr-code`
- `GET /api/ar-studio/models/:id/analytics`

#### Frontend API Routes
**Fichiers à créer** :
```
apps/frontend/src/app/api/ar-studio/upload/route.ts
apps/frontend/src/app/api/ar-studio/preview/route.ts
apps/frontend/src/app/api/ar-studio/qr-code/route.ts
```

**Migration Prisma** :
```prisma
// Ajouter à schema.prisma
model ARModel {
  id              String   @id @default(cuid())
  name            String
  type            String
  glbUrl          String?
  usdzUrl         String?
  thumbnailUrl    String?
  status          String   @default("active")
  brandId         String
  productId       String?
  viewsCount      Int      @default(0)
  tryOnsCount     Int      @default(0)
  conversionsCount Int     @default(0)
  metadata        Json?
  tags            String[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([brandId])
  @@index([status])
}
```

---

### 1.3 Seller Dashboard - Endpoints Manquants (3 jours)

#### Frontend API Routes
**Fichiers à créer** :
```
apps/frontend/src/app/api/marketplace/seller/products/route.ts
apps/frontend/src/app/api/marketplace/seller/orders/route.ts
apps/frontend/src/app/api/marketplace/seller/reviews/route.ts
apps/frontend/src/app/api/marketplace/seller/payouts/route.ts
```

**Code exemple** (`apps/frontend/src/app/api/marketplace/seller/products/route.ts`) :
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié' };
    }

    // Vérifier que l'utilisateur est un seller
    const { data: seller } = await supabase
      .from('sellers')
      .select('id, stripe_account_id, status')
      .eq('user_id', user.id)
      .single();

    if (!seller || seller.status !== 'active') {
      throw { status: 403, message: 'Vous devez être un seller actif' };
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);

    // Récupérer les produits du seller
    const { data: products, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw { status: 500, message: 'Erreur lors de la récupération des produits' };
    }

    return {
      products: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1,
      },
    };
  }, '/api/marketplace/seller/products', 'GET');
}

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié' };
    }

    // Vérifier seller status
    const { data: seller } = await supabase
      .from('sellers')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (!seller || seller.status !== 'active') {
      throw { status: 403, message: 'Vous devez être un seller actif' };
    }

    const body = await request.json();
    
    // Créer le produit
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...body,
        seller_id: seller.id,
        brand_id: seller.brand_id,
      })
      .select()
      .single();

    if (error) {
      throw { status: 500, message: 'Erreur lors de la création du produit' };
    }

    return product;
  }, '/api/marketplace/seller/products', 'POST');
}
```

---

## 📋 PHASE 2 : HAUTE PRIORITÉ (Semaine 3-4) - 18 jours

### 2.1 AB Testing Module (5 jours)

#### Backend NestJS
**Fichiers à créer** :
```
apps/backend/src/modules/ab-testing/ab-testing.module.ts
apps/backend/src/modules/ab-testing/ab-testing.service.ts
apps/backend/src/modules/ab-testing/ab-testing.controller.ts
apps/backend/src/modules/ab-testing/dto/create-experiment.dto.ts
apps/backend/src/modules/ab-testing/dto/update-experiment.dto.ts
apps/backend/src/modules/ab-testing/interfaces/experiment.interface.ts
```

**Migration Prisma** :
```prisma
model Experiment {
  id            String   @id @default(cuid())
  name          String
  description   String?
  status        String   // draft, running, paused, completed
  metric        String   // conversion, revenue, engagement
  startDate     DateTime
  endDate       DateTime?
  brandId       String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  variants      Variant[]
  results       ExperimentResult[]
  
  @@index([brandId])
  @@index([status])
}

model Variant {
  id            String   @id @default(cuid())
  experimentId  String
  name          String
  traffic       Int      // percentage
  isControl     Boolean  @default(false)
  isWinner      Boolean  @default(false)
  conversions   Int      @default(0)
  visitors      Int      @default(0)
  revenue       Float    @default(0)
  
  experiment    Experiment @relation(fields: [experimentId], references: [id], onDelete: Cascade)
  
  @@index([experimentId])
}

model ExperimentResult {
  id            String   @id @default(cuid())
  experimentId  String
  date          DateTime
  variantId     String
  conversions   Int
  visitors      Int
  revenue       Float
  
  experiment    Experiment @relation(fields: [experimentId], references: [id], onDelete: Cascade)
  
  @@index([experimentId, date])
}
```

#### Frontend tRPC Router
**Fichier à compléter** :
```
apps/frontend/src/lib/trpc/routers/ab-testing.ts
```

**Code à ajouter** :
```typescript
export const abTestingRouter = router({
  listExperiments: protectedProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      status: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const experiments = await db.experiment.findMany({
        where: {
          brandId: ctx.user.brandId,
          ...(input.status && { status: input.status }),
        },
        include: {
          variants: true,
          results: {
            take: 30,
            orderBy: { date: 'desc' },
          },
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        orderBy: { createdAt: 'desc' },
      });

      return { experiments };
    }),

  createExperiment: protectedProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      metric: z.string(),
      variants: z.array(z.object({
        name: z.string(),
        traffic: z.number(),
        isControl: z.boolean(),
      })),
      startDate: z.date(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const experiment = await db.experiment.create({
        data: {
          ...input,
          brandId: ctx.user.brandId,
          status: 'draft',
          variants: {
            create: input.variants,
          },
        },
        include: { variants: true },
      });

      return experiment;
    }),

  updateExperiment: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional(),
      variants: z.array(z.object({
        id: z.string().optional(),
        name: z.string(),
        traffic: z.number(),
        isControl: z.boolean(),
      })).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      // Vérifier permissions
      const experiment = await db.experiment.findUnique({
        where: { id },
      });

      if (!experiment || experiment.brandId !== ctx.user.brandId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous n\'avez pas la permission de modifier cette expérience',
        });
      }

      // Mettre à jour
      const updated = await db.experiment.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          status: data.status,
        },
        include: { variants: true },
      });

      // Mettre à jour variants si fournis
      if (data.variants) {
        // Supprimer anciens variants
        await db.variant.deleteMany({
          where: { experimentId: id },
        });

        // Créer nouveaux variants
        await db.variant.createMany({
          data: data.variants.map((v) => ({
            ...v,
            experimentId: id,
          })),
        });
      }

      return updated;
    }),

  toggleExperiment: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['draft', 'running', 'paused', 'completed']),
    }))
    .mutation(async ({ input, ctx }) => {
      const experiment = await db.experiment.findUnique({
        where: { id: input.id },
      });

      if (!experiment || experiment.brandId !== ctx.user.brandId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Vous n\'avez pas la permission',
        });
      }

      const updated = await db.experiment.update({
        where: { id: input.id },
        data: { status: input.status },
        include: { variants: true },
      });

      return updated;
    }),
});
```

---

### 2.2 AI Studio - Templates & Animations (4 jours)

#### Backend NestJS
**Fichiers à créer** :
```
apps/backend/src/modules/ai/services/ai-templates.service.ts
apps/backend/src/modules/ai/services/ai-animations.service.ts
apps/backend/src/modules/ai/dto/create-template.dto.ts
apps/backend/src/modules/ai/dto/generate-animation.dto.ts
```

**Migration Prisma** :
```prisma
model AITemplate {
  id            String   @id @default(cuid())
  name          String
  category      String   // logo, product, animation, design
  subcategory   String?
  prompt        String
  style         String?
  thumbnailUrl  String
  previewUrl    String?
  price         Float    @default(0) // 0 = free
  isPremium     Boolean  @default(false)
  downloads     Int      @default(0)
  views         Int      @default(0)
  rating        Float    @default(0)
  tags          String[]
  metadata      Json?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([category])
  @@index([isPremium])
}
```

#### Frontend API Routes
**Fichiers à créer** :
```
apps/frontend/src/app/api/ai-studio/templates/route.ts
apps/frontend/src/app/api/ai-studio/animations/route.ts
```

---

### 2.3 AR Studio - Integrations & Collaboration (4 jours)

#### Backend NestJS
**Fichiers à créer** :
```
apps/backend/src/modules/ar/services/ar-integrations.service.ts
apps/backend/src/modules/ar/services/ar-collaboration.service.ts
apps/backend/src/modules/ar/dto/integration-config.dto.ts
```

#### Frontend API Routes
**Fichiers à créer** :
```
apps/frontend/src/app/api/ar-studio/integrations/route.ts
apps/frontend/src/app/api/ar-studio/collaboration/route.ts
```

---

### 2.4 Editor Module (5 jours)

#### Backend NestJS
**Fichiers à créer** :
```
apps/backend/src/modules/editor/editor.module.ts
apps/backend/src/modules/editor/editor.service.ts
apps/backend/src/modules/editor/editor.controller.ts
apps/backend/src/modules/editor/dto/save-project.dto.ts
apps/backend/src/modules/editor/dto/export-project.dto.ts
```

**Migration Prisma** :
```prisma
model EditorProject {
  id            String   @id @default(cuid())
  name          String
  brandId       String
  userId        String
  canvasData    Json     // Canvas state
  layers        Json     // Layers data
  history       Json?    // Undo/redo history
  thumbnailUrl  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([brandId])
  @@index([userId])
}
```

#### Frontend API Routes
**Fichiers à créer** :
```
apps/frontend/src/app/api/editor/save/route.ts
apps/frontend/src/app/api/editor/export/route.ts
apps/frontend/src/app/api/editor/projects/route.ts
```

---

## 📋 PHASE 3 : MOYENNE PRIORITÉ (Semaine 5-6) - 7 jours

### 3.1 Library - Favorites & Collections (2 jours)

**Fichiers à modifier** :
```
apps/frontend/src/app/api/library/favorites/route.ts (compléter)
apps/backend/src/modules/library/library.service.ts (ajouter méthodes favorites)
```

**Migration Prisma** :
```prisma
model LibraryFavorite {
  id            String   @id @default(cuid())
  userId        String
  templateId    String
  createdAt     DateTime @default(now())
  
  @@unique([userId, templateId])
  @@index([userId])
}

model LibraryCollection {
  id            String   @id @default(cuid())
  name          String
  userId        String
  isPublic      Boolean  @default(false)
  templates     Json     // Array of template IDs
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([userId])
}
```

---

### 3.2 Configurator 3D - Export & Materials (3 jours)

**Fichiers à créer** :
```
apps/backend/src/modules/configurator-3d/configurator-3d.service.ts
apps/frontend/src/app/api/3d-configurations/export/route.ts
```

---

### 3.3 Library Import - Validation & Processing (2 jours)

**Fichiers à modifier** :
```
apps/frontend/src/app/api/library/upload/route.ts (ajouter validation)
apps/backend/src/modules/library/services/file-processor.service.ts
```

---

## 🧪 TESTS & VALIDATION

Pour chaque module développé :

1. **Tests unitaires** (Jest)
   - Service methods
   - DTO validation
   - Business logic

2. **Tests E2E** (Playwright)
   - User flows complets
   - API endpoints
   - Frontend integration

3. **Validation manuelle**
   - Tester chaque endpoint
   - Vérifier données réelles en base
   - Tester erreurs et edge cases

---

## 📝 CHECKLIST PAR MODULE

Pour chaque module, vérifier :

- [ ] Backend NestJS créé (module, service, controller)
- [ ] DTOs avec validation Zod
- [ ] Migration Prisma si nécessaire
- [ ] Frontend API routes créées
- [ ] tRPC router mis à jour (si applicable)
- [ ] Tests unitaires écrits
- [ ] Tests E2E écrits
- [ ] Documentation Swagger
- [ ] Frontend connecté et fonctionnel
- [ ] Données réelles (pas de mock)
- [ ] Gestion d'erreurs complète
- [ ] Logging professionnel

---

## 🎯 RÉSULTAT ATTENDU

À la fin des 37 jours de développement :

- ✅ **100% des pages dashboard** fonctionnelles avec données réelles
- ✅ **0 données mockées** dans les pages
- ✅ **Tous les endpoints API** implémentés et testés
- ✅ **Intégrations tierces** complètes (Stripe, Cloudinary, etc.)
- ✅ **Base de données** complète avec toutes les tables nécessaires
- ✅ **Tests** complets (unitaires + E2E)
- ✅ **Documentation** API complète

---

**Document créé le** : 5 janvier 2026  
**Début développement** : À définir  
**Fin estimée** : 7-8 semaines après le début


