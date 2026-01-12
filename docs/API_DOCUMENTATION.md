# 📚 API DOCUMENTATION COMPLÈTE

**Date**: 15 janvier 2025  
**Status**: ✅ Documentation complète

---

## 🎯 OVERVIEW

Documentation complète de l'API Luneo Platform, incluant tous les endpoints, authentification, erreurs, et exemples.

---

## 🔐 AUTHENTICATION

### JWT Tokens

Tous les endpoints (sauf publics) nécessitent un token JWT dans le header `Authorization`:

```http
Authorization: Bearer <access_token>
```

### Obtention d'un Token

**Login**:
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "role": "CONSUMER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📋 ENDPOINTS

### Authentication

#### POST /api/v1/auth/signup
Créer un nouveau compte utilisateur.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe",
  "captchaToken": "03AGdBq..."
}
```

**Response**: `201 Created`

---

#### POST /api/v1/auth/login
Connexion utilisateur.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**: `200 OK`

---

#### POST /api/v1/auth/refresh
Rafraîchir le token d'accès.

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response**: `200 OK`

---

#### GET /api/v1/auth/google
Initier authentification Google OAuth.

**Response**: `302 Redirect` vers Google OAuth

---

#### GET /api/v1/auth/github
Initier authentification GitHub OAuth.

**Response**: `302 Redirect` vers GitHub OAuth

---

#### GET /api/v1/auth/saml
Initier authentification SAML SSO.

**Response**: `302 Redirect` vers IdP SAML

---

#### GET /api/v1/auth/oidc
Initier authentification OIDC SSO.

**Response**: `302 Redirect` vers IdP OIDC

---

### Products

#### GET /api/v1/products
Liste tous les produits.

**Query Parameters**:
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments (défaut: 20, max: 100)
- `search`: Recherche par nom
- `category`: Filtrer par catégorie

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "prod_123",
      "name": "Gold Ring",
      "price": 299.99,
      "category": "jewelry"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

#### GET /api/v1/products/:id
Obtenir un produit par ID.

**Response**: `200 OK`

---

#### POST /api/v1/products
Créer un nouveau produit (Admin uniquement).

**Request**:
```json
{
  "name": "Gold Ring",
  "description": "Beautiful gold ring",
  "price": 299.99,
  "category": "jewelry",
  "zones": [
    {
      "type": "text",
      "position": { "x": 10, "y": 20 },
      "constraints": { "maxLength": 20 }
    }
  ]
}
```

**Response**: `201 Created`

---

### Designs

#### GET /api/v1/designs
Liste tous les designs de l'utilisateur.

**Query Parameters**:
- `page`: Numéro de page
- `limit`: Nombre d'éléments
- `status`: Filtrer par statut (PENDING, COMPLETED, FAILED)

**Response**: `200 OK`

---

#### POST /api/v1/designs
Créer un nouveau design.

**Request**:
```json
{
  "name": "My Design",
  "productId": "prod_123",
  "prompt": "A beautiful gold ring with diamonds",
  "zones": [
    {
      "zoneId": "zone_1",
      "content": "Love"
    }
  ]
}
```

**Response**: `201 Created`

---

#### GET /api/v1/designs/:id
Obtenir un design par ID.

**Response**: `200 OK`

---

### Orders

#### GET /api/v1/orders
Liste toutes les commandes.

**Query Parameters**:
- `page`: Numéro de page
- `limit`: Nombre d'éléments
- `status`: Filtrer par statut

**Response**: `200 OK`

---

#### POST /api/v1/orders
Créer une nouvelle commande.

**Request**:
```json
{
  "designId": "design_123",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "postalCode": "10001",
    "country": "US"
  }
}
```

**Response**: `201 Created`

---

### Analytics

#### GET /api/v1/analytics/overview
Obtenir les métriques analytics globales.

**Query Parameters**:
- `startDate`: Date de début (ISO 8601)
- `endDate`: Date de fin (ISO 8601)

**Response**: `200 OK`
```json
{
  "mrr": 50000,
  "growth": 15.5,
  "customers": 1250,
  "churnRate": 2.3,
  "revenue": {
    "total": 600000,
    "monthly": 50000,
    "growth": 15.5
  }
}
```

---

#### GET /api/v1/analytics/cohort
Analyse de cohort.

**Response**: `200 OK`

---

#### GET /api/v1/analytics/funnel
Funnel de conversion.

**Response**: `200 OK`

---

#### POST /api/v1/analytics/export
Exporter les analytics (PDF/Excel).

**Request**:
```json
{
  "format": "pdf",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "metrics": ["revenue", "customers", "orders"]
}
```

**Response**: `200 OK` (fichier binaire)

---

### Admin

#### GET /api/v1/admin/customers
Liste tous les clients (Admin uniquement).

**Query Parameters**:
- `page`: Numéro de page
- `limit`: Nombre d'éléments
- `search`: Recherche
- `segment`: Segment de clients

**Response**: `200 OK`

---

#### GET /api/v1/admin/customers/:id
Détails d'un client (Admin uniquement).

**Response**: `200 OK`

---

#### GET /api/v1/admin/analytics/overview
Vue d'ensemble analytics admin.

**Response**: `200 OK`

---

### SSO Enterprise

#### POST /api/v1/sso
Créer configuration SSO (Admin uniquement).

**Request**:
```json
{
  "brandId": "brand_123",
  "provider": "saml",
  "name": "Enterprise SAML",
  "samlEntryPoint": "https://idp.example.com/saml/sso",
  "samlIssuer": "luneo-app",
  "samlCert": "-----BEGIN CERTIFICATE-----...",
  "autoProvisioning": true
}
```

**Response**: `201 Created`

---

#### GET /api/v1/sso/brand/:brandId
Obtenir configurations SSO d'un brand.

**Response**: `200 OK`

---

### Audit Logs

#### GET /api/v1/audit-logs
Obtenir les logs d'audit (Admin uniquement).

**Query Parameters**:
- `userId`: Filtrer par utilisateur
- `brandId`: Filtrer par brand
- `action`: Filtrer par action
- `startDate`: Date de début
- `endDate`: Date de fin

**Response**: `200 OK`

---

## 🔒 RATE LIMITING

Tous les endpoints sont protégés par rate limiting:

- **API générale**: 100 requêtes / 60 secondes
- **Auth endpoints**: 10 requêtes / 60 secondes
- **Public endpoints**: 200 requêtes / 60 secondes

**Headers de réponse**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2025-01-15T12:00:00Z
```

