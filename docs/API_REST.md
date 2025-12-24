# 📚 Documentation API REST

## Vue d'ensemble

Cette documentation décrit les routes API REST Next.js disponibles dans l'application Luneo.

---

## 🔐 Authentification

Toutes les routes protégées nécessitent une authentification via Supabase. Le token est extrait des cookies ou headers `Authorization`.

---

## 📦 Routes Disponibles

### Products

#### `POST /api/products/[id]/zones`
Crée ou met à jour les zones d'un produit.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "zones": [
    {
      "name": "Zone 1",
      "type": "TEXT",
      "positionX": 0,
      "positionY": 0,
      "positionZ": 0,
      "uvMinU": 0,
      "uvMaxU": 1,
      "uvMinV": 0,
      "uvMaxV": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "zones": [...]
  }
}
```

#### `GET /api/products/[id]/zones`
Récupère les zones d'un produit.

**Response:**
```json
{
  "success": true,
  "data": {
    "zones": [...]
  }
}
```

#### `POST /api/products/[id]/upload-model`
Upload un modèle 3D pour un produit.

**Body:**
```json
{
  "fileUrl": "https://example.com/model.glb",
  "fileName": "model.glb",
  "fileSize": 1024000,
  "fileType": "model/gltf-binary"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "productId": "prod_123",
    "modelUrl": "https://s3.../model.glb",
    "uploadedAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### Customization

#### `POST /api/customization/generate`
Génère une personnalisation.

**Body:**
```json
{
  "productId": "prod_123",
  "zoneId": "zone_456",
  "prompt": "Hello World",
  "font": "Arial",
  "color": "#FF0000",
  "size": 24
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "custom_123",
    "status": "GENERATING",
    "jobId": "job_456"
  }
}
```

---

### Production

#### `GET /api/production/status/[jobId]`
Vérifie le statut d'un job de production.

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "job_123",
    "status": "COMPLETED",
    "progress": 100,
    "files": [
      {
        "url": "https://s3.../file.pdf",
        "format": "pdf",
        "size": 1024000
      }
    ]
  }
}
```

---

### POD (Print-on-Demand)

#### `POST /api/pod/[provider]/submit`
Soumet une commande à un provider POD.

**Path Parameters:**
- `provider`: `printful` | `printify` | `gelato`

**Body:**
```json
{
  "orderId": "order_123",
  "items": [
    {
      "itemId": "item_456",
      "productId": "prod_789",
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "podOrderId": "pod_123",
    "status": "submitted"
  }
}
```

---

### Integrations

#### `POST /api/integrations/shopify/webhook`
Webhook Shopify pour synchronisation.

#### `POST /api/integrations/woocommerce/webhook`
Webhook WooCommerce pour synchronisation.

---

### Reports

#### `POST /api/reports/upload`
Upload un rapport généré.

#### `DELETE /api/reports/upload`
Supprime un rapport.

---

## 🛡️ Gestion d'erreurs

Toutes les routes utilisent `ApiResponseBuilder` pour des réponses standardisées :

**Success:**
```json
{
  "success": true,
  "data": {...}
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE"
  }
}
```

---

## 📝 Notes

- Toutes les routes sont typées avec TypeScript
- La validation est effectuée avec Zod
- Les erreurs sont loggées automatiquement
- Rate limiting est appliqué sur certaines routes

---

*Dernière mise à jour: $(date)*

