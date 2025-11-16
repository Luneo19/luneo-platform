# Shopify Integration

This document describes the Shopify integration module for Luneo Platform, including OAuth onboarding, webhook handling, and Prisma migration.

## Overview

The Shopify integration enables brands to connect their Shopify stores to Luneo Platform, allowing for:
- OAuth-based installation flow
- Secure token storage with encryption
- Webhook processing for product updates
- HMAC signature verification for security

## Architecture

### Module Structure

```
apps/backend/src/modules/ecommerce/shopify/
├── shopify.module.ts          # NestJS module definition
├── shopify.controller.ts      # API endpoints (install, callback, webhooks)
├── shopify.service.ts         # Business logic and Shopify API interactions
├── shopify.service.spec.ts    # Unit tests
└── shopify.controller.spec.ts # Controller tests
```

### Database Schema

The `ShopifyInstall` table stores encrypted installation data:

```prisma
model ShopifyInstall {
  id            String    @id @default(cuid())
  shopDomain    String    @unique
  accessToken   String    // Encrypted access token
  webhookSecret String?   // Encrypted webhook secret
  installedAt   DateTime  @default(now())
  scopes        String[]  // Array of granted scopes
  status        String    @default("active")
  brandId       String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  brand Brand @relation(fields: [brandId], references: [id], onDelete: Cascade)
}
```

## Environment Variables

The following environment variables are required:

### Required

- `SHOPIFY_API_KEY` - Your Shopify app API key
- `SHOPIFY_API_SECRET` - Your Shopify app API secret
- `MASTER_ENCRYPTION_KEY` - 64-character hex string (32 bytes) for encrypting tokens

### Optional

- `SHOPIFY_SCOPES` - Comma-separated list of Shopify scopes (default: `read_products,write_products,read_orders,write_orders`)
- `APP_URL` - Base URL of your application (default: `http://localhost:3000`)
- `FRONTEND_URL` - Frontend URL for redirects (default: `http://localhost:3001`)

### Example `.env` Configuration

```bash
# Shopify Configuration
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders

# Encryption (generate with: openssl rand -hex 32)
MASTER_ENCRYPTION_KEY=your_64_character_hex_string_here

# Application URLs
APP_URL=https://api.luneo.app
FRONTEND_URL=https://app.luneo.app
```

## API Endpoints

### 1. Install Endpoint

**GET** `/api/shopify/install`

Initiates the Shopify OAuth installation flow.

**Query Parameters:**
- `shop` (required) - Shopify shop domain (e.g., `myshop.myshopify.com`)
- `brandId` (required) - Brand ID in Luneo Platform

**Example:**
```
GET /api/shopify/install?shop=myshop.myshopify.com&brandId=brand_123
```

**Response:** Redirects to Shopify OAuth authorization page

### 2. OAuth Callback

**GET** `/api/shopify/callback`

Handles the OAuth callback from Shopify after user authorization.

**Query Parameters:**
- `code` (required) - OAuth authorization code
- `shop` (required) - Shopify shop domain
- `state` (required) - CSRF nonce for validation
- `brandId` (required) - Brand ID

**Response:** Redirects to frontend with success/error status

### 3. Webhook Endpoint

**POST** `/api/shopify/webhooks/products`

Receives Shopify webhooks for product updates.

**Headers:**
- `x-shopify-shop-domain` (required) - Shop domain
- `x-shopify-hmac-sha256` (required) - HMAC signature for verification
- `x-shopify-topic` (required) - Webhook topic (e.g., `products/update`)

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

## Security Features

### 1. Token Encryption

All access tokens and webhook secrets are encrypted using AES-256-GCM before storage:
- Uses `MASTER_ENCRYPTION_KEY` from environment
- PBKDF2 key derivation with 100,000 iterations
- Unique salt per encryption operation
- Authentication tag for integrity verification

### 2. HMAC Verification

Webhook signatures are verified using HMAC-SHA256:
- Compares received HMAC with calculated HMAC
- Uses timing-safe comparison to prevent timing attacks
- Requires webhook secret stored during installation

