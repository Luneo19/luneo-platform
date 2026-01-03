# 📡 Documentation API - Luneo Platform

**Documentation complète des endpoints API**

---

## 📋 Vue d'Ensemble

Luneo Platform expose deux types d'API:
- **REST API** - Endpoints Next.js API Routes
- **tRPC API** - API type-safe via tRPC

---

## 🔐 Authentification

### Supabase Auth
La plupart des endpoints nécessitent une authentification via Supabase.

**Headers requis:**
```http
Authorization: Bearer <supabase_jwt_token>
```

**Obtention du token:**
```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
```

---

## 📡 REST API Endpoints

### Base URL
```
Production: https://app.luneo.app/api
Development: http://localhost:3000/api
```

### Format de Réponse Standard

Tous les endpoints utilisent `ApiResponseBuilder`:

```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

---

## 🏥 Health & Monitoring

### GET /api/health
Vérifie la santé de l'application.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-01T00:00:00Z",
    "services": {
      "database": "healthy",
      "cache": "healthy"
    }
  }
}
```

---

## 👤 Authentication

### POST /api/auth/forgot-password
Envoie un email de réinitialisation de mot de passe.

**Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password
Réinitialise le mot de passe.

**Body:**
```json
{
  "token": "reset-token",
  "password": "new-password"
}
```

### POST /api/auth/onboarding
Complète l'onboarding utilisateur.

**Body:**
```json
{
  "step": 1,
  "data": {
    "companyName": "My Company"
  }
}
```

---

## 📦 Products

### GET /api/products
Liste les produits de l'utilisateur.

