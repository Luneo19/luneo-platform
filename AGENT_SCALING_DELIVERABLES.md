# Agent Scaling - Load Tests & Autoscaling Deliverables

**Date:** November 2025  
**Status:** ✅ Complete

---

## Overview

This document summarizes all deliverables for the Agent Scaling task, including load testing scripts, autoscaling configurations, and cost estimates for handling 10k concurrent users and 500 concurrent renders.

---

## Deliverables

### ✅ 1. Load Testing Scripts

#### k6 Scripts (Primary)

1. **`load-tests/k6-embed-widget.js`**
   - Simulates 10,000 concurrent users loading embed widget
   - Tests token generation and nonce validation endpoints
   - Gradual ramp-up: 1k → 5k → 10k users
   - Custom metrics: token latency, validate latency, handshake latency
   - **Usage:** `k6 run --vus 10000 --duration 5m k6-embed-widget.js`

2. **`load-tests/k6-worker-render.js`**
   - Simulates 500 concurrent render jobs
   - Tests job enqueue and completion tracking
   - Polls for job status until completion
   - Custom metrics: enqueue latency, job completion rate, processing time
   - **Usage:** `k6 run --vus 500 --duration 10m k6-worker-render.js`

#### Artillery Scripts (Alternative)

3. **`load-tests/artillery-embed-widget.yml`**
   - Alternative to k6 for embed widget testing
   - YAML-based configuration
   - **Usage:** `artillery run --count 10000 --target 1000 artillery-embed-widget.yml`

4. **`load-tests/artillery-processor.js`**
   - Helper functions for Artillery tests
   - Random shop/origin generation

#### Documentation

5. **`load-tests/README.md`**
   - Comprehensive guide for load testing
   - Installation instructions
   - Usage examples
   - Performance targets
   - Troubleshooting guide

6. **`load-tests/QUICK_START.md`**
   - Quick reference guide
   - Common commands
   - Expected results
   - Troubleshooting tips

---

### ✅ 2. Autoscaling Configuration

#### Kubernetes HPA Configurations

1. **`infra/autoscaling/hpa-backend.yaml`**
   - Horizontal Pod Autoscaler for backend API
   - **Scaling Metrics:**
     - CPU: 70% target utilization
     - Memory: 80% target utilization
     - Request rate: 1000 req/s per pod
   - **Scaling Behavior:**
     - Min replicas: 3
     - Max replicas: 50
     - Aggressive scale-up (double or +5 pods per minute)
     - Conservative scale-down (50% or -2 pods per 5 minutes)
   - **Use Case:** Handle 10k concurrent users

2. **`infra/autoscaling/hpa-worker.yaml`**
   - Horizontal Pod Autoscaler for worker service
   - **Scaling Metrics:**
     - CPU: 75% target utilization
     - Memory: 85% target utilization
     - Queue depth: 50 jobs per worker
     - Active jobs: 10 jobs per worker
   - **Scaling Behavior:**
     - Min replicas: 2
     - Max replicas: 20
     - Moderate scale-up (50% or +2 pods per 2 minutes)
     - Very conservative scale-down (25% or -1 pod per 10 minutes)
   - **Use Case:** Handle 500 concurrent renders
   - **Includes:** VPA (Vertical Pod Autoscaler) configuration

#### Worker Concurrency Policy

3. **`infra/autoscaling/worker-concurrency-config.md`**
   - Detailed concurrency policy based on CPU/RAM
   - Resource-based concurrency formulas
   - Instance type recommendations:
     - Small (1 CPU, 2 GiB): 2 global, 1 per-tenant
     - Medium (2 CPU, 4 GiB): 5 global, 2 per-tenant ⭐ Recommended
     - Large (4 CPU, 8 GiB): 10 global, 3 per-tenant
     - XLarge (8 CPU, 16 GiB): 20 global, 5 per-tenant
   - Job type resource requirements
   - Scaling recommendations (horizontal vs vertical)
   - Monitoring metrics and thresholds
   - Cost optimization strategies

#### Documentation

4. **`infra/autoscaling/README.md`**
   - Complete autoscaling guide
   - Installation instructions
   - Configuration details
   - Monitoring and troubleshooting
   - Best practices

---

### ✅ 3. Cost Estimate Sheet

**`infra/cost-estimate/SCALE_TARGET_COST_ESTIMATE.md`**

Comprehensive cost breakdown for scale targets:

#### Base Configuration: $3,428/month

| Component | Monthly Cost |
|-----------|--------------|
| Backend API (8 instances avg) | $600 |
| Worker Service (7 instances avg) | $1,022 |
| Database (Supabase Pro + replicas) | $88 |
| Redis Cache (Upstash 4GB) | $50 |
| Object Storage (Cloudinary) | $1,550 |
| CDN & Edge (Vercel) | $20 |
| Monitoring (Sentry) | $26 |
| Kubernetes (EKS) | $73 |
| **TOTAL** | **$3,428** |

#### Optimized Configuration: $1,929/month

**Optimizations:**
- LRU cache for previews (60-70% Cloudinary savings)
- Preview routing optimization (40-50% API load reduction)
- Worker right-sizing (spot instances, VPA)

**Savings:** $1,499/month (44% reduction)

#### Cost per Unit

- **Per Concurrent User:** $0.19/user/month (optimized)
- **Per Concurrent Render:** $3.86/render/month (optimized)

#### Scaling Projections

- 2x scale (20k users, 1k renders): ~$3,500/month
- 5x scale (50k users, 2.5k renders): ~$7,500/month
- 10x scale (100k users, 5k renders): ~$14,000/month