### 3. CSRF Protection

OAuth flow includes nonce validation:
- Random nonce generated during install
- Stored in cache with 10-minute TTL
- Validated during callback to prevent CSRF attacks

### 4. Scope Validation

Required scopes are validated before installation:
- Default required: `read_products`, `write_products`
- Installation fails if insufficient permissions granted

## Installation Flow

1. **User initiates installation:**
   ```
   GET /api/shopify/install?shop=myshop.myshopify.com&brandId=brand_123
   ```

2. **System generates OAuth URL:**
   - Creates nonce for CSRF protection
   - Builds Shopify OAuth URL with scopes
   - Redirects user to Shopify

3. **User authorizes on Shopify:**
   - Shopify redirects back with `code` and `state`

4. **System processes callback:**
   - Validates nonce (CSRF protection)
   - Exchanges code for access token
   - Validates granted scopes
   - Encrypts and stores tokens
   - Enables webhooks

5. **Webhooks enabled:**
   - Registers `products/update` webhook with Shopify
   - Stores encrypted webhook secret

## Webhook Processing

### HMAC Verification Process

1. Extract raw request body (must be raw for HMAC calculation)
2. Retrieve webhook secret for shop domain
3. Calculate HMAC-SHA256 of raw body with secret
4. Compare calculated HMAC with received HMAC header
5. Reject if signatures don't match

### Replay Protection

**TODO:** Implement replay protection using:
- Nonce tracking in cache/database
- Timestamp validation (reject old webhooks)
- Idempotency keys for duplicate detection

## Migration

### Running the Migration

```bash
cd apps/backend
npx prisma migrate dev --name add_shopify_install
```

### Migration File

The migration creates:
- `ShopifyInstall` table with indexes
- Foreign key relationship to `Brand` table
- Unique constraint on `shopDomain`

## Testing

### Unit Tests

Run unit tests:
```bash
npm test shopify.service.spec.ts
npm test shopify.controller.spec.ts
```

### Integration Tests

**TODO:** Add integration tests for:
- Complete OAuth flow with mocked Shopify API
- Webhook processing with valid/invalid signatures
- Error handling scenarios

## Shopify App Block Snippet

The widget inject snippet is located at:
```
apps/shopify/snippets/widget-inject.liquid
```

### Usage in Shopify Theme

```liquid
{% render 'widget-inject', shop: shop %}
```

### Features

- Loads CDN script with `data-shop` attribute
- Generates signed nonce using HMAC-SHA256
- Includes timestamp for freshness validation
- Async/defer loading for performance

## Troubleshooting

### Common Issues

1. **"MASTER_ENCRYPTION_KEY not configured"**
   - Ensure `MASTER_ENCRYPTION_KEY` is set in environment
   - Must be exactly 64 hex characters (32 bytes)

2. **"Invalid webhook signature"**
   - Verify webhook secret is stored correctly
   - Ensure raw body is used for HMAC calculation
   - Check that webhook secret matches Shopify configuration

3. **"Invalid state parameter"**
   - Nonce may have expired (10-minute TTL)
   - Ensure same `brandId` is used in install and callback

4. **"Insufficient scopes granted"**
   - User must grant required scopes during OAuth
   - Check `SHOPIFY_SCOPES` environment variable

## Production Checklist

- [ ] Set `MASTER_ENCRYPTION_KEY` in production environment
- [ ] Configure `SHOPIFY_API_KEY` and `SHOPIFY_API_SECRET`
- [ ] Set `APP_URL` to production API URL
- [ ] Set `FRONTEND_URL` to production frontend URL
- [ ] Run Prisma migration in production database
- [ ] Test OAuth flow end-to-end
- [ ] Verify webhook HMAC verification works
- [ ] Monitor webhook processing logs
- [ ] Set up alerts for webhook failures

## Related Documentation

- [Shopify OAuth Documentation](https://shopify.dev/docs/apps/auth/oauth)
- [Shopify Webhooks Guide](https://shopify.dev/docs/apps/webhooks)
- [Prisma Migration Guide](https://www.prisma.io/docs/guides/migrate)
