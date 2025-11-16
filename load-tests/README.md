# Load Testing & Performance Testing

This directory contains load testing scripts for the Luneo Platform using k6.

## Prerequisites

Install k6:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

## Test Scripts

### 1. Embed Widget Load Test (`k6-embed-widget.js`)

Simulates 10,000 concurrent users loading the embed widget on product pages.

**Test Flow:**
1. Request embed token (`GET /api/embed/token`)
2. Validate nonce (`POST /api/embed/validate`)
3. Simulate widget handshake

**Run:**
```bash
# Full 10k concurrent users test
k6 run --vus 10000 --duration 5m k6-embed-widget.js

# With custom base URL
BASE_URL=https://api.luneo.app k6 run --vus 10000 --duration 5m k6-embed-widget.js

# Gradual ramp-up (recommended)
k6 run --stage 2m:1000 --stage 5m:5000 --stage 5m:10000 k6-embed-widget.js
```

**Expected Results:**
- Token generation: < 300ms (p95), < 500ms (p99)
- Nonce validation: < 200ms (p95), < 400ms (p99)
- Full handshake: < 600ms (p95), < 1000ms (p99)
- Success rate: > 99%

### 2. Worker Render Pipeline Test (`k6-worker-render.js`)

Simulates 500 concurrent render jobs being enqueued and processed.

**Test Flow:**
1. Enqueue render job (`POST /api/designs/:id/render`)
2. Poll for job status (`GET /api/jobs/:id/status`)
3. Track completion rate

**Run:**
```bash
# Full 500 concurrent renders test
k6 run --vus 500 --duration 10m k6-worker-render.js

# With authentication
BASE_URL=https://api.luneo.app API_KEY=your-token k6 run --vus 500 --duration 10m k6-worker-render.js

# Gradual ramp-up
k6 run --stage 1m:100 --stage 2m:300 --stage 2m:500 k6-worker-render.js
```

**Expected Results:**
- Enqueue latency: < 500ms (p95), < 1000ms (p99)
- Enqueue success rate: > 95%
- Job completion rate: > 90%
- Rate limit handling: Graceful backoff

## Environment Variables

- `BASE_URL`: API base URL (default: `https://api.luneo.app`)
- `WIDGET_URL`: Widget CDN URL (default: `https://widget.luneo.app`)
- `API_KEY`: Bearer token for authenticated endpoints

## Output

Test results are saved to:
- `load-test-results.json` (embed widget test)
- `worker-load-test-results.json` (worker render test)

## Performance Targets

### Embed Widget (Read-Only)
- **10,000 concurrent users**
- **Response time (p95)**: < 500ms
- **Response time (p99)**: < 1000ms
- **Error rate**: < 1%
- **Success rate**: > 99%

### Worker Render Pipeline
- **500 concurrent renders**
- **Enqueue latency (p95)**: < 1000ms
- **Enqueue latency (p99)**: < 2000ms
- **Error rate**: < 5%
- **Job completion rate**: > 90%

## Monitoring During Tests

Monitor these metrics during load tests:

1. **API Server Metrics:**
   - CPU usage
   - Memory usage
   - Request rate (req/s)
   - Error rate
   - Response time percentiles

2. **Database Metrics:**
   - Connection pool usage
   - Query latency
   - Active connections
   - Lock contention

3. **Redis Metrics:**
   - Memory usage
   - Connection count
   - Command latency
   - Hit/miss ratio

4. **Worker Metrics:**
   - Queue depth
   - Active jobs
   - Job completion rate
   - Worker CPU/memory

## Troubleshooting

### High Error Rates
- Check API server logs
- Verify database connection pool size
- Check Redis connection limits
- Review rate limiting configuration

### High Latency
- Check database query performance
- Verify Redis latency
- Review API server resource usage
- Check network latency

### Worker Backlog
- Increase worker concurrency
- Scale out worker instances
- Check worker resource limits
- Review job processing time

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/load-test.yml
name: Load Tests
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Run Embed Widget Load Test
        run: |
          cd load-tests
          k6 run --vus 1000 --duration 2m k6-embed-widget.js
      - name: Run Worker Render Load Test
        run: |
          cd load-tests
          k6 run --vus 100 --duration 2m k6-worker-render.js
```
