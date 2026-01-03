# ✅ Checklist de Déploiement Production

## Date: 2024-12-19
## Statut: 🔍 Vérification en cours

---

## 📋 Pages Frontend - État

### ✅ Pages Existantes

#### Pages Publiques
- ✅ `/` - Page d'accueil
- ✅ `/produits` - Hub produits
- ✅ `/features` - Fonctionnalités
- ✅ `/pricing` - Tarification
- ✅ `/help/documentation` - Documentation
- ✅ `/legal/*` - Pages légales
- ✅ `/auth/*` - Authentification (login, register, etc.)

#### Pages Dashboard
- ✅ `/overview` - Vue d'ensemble
- ✅ `/dashboard/ai-studio` - AI Studio
- ✅ `/dashboard/ar-studio` - AR Studio
- ✅ `/dashboard/analytics` - Analytics
- ✅ `/dashboard/products` - Gestion produits
- ✅ `/dashboard/billing` - Facturation
- ✅ `/dashboard/team` - Équipe
- ✅ `/dashboard/integrations-dashboard` - Intégrations
- ✅ `/dashboard/settings` - Paramètres
- ✅ `/dashboard/security` - Sécurité

#### Pages API
- ✅ `/api/*` - Routes API Next.js (147 fichiers)

### ⚠️ Pages Manquantes pour Widget

#### Pages Widget (à créer)
- ❌ `/widget/editor` - Éditeur widget standalone
- ❌ `/widget/demo` - Démo widget
- ❌ `/widget/docs` - Documentation widget

---

## 📋 Backend API - État

### ✅ Endpoints Existants

#### Render Engine
- ✅ `POST /render/2d` - Rendu 2D
- ✅ `POST /render/3d` - Rendu 3D
- ✅ `POST /render/print-ready` - **NOUVEAU** Rendu print-ready
- ✅ `POST /render/preview` - Preview render
- ✅ `POST /render/final` - Final render
- ✅ `GET /render/status/:renderId` - Statut render
- ✅ `GET /render/preview/:renderId` - Preview render

#### Public API
- ✅ `GET /api/v1/health` - Health check
- ✅ `POST /api/v1/designs` - Créer design
- ✅ `GET /api/v1/designs/:id` - Récupérer design
- ✅ `POST /api/v1/orders` - Créer commande
- ✅ `GET /api/v1/analytics` - Analytics

#### Webhooks
- ✅ `POST /webhooks/test` - Test webhook
- ✅ `GET /webhooks/history` - Historique
- ✅ `POST /webhooks/:id/retry` - Retry webhook

### ⚠️ Endpoints Widget Manquants

#### Widget API (à créer)
- ❌ `GET /api/widget/products/:id` - Config produit
- ❌ `POST /api/widget/designs` - Sauvegarder design
- ❌ `GET /api/widget/designs/:id` - Charger design
- ❌ `POST /api/widget/export` - Export design

---

## 🚀 Configuration Déploiement

### ✅ Vercel - Backend

**Fichier**: `apps/backend/vercel.json` ✅
```json
{
  "version": 2,
  "buildCommand": "npm run vercel-build",
  "functions": {
    "api/index.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    }
  ]
}
```

### ✅ Vercel - Frontend

**Fichier**: `apps/frontend/vercel.json` ✅
- Configuration Next.js 15
- Routes API configurées

### ✅ Railway

**Fichiers**: 
- `railway.json` ✅
- `apps/backend/railway.json` ✅

### ⚠️ Dockerfile Manquant

- ❌ `apps/backend/Dockerfile` - Pour Railway/container
- ❌ `apps/frontend/Dockerfile` - Optionnel (Vercel préféré)

---

## 🔧 Variables d'Environnement Requises

### Backend (Vercel/Railway)

```env
# Database
DATABASE_URL=postgresql://...

# Redis (pour BullMQ)
REDIS_HOST=...
REDIS_PORT=6379

# Storage (S3)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...

# Auth
JWT_SECRET=...
JWT_EXPIRES_IN=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# API
API_BASE_URL=...

# Widget
WIDGET_API_URL=...
WIDGET_CDN_URL=...
```

### Frontend (Vercel)

