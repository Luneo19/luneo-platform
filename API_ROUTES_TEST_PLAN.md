# 🧪 API Routes Test Plan - Luneo

## Frontend API Routes (62 routes)

### 🔐 **Authentication** (5 routes)
```bash
# Login
POST /api/auth/login
Body: { email, password }
Expected: { accessToken, refreshToken, user }

# Register
POST /api/auth/register
Body: { email, password, name }
Expected: { user, tokens }

# Refresh Token
POST /api/auth/refresh
Headers: { Authorization: Bearer <refreshToken> }
Expected: { accessToken }

# Logout
POST /api/auth/logout
Expected: { success: true }

# Forgot Password
POST /api/auth/forgot-password
Body: { email }
Expected: { success: true }
```

### 💳 **Billing** (6 routes)
```bash
# Create Checkout Session
POST /api/billing/create-checkout-session
Body: { planId: "professional", email, billing: "monthly" }
Expected: { success: true, url: "stripe-checkout-url" }

# Get Current Subscription
GET /api/billing/subscription
Headers: { Authorization: Bearer <token> }
Expected: { subscription: {...}, plan: "professional" }

# Cancel Subscription
POST /api/billing/cancel
Expected: { success: true }

# Update Payment Method
POST /api/billing/update-payment
Body: { paymentMethodId }
Expected: { success: true }

# Get Invoices
GET /api/billing/invoices
Expected: { invoices: [{...}] }

# Webhook (Stripe)
POST /api/webhooks/stripe
Headers: { stripe-signature }
Expected: 200 OK
```

### 🎨 **Designs** (8 routes)
```bash
# List Designs
GET /api/designs
Query: ?page=1&limit=20
Expected: { designs: [...], total, page }

# Get Design by ID
GET /api/designs/:id
Expected: { design: {...} }

# Create Design
POST /api/designs
Body: { name, template, customizations: {...} }
Expected: { design: {...}, id }

# Update Design
PATCH /api/designs/:id
Body: { name, customizations }
Expected: { design: {...} }

# Delete Design
DELETE /api/designs/:id
Expected: { success: true }

# Duplicate Design
POST /api/designs/:id/duplicate
Expected: { design: {...}, id }

# Export Design
POST /api/designs/:id/export
Body: { format: "png" | "glb" | "usdz" }
Expected: { url: "download-url" }

# Share Design
POST /api/designs/:id/share
Expected: { shareUrl: "public-url", shareId }
```

### 🤖 **AI Generation** (3 routes)
```bash
# Generate with AI
POST /api/ai/generate
Body: { prompt: "Modern t-shirt", style: "photorealistic" }
Expected: { images: [...], designId }

# Get AI Generation History
GET /api/ai/history
Expected: { generations: [...] }

# Upscale Image
POST /api/ai/upscale
Body: { imageUrl }
Expected: { upscaledUrl }
```

### 📦 **Orders** (6 routes)
```bash
# List Orders
GET /api/orders
Expected: { orders: [...] }

# Get Order by ID
GET /api/orders/:id
Expected: { order: {...}, items: [...] }

# Create Order
POST /api/orders
Body: { designId, quantity, shipping: {...} }
Expected: { order: {...}, id }

# Update Order Status
PATCH /api/orders/:id
Body: { status: "shipped", trackingNumber }
Expected: { order: {...} }

# Cancel Order
POST /api/orders/:id/cancel
Expected: { success: true }

# Get Order Tracking
GET /api/orders/:id/tracking
Expected: { trackingNumber, status, updates: [...] }
```

### 📊 **Analytics** (3 routes)
```bash
# Dashboard Stats
GET /api/analytics/dashboard
Expected: { designs: 42, orders: 15, revenue: 1250 }

# Design Analytics
GET /api/analytics/designs/:id
Expected: { views: 150, shares: 12, downloads: 8 }

# Export Analytics
GET /api/analytics/export
Query: ?format=csv&dateFrom=2025-01-01
Expected: CSV file download
```

### 👤 **User / Profile** (5 routes)
```bash
# Get Profile
GET /api/user/profile
Expected: { user: {...} }

# Update Profile
PATCH /api/user/profile
Body: { name, email, avatar }
Expected: { user: {...} }

# Change Password
POST /api/user/change-password
Body: { oldPassword, newPassword }
Expected: { success: true }

# Delete Account
DELETE /api/user/account
Expected: { success: true }

# Export User Data (GDPR)
GET /api/user/export
Expected: JSON file download
```

### ⚙️ **Settings** (6 routes)
```bash
# Get API Keys
GET /api/settings/api-keys
Expected: { keys: [...] }

# Create API Key
POST /api/settings/api-keys
Body: { name: "My API Key" }
Expected: { key: "sk_...", id }

# Revoke API Key
DELETE /api/settings/api-keys/:id
Expected: { success: true }

# Get Webhooks
GET /api/settings/webhooks
Expected: { webhooks: [...] }

# Create Webhook
POST /api/settings/webhooks
Body: { url, events: ["design.created"] }
Expected: { webhook: {...}, secret }

# Update Preferences
PATCH /api/settings/preferences
Body: { notifications: {...}, theme: "dark" }
Expected: { preferences: {...} }
```

