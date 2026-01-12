# @luneo/api-sdk

Official TypeScript SDK for Luneo Public API.

## Installation

```bash
npm install @luneo/api-sdk
# or
yarn add @luneo/api-sdk
# or
pnpm add @luneo/api-sdk
```

## Quick Start

```typescript
import { createClient } from '@luneo/api-sdk';

// Initialize the client
const client = createClient({
  apiKey: 'your_api_key_here',
  baseURL: 'https://api.luneo.com/api/v1', // Optional, defaults to production
});

// Check API health
const health = await client.health();
console.log('API Status:', health.status);

// List products
const products = await client.products.list({ limit: 10 });
console.log('Products:', products.data);

// Get a specific product
const product = await client.products.get('prod_123');
console.log('Product:', product);

// Create a design
const design = await client.designs.create({
  productId: 'prod_123',
  prompt: 'Collier minimaliste or 18k, pendentif coeur',
  options: {
    material: 'gold',
    size: 'M',
  },
});
console.log('Design created:', design.id);

// Wait for design completion
const completedDesign = await client.designs.waitForCompletion(design.id);
console.log('Design completed:', completedDesign.previewUrl);

// Create an order
const order = await client.orders.create({
  items: [
    {
      productId: 'prod_123',
      designId: completedDesign.id,
      quantity: 1,
      unitPrice: 4900,
    },
  ],
  shipping: {
    address: '123 Rue de la Paix, 75001 Paris, France',
    method: 'express',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+33123456789',
  },
  currency: 'EUR',
});
console.log('Order created:', order.id);
console.log('Payment URL:', order.paymentUrl);

// Get analytics
const analytics = await client.analytics.overview();
console.log('Total Revenue:', analytics.totalRevenue);
```

## API Reference

### Client Configuration

```typescript
interface LuneoClientConfig {
  apiKey: string;
  baseURL?: string; // Optional, defaults to 'https://api.luneo.com/api/v1'
  timeout?: number; // Optional, defaults to 30000ms
  retries?: number; // Optional, defaults to 0
}
```

### Products

#### `client.products.list(params?)`

List all products.

**Parameters:**
- `limit?: number` - Number of results (default: 20, max: 100)
- `offset?: number` - Pagination offset (default: 0)
- `category?: string` - Filter by category
- `search?: string` - Search query

**Returns:** `Promise<PaginatedResponse<Product>>`

#### `client.products.get(id)`

Get a specific product by ID.

**Parameters:**
- `id: string` - Product ID

**Returns:** `Promise<Product>`

### Designs

#### `client.designs.create(request)`

Create a new design with AI.

**Parameters:**
- `request: CreateDesignRequest`

**Returns:** `Promise<Design>`

#### `client.designs.get(id)`

Get a specific design by ID.

**Parameters:**
- `id: string` - Design ID

**Returns:** `Promise<Design>`

#### `client.designs.waitForCompletion(id, options?)`

Wait for design completion with polling.

**Parameters:**
- `id: string` - Design ID
- `options?: { interval?: number; timeout?: number }`

**Returns:** `Promise<Design>`

### Orders

#### `client.orders.create(request)`

Create a new order.

**Parameters:**
- `request: CreateOrderRequest`

**Returns:** `Promise<Order>`

#### `client.orders.get(id)`

Get a specific order by ID.

**Parameters:**
- `id: string` - Order ID

**Returns:** `Promise<Order>`

#### `client.orders.cancel(id)`

Cancel an order.

**Parameters:**
- `id: string` - Order ID

**Returns:** `Promise<Order>`

### Analytics

#### `client.analytics.overview(params?)`

Get analytics overview.

**Parameters:**
- `start?: string` - Start date (ISO 8601)
- `end?: string` - End date (ISO 8601)

**Returns:** `Promise<AnalyticsOverview>`

## Error Handling

```typescript
import { LuneoAPIError } from '@luneo/api-sdk';

try {
  const product = await client.products.get('invalid_id');
} catch (error) {
  if (error instanceof LuneoAPIError) {
    console.error('API Error:', error.code, error.message);
    console.error('Details:', error.details);
    console.error('Status Code:', error.statusCode);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Rate Limiting

The SDK automatically handles rate limiting. You can check rate limit information:

```typescript
const rateLimitInfo = client.getRateLimitInfo();
if (rateLimitInfo) {
  console.log('Remaining requests:', rateLimitInfo.remaining);
  console.log('Reset time:', new Date(rateLimitInfo.reset * 1000));
}
```

## TypeScript Support

This SDK is written in TypeScript and provides full type definitions. All types are exported:

```typescript
import {
  Product,
  Design,
  Order,
  CreateDesignRequest,
  CreateOrderRequest,
  // ... and more
} from '@luneo/api-sdk';
```

## License

MIT

## Support

- **Documentation**: https://docs.luneo.com
- **API Reference**: https://docs.luneo.com/api
- **Support Email**: api-support@luneo.com
