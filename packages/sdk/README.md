# @luneo/sdk

SDK TypeScript pour interagir avec la plateforme Luneo (API REST publiques, gestion des designs & commandes).

## Installation

```bash
pnpm add @luneo/sdk
# ou
npm install @luneo/sdk
```

## Usage rapide

```ts
import { createClient } from '@luneo/sdk';

const luneo = createClient({
  baseUrl: 'https://app.luneo.app/api/v1',
  apiKey: process.env.LUNEO_API_KEY!,
  organisationId: 'brand_123',
});

// Lister les designs
const designs = await luneo.listDesigns({ status: 'completed', page: 1, pageSize: 20 });

// Créer un design via IA
const design = await luneo.createDesign({
  prompt: 'Sneaker futuriste dégradé violet/bleu, éclairage studio',
  productId: 'prod_sneaker_xl',
  options: {
    aspect_ratio: '1:1',
    finish: 'glossy',
  },
});

// Lancer un rendu haute définition
await luneo.generateHighRes({ designId: design.id, resolution: '4k' });
```

## Configuration

| Option            | Description                                     | Par défaut                        |
| ----------------- | ----------------------------------------------- | --------------------------------- |
| `baseUrl`         | URL de l'API Luneo (`/api/v1`)                  | `https://app.luneo.app/api/v1`    |
| `apiKey`          | Jeton API privé                                 | `undefined`                       |
| `organisationId`  | ID organisation / brand (header `x-luneo-organisation`) | `undefined`                       |
| `fetch`           | Implémentation `fetch` personnalisée            | [`cross-fetch`](https://github.com/lquixada/cross-fetch) |

## Méthodes disponibles

- `listDesigns(params)` – pagination, filtrage par statut.  
- `createDesign(payload)` – lance une génération IA avec options.  
- `generateHighRes({ designId, resolution })` – rendu haute définition.  
- `listOrders(params)` – liste des commandes (production / fulfilment).  
- `request(path, options)` – méthode générique si besoin de routes non couvertes.

## Notes

- L'API nécessite un header `Authorization: Bearer <API_KEY>`.  
- Pour les intégrations multi-marques, renseigner `organisationId`.  
- Les types sont partagés via `@luneo/types` (interfaces `Design`, `Order`, etc.).

## Roadmap

- Gestion des webhooks (signature + helpers).  
- Support GraphQL / gRPC quand disponibles.  
- Méthodes haut niveau (ex. synchronisation e-commerce, pipelines batch).

