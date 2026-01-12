# 📚 Luneo Public API Documentation

## 🎯 Vue d'ensemble

L'API publique Luneo permet aux développeurs d'intégrer la plateforme de personnalisation de produits dans leurs applications. L'API utilise l'authentification par clé API et supporte les webhooks pour les événements en temps réel.

**Base URL** : `https://api.luneo.com/api/v1`

**Version** : `1.0.0`

## 🔐 Authentification

### Clé API

Toutes les requêtes (sauf `/health`) nécessitent une clé API dans le header :

```
X-API-Key: votre_cle_api
```

### Obtenir une clé API

1. Connectez-vous à votre compte Luneo
2. Allez dans **Paramètres** → **API Keys**
3. Cliquez sur **Créer une nouvelle clé API**
4. Copiez la clé (elle ne sera affichée qu'une seule fois)

### Rate Limiting

- **Limite par défaut** : 100 requêtes/minute par clé API
- **Limite pour génération de designs** : 20 requêtes/minute
- **Header de réponse** : `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## 📋 Endpoints

### Health Check

#### `GET /health`

Vérifie l'état de l'API. Aucune authentification requise.

**Réponse** :
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### Produits

#### `GET /products`

Récupère la liste des produits disponibles.

**Paramètres de requête** :
- `limit` (number, optionnel) : Nombre de résultats (défaut: 20, max: 100)
- `offset` (number, optionnel) : Décalage pour pagination (défaut: 0)
- `category` (string, optionnel) : Filtrer par catégorie
- `search` (string, optionnel) : Recherche textuelle

**Réponse** :
```json
{
  "data": [
    {
      "id": "prod_123",
      "name": "Collier en or",
      "description": "Collier minimaliste en or 18k",
      "price": 4900,
      "currency": "EUR",
      "images": ["https://..."],
      "category": "jewelry",
      "available": true
    }
  ],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

#### `GET /products/:id`

Récupère les détails d'un produit spécifique.

**Réponse** :
```json
{
  "id": "prod_123",
  "name": "Collier en or",
  "description": "Collier minimaliste en or 18k",
  "price": 4900,
  "currency": "EUR",
  "images": ["https://..."],
  "category": "jewelry",
  "available": true,
  "customizationOptions": {
    "materials": ["gold", "silver"],
    "sizes": ["S", "M", "L"],
    "engraving": true
  }
}
```

### Designs

#### `POST /designs`

Crée un nouveau design avec IA.

**Corps de la requête** :
```json
{
  "productId": "prod_123",
  "prompt": "Collier minimaliste or 18k, pendentif coeur, gravure 'A.'",
  "options": {
    "material": "gold",
    "size": "S",
    "color": "yellow",
    "engravingText": "A."
  }
}
```

**Réponse** :
```json
{
  "id": "design_456",
  "status": "processing",
  "productId": "prod_123",
  "previewUrl": null,
  "estimatedCompletionTime": 30
}
```

#### `GET /designs/:id`

Récupère le statut et les détails d'un design.

**Réponse** :
```json
{
  "id": "design_456",
  "status": "completed",
  "productId": "prod_123",
  "previewUrl": "https://...",
  "highResUrl": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "completedAt": "2024-01-15T10:30:30Z"
}
```

### Commandes

#### `POST /orders`

Crée une nouvelle commande.

**Corps de la requête** :
```json
{
  "items": [
    {
      "productId": "prod_123",
      "designId": "design_456",
      "quantity": 1,
      "unitPrice": 4900
    }
  ],
  "shipping": {
    "address": "123 Rue de la Paix, 75001 Paris, France",
    "method": "express",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+33123456789"
  },
  "currency": "EUR"
}
```

**Réponse** :
```json
{
  "id": "order_789",
  "status": "pending_payment",
  "total": 4900,
  "currency": "EUR",
  "paymentUrl": "https://checkout.stripe.com/...",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

#### `GET /orders/:id`

Récupère les détails d'une commande.

**Réponse** :
```json
{
  "id": "order_789",
  "status": "paid",
  "total": 4900,
  "currency": "EUR",
  "items": [...],
  "shipping": {...},
  "trackingNumber": "TRACK123456",
  "createdAt": "2024-01-15T10:30:00Z",
  "paidAt": "2024-01-15T10:31:00Z"
}
```

### Analytics

#### `GET /analytics/overview`

Récupère les statistiques générales.

**Réponse** :
```json
{
  "totalOrders": 150,
  "totalRevenue": 735000,
  "averageOrderValue": 4900,
  "conversionRate": 3.5,
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  }
}
```

## 🔗 Webhooks

### Configuration

Configurez vos webhooks dans **Paramètres** → **Webhooks**.

### Événements disponibles

- `order.created` - Commande créée
- `order.paid` - Commande payée
- `order.shipped` - Commande expédiée
- `design.completed` - Design terminé
- `design.failed` - Design échoué

### Signature des webhooks

Les webhooks sont signés avec HMAC SHA256. Vérifiez la signature :

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

### Exemple de payload

```json
{
  "event": "order.paid",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "orderId": "order_789",
    "total": 4900,
    "currency": "EUR"
  }
}
```

## 📝 Codes de Statut

- `200` - Succès
- `201` - Créé
- `202` - Accepté (traitement en cours)
- `400` - Requête invalide
- `401` - Non authentifié (clé API invalide)
- `403` - Non autorisé
- `404` - Ressource non trouvée
- `429` - Trop de requêtes (rate limit dépassé)
- `500` - Erreur serveur

## 🚨 Gestion des Erreurs

Toutes les erreurs suivent ce format :

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Le produit spécifié n'existe pas",
    "details": {
      "field": "productId",
      "value": "prod_invalid"
    }
  }
}
```

