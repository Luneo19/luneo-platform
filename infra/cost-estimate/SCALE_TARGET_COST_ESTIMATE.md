# Cost Estimate: Scale Target (10k Concurrent Users + 500 Concurrent Renders)

**Date:** November 2025  
**Target Scale:** 
- 10,000 concurrent users (read-only embed widget flows)
- 500 concurrent render jobs (worker pipeline)

---

## Infrastructure Components

### 1. Backend API (NestJS)

**Requirements:**
- Handle 10k concurrent users
- ~1000 requests/second peak
- Low latency (< 500ms p95)
- High availability (99.9%)

**Architecture:**
- Kubernetes deployment with HPA
- Min: 3 replicas, Max: 50 replicas
- Auto-scaling based on CPU, memory, and request rate

**Instance Configuration:**
- **Base:** 3x Medium instances (2 CPU, 4 GiB RAM)
- **Peak:** Up to 20x Medium instances during peak traffic
- **Average:** ~8-10 instances during normal operations

**Cost Breakdown:**

| Component | Instance Type | Count (Avg) | Cost/Hour | Hours/Month | Monthly Cost |
|-----------|--------------|-------------|-----------|-------------|--------------|
| Backend API | Medium (2 CPU, 4 GiB) | 8 | $0.10 | 730 | $584 |
| Load Balancer | Application LB | 1 | $0.0225 | 730 | $16.43 |
| **Subtotal** | | | | | **$600.43** |

*Note: Costs based on AWS EKS pricing (us-east-1)*

---

### 2. Worker Service (Render Pipeline)

**Requirements:**
- Process 500 concurrent render jobs
- Handle 3D rendering (CPU-intensive)
- Memory-intensive operations (image processing)
- Job queue management

**Architecture:**
- Kubernetes deployment with HPA
- Min: 2 replicas, Max: 20 replicas
- Auto-scaling based on queue depth and CPU/memory

**Instance Configuration:**
- **Base:** 2x Large instances (4 CPU, 8 GiB RAM)
- **Peak:** Up to 15x Large instances during high load
- **Average:** ~6-8 instances during normal operations

**Cost Breakdown:**

| Component | Instance Type | Count (Avg) | Cost/Hour | Hours/Month | Monthly Cost |
|-----------|--------------|-------------|-----------|-------------|--------------|
| Worker Nodes | Large (4 CPU, 8 GiB) | 7 | $0.20 | 730 | $1,022 |
| **Subtotal** | | | | | **$1,022** |

---

### 3. Database (PostgreSQL - Supabase)

**Requirements:**
- Handle read-heavy workload (10k concurrent reads)
- Write operations for job tracking
- Connection pooling
- Read replicas for scaling

**Configuration:**
- **Primary:** Pro Plan (8 GB RAM, 2 vCPU)
- **Read Replicas:** 2x Pro Plan (for read scaling)
- **Storage:** 100 GB SSD (expandable)

**Cost Breakdown:**

| Component | Plan | Count | Monthly Cost |
|-----------|------|-------|--------------|
| Primary DB | Pro ($25/month base) | 1 | $25 |
| Read Replicas | Pro ($25/month base) | 2 | $50 |
| Storage (100 GB) | $0.125/GB | 100 | $12.50 |
| **Subtotal** | | | **$87.50** |

*Note: Supabase Pro plan pricing*

---

### 4. Redis Cache (Upstash)

**Requirements:**
- Session storage (nonces, tokens)
- Queue management (BullMQ)
- Rate limiting
- LRU cache for previews

**Configuration:**
- **Redis Cluster:** Regional (Multi-AZ)
- **Memory:** 4 GB (scalable)
- **Throughput:** 10,000 commands/second

**Cost Breakdown:**

| Component | Plan | Monthly Cost |
|-----------|------|--------------|
| Redis Cluster | Regional 4GB | $50 |
| **Subtotal** | | **$50** |

*Note: Upstash Regional pricing*

---

### 5. Object Storage (Cloudinary)

**Requirements:**
- Store rendered images (3D renders, AR previews)
- CDN delivery
- Image transformations
- Bandwidth for 10k concurrent users

**Configuration:**
- **Storage:** 500 GB
- **Bandwidth:** 5 TB/month
- **Transformations:** 100k/month

**Cost Breakdown:**

| Component | Usage | Monthly Cost |
|-----------|-------|--------------|
| Storage (500 GB) | $0.10/GB | $50 |
| Bandwidth (5 TB) | $0.10/GB | $500 |
| Transformations (100k) | $0.01/transformation | $1,000 |
| **Subtotal** | | **$1,550** |

*Note: Cloudinary Advanced plan pricing*

---

### 6. CDN & Edge (Vercel)

**Requirements:**
- Frontend hosting (Next.js)
- Widget CDN delivery
- Edge functions
- Global distribution

**Configuration:**
- **Frontend:** Pro Plan
- **Bandwidth:** 1 TB/month
- **Edge Functions:** 100 GB-hours/month

**Cost Breakdown:**

| Component | Plan | Monthly Cost |
|-----------|------|--------------|
| Frontend Hosting | Pro ($20/month) | $20 |
| Bandwidth (1 TB) | Included | $0 |
| Edge Functions | Included | $0 |
| **Subtotal** | | **$20** |

---

### 7. Monitoring & Observability

**Requirements:**
- Application monitoring (Sentry)
- Infrastructure monitoring (Prometheus/Grafana)
- Log aggregation
- Alerting

**Cost Breakdown:**

| Component | Plan | Monthly Cost |
|-----------|------|--------------|
| Sentry (Team) | $26/month | $26 |
| Grafana Cloud | Free tier | $0 |
| **Subtotal** | | **$26** |