### 🎯 **AR Studio** (4 routes)
```bash
# Create AR Experience
POST /api/ar/create
Body: { designId, platform: "ios" | "android" }
Expected: { arUrl: "usdz-or-glb-url" }

# List AR Experiences
GET /api/ar
Expected: { experiences: [...] }

# Get AR by ID
GET /api/ar/:id
Expected: { experience: {...} }

# Delete AR
DELETE /api/ar/:id
Expected: { success: true }
```

### 🔗 **Integrations** (8 routes)
```bash
# Shopify - Connect
POST /api/integrations/shopify/connect
Body: { shop: "myshop.myshopify.com", accessToken }
Expected: { connected: true }

# Shopify - Sync Products
POST /api/integrations/shopify/sync
Expected: { synced: 150 }

# WooCommerce - Connect
POST /api/integrations/woocommerce/connect
Body: { siteUrl, consumerKey, consumerSecret }
Expected: { connected: true }

# Printful - Connect
POST /api/integrations/printful/connect
Body: { apiKey }
Expected: { connected: true }

# Zapier - Get Webhooks
GET /api/integrations/zapier/webhooks
Expected: { webhooks: [...] }

# List Connected Integrations
GET /api/integrations
Expected: { integrations: [...] }

# Disconnect Integration
DELETE /api/integrations/:provider
Expected: { success: true }

# Test Integration
POST /api/integrations/:provider/test
Expected: { success: true, message }
```

### 📸 **Assets / Uploads** (4 routes)
```bash
# Upload Image
POST /api/assets/upload
Body: FormData { file }
Expected: { url: "s3-url", id }

# List Assets
GET /api/assets
Expected: { assets: [...] }

# Delete Asset
DELETE /api/assets/:id
Expected: { success: true }

# Get Signed URL (S3)
GET /api/assets/:id/signed-url
Expected: { signedUrl: "temporary-url" }
```

### 🧪 **Health & Monitoring** (4 routes)
```bash
# Health Check
GET /api/health
Expected: { status: "ok", uptime, version }

# API Status
GET /api/status
Expected: { api: "ok", db: "ok", redis: "ok" }

# Rate Limit Info
GET /api/rate-limit
Expected: { limit: 1000, remaining: 997, reset: timestamp }

# Version Info
GET /api/version
Expected: { version: "2.5.0", commit: "abc123" }
```

---

## 🧪 **Backend NestJS API Routes** (à tester via Postman/Insomnia)

Base URL: `http://localhost:3001` (dev) ou `https://api.luneo.app` (prod)

### Auth Module
```
POST   /auth/signup
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
GET    /auth/me
```

### Designs Module
```
GET    /designs
POST   /designs
GET    /designs/:id
PATCH  /designs/:id
DELETE /designs/:id
POST   /designs/:id/duplicate
POST   /designs/:id/export
```

### AI Module
```
POST   /ai/generate
POST   /ai/upscale
GET    /ai/history
POST   /ai/bulk-generate
```

### Orders Module
```
GET    /orders
POST   /orders
GET    /orders/:id
PATCH  /orders/:id
DELETE /orders/:id
```

### Billing Module
```
POST   /billing/create-subscription
GET    /billing/subscription
POST   /billing/cancel-subscription
GET    /billing/invoices
POST   /billing/webhooks/stripe
```

### Users Module
```
GET    /users/profile
PATCH  /users/profile
DELETE /users/account
GET    /users/export-data
POST   /users/change-password
```

---

## 🎯 **Testing Tools**

### Recommandés:
1. **Postman** - Collections API testing
2. **Insomnia** - REST client
3. **cURL** - Command line
4. **Jest** - Unit tests
5. **Supertest** - Integration tests

### Automated Testing (à implémenter):
```typescript
// Example avec Jest + Supertest
describe('POST /api/designs', () => {
  it('should create a new design', async () => {
    const response = await request(app)
      .post('/api/designs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Design',
        template: 't-shirt',
        customizations: { color: '#FF0000' }
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

---

## ✅ **Test Checklist**

- [ ] Tous les endpoints authentifiés retournent 401 sans token
- [ ] Tous les endpoints POST/PATCH valident les inputs
- [ ] Error responses ont format cohérent `{ error, message, statusCode }`
- [ ] Rate limiting fonctionne correctement
- [ ] CORS configuré pour app.luneo.app
- [ ] Webhooks Stripe vérifient la signature
- [ ] Uploads fichiers limitent taille/type
- [ ] Exports retournent fichiers corrects
- [ ] Pagination fonctionne (limit, offset, total)
- [ ] Filtres/recherche retournent résultats corrects

---

**Status :** 📋 Plan créé - Tests à exécuter manuellement ou via Postman