### Codes d'erreur courants

- `INVALID_API_KEY` - Clé API invalide
- `RATE_LIMIT_EXCEEDED` - Limite de taux dépassée
- `INVALID_REQUEST` - Requête invalide
- `RESOURCE_NOT_FOUND` - Ressource non trouvée
- `PROCESSING_ERROR` - Erreur de traitement
- `PAYMENT_REQUIRED` - Paiement requis

## 📚 Exemples de Code

### JavaScript/TypeScript

```typescript
const API_KEY = 'votre_cle_api';
const BASE_URL = 'https://api.luneo.com/api/v1';

async function createDesign(productId: string, prompt: string) {
  const response = await fetch(`${BASE_URL}/designs`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({
      productId,
      prompt,
      options: {
        material: 'gold',
        size: 'M',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}
```

### Python

```python
import requests

API_KEY = 'votre_cle_api'
BASE_URL = 'https://api.luneo.com/api/v1'

def create_design(product_id: str, prompt: str):
    response = requests.post(
        f'{BASE_URL}/designs',
        headers={
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY,
        },
        json={
            'productId': product_id,
            'prompt': prompt,
            'options': {
                'material': 'gold',
                'size': 'M',
            },
        },
    )
    
    response.raise_for_status()
    return response.json()
```

### cURL

```bash
curl -X POST https://api.luneo.com/api/v1/designs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: votre_cle_api" \
  -d '{
    "productId": "prod_123",
    "prompt": "Collier minimaliste or 18k",
    "options": {
      "material": "gold",
      "size": "M"
    }
  }'
```

## 🔄 Pagination

Les endpoints de liste utilisent la pagination avec `limit` et `offset` :

```
GET /products?limit=20&offset=0
```

**Réponse** :
```json
{
  "data": [...],
  "total": 100,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

## 📞 Support

- **Email** : api-support@luneo.com
- **Documentation** : https://docs.luneo.com
- **Status Page** : https://status.luneo.com

## 🔄 Changelog

### v1.0.0 (2024-01-15)
- Version initiale de l'API publique
- Support des produits, designs, commandes
- Webhooks configurés
- Analytics de base
