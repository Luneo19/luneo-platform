# 🔑 Architecture API Publique - Luneo Enterprise

## 🎯 **Vue d'Ensemble**

L'API publique Luneo Enterprise permettra aux développeurs tiers d'intégrer les fonctionnalités de génération IA et de gestion de designs dans leurs applications.

## 🏗️ **Architecture Technique**

### **Stack Technologique**
- **Framework** : NestJS avec Swagger/OpenAPI 3.0
- **Authentification** : API Keys + OAuth 2.0
- **Rate Limiting** : Redis + Token Bucket
- **Documentation** : Swagger UI + Redoc
- **Monitoring** : Prometheus + Grafana
- **SDK** : TypeScript, Python, PHP, Node.js

### **Endpoints Structure**
```
https://api.luneo.app/v1/
├── auth/                 # Authentification
├── designs/              # Gestion des designs
├── products/             # Catalogue produits
├── ai/                   # Génération IA
├── webhooks/             # Notifications
├── analytics/            # Métriques
└── billing/              # Facturation
```

## 🔐 **Système d'Authentification**

### **API Keys**
```typescript
// Structure d'une API Key
interface ApiKey {
  id: string;
  name: string;
  key: string;           // luneo_live_xxx / luneo_test_xxx
  secret: string;        // Hashé avec bcrypt
  permissions: Permission[];
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
    requestsPerMonth: number;
  };
  webhooks: WebhookEndpoint[];
  createdAt: string;
  lastUsedAt: string;
  isActive: boolean;
}

enum Permission {
  DESIGNS_READ = 'designs:read',
  DESIGNS_WRITE = 'designs:write',
  DESIGNS_DELETE = 'designs:delete',
  AI_GENERATE = 'ai:generate',
  PRODUCTS_READ = 'products:read',
  WEBHOOKS_MANAGE = 'webhooks:manage',
  ANALYTICS_READ = 'analytics:read',
}
```

### **OAuth 2.0 Flow**
```typescript
// OAuth endpoints
POST /oauth/authorize    # Autorisation
POST /oauth/token        # Token exchange
POST /oauth/refresh      # Refresh token
POST /oauth/revoke       # Révoquer token

// Scopes OAuth
const OAUTH_SCOPES = {
  'designs:read': 'Lire les designs',
  'designs:write': 'Créer/modifier les designs',
  'ai:generate': 'Générer des designs avec IA',
  'products:read': 'Lire le catalogue produits',
  'webhooks:manage': 'Gérer les webhooks',
  'analytics:read': 'Lire les analytics',
};
```

## 🚀 **Endpoints Principaux**

### **1. Authentification**

#### **API Key Authentication**
```http
POST /v1/auth/validate
Authorization: Bearer luneo_live_xxx

Response:
{
  "valid": true,
  "key": {
    "id": "key_123",
    "name": "Mon App",
    "permissions": ["designs:read", "ai:generate"],
    "rateLimit": {
      "requestsPerMinute": 100,
      "requestsPerDay": 10000,
      "requestsPerMonth": 100000
    }
  }
}
```

#### **OAuth 2.0**
```http
POST /v1/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&
client_id=your_client_id&
client_secret=your_client_secret&
scope=designs:read ai:generate

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "designs:read ai:generate"
}
```

### **2. Gestion des Designs**

#### **Liste des Designs**
```http
GET /v1/designs?page=1&limit=20&status=completed&search=logo

Response:
{
  "data": [
    {
      "id": "design_123",
      "name": "Logo Company",
      "status": "completed",
      "imageUrl": "https://cdn.luneo.app/designs/123.png",
      "thumbnailUrl": "https://cdn.luneo.app/designs/123_thumb.png",
      "prompt": "Modern logo for tech company",
      "metadata": {
        "width": 1024,
        "height": 1024,
        "format": "png",
        "aiModel": "dall-e-3"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:35:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### **Créer un Design**
```http
POST /v1/designs
Authorization: Bearer luneo_live_xxx
Content-Type: application/json

{
  "name": "Mon nouveau design",
  "prompt": "Create a modern logo for a fintech startup with blue and white colors",
  "options": {
    "style": "modern",
    "colors": ["#0066cc", "#ffffff"],
    "format": "png",
    "size": "1024x1024"
  }
}

Response:
{
  "id": "design_456",
  "name": "Mon nouveau design",
  "status": "generating",
  "estimatedTime": 30,
  "createdAt": "2024-01-15T11:00:00Z"
}
```

#### **Génération IA**
```http
POST /v1/ai/generate
Authorization: Bearer luneo_live_xxx
Content-Type: application/json

