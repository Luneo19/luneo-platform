# AR Implementation - GLTF to USDZ Conversion & WebXR

## Overview

This document describes the implementation of AR (Augmented Reality) support for designs, including GLB to USDZ conversion and WebXR viewing capabilities.

## Architecture

### Components

1. **USDZ Converter Service** (`tools/usdz-converter`)
   - Docker container for GLB to USDZ conversion
   - Uses gltf-pipeline for GLB optimization
   - Texture optimization (resize, mipmaps, compression)
   - Python-based converter script

2. **Backend Service** (`apps/backend/src/modules/designs/services/usdz-converter.service.ts`)
   - Handles conversion requests
   - Manages caching via Redis
   - Uploads converted USDZ to Cloudinary
   - Generates signed CDN URLs with short expiry

3. **API Endpoint** (`GET /api/designs/:id/ar`)
   - Returns signed USDZ URL for AR viewing
   - Platform detection (iOS/Android/WebXR)
   - Short expiry URLs (1 hour)

4. **Frontend Components**
   - `ARViewer.tsx`: Main AR viewer component
   - `ar/viewer/page.tsx`: WebXR viewer page
   - Platform-specific AR activation

## Features

### ✅ Implemented

- [x] USDZ converter Docker container
- [x] GLB optimization with gltf-pipeline
- [x] Texture optimization (resize, mipmaps)
- [x] Redis caching for converted USDZ (by texture hash)
- [x] API endpoint for AR URLs
- [x] iOS Quick Look support (`rel="ar"`)
- [x] Android Scene Viewer support
- [x] WebXR viewer component
- [x] Platform detection
- [x] Signed CDN URLs with expiry

### ⚠️ Limitations

1. **Full USDZ Conversion**
   - Apple's official `usdz-converter` requires macOS
   - Current implementation optimizes GLB as placeholder
   - Production options:
     - Use macOS CI/CD runner (GitHub Actions)
     - Use cloud service with macOS runtime
     - Use alternative Python libraries (pxr/USD)

2. **Device Compatibility**
   - Requires manual QA on iPhone models
   - WebXR support varies by browser
   - Android Scene Viewer requires Google Play Services

## Usage

### Backend API

```typescript
GET /api/designs/:id/ar

Response:
{
  usdzUrl: string;        // Signed CDN URL (expires in 1 hour)
  expiresAt: string;      // ISO timestamp
  platform: 'ios' | 'android' | 'webxr';
  cacheKey?: string;
  optimized?: boolean;
}
```

### Frontend Component

```tsx
import { ARViewer } from '@/components/ar/ARViewer';

<ARViewer 
  designId="design-123"
  designName="My Design"
/>
```

## Caching Strategy

- **Cache Key**: `usdz:{designId}:{textureHash}`
- **TTL**: 7 days
- **Hash Calculation**: SHA256 of sorted texture URLs
- **Invalidation**: Manual via `clearCache()` method

## Docker Setup

The USDZ converter service is included in `docker-compose.yml`:

```yaml
usdz-converter:
  build:
    context: ./tools/usdz-converter
    dockerfile: Dockerfile
  volumes:
    - usdz_cache:/app/cache
```

## Environment Variables

```bash
# Backend
USDZ_CONVERTER_URL=http://usdz-converter:3002  # Optional
USDZ_CACHE_ENABLED=true                        # Default: true

# Cloudinary (for signed URLs)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Testing

### Manual QA Checklist

- [ ] iOS iPhone (Safari): Quick Look opens correctly
- [ ] iOS iPad (Safari): Quick Look opens correctly
- [ ] Android Chrome: Scene Viewer opens correctly
- [ ] Android Firefox: Fallback behavior works
- [ ] Desktop Chrome: WebXR viewer loads
- [ ] Desktop Safari: Fallback to download
- [ ] Cache hit: Second request uses cached USDZ
- [ ] Cache miss: New conversion works correctly
- [ ] Signed URL expiry: Expired URLs are rejected

## Production Considerations

1. **macOS Conversion Service**
   - Set up GitHub Actions with macOS runner
   - Or use cloud service (AWS Lambda with macOS if available)
   - Or integrate with Apple's USDZ conversion API (if available)

2. **Performance**
   - Monitor conversion times
   - Set up queue for long-running conversions
   - Consider async conversion with webhook notification

3. **Error Handling**
   - Graceful fallback to GLB if USDZ conversion fails
   - User-friendly error messages
   - Logging and monitoring

4. **Security**
   - Validate design access permissions
   - Rate limiting on AR endpoint
   - Signed URL expiry enforcement

## Future Enhancements

- [ ] Full USDZ conversion with macOS service
- [ ] Async conversion with webhook notifications
- [ ] AR placement hints/metadata
- [ ] AR analytics (views, placements)
- [ ] Multi-model AR scenes
- [ ] AR filters/effects
