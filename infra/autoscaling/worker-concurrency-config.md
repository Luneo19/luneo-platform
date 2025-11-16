# Worker Concurrency Configuration

## Overview

This document defines the concurrency policy for Luneo worker instances based on CPU and memory resources.

## Concurrency Policy

### Per-Worker Concurrency

| Instance Type | CPU | Memory | Global Concurrency | Per-Tenant Concurrency | Max Workers |
|--------------|-----|--------|-------------------|----------------------|------------|
| **Small**    | 1 CPU | 2 GiB | 2 | 1 | 10 |
| **Medium**   | 2 CPU | 4 GiB | 5 | 2 | 20 |
| **Large**    | 4 CPU | 8 GiB | 10 | 3 | 20 |
| **XLarge**   | 8 CPU | 16 GiB | 20 | 5 | 20 |

### Resource-Based Concurrency Formula

```typescript
// Calculate optimal concurrency based on resources
function calculateConcurrency(cpu: number, memory: number): {
  global: number;
  perTenant: number;
} {
  // Base concurrency: 1 job per CPU core
  const baseConcurrency = Math.floor(cpu);
  
  // Memory constraint: ~500MB per job
  const memoryConcurrency = Math.floor(memory / 0.5);
  
  // Use the lower of the two constraints
  const globalConcurrency = Math.min(baseConcurrency, memoryConcurrency);
  
  // Per-tenant: ~30% of global (prevents tenant starvation)
  const perTenantConcurrency = Math.max(1, Math.floor(globalConcurrency * 0.3));
  
  return {
    global: globalConcurrency,
    perTenant: perTenantConcurrency,
  };
}
```

### Example Configurations

#### Small Instance (1 CPU, 2 GiB)
```yaml
env:
  - name: WORKER_CONCURRENCY
    value: "2"
  - name: DEFAULT_TENANT_CONCURRENCY
    value: "1"
```

#### Medium Instance (2 CPU, 4 GiB) - **Recommended**
```yaml
env:
  - name: WORKER_CONCURRENCY
    value: "5"
  - name: DEFAULT_TENANT_CONCURRENCY
    value: "2"
```

#### Large Instance (4 CPU, 8 GiB)
```yaml
env:
  - name: WORKER_CONCURRENCY
    value: "10"
  - name: DEFAULT_TENANT_CONCURRENCY
    value: "3"
```

#### XLarge Instance (8 CPU, 16 GiB)
```yaml
env:
  - name: WORKER_CONCURRENCY
    value: "20"
  - name: DEFAULT_TENANT_CONCURRENCY
    value: "5"
```

## Job Type Resource Requirements

| Job Type | CPU Usage | Memory Usage | Avg Duration | Priority |
|----------|-----------|--------------|--------------|----------|
| **2D Render** | Low (0.2-0.5) | Medium (200-500MB) | 5-15s | Normal |
| **3D Render** | High (1-2) | High (1-2GB) | 30-120s | Normal |
| **AR Preview** | Medium (0.5-1) | Medium (500MB-1GB) | 10-30s | Normal |
| **Texture Blend** | Low (0.2-0.5) | Low (100-300MB) | 3-10s | High |

## Scaling Recommendations

### Horizontal Scaling (Add More Workers)

**When to scale horizontally:**
- Queue depth > 100 jobs
- Average wait time > 60 seconds
- CPU utilization < 50% (workers are idle waiting for jobs)
- Need to handle burst traffic

**Scaling formula:**
```
Required Workers = (Queue Depth / Target Jobs Per Worker) + Buffer
Target Jobs Per Worker = Global Concurrency * 0.8 (80% utilization)
Buffer = 20% extra capacity
```

**Example:**
- Queue depth: 500 jobs
- Global concurrency: 5 jobs/worker
- Target: 4 jobs/worker (80% utilization)
- Required: (500 / 4) * 1.2 = 150 workers

### Vertical Scaling (Increase Resources)

**When to scale vertically:**
- CPU utilization > 90% consistently
- Memory usage > 90% consistently
- Jobs timing out due to resource constraints
- Need faster job processing

**Scaling path:**
1. Small → Medium (2x capacity)
2. Medium → Large (2x capacity)
3. Large → XLarge (2x capacity)

## Monitoring Metrics

### Key Metrics to Track

1. **Queue Depth**
   - Target: < 50 jobs
   - Warning: 50-100 jobs
   - Critical: > 100 jobs

2. **Active Jobs per Worker**
   - Target: 70-80% of global concurrency
   - Warning: > 90%
   - Critical: = 100% (saturated)

3. **Job Wait Time**
   - Target: < 10 seconds
   - Warning: 10-30 seconds
   - Critical: > 60 seconds

4. **CPU Utilization**
   - Target: 60-80%
   - Warning: > 90%
   - Critical: > 95%

5. **Memory Utilization**
   - Target: 70-85%
   - Warning: > 90%
   - Critical: > 95%

6. **Job Completion Rate**
   - Target: > 95%
   - Warning: 90-95%
   - Critical: < 90%

## Implementation

### Environment Variables

```bash
# Worker concurrency (set per instance type)
WORKER_CONCURRENCY=5                    # Global concurrency
DEFAULT_TENANT_CONCURRENCY=2            # Per-tenant limit

# Rate limiting
RATE_LIMIT_MAX=100                      # Jobs per minute
RATE_LIMIT_DURATION=60000               # 1 minute

# Circuit breaker
CIRCUIT_BREAKER_THRESHOLD=5             # Failures before opening
CIRCUIT_BREAKER_TIMEOUT=60000           # 60 seconds
```

### Kubernetes Deployment Example

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: luneo-worker-ia
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: worker
        image: luneo/worker-ia:latest
        resources:
          requests:
            cpu: "2"
            memory: "4Gi"
          limits:
            cpu: "4"
            memory: "8Gi"
        env:
        - name: WORKER_CONCURRENCY
          value: "5"
        - name: DEFAULT_TENANT_CONCURRENCY
          value: "2"
        - name: REDIS_HOST
          value: "redis-service"
        - name: REDIS_PORT
          value: "6379"
```

## Cost Optimization

### Right-Sizing Workers

1. **Start with Medium instances** (2 CPU, 4 GiB)
   - Good balance of cost and performance
   - Can handle most workloads

2. **Monitor and adjust**
   - If CPU < 50%: Consider Small instances
   - If CPU > 90%: Consider Large instances
   - If memory > 90%: Increase memory allocation

3. **Use HPA for auto-scaling**
   - Automatically scale based on queue depth
   - Scale down during low traffic periods
   - Scale up during peak traffic

### Cost Estimate (per month)

| Instance Type | Cost/Hour | Workers | Monthly Cost |
|--------------|-----------|---------|---------------|
| Small (1 CPU, 2 GiB) | $0.05 | 10 | $360 |
| Medium (2 CPU, 4 GiB) | $0.10 | 5 | $360 |
| Large (4 CPU, 8 GiB) | $0.20 | 3 | $432 |
| XLarge (8 CPU, 16 GiB) | $0.40 | 2 | $576 |

*Note: Costs vary by cloud provider and region*

## Best Practices

1. **Start conservative**: Begin with Medium instances and 2-3 replicas
2. **Monitor closely**: Track queue depth, CPU, memory, and job completion rates
3. **Scale proactively**: Use HPA to scale before queue depth becomes critical
4. **Right-size**: Adjust instance types based on actual usage patterns
5. **Test thoroughly**: Run load tests before production deployment