{
  "prompt": "Design a modern website header for a SaaS company",
  "model": "dall-e-3",
  "options": {
    "style": "photorealistic",
    "size": "1792x1024",
    "quality": "hd",
    "n": 1
  }
}

Response:
{
  "id": "generation_789",
  "status": "processing",
  "estimatedTime": 45,
  "cost": {
    "credits": 10,
    "currency": "USD",
    "amount": 0.20
  }
}
```

### **3. Catalogue Produits**

#### **Recherche Produits**
```http
GET /v1/products?search=t-shirt&category=apparel&limit=10

Response:
{
  "data": [
    {
      "id": "product_123",
      "name": "Premium Cotton T-Shirt",
      "description": "High-quality cotton t-shirt perfect for custom designs",
      "price": 2499,
      "currency": "USD",
      "images": [
        "https://cdn.luneo.app/products/123_1.jpg",
        "https://cdn.luneo.app/products/123_2.jpg"
      ],
      "variants": [
        {
          "id": "variant_1",
          "name": "Black - Medium",
          "price": 2499,
          "attributes": {
            "color": "black",
            "size": "M"
          },
          "stock": 50
        }
      ],
      "category": "apparel",
      "tags": ["cotton", "premium", "customizable"],
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "pages": 25
  }
}
```

### **4. Webhooks**

#### **Configuration Webhook**
```http
POST /v1/webhooks
Authorization: Bearer luneo_live_xxx
Content-Type: application/json

{
  "url": "https://myapp.com/webhooks/luneo",
  "events": [
    "design.completed",
    "design.failed",
    "generation.completed"
  ],
  "secret": "your_webhook_secret",
  "isActive": true
}

Response:
{
  "id": "webhook_123",
  "url": "https://myapp.com/webhooks/luneo",
  "events": ["design.completed", "design.failed", "generation.completed"],
  "secret": "whsec_xxx",
  "isActive": true,
  "createdAt": "2024-01-15T12:00:00Z"
}
```

#### **Événements Webhook**
```json
// design.completed
{
  "id": "evt_123",
  "type": "design.completed",
  "data": {
    "design": {
      "id": "design_456",
      "name": "Mon nouveau design",
      "status": "completed",
      "imageUrl": "https://cdn.luneo.app/designs/456.png",
      "metadata": {
        "width": 1024,
        "height": 1024,
        "format": "png",
        "aiModel": "dall-e-3",
        "generationTime": 28
      }
    }
  },
  "createdAt": "2024-01-15T11:35:00Z"
}
```

## 📊 **Rate Limiting & Quotas**

### **Stratégie de Limitation**
```typescript
interface RateLimit {
  // Par minute
  requestsPerMinute: number;
  
  // Par jour
  requestsPerDay: number;
  
  // Par mois
  requestsPerMonth: number;
  
  // Coûts IA
  aiCreditsPerMonth: number;
  
  // Taille upload
  maxUploadSize: number; // bytes
  
  // Webhooks
  maxWebhooks: number;
}

// Plans API
const API_PLANS = {
  free: {
    requestsPerMinute: 10,
    requestsPerDay: 1000,
    requestsPerMonth: 10000,
    aiCreditsPerMonth: 100,
    maxUploadSize: 5 * 1024 * 1024, // 5MB
    maxWebhooks: 2
  },
  starter: {
    requestsPerMinute: 100,
    requestsPerDay: 10000,
    requestsPerMonth: 100000,
    aiCreditsPerMonth: 1000,
    maxUploadSize: 50 * 1024 * 1024, // 50MB
    maxWebhooks: 10
  },
  pro: {
    requestsPerMinute: 1000,
    requestsPerDay: 100000,
    requestsPerMonth: 1000000,
    aiCreditsPerMonth: 10000,
    maxUploadSize: 500 * 1024 * 1024, // 500MB
    maxWebhooks: 50
  },
  enterprise: {
    requestsPerMinute: -1, // Unlimited
    requestsPerDay: -1,
    requestsPerMonth: -1,
    aiCreditsPerMonth: -1,
    maxUploadSize: -1,
    maxWebhooks: -1
  }
};
```

### **Headers de Rate Limiting**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642262400
X-RateLimit-Retry-After: 60
```

## 📚 **Documentation Interactive**

### **Swagger UI**
- **URL** : https://api.luneo.app/docs
- **Fonctionnalités** :
  - Test des endpoints en direct
  - Authentification intégrée
  - Exemples de requêtes/réponses
  - Code généré pour différents langages

### **Redoc**
- **URL** : https://api.luneo.app/redoc
- **Fonctionnalités** :
  - Documentation élégante
  - Navigation améliorée
  - Export PDF
  - Intégration SDK

## 🛡️ **Sécurité & Conformité**

### **Sécurité**
- **HTTPS** obligatoire (TLS 1.3)
- **API Keys** avec rotation automatique
- **OAuth 2.0** avec PKCE
- **CORS** configuré par domaine
- **IP Whitelisting** pour Enterprise
- **Request Signing** pour webhooks

### **Conformité**
- **RGPD** : Anonymisation des données
- **SOC 2** : Audit de sécurité
- **ISO 27001** : Gestion sécurité
- **PCI DSS** : Paiements sécurisés

## 📈 **Monitoring & Analytics**

### **Métriques API**
```typescript
interface ApiMetrics {
  // Performance
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
  
  // Disponibilité
  uptime: number; // %
  errorRate: number; // %
  
  // Utilisation
  requestsPerSecond: number;
  uniqueUsers: number;
  
  // Coûts
  totalCreditsUsed: number;
  averageCostPerRequest: number;
}
```

### **Alertes**
- **Rate limit** dépassé
- **Erreur 5xx** > 1%
- **Latence** > 2s
- **Quota** dépassé
- **Webhook** échec

## 🔧 **SDK & Intégrations**

### **SDK Officiels**
```typescript
// TypeScript/Node.js
import { LuneoApi } from '@luneo/api-client';

const luneo = new LuneoApi({
  apiKey: 'luneo_live_xxx',
  environment: 'production'
});

const design = await luneo.designs.create({
  name: 'My Design',
  prompt: 'Modern logo design'
});
```

```python
# Python
from luneo import LuneoClient

client = LuneoClient(api_key='luneo_live_xxx')

design = client.designs.create(
    name='My Design',
    prompt='Modern logo design'
)
```

```php
// PHP
use Luneo\LuneoClient;

$client = new LuneoClient('luneo_live_xxx');

$design = $client->designs()->create([
    'name' => 'My Design',
    'prompt' => 'Modern logo design'
]);
```

### **Intégrations Populaires**
- **Shopify** : App Store
- **WordPress** : Plugin
- **WooCommerce** : Extension
- **Magento** : Module
- **Webflow** : Custom Code
- **Zapier** : Connector

## 💰 **Modèle de Facturation**

### **Plans API**
```typescript
const BILLING_PLANS = {
  free: {
    price: 0,
    requests: 10000,
    aiCredits: 100,
    support: 'community'
  },
  starter: {
    price: 29, // USD/month
    requests: 100000,
    aiCredits: 1000,
    support: 'email'
  },
  pro: {
    price: 99, // USD/month
    requests: 1000000,
    aiCredits: 10000,
    support: 'priority'
  },
  enterprise: {
    price: 'custom',
    requests: 'unlimited',
    aiCredits: 'unlimited',
    support: 'dedicated'
  }
};
```

### **Facturation à l'Usage**
- **Génération IA** : $0.02 par image
- **Stockage** : $0.10 par GB/mois
- **Webhooks** : $0.01 par événement
- **Support Premium** : $50/mois

## 🚀 **Roadmap API**

### **Phase 1 : MVP (4 semaines)**
- [x] Architecture de base
- [x] Authentification API Keys
- [x] Endpoints designs de base
- [x] Documentation Swagger
- [x] Rate limiting basique

### **Phase 2 : Core Features (6 semaines)**
- [ ] OAuth 2.0 complet
- [ ] Génération IA avancée
- [ ] Webhooks système
- [ ] SDK TypeScript
- [ ] Monitoring complet

### **Phase 3 : Advanced (4 semaines)**
- [ ] SDK Python/PHP
- [ ] Intégrations populaires
- [ ] Analytics avancées
- [ ] Marketplace API
- [ ] Support Enterprise

### **Phase 4 : Scale (2 semaines)**
- [ ] Global CDN
- [ ] Multi-region
- [ ] SLA Enterprise
- [ ] Certification compliance
- [ ] Community ecosystem

## 📋 **Checklist de Déploiement**

### **Pré-Production**
- [ ] Tests d'intégration complets
- [ ] Load testing (10k req/s)
- [ ] Security audit
- [ ] Documentation review
- [ ] SDK validation

### **Production**
- [ ] Monitoring setup
- [ ] Alertes configurées
- [ ] Backup strategy
- [ ] Disaster recovery
- [ ] Support team training

---

**L'API publique Luneo Enterprise sera la référence pour l'intégration IA dans les applications tierces ! 🔑🚀**