---

### 8. Kubernetes Cluster (EKS)

**Requirements:**
- Managed Kubernetes control plane
- Node groups for workers
- Networking

**Cost Breakdown:**

| Component | Cost/Hour | Hours/Month | Monthly Cost |
|-----------|-----------|-------------|--------------|
| EKS Control Plane | $0.10 | 730 | $73 |
| **Subtotal** | | | **$73** |

---

## Total Monthly Cost Estimate

| Category | Monthly Cost |
|----------|--------------|
| Backend API | $600.43 |
| Worker Service | $1,022.00 |
| Database (Supabase) | $87.50 |
| Redis Cache (Upstash) | $50.00 |
| Object Storage (Cloudinary) | $1,550.00 |
| CDN & Edge (Vercel) | $20.00 |
| Monitoring | $26.00 |
| Kubernetes (EKS) | $73.00 |
| **TOTAL** | **$3,427.93** |

---

## Cost Optimization Strategies

### 1. LRU Cache Optimization

**Impact:** Reduce Cloudinary transformation costs by 60-70%

**Implementation:**
- Cache rendered previews in Redis (24h TTL)
- Route preview requests through cache layer
- Only generate new renders for unique designs

**Savings:** ~$1,000/month

**Revised Cloudinary Cost:** $550/month

---

### 2. Preview Routing Optimization

**Impact:** Reduce backend API load by 40-50%

**Implementation:**
- Serve cached previews directly from CDN
- Bypass API for read-only preview requests
- Use Cloudinary URL transformations for common variations

**Savings:** ~$200/month (fewer API instances needed)

**Revised Backend Cost:** $400/month

---

### 3. Worker Right-Sizing

**Impact:** Optimize worker instance allocation

**Implementation:**
- Use spot instances for non-critical workloads (50% savings)
- Implement job prioritization (process high-priority jobs first)
- Use VPA (Vertical Pod Autoscaler) for optimal resource allocation

**Savings:** ~$300/month

**Revised Worker Cost:** $722/month

---

### 4. Database Optimization

**Impact:** Reduce database costs

**Implementation:**
- Use connection pooling (PgBouncer)
- Implement read replicas for read-heavy workloads
- Optimize queries and indexes

**Savings:** Minimal (already optimized)

---

## Optimized Cost Estimate

| Category | Original | Optimized | Savings |
|----------|----------|-----------|---------|
| Backend API | $600.43 | $400.00 | $200.43 |
| Worker Service | $1,022.00 | $722.00 | $300.00 |
| Database | $87.50 | $87.50 | $0 |
| Redis Cache | $50.00 | $50.00 | $0 |
| Object Storage | $1,550.00 | $550.00 | $1,000.00 |
| CDN & Edge | $20.00 | $20.00 | $0 |
| Monitoring | $26.00 | $26.00 | $0 |
| Kubernetes | $73.00 | $73.00 | $0 |
| **TOTAL** | **$3,427.93** | **$1,928.50** | **$1,499.43** |

**Optimized Monthly Cost: $1,928.50**  
**Annual Cost: $23,142**

---

## Cost per User/Render

### Per Concurrent User (Read-Only)
- **Base Cost:** $3,427.93 / 10,000 = **$0.34/user/month**
- **Optimized Cost:** $1,928.50 / 10,000 = **$0.19/user/month**

### Per Concurrent Render
- **Base Cost:** $3,427.93 / 500 = **$6.86/render/month**
- **Optimized Cost:** $1,928.50 / 500 = **$3.86/render/month**

---

## Scaling Projections

### 2x Scale (20k users, 1000 renders)
- **Monthly Cost:** ~$3,500 (optimized)
- **Cost per User:** $0.18/user/month

### 5x Scale (50k users, 2500 renders)
- **Monthly Cost:** ~$7,500 (optimized)
- **Cost per User:** $0.15/user/month

### 10x Scale (100k users, 5000 renders)
- **Monthly Cost:** ~$14,000 (optimized)
- **Cost per User:** $0.14/user/month

*Note: Costs scale sub-linearly due to economies of scale*

---

## Risk Mitigation

### Cost vs Performance Trade-offs

1. **LRU Cache TTL**
   - **Risk:** Stale previews if TTL too long
   - **Mitigation:** 24h TTL with invalidation on design updates
   - **Impact:** 60-70% cost reduction

2. **Preview Routing**
   - **Risk:** Cache misses increase API load
   - **Mitigation:** Multi-layer caching (Redis + CDN)
   - **Impact:** 40-50% API load reduction

3. **Worker Spot Instances**
   - **Risk:** Interruptions during peak load
   - **Mitigation:** Mix of spot (70%) and on-demand (30%)
   - **Impact:** 50% worker cost reduction

4. **Auto-scaling Aggressiveness**
   - **Risk:** Over-provisioning during spikes
   - **Mitigation:** Conservative scale-down policies
   - **Impact:** 10-20% cost reduction

---

## Recommendations

1. **Start with optimized configuration** ($1,928/month)
2. **Implement LRU caching** (highest ROI)
3. **Monitor and adjust** based on actual usage
4. **Use auto-scaling** to handle traffic spikes
5. **Review costs monthly** and optimize continuously

---

## Notes

- All costs are estimates based on AWS/EKS pricing (us-east-1)
- Actual costs may vary based on:
  - Traffic patterns
  - Data transfer volumes
  - Storage growth
  - Regional pricing differences
- Consider reserved instances for predictable workloads (30-40% savings)
- Monitor actual usage and adjust estimates quarterly

---

**Last Updated:** November 2025  
**Next Review:** December 2025
