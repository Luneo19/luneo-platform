# Runbook: Convert AR Model (GLB to USDZ)

**Last Updated:** November 16, 2025  
**Service:** AR Conversion (`apps/frontend/src/app/api/ar/`)  
**Tool:** USDZ Converter (`tools/usdz-converter/`)

---

## Overview

This runbook covers the process of converting 3D models (GLB format) to AR-ready formats (USDZ for iOS, GLB optimized for Android).

---

## Prerequisites

- ✅ Design with completed 3D model (GLB format)
- ✅ Access to conversion service/API
- ✅ Storage configured (Cloudinary/S3)
- ✅ Redis cache accessible (for caching)

---

## Conversion Methods

### Method 1: API Endpoint (Recommended)

Use the built-in API endpoint for automatic conversion:

```bash
# Convert GLB to USDZ
curl -X POST https://api.luneo.app/api/ar/convert-usdz \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "glb_url": "https://cdn.luneo.app/models/design-123.glb",
    "product_name": "Custom T-Shirt",
    "scale": 1.0,
    "ar_model_id": "ar-model-123"
  }'
```

**Response:**
```json
{
  "success": true,
  "usdz_url": "https://cdn.luneo.app/ar/model-123.usdz",
  "file_size": 2456789,
  "conversion_time": 3456,
  "cached": false
}
```

### Method 2: Manual Conversion (macOS)

For manual conversion on macOS:

```bash
# 1. Install USDZ Converter (macOS only)
# Download from Apple Developer Tools

# 2. Convert GLB to USDZ
usdzconvert input.glb output.usdz

# 3. Verify conversion
file output.usdz
# Should show: output.usdz: USDZ

# 4. Upload to storage
aws s3 cp output.usdz s3://luneo-ar-models/design-123.usdz
```

### Method 3: Docker Container

Use the USDZ converter Docker container:

```bash
# 1. Build converter image
cd tools/usdz-converter
docker build -t luneo-usdz-converter .

# 2. Run conversion
docker run --rm \
  -v $(pwd)/input:/input \
  -v $(pwd)/output:/output \
  luneo-usdz-converter \
  /input/model.glb /output/model.usdz

# 3. Verify output
ls -lh output/model.usdz
```

---

## Step-by-Step Conversion Process

### 1. Verify Input Model

```bash
# Check GLB file exists and is valid
curl -I https://cdn.luneo.app/models/design-123.glb

# Expected: HTTP 200 OK
# Content-Type: model/gltf-binary
```

### 2. Initiate Conversion

**Via Frontend:**
1. Navigate to design page
2. Click "View in AR" button
3. System automatically converts if USDZ doesn't exist

**Via API:**
```bash
POST /api/ar/convert-usdz
```

**Via Worker (Background):**
```bash
# Job is automatically queued when design is completed
# Check queue status:
redis-cli LLEN bull:ar-conversion:waiting
```

### 3. Monitor Conversion

```bash
# Check conversion status
curl https://api.luneo.app/api/ar/convert-2d-to-3d?task_id=xxx \
  -H "Authorization: Bearer $TOKEN"

# Response:
{
  "success": true,
  "status": "processing" | "completed" | "failed",
  "progress": 45,
  "estimated_time": "2 minutes"
}
```

### 4. Verify Output

```bash
# Check USDZ file exists
curl -I https://cdn.luneo.app/ar/model-123.usdz

# Expected: HTTP 200 OK
# Content-Type: model/vnd.usdz+zip

# Verify file size (should be reasonable)
curl -I https://cdn.luneo.app/ar/model-123.usdz | grep Content-Length
```

---

## Troubleshooting

### Issue: Conversion Fails

**Symptoms:**
- API returns `success: false`
- Error message in response

**Diagnosis:**
```bash
# Check conversion service logs
tail -f /var/log/luneo/usdz-converter.log

# Check Redis cache
redis-cli GET ar:conversion:design-123
```

**Common Causes:**

1. **Invalid GLB File**
   ```bash
   # Verify GLB is valid
   gltf-validator input.glb
   ```

2. **Service Unavailable**
   ```bash
   # Check converter service health
   curl https://converter.luneo.app/health
   ```

3. **Storage Issues**
   ```bash
   # Check Cloudinary/S3 credentials
   # Verify storage quota not exceeded
   ```

**Solution:**
1. Verify GLB file is valid and accessible
2. Check conversion service is running
3. Verify storage credentials and quota
4. Retry conversion with exponential backoff

---

### Issue: Conversion Takes Too Long

**Symptoms:**
- Conversion stuck in "processing" status
- Timeout errors

**Diagnosis:**
```bash
# Check conversion queue
redis-cli LLEN bull:ar-conversion:active

# Check worker logs
tail -f /var/log/luneo/worker-ia.log | grep ar-conversion
```

**Solution:**
1. Check worker is processing jobs
2. Verify model complexity (large models take longer)
3. Increase timeout settings if needed
4. Consider optimizing GLB before conversion

---

### Issue: USDZ File Too Large

**Symptoms:**
- USDZ file > 50MB
- iOS Quick Look fails to load

**Solution:**
```bash
# Optimize GLB before conversion
gltf-pipeline -i input.glb -o optimized.glb \
  --draco.compressionLevel 7 \
  --textureCompression webp

# Then convert optimized GLB
usdzconvert optimized.glb output.usdz
```

---

## Optimization Tips

### 1. Pre-Conversion Optimization

```bash
# Use gltf-pipeline to optimize GLB
gltf-pipeline -i model.glb -o optimized.glb \
  --draco.compressionLevel 7 \
  --textureCompression webp \
  --textureResolution 2048
```

### 2. Texture Optimization

- Use WebP format for textures
- Limit texture resolution to 2048x2048
- Use mipmaps for better performance

### 3. Geometry Optimization

- Reduce polygon count
- Use Draco compression
- Remove unused materials/textures

---

## Caching Strategy

### Cache Key Format

```
ar:usdz:{designId}:{textureHash}
```

### Cache TTL

- **Successful conversions**: 30 days
- **Failed conversions**: 1 hour (to allow retry)

### Cache Invalidation

```bash
# Invalidate cache for specific design
redis-cli DEL ar:usdz:design-123:*

# Or via API
DELETE /api/ar/cache/design-123
```

---

## Monitoring

### Key Metrics

- **Conversion Success Rate**: Target > 95%
- **Average Conversion Time**: Target < 30 seconds
- **Cache Hit Rate**: Target > 60%
- **File Size**: Monitor for optimization opportunities

### Alert Thresholds

- ⚠️ **Warning**: Success rate < 90%
- 🚨 **Critical**: Success rate < 80%
- ⚠️ **Warning**: Average time > 60 seconds
- 🚨 **Critical**: Average time > 120 seconds

---

## Related Documentation

- [AR Implementation Guide](../../docs/AR_IMPLEMENTATION.md)
- [Architecture: AR Conversion Flow](../../ARCHITECTURE.md#ar-conversion-flow)
- [USDZ Converter Tool](../../tools/usdz-converter/README.md)

---

**Runbook Maintained By:** AR Team  
**Last Review:** November 16, 2025  
**Next Review:** December 16, 2025
