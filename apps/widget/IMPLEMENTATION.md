# Widget SDK Implementation Summary

## Overview

Complete implementation of the Luneo Widget SDK with secure embed token generation, iframe handshake, and nonce validation.

## Components

### 1. Widget SDK (`apps/widget/`)

- **Build System**: tsup for UMD + ESM + CJS bundles
- **Entry Point**: `src/index.ts`
- **Main Class**: `LuneoWidget`
- **Features**:
  - Token fetching from backend
  - Secure iframe creation with sandbox attributes
  - PostMessage handshake with nonce validation
  - Origin verification
  - Error handling and cleanup

### 2. Backend Token Endpoint (`apps/backend/src/modules/widget/`)

- **Controller**: `widget.controller.ts`
- **Service**: `widget.service.ts`
- **Module**: `widget.module.ts`
- **Endpoint**: `GET /api/v1/embed/token?shop=...`

**Features**:
- Validates shop installation (ShopifyInstall table)
- Generates short-lived JWT (5 minutes)
- Creates one-time nonce (stored in Redis)
- Origin validation
- Single-use nonce enforcement (prevents replay attacks)

### 3. Security Features

- **Short-lived tokens**: 5-minute expiry
- **One-time nonces**: Stored in Redis, marked as used after validation
- **Origin validation**: Nonces are bound to requesting origin
- **Sandboxed iframe**: Restricted permissions via sandbox attribute
- **CSP headers**: Updated to allow widget CDN

### 4. CSP Headers

Updated in `apps/backend/src/main.ts`:
- `scriptSrc`: Added `https://widget.luneo.app`
- `connectSrc`: Added `https://widget.luneo.app`
- `frameSrc`: Added `https://widget.luneo.app`
- `frameAncestors`: Added Shopify domains

### 5. E2E Tests

Location: `apps/backend/tests/e2e/widget-handshake.spec.ts`

Tests cover:
- Token generation
- Invalid shop rejection
- Missing parameter handling
- Nonce uniqueness
- Widget URL inclusion

### 6. Documentation

- `README.md`: Usage guide and API reference
- `example-snippet.html`: Complete integration example
- `IMPLEMENTATION.md`: This file

## Usage

### Basic Integration

```html
<script src="https://cdn.luneo.app/widget/luneo-widget.js"></script>
<script>
  LuneoWidget.init({
    shop: 'your-shop.myshopify.com',
    tokenUrl: 'https://api.luneo.app/api/v1/embed/token',
    container: '#widget-container',
    onReady: () => console.log('Ready!'),
  });
</script>
```

### Backend Endpoint

```
GET /api/v1/embed/token?shop=myshop.myshopify.com
Headers: Origin: https://myshop.myshopify.com

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "nonce": "a1b2c3d4e5f6...",
  "expiresIn": 300,
  "widgetUrl": "https://widget.luneo.app"
}
```

## Security Considerations

1. **Token Expiry**: 5 minutes prevents long-lived token abuse
2. **Nonce Expiry**: 10 minutes (longer than token for handshake window)
3. **Single-use Nonces**: Prevents replay attacks
4. **Origin Binding**: Nonces are validated against requesting origin
5. **Shop Validation**: Only active Shopify installations can get tokens

## Build & Deploy

### Widget SDK

```bash
cd apps/widget
npm install
npm run build
```

Outputs:
- `dist/index.cjs` - CommonJS
- `dist/index.mjs` - ES Module
- `dist/index.js` - UMD/IIFE (for CDN)
- `dist/index.d.ts` - TypeScript definitions

### Backend

The widget module is automatically included when the backend starts. Ensure:
- Redis is configured and running
- `ShopifyInstall` table exists with active installations
- JWT secret is set in environment variables

## Environment Variables

### Backend

- `JWT_SECRET`: Secret for signing embed tokens
- `WIDGET_CDN_URL`: Widget CDN URL (default: `https://widget.luneo.app`)
- `REDIS_URL`: Redis connection string

## Testing

```bash
# Backend E2E tests
cd apps/backend
npm run test:e2e

# Widget SDK tests
cd apps/widget
npm test
```

## Next Steps

1. Deploy widget CDN with built files
2. Configure widget iframe application
3. Add widget route handling in frontend/widget app
4. Implement nonce validation endpoint in widget iframe
5. Add monitoring and logging