```env
# API
NEXT_PUBLIC_API_URL=...
NEXT_PUBLIC_WIDGET_URL=...

# Auth
NEXT_PUBLIC_AUTH_URL=...

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=...
```

---

## 📝 Actions Requises Avant Déploiement

### 1. Créer Endpoints Widget API ⚠️

**Fichier à créer**: `apps/backend/src/modules/widget/widget.controller.ts`

```typescript
@Controller('api/widget')
export class WidgetController {
  @Get('products/:id')
  async getProductConfig(@Param('id') id: string) {
    // Retourner CustomizableArea + Product config
  }
  
  @Post('designs')
  async saveDesign(@Body() designData: DesignData) {
    // Sauvegarder design avec layers
  }
  
  @Get('designs/:id')
  async getDesign(@Param('id') id: string) {
    // Charger design avec layers
  }
}
```

### 2. Créer Pages Widget Frontend ⚠️

**Fichiers à créer**:
- `apps/frontend/src/app/widget/editor/page.tsx`
- `apps/frontend/src/app/widget/demo/page.tsx`
- `apps/frontend/src/app/widget/docs/page.tsx`

### 3. Créer Dockerfile Backend ⚠️

**Fichier**: `apps/backend/Dockerfile`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

### 4. Vérifier Variables d'Environnement ⚠️

- Créer `.env.example` pour chaque app
- Documenter toutes les variables requises

---

## ✅ Checklist Déploiement

### Backend (Railway/Vercel)
- [x] Configuration Vercel (`vercel.json`)
- [x] Configuration Railway (`railway.json`)
- [x] Endpoints render créés
- [x] Service RenderPrintReady créé
- [x] Worker BullMQ configuré
- [ ] Endpoints widget API (à créer)
- [ ] Dockerfile (à créer)
- [ ] Variables d'environnement documentées

### Frontend (Vercel)
- [x] Configuration Vercel (`vercel.json`)
- [x] Pages dashboard existantes
- [x] Pages publiques existantes
- [ ] Pages widget (à créer)
- [ ] Variables d'environnement configurées

### Base de Données
- [x] Schema Prisma complet
- [x] Modèles CustomizableArea créés
- [x] Modèles DesignLayer créés
- [x] Migration appliquée (`prisma db push`)
- [x] Prisma Client généré

### Infrastructure
- [x] Redis configuré (pour BullMQ)
- [x] S3 configuré (pour storage)
- [ ] Variables d'environnement définies

---

## 🚀 Commandes de Déploiement

### Vercel (Frontend)
```bash
cd apps/frontend
vercel --prod
```

### Vercel (Backend)
```bash
cd apps/backend
vercel --prod
```

### Railway (Backend)
```bash
# Via Railway CLI
railway up

# Ou via GitHub integration
# Push vers main branch
```

---

## ⚠️ Points d'Attention

1. **Canvas sur Vercel**: `node-canvas` nécessite des dépendances système
   - Solution: Utiliser `@vercel/node` avec buildpacks
   - Ou: Utiliser Railway pour le backend (meilleur support)

2. **Redis**: Nécessaire pour BullMQ
   - Vercel: Utiliser Upstash Redis
   - Railway: Service Redis disponible

3. **PostgreSQL**: Base de données
   - Vercel: Utiliser Vercel Postgres
   - Railway: Service PostgreSQL disponible

4. **S3**: Stockage fichiers
   - AWS S3 ou compatible (Cloudflare R2, etc.)

---

## 📊 État Global

### ✅ Prêt pour Production
- Backend API (sauf endpoints widget)
- Frontend pages (sauf pages widget)
- Base de données
- Configuration déploiement

### ⚠️ À Compléter
- Endpoints widget API (3 endpoints)
- Pages widget frontend (3 pages)
- Dockerfile backend
- Documentation variables d'environnement

---

## 🎯 Recommandation

**Pour déploiement immédiat**:
1. ✅ Backend peut être déployé sur Railway (meilleur support pour node-canvas)
2. ✅ Frontend peut être déployé sur Vercel
3. ⚠️ Créer les endpoints/widget API manquants (30 min)
4. ⚠️ Créer les pages widget frontend (1h)

**Le projet est à 90% prêt pour production !**

