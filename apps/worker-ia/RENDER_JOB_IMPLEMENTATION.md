# Design Render Job Implementation

## Overview

The `design-render` worker job has been implemented in `apps/worker-ia/src/jobs/render-job.ts`. This worker handles inpainting and rendering of design textures using AI services.

## Features Implemented

### 1. Core Functionality
- ✅ **OpenAI Image Edit API** - Primary method for inpainting
- ✅ **Local Diffusion Fallback** - Falls back to local diffusion container if OpenAI fails
- ✅ **Prompt Sanitization** - Uses `@luneo/ai-safety` to sanitize prompts
- ✅ **Image Processing** - Downloads, processes, and resizes images using Sharp

### 2. Image Generation
- ✅ **Preview Generation** - Creates 512x512 preview images
- ✅ **High-Resolution Generation** - Creates 2048x2048 high-res images
- ✅ **Normal Map Generation** - Optional normal map generation from textures
- ✅ **Roughness Map Generation** - Optional roughness map generation

### 3. Storage & Database
- ✅ **Cloudinary Integration** - Uploads to Cloudinary if configured
- ✅ **Local Storage Fallback** - Falls back to local storage if Cloudinary unavailable
- ✅ **Prisma Updates** - Updates Design record with:
  - `compositeTextureUrl` - Main composite texture URL
  - `previewUrl` - Preview image URL
  - `highResUrl` - High-resolution image URL
  - `costTokens` - Tokens used for generation
  - `costCents` - Cost in cents
  - `metadata` - Additional metadata including normal/roughness maps

### 4. Cost & Token Management
- ✅ **Token Tracking** - Tracks tokens used per job
- ✅ **Cost Calculation** - Calculates cost based on provider and tokens
- ✅ **Token Limits** - Enforces `MAX_TOKENS_PER_JOB` limit (default: 10000)
- ✅ **Dry Run Mode** - Supports dry-run mode for testing

### 5. Reliability Features
- ✅ **Circuit Breaker** - Implements circuit breaker pattern for API calls
  - Threshold: 5 failures (configurable via `CIRCUIT_BREAKER_THRESHOLD`)
  - Timeout: 60s (configurable via `CIRCUIT_BREAKER_TIMEOUT`)
- ✅ **Retries** - BullMQ handles retries with exponential backoff
- ✅ **Tenant Concurrency Limits** - Enforces per-tenant concurrency limits
  - Default: 2 concurrent jobs per tenant (configurable via `DEFAULT_TENANT_CONCURRENCY`)
  - Uses Redis for atomic concurrency tracking

### 6. Event System
- ✅ **WebSocket Events** - Emits events via Redis pub/sub:
  - `design.render.completed` - When render completes successfully
  - `design.render.failed` - When render fails
- ✅ **Webhook Support** - Optional webhook triggering (enabled via `WEBHOOK_ENABLED`)

### 7. Observability
- ✅ **OpenTelemetry Tracing** - Full tracing support via span-helpers
- ✅ **Structured Logging** - Winston-based logging with context
- ✅ **Error Handling** - Comprehensive error handling and reporting

## Configuration

### Environment Variables

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...
OPENAI_IMAGE_EDIT_ENABLED=true  # Enable/disable OpenAI Image Edit

# Local Diffusion Fallback
LOCAL_DIFFUSION_URL=http://localhost:7860

# Cost & Limits
MAX_TOKENS_PER_JOB=10000
DRY_RUN_MODE=false

# Circuit Breaker
CIRCUIT_BREAKER_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT=60000

# Tenant Concurrency
DEFAULT_TENANT_CONCURRENCY=2

# Storage
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Webhooks
WEBHOOK_ENABLED=false

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=...
```

## Database Schema Changes

The following fields have been added to the `Design` model:

```prisma
model Design {
  // ... existing fields ...
  
  compositeTextureUrl String? // Composite texture URL for renders
  costTokens Int @default(0)  // Tokens used for AI generation
  
  // ... rest of fields ...
}
```

**Migration Required:**
```bash
cd apps/backend
npx prisma migrate dev --name add_render_fields
```

## Usage

### Adding a Job to the Queue

```typescript
import { Queue } from 'bullmq';

const queue = new Queue('design-render', {
  connection: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
});

await queue.add('render', {
  designId: 'design-123',
  prompt: 'A beautiful landscape with mountains',
  baseTextureUrl: 'https://example.com/base.png',
  maskUrl: 'https://example.com/mask.png', // Optional
  tenantId: 'tenant-123',
  userId: 'user-123', // Optional
  renderOptions: {
    generateNormalMap: true,
    generateRoughnessMap: true,
    quality: 'hd',
    size: '2048x2048',
  },
});
```

## Testing

Tests are available in `apps/worker-ia/src/jobs/__tests__/render-job.test.ts`:

```bash
cd apps/worker-ia
npm test
```

The tests cover:
- Successful job processing
- Prompt blocking
- Token limit enforcement
- Circuit breaker behavior
- Tenant concurrency limits
- OpenAI fallback to local diffusion

## Architecture

### Job Flow

1. **Job Received** → Acquire tenant concurrency slot
2. **Status Update** → Set design status to `PROCESSING`
3. **Prompt Sanitization** → Sanitize and validate prompt
4. **Download Assets** → Download base texture and mask
5. **Generate Composite** → Call OpenAI Image Edit or local diffusion
6. **Process Images** → Generate preview (512) and high-res (2048)
7. **Optional Maps** → Generate normal/roughness maps if requested
8. **Upload Storage** → Upload to Cloudinary or local storage
9. **Update Database** → Update Design record with results
10. **Emit Events** → Emit websocket events and optional webhooks
11. **Release Slot** → Release tenant concurrency slot

### Circuit Breaker States

- **Closed** - Normal operation, requests pass through
- **Open** - Too many failures, requests rejected immediately
- **Half-Open** - Testing if service recovered, allows one request

### Tenant Concurrency

Uses Redis atomic operations to track active jobs per tenant:
- `INCR tenant:concurrency:{tenantId}` - Acquire slot
- `DECR tenant:concurrency:{tenantId}` - Release slot
- Expires after 1 hour to prevent stale locks

## Risk Mitigation

### Cost Explosion Prevention
- ✅ Token limits enforced per job (`MAX_TOKENS_PER_JOB`)
- ✅ Dry-run mode available for testing
- ✅ Cost tracking and reporting
- ✅ Circuit breaker prevents excessive API calls

### Reliability
- ✅ Circuit breaker prevents cascading failures
- ✅ Automatic fallback to local diffusion
- ✅ Retry mechanism with exponential backoff
- ✅ Comprehensive error handling

### Performance
- ✅ Per-tenant concurrency limits prevent resource exhaustion
- ✅ Efficient image processing with Sharp
- ✅ Parallel uploads for multiple images
- ✅ Redis-based concurrency tracking

## Future Enhancements

- [ ] Support for additional AI providers (Stable Diffusion, Midjourney)
- [ ] Batch processing for multiple designs
- [ ] Advanced normal map generation algorithms
- [ ] Caching of generated textures
- [ ] Webhook retry mechanism
- [ ] Metrics and monitoring dashboard integration
