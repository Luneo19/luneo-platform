# SDK Luneo – Guide d’intégration

## 1. Installation

```bash
pnpm add @luneo/sdk
# ou npm install @luneo/sdk
```

Prérequis :
- Node.js ≥ 18
- Obtention d’une clé API (Dashboard → Settings → API)

## 2. Configuration de base

```ts
import { createClient } from '@luneo/sdk';

const luneo = createClient({
  baseUrl: process.env.LUNEO_API_URL ?? 'https://app.luneo.app/api/v1',
  apiKey: process.env.LUNEO_API_KEY!,
  organisationId: 'brand_123', // optionnel
});
```

## 3. Exemples

### Lister les designs
```ts
const designs = await luneo.listDesigns({ status: 'completed', page: 1, pageSize: 20 });
```

### Créer un design (IA)
```ts
const design = await luneo.createDesign({
  prompt: 'Concept sneaker gradient violet/bleu',
  productId: 'prod_sneaker_xl',
  options: {
    aspect_ratio: '1:1',
    finish: 'glossy',
  },
});
```

### Lancer un rendu haute définition
```ts
await luneo.generateHighRes({ designId: design.id, resolution: '4k' });
```

### Lister les commandes
```ts
const orders = await luneo.listOrders({ status: 'processing', page: 1 });
```

## 4. Erreurs & gestion

Les méthodes lèvent une `Error` avec le message retourné par l’API en cas d’échec.  
Pour les routes non couvertes, utiliser `client.request(path, options)`.

## 5. Roadmap SDK

- Gestion webhooks (signature HMAC).  
- Helpers e-commerce (Shopify/WooCommerce).  
- Support streaming pour générations IA.

Pour questions / feedbacks : `devrel@luneo.app`.