**Erreur 429**:
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "retryAfter": 30
}
```

---

## ❌ GESTION D'ERREURS

### Codes d'Erreur Standards

- `400 Bad Request`: Données invalides
- `401 Unauthorized`: Token manquant ou invalide
- `403 Forbidden`: Permissions insuffisantes
- `404 Not Found`: Ressource introuvable
- `409 Conflict`: Conflit (ex: email déjà utilisé)
- `429 Too Many Requests`: Rate limit dépassé
- `500 Internal Server Error`: Erreur serveur

### Format d'Erreur

```json
{
  "statusCode": 400,
  "message": ["email must be an email", "password is too weak"],
  "error": "Bad Request"
}
```

---

## 📊 PAGINATION

Tous les endpoints de liste supportent la pagination:

**Query Parameters**:
- `page`: Numéro de page (défaut: 1)
- `limit`: Nombre d'éléments (défaut: 20, max: 100)

**Response**:
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## 🔗 WEBHOOKS

### Configuration

Les webhooks peuvent être configurés pour recevoir des notifications d'événements.

**POST /api/v1/webhooks**
Créer un webhook.

**Request**:
```json
{
  "url": "https://example.com/webhook",
  "events": ["order.created", "order.completed"],
  "secret": "webhook_secret_key"
}
```

---

## 📚 RESSOURCES

- **Swagger UI**: `/api/docs`
- **OpenAPI Spec**: `/api/docs-json`
- **Postman Collection**: Disponible sur demande

---

**Status**: ✅ Documentation complète  
**Score gagné**: +3 points (Phase 3 - P3)
