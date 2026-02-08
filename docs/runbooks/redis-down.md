# Runbook: Redis Down

**Severity:** P2 — Degraded performance, rate limiting affected  
**Owner:** Backend / DevOps  
**Estimated resolution:** 10–20 min

---

## 1. Detection

- **Cache misses increase** — Slower response times, higher DB load.
- **Rate limiting stops working** — Either no limiting (risk of abuse) or all requests blocked.
- **Sentry / logs** — "Redis connection refused", "ECONNREFUSED" to Redis host/port.
- **Sessions** — If sessions are in Redis, users may be logged out or see inconsistent state.

---

## 2. Diagnosis

### Step 1: Check Redis connection

```bash
# If redis-cli is available
redis-cli -u "$REDIS_URL" ping
# Expected: PONG
```

### Step 2: Check from application

- Backend health endpoint may expose Redis status (if implemented).
- Check logs for Redis errors when the app starts or when cache/rate-limit is used.

### Step 3: Check memory and eviction

```bash
redis-cli -u "$REDIS_URL" info memory
redis-cli -u "$REDIS_URL" info stats
```

- **Memory:** If at maxmemory, Redis may evict keys or reject writes.
- **Provider:** If using managed Redis (e.g. Upstash, Railway), check provider status/dashboard.

---

## 3. Resolution

### Option A: Restart Redis

- **Managed (Upstash, Railway, etc.):** Use provider dashboard to restart the instance.
- **Self-hosted:** `sudo systemctl restart redis` (or equivalent); then verify with `redis-cli ping`.

### Option B: Fall back to in-memory cache

- If the app supports an in-memory fallback when Redis is unavailable:
  - No code change needed if already implemented; just ensure restarts don’t depend on Redis.
- If not implemented: document as post-incident improvement; for now, accept degraded behavior (no shared cache, possible rate-limit bypass) until Redis is back.

### Option C: Temporarily disable rate limiting (last resort)

- Only if rate limiting is blocking all traffic and no Redis fix is possible soon.
- Use env flag or config (e.g. `ENABLE_RATE_LIMIT_IN_DEV=true` / false) if the app supports it; re-enable as soon as Redis is restored.

### After resolution

- Verify `redis-cli ping` or app health.
- Watch Sentry and logs for Redis errors.
- If keys were evicted, cache will repopulate; no data restore needed for typical cache use.

---

## 4. Prevention

| Action | Description |
|--------|-------------|
| **Redis Sentinel / Cluster** | For HA, use managed Redis with failover or Redis Sentinel. |
| **Memory alerts** | Alert when Redis memory usage is high (e.g. >80% of max). |
| **Graceful degradation** | Use in-memory cache or skip cache when Redis is down so app still runs. |
| **Connection handling** | Configure timeouts and retries so one bad Redis node doesn’t hang the app. |

---

## 5. Escalation

- **P2:** Resolve within SLA; escalate to on-call if Redis is shared and multiple services are affected.
- **Persistent outages:** Consider failover or alternate Redis provider; document in post-mortem.