---

## Test Scenarios

### Scenario 1: Embed Widget Load (10k Concurrent Users)

**Objective:** Validate system can handle 10k concurrent users loading embed widget

**Test Flow:**
1. Request embed token (`GET /api/embed/token`)
2. Validate nonce (`POST /api/embed/validate`)
3. Simulate widget handshake

**Success Criteria:**
- ✅ Token generation: < 300ms (p95), < 500ms (p99)
- ✅ Nonce validation: < 200ms (p95), < 400ms (p99)
- ✅ Full handshake: < 600ms (p95), < 1000ms (p99)
- ✅ Success rate: > 99%
- ✅ Error rate: < 1%

**Expected Infrastructure:**
- Backend API: 8-10 instances (auto-scaling 3-50)
- Database: Pro plan + 2 read replicas
- Redis: 4GB cluster
- CDN: Vercel Pro plan

---

### Scenario 2: Worker Render Pipeline (500 Concurrent Renders)

**Objective:** Validate worker can process 500 concurrent render jobs

**Test Flow:**
1. Enqueue render job (`POST /api/designs/:id/render`)
2. Poll for job status (`GET /api/jobs/:id/status`)
3. Track completion rate

**Success Criteria:**
- ✅ Enqueue latency: < 500ms (p95), < 1000ms (p99)
- ✅ Enqueue success rate: > 95%
- ✅ Job completion rate: > 90%
- ✅ Queue depth: < 100 jobs

**Expected Infrastructure:**
- Worker Service: 6-8 instances (auto-scaling 2-20)
- Queue: BullMQ with Redis
- Storage: Cloudinary for rendered outputs

---

## Risk Mitigation

### Cost vs Performance Trade-offs

1. **LRU Cache TTL**
   - **Risk:** Stale previews if TTL too long
   - **Mitigation:** 24h TTL with invalidation on design updates
   - **Impact:** 60-70% cost reduction ($1,000/month savings)

2. **Preview Routing**
   - **Risk:** Cache misses increase API load
   - **Mitigation:** Multi-layer caching (Redis + CDN)
   - **Impact:** 40-50% API load reduction ($200/month savings)

3. **Worker Spot Instances**
   - **Risk:** Interruptions during peak load
   - **Mitigation:** Mix of spot (70%) and on-demand (30%)
   - **Impact:** 50% worker cost reduction ($300/month savings)

4. **Auto-scaling Aggressiveness**
   - **Risk:** Over-provisioning during spikes
   - **Mitigation:** Conservative scale-down policies
   - **Impact:** 10-20% cost reduction

---

## Implementation Checklist

### Load Testing

- [x] Create k6 embed widget load test script
- [x] Create k6 worker render load test script
- [x] Create Artillery alternative scripts
- [x] Add comprehensive documentation
- [x] Add quick start guide

### Autoscaling

- [x] Create HPA configuration for backend API
- [x] Create HPA configuration for worker service
- [x] Define worker concurrency policy
- [x] Add VPA configuration for workers
- [x] Add comprehensive documentation

### Cost Estimation

- [x] Create detailed cost breakdown
- [x] Calculate base configuration costs
- [x] Calculate optimized configuration costs
- [x] Provide cost per unit metrics
- [x] Add scaling projections
- [x] Document optimization strategies

---

## Next Steps

1. **Run Load Tests**
   ```bash
   cd load-tests
   k6 run --vus 1000 --duration 2m k6-embed-widget.js
   k6 run --vus 100 --duration 2m k6-worker-render.js
   ```

2. **Deploy Autoscaling**
   ```bash
   cd infra/autoscaling
   kubectl apply -f hpa-backend.yaml
   kubectl apply -f hpa-worker.yaml
   ```

3. **Monitor & Optimize**
   - Monitor HPA scaling behavior
   - Review load test results
   - Adjust autoscaling thresholds
   - Implement cost optimizations

4. **Review Costs Monthly**
   - Track actual costs vs estimates
   - Adjust configurations based on usage
   - Optimize further as needed

---

## File Structure

```
luneo-platform/
├── load-tests/
│   ├── k6-embed-widget.js          # k6 script for embed widget (10k users)
│   ├── k6-worker-render.js         # k6 script for worker renders (500 jobs)
│   ├── artillery-embed-widget.yml  # Artillery alternative
│   ├── artillery-processor.js      # Artillery helper functions
│   ├── README.md                   # Comprehensive guide
│   └── QUICK_START.md              # Quick reference
│
├── infra/
│   ├── autoscaling/
│   │   ├── hpa-backend.yaml        # Backend API HPA config
│   │   ├── hpa-worker.yaml         # Worker HPA + VPA config
│   │   ├── worker-concurrency-config.md  # Concurrency policy
│   │   └── README.md                # Autoscaling guide
│   │
│   └── cost-estimate/
│       └── SCALE_TARGET_COST_ESTIMATE.md  # Cost breakdown
│
└── AGENT_SCALING_DELIVERABLES.md   # This file
```

---

## Summary

✅ **All deliverables completed:**

1. ✅ Load testing scripts (k6 + Artillery)
   - Embed widget: 10k concurrent users
   - Worker render: 500 concurrent jobs

2. ✅ Autoscaling configuration
   - HPA for backend API (3-50 replicas)
   - HPA + VPA for worker service (2-20 replicas)
   - Worker concurrency policy

3. ✅ Cost estimate sheet
   - Base: $3,428/month
   - Optimized: $1,929/month
   - Per-unit costs and scaling projections

**Ready for implementation and testing!** 🚀
