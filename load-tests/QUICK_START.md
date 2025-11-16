# Quick Start Guide: Load Testing & Autoscaling

## Quick Commands

### Install k6

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Run Embed Widget Load Test (10k concurrent users)

```bash
cd load-tests

# Quick test (1k users, 2 minutes)
k6 run --vus 1000 --duration 2m k6-embed-widget.js

# Full test (10k users, gradual ramp-up)
k6 run --stage 2m:1000 --stage 5m:5000 --stage 5m:10000 k6-embed-widget.js

# With custom URL
BASE_URL=https://api.luneo.app k6 run --vus 10000 --duration 5m k6-embed-widget.js
```

### Run Worker Render Load Test (500 concurrent renders)

```bash
cd load-tests

# Quick test (100 renders, 2 minutes)
k6 run --vus 100 --duration 2m k6-worker-render.js

# Full test (500 renders, gradual ramp-up)
BASE_URL=https://api.luneo.app API_KEY=your-token k6 run --stage 1m:100 --stage 2m:300 --stage 2m:500 k6-worker-render.js
```

### Install Artillery (Alternative)

```bash
npm install -g artillery
```

### Run Artillery Tests

```bash
cd load-tests

# Embed widget test
artillery run --count 10000 --target 1000 artillery-embed-widget.yml

# With output
artillery run --count 10000 --target 1000 --output report.json artillery-embed-widget.yml
```

## Deploy Autoscaling

### Prerequisites

```bash
# Install kubectl
# Install metrics-server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### Deploy HPA Configurations

```bash
cd infra/autoscaling

# Backend API autoscaling
kubectl apply -f hpa-backend.yaml

# Worker autoscaling
kubectl apply -f hpa-worker.yaml

# Verify
kubectl get hpa -n luneo-production
```

### Monitor Autoscaling

```bash
# Watch HPA in real-time
kubectl get hpa -n luneo-production -w

# Check HPA details
kubectl describe hpa luneo-backend-hpa -n luneo-production
kubectl describe hpa luneo-worker-hpa -n luneo-production

# Check pod scaling
kubectl get pods -n luneo-production -w
```

## Expected Results

### Embed Widget Test (10k concurrent users)

✅ **Success Criteria:**
- Token generation: < 300ms (p95), < 500ms (p99)
- Nonce validation: < 200ms (p95), < 400ms (p99)
- Full handshake: < 600ms (p95), < 1000ms (p99)
- Success rate: > 99%
- Error rate: < 1%

### Worker Render Test (500 concurrent renders)

✅ **Success Criteria:**
- Enqueue latency: < 500ms (p95), < 1000ms (p99)
- Enqueue success rate: > 95%
- Job completion rate: > 90%
- Queue depth: < 100 jobs

## Cost Estimates

**Base Configuration:** ~$3,428/month
- Backend API: $600
- Worker Service: $1,022
- Database: $88
- Redis: $50
- Storage: $1,550
- CDN: $20
- Monitoring: $26
- Kubernetes: $73

**Optimized Configuration:** ~$1,929/month
- With LRU caching
- Preview routing optimization
- Worker right-sizing

See `infra/cost-estimate/SCALE_TARGET_COST_ESTIMATE.md` for details.

## Troubleshooting

### Load Test Fails

1. **Check API availability**
   ```bash
   curl https://api.luneo.app/health
   ```

2. **Check rate limiting**
   - Review API logs for 429 responses
   - Adjust test ramp-up rate

3. **Check database connections**
   - Monitor connection pool usage
   - Increase pool size if needed

### HPA Not Scaling

1. **Check metrics server**
   ```bash
   kubectl top nodes
   kubectl top pods -n luneo-production
   ```

2. **Check HPA status**
   ```bash
   kubectl describe hpa luneo-backend-hpa -n luneo-production
   ```

3. **Check resource requests**
   ```bash
   kubectl describe deployment luneo-backend -n luneo-production
   ```

## Next Steps

1. ✅ Run load tests to establish baseline
2. ✅ Deploy autoscaling configurations
3. ✅ Monitor scaling behavior
4. ✅ Optimize based on results
5. ✅ Review costs monthly

## Documentation

- **Load Tests:** `load-tests/README.md`
- **Autoscaling:** `infra/autoscaling/README.md`
- **Worker Config:** `infra/autoscaling/worker-concurrency-config.md`
- **Cost Estimate:** `infra/cost-estimate/SCALE_TARGET_COST_ESTIMATE.md`
