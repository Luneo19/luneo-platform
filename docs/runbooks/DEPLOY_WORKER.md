# Runbook: Deploy Worker Service

**Last Updated:** November 16, 2025  
**Service:** Worker-IA (`apps/worker-ia/`)  
**Environment:** Production

---

## Overview

This runbook covers the process of deploying the Worker-IA service, which processes background jobs for image generation, 3D rendering, and AR conversion.

---

## Prerequisites

- ✅ Access to Railway dashboard (or deployment platform)
- ✅ Environment variables configured
- ✅ Redis instance accessible
- ✅ Database migrations applied
- ✅ Docker installed (if deploying via Docker)

---

## Pre-Deployment Checklist

- [ ] Verify Redis connection is healthy
- [ ] Check database migrations are up to date
- [ ] Confirm environment variables are set
- [ ] Review recent commits/changes
- [ ] Notify team of deployment window

---

## Deployment Steps

### Option 1: Railway (Recommended)

```bash
# 1. Navigate to worker directory
cd apps/worker-ia

# 2. Build locally to verify (optional)
npm run build

# 3. Deploy via Railway CLI
railway up

# Or deploy via Railway dashboard:
# - Go to Railway dashboard
# - Select worker-ia service
# - Click "Deploy" → "Deploy from GitHub"
```

### Option 2: Docker

```bash
# 1. Build Docker image
docker build -t luneo-worker-ia:latest -f apps/worker-ia/Dockerfile .

# 2. Tag for registry (if using)
docker tag luneo-worker-ia:latest registry.example.com/luneo-worker-ia:latest

# 3. Push to registry
docker push registry.example.com/luneo-worker-ia:latest

# 4. Deploy to production
# (Follow your container orchestration platform's deployment process)
```

### Option 3: Manual Server Deployment

```bash
# 1. SSH into production server
ssh user@worker-production.example.com

# 2. Navigate to deployment directory
cd /opt/luneo/worker-ia

# 3. Pull latest code
git pull origin main

# 4. Install dependencies
npm ci --production

# 5. Build
npm run build

# 6. Restart service (PM2 example)
pm2 restart luneo-worker-ia

# Or with systemd:
sudo systemctl restart luneo-worker-ia
```

---

## Post-Deployment Verification

### 1. Check Service Health

```bash
# Check if worker is running
curl https://worker.luneo.app/health

# Expected response:
# {"status":"ok","service":"worker-ia","version":"1.0.0"}
```

### 2. Verify Queue Processing

```bash
# Check Redis queue status
redis-cli -h $REDIS_HOST
> LLEN bull:render-processing:waiting
> LLEN bull:render-processing:active
> LLEN bull:render-processing:completed

# Should see jobs being processed
```

### 3. Monitor Logs

```bash
# Railway logs
railway logs --service worker-ia

# Or Docker logs
docker logs -f luneo-worker-ia

# Or PM2 logs
pm2 logs luneo-worker-ia
```

### 4. Test Job Processing

```bash
# Create a test render job via API
curl -X POST https://api.luneo.app/api/v1/designs/test/render \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"designId": "test-design-id", "type": "2d"}'

# Monitor logs to see job being processed
```

---

## Rollback Procedure

If deployment fails or issues are detected:

### Railway

```bash
# 1. Go to Railway dashboard
# 2. Select worker-ia service
# 3. Click "Deployments" → Select previous working version
# 4. Click "Redeploy"
```

### Docker

```bash
# 1. Tag previous version
docker tag luneo-worker-ia:previous luneo-worker-ia:latest

# 2. Redeploy
docker-compose up -d worker-ia
```

### Manual Server

```bash
# 1. SSH into server
ssh user@worker-production.example.com

# 2. Checkout previous version
cd /opt/luneo/worker-ia
git checkout <previous-commit-hash>

# 3. Rebuild and restart
npm ci --production
npm run build
pm2 restart luneo-worker-ia
```

---

## Troubleshooting

### Issue: Worker Not Processing Jobs

**Symptoms:**
- Jobs stuck in queue
- No logs showing job processing

**Diagnosis:**
```bash
# Check Redis connection
redis-cli -h $REDIS_HOST ping
# Should return: PONG

# Check worker process
ps aux | grep worker-ia
# Should show running process

# Check logs for errors
tail -f /var/log/luneo/worker-ia.log
```

**Solution:**
1. Verify `REDIS_URL` environment variable
2. Check Redis instance is accessible
3. Restart worker service
4. Check for error messages in logs

---

### Issue: High Memory Usage

**Symptoms:**
- Worker crashes
- OOM (Out of Memory) errors

**Diagnosis:**
```bash
# Check memory usage
free -h
top -p $(pgrep -f worker-ia)
```

**Solution:**
1. Reduce concurrency: Set `WORKER_CONCURRENCY=3` (default: 5)
2. Increase server memory
3. Enable job cleanup: `REMOVE_ON_COMPLETE=50`
4. Monitor memory-intensive operations (3D rendering)

---

### Issue: Jobs Failing

**Symptoms:**
- High failure rate in queue
- Error logs showing failures

**Diagnosis:**
```bash
# Check failed jobs
redis-cli -h $REDIS_HOST
> LLEN bull:render-processing:failed

# Get error details
> LRANGE bull:render-processing:failed 0 10
```

**Solution:**
1. Review error logs for patterns
2. Check external API keys (OpenAI, Cloudinary)
3. Verify storage permissions
4. Check network connectivity to external services

---

## Monitoring

### Key Metrics to Watch

- **Queue Depth**: Number of jobs waiting
- **Processing Rate**: Jobs completed per minute
- **Error Rate**: Percentage of failed jobs
- **Memory Usage**: Current memory consumption
- **CPU Usage**: Current CPU utilization
- **Job Duration**: Average processing time

### Alert Thresholds

- ⚠️ **Warning**: Queue depth > 100
- 🚨 **Critical**: Queue depth > 500
- ⚠️ **Warning**: Error rate > 5%
- 🚨 **Critical**: Error rate > 10%
- ⚠️ **Warning**: Memory usage > 80%
- 🚨 **Critical**: Memory usage > 95%

---

## Environment Variables

Required environment variables:

```bash
# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-password

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# AI Services
OPENAI_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...

# Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Worker Configuration
WORKER_CONCURRENCY=5
WORKER_STORAGE_PATH=/tmp/luneo-render
LOG_LEVEL=info
```

---

## Related Documentation

- [Worker README](../../apps/worker-ia/README.md)
- [Architecture Overview](../../ARCHITECTURE.md#worker-render-pipeline)
- [Troubleshooting Guide](../../docs/troubleshooting/WORKER_ISSUES.md)

---

**Runbook Maintained By:** DevOps Team  
**Last Review:** November 16, 2025  
**Next Review:** December 16, 2025