**Query Params:**
- `page` (number, default: 1)
- `limit` (number, default: 20)
- `search` (string, optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### POST /api/products
Crée un nouveau produit.

**Body:**
```json
{
  "name": "T-Shirt",
  "description": "T-shirt personnalisable",
  "basePrice": 29.99,
  "category": "apparel"
}
```

### GET /api/products/[id]
Récupère un produit par ID.

### PUT /api/products/[id]
Met à jour un produit.

### DELETE /api/products/[id]
Supprime un produit.

### POST /api/products/[id]/upload-model
Upload un modèle 3D pour un produit.

**Body:** FormData avec fichier

### GET /api/products/[id]/zones
Récupère les zones de personnalisation d'un produit.

---

## 🎨 Designs

### GET /api/designs
Liste les designs de l'utilisateur.

**Query Params:**
- `page`, `limit`, `search`, `status`

### POST /api/designs
Crée un nouveau design.

**Body:**
```json
{
  "productId": "product-123",
  "name": "My Design",
  "config": {
    "zones": [...]
  }
}
```

### GET /api/designs/[id]
Récupère un design par ID.

### PUT /api/designs/[id]
Met à jour un design.

### DELETE /api/designs/[id]
Supprime un design.

### POST /api/designs/export-print
Exporte un design en format print-ready.

**Body:**
```json
{
  "designId": "design-123",
  "format": "pdf",
  "quality": "high"
}
```

---

## 🛒 Orders

### GET /api/orders
Liste les commandes de l'utilisateur.

**Query Params:**
- `page`, `limit`, `status`, `search`

### POST /api/orders
Crée une nouvelle commande.

**Body:**
```json
{
  "designId": "design-123",
  "quantity": 1,
  "shippingAddress": {...}
}
```

### GET /api/orders/[id]
Récupère une commande par ID.

### PUT /api/orders/[id]
Met à jour une commande.

### POST /api/orders/generate-production-files
Génère les fichiers de production pour une commande.

---

## 💳 Billing

### POST /api/billing/create-checkout-session
Crée une session Stripe Checkout.

**Body:**
```json
{
  "planId": "pro",
  "successUrl": "https://app.luneo.app/billing/success",
  "cancelUrl": "https://app.luneo.app/billing"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_...",
    "url": "https://checkout.stripe.com/..."
  }
}
```

### GET /api/billing/invoices
Liste les factures.

### GET /api/billing/payment-methods
Liste les méthodes de paiement.

### POST /api/billing/portal
Crée un lien vers le portail client Stripe.

### PUT /api/billing/subscription
Met à jour l'abonnement.

### GET /api/billing/verify-session
Vérifie une session Stripe.

---

## 🤖 AI

### POST /api/ai/generate
Génère un design avec IA.

**Body:**
```json
{
  "prompt": "A red t-shirt with a logo",
  "productId": "product-123",
  "style": "modern"
}
```

### POST /api/ai/text-to-design
Convertit du texte en design.

### POST /api/ai/background-removal
Supprime le fond d'une image.

**Body:** FormData avec image

### POST /api/ai/smart-crop
Recadre intelligemment une image.

### POST /api/ai/upscale
Améliore la résolution d'une image.

### POST /api/ai/extract-colors
Extrait les couleurs d'une image.

---

## 🎯 Analytics

### POST /api/analytics/events
Envoie des événements analytics.

**Body:**
```json
{
  "events": [
    {
      "category": "conversion",
      "action": "purchase",
      "label": "premium-plan",
      "value": 99
    }
  ]
}
```

### POST /api/analytics/web-vitals
Envoie des métriques Core Web Vitals.

**Body:**
```json
{
  "name": "LCP",
  "value": 1850,
  "rating": "good",
  "id": "lcp-123",
  "url": "/dashboard",
  "timestamp": 1234567890
}
```

### GET /api/analytics/overview
Récupère un aperçu des analytics.

**Query Params:**
- `startDate` (ISO string)
- `endDate` (ISO string)

### GET /api/analytics/export
Exporte les données analytics.

---

## 🔗 Integrations

### GET /api/integrations/list
Liste les intégrations de l'utilisateur.

### POST /api/integrations/connect
Connecte une intégration.

**Body:**
```json
{
  "type": "shopify",
  "credentials": {...}
}
```

### POST /api/integrations/shopify/connect
Connecte Shopify.

### POST /api/integrations/shopify/sync
Synchronise les produits Shopify.

### POST /api/integrations/woocommerce/connect
Connecte WooCommerce.

### POST /api/integrations/woocommerce/sync
Synchronise les produits WooCommerce.

---

## 🔑 API Keys

### GET /api/api-keys
Liste les clés API de l'utilisateur.

### POST /api/api-keys
Crée une nouvelle clé API.

**Body:**
```json
{
  "name": "My API Key",
  "permissions": ["read", "write"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "apiKey": "luneo_...",
    "id": "key-123"
  }
}
```

⚠️ **Important:** La clé complète n'est affichée qu'une seule fois.

### DELETE /api/api-keys/[id]
Supprime une clé API.

---

## 📊 Webhooks

### POST /api/webhooks
Crée un webhook endpoint.

**Body:**
```json
{
  "name": "Order Webhook",
  "url": "https://example.com/webhook",
  "events": ["order.created", "order.updated"],
  "secret": "optional-secret"
}
```

### POST /api/webhooks/stripe
Endpoint pour recevoir les webhooks Stripe.

**Headers:**
```http
Stripe-Signature: ...
```

---

## 🎨 3D & AR

### POST /api/3d/export-ar
Exporte un modèle 3D pour AR.

**Body:**
```json
{
  "designId": "design-123",
  "format": "usdz"
}
```

### POST /api/3d/render-highres
Rendu haute résolution d'un modèle 3D.

### POST /api/ar/convert-2d-to-3d
Convertit un design 2D en 3D.

### POST /api/ar/convert-usdz
Convertit un modèle en USDZ.

### POST /api/ar/export
Exporte un modèle AR.

### POST /api/ar/upload
Upload un modèle AR.

---

## 👥 Team

### GET /api/team
Liste les membres de l'équipe.

### POST /api/team/invite
Invite un membre à l'équipe.

**Body:**
```json
{
  "email": "member@example.com",
  "role": "member"
}
```

### GET /api/team/members
Liste les membres avec détails.

### PUT /api/team/[id]
Met à jour un membre.

### DELETE /api/team/[id]
Supprime un membre.

---

## 🔔 Notifications

### GET /api/notifications
Liste les notifications.

**Query Params:**
- `unread` (boolean)
- `limit` (number)

### POST /api/notifications/[id]/read
Marque une notification comme lue.

### POST /api/notifications/read-all
Marque toutes les notifications comme lues.

---

## 💰 Credits

### GET /api/credits/balance
Récupère le solde de crédits.

### POST /api/credits/buy
Achète des crédits.

**Body:**
```json
{
  "packId": "pack-100",
  "quantity": 1
}
```

### GET /api/credits/packs
Liste les packs de crédits disponibles.

### GET /api/credits/transactions
Liste les transactions de crédits.

---

## 📧 Email

### POST /api/email/send
Envoie un email.

**Body:**
```json
{
  "to": "user@example.com",
  "subject": "Welcome",
  "template": "welcome",
  "data": {...}
}
```

---

## 🔒 GDPR

### POST /api/gdpr/export
Exporte toutes les données utilisateur.

**Response:** Fichier JSON avec toutes les données

### POST /api/gdpr/delete-account
Supprime le compte et toutes les données.

⚠️ **Irréversible**

---

## 📊 Public API

### GET /api/public/plans
Liste les plans disponibles (public).

### GET /api/public/integrations
Liste les intégrations disponibles (public).

### GET /api/public/solutions
Liste les solutions (public).

### GET /api/public/industries
Liste les industries (public).

### GET /api/public/marketing
Données marketing (public).

---

## 🛠️ tRPC API

### Base URL
```
/api/trpc
```

### Utilisation

```typescript
import { trpc } from '@/lib/trpc/client';

// Query
const { data } = trpc.product.list.useQuery();

// Mutation
const mutation = trpc.product.create.useMutation();
await mutation.mutateAsync({ name: 'Product' });
```

### Routers Disponibles

- `product` - Gestion produits
- `design` - Gestion designs
- `order` - Gestion commandes
- `analytics` - Analytics
- `customization` - Personnalisation
- `notification` - Notifications
- `ar` - AR/3D

**Voir:** `apps/frontend/src/lib/trpc/routers/` pour détails

---

## 🔒 Sécurité

### CSRF Protection
Certains endpoints nécessitent un token CSRF.

**Obtenir le token:**
```http
GET /api/csrf/token
```

**Utiliser le token:**
```http
X-CSRF-Token: <token>
```

### Rate Limiting
Les endpoints sont protégés par rate limiting:
- **Authenticated:** 100 req/min
- **Unauthenticated:** 10 req/min

### Validation
Tous les endpoints utilisent Zod pour la validation.

---

## 📝 Codes de Statut

- `200` - Succès
- `201` - Créé
- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Non autorisé
- `404` - Non trouvé
- `429` - Trop de requêtes
- `500` - Erreur serveur

---

## 🔗 Ressources

- [Architecture](ARCHITECTURE.md)
- [tRPC Documentation](https://trpc.io)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

**Dernière mise à jour:** Décembre 2024








