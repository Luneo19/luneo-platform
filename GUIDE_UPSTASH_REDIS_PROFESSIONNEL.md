# 🚀 GUIDE PROFESSIONNEL - UPSTASH REDIS

**Date:** 29 Octobre 2025  
**Objectif:** Configuration professionnelle d'Upstash Redis pour Luneo Platform  
**Référence:** Best practices 2025 pour Next.js 15 + Upstash

---

## 🎯 POURQUOI UPSTASH REDIS?

### Avantages pour Production

1. **Serverless & Payg-as-you-go**
   - Pas de serveur à gérer
   - Scaling automatique
   - Facturation à l'usage

2. **Edge-optimized**
   - Latence ultra-faible (<10ms)
   - Multi-region support
   - Compatible Vercel Edge

3. **REST API**
   - HTTP requests (pas besoin de connection pool)
   - Compatible avec serverless functions
   - TLS par défaut

4. **Features avancées**
   - Rate limiting intégré (@upstash/ratelimit)
   - TTL automatique
   - Persistent storage
   - Monitoring dashboard

---

## 📋 SETUP PROFESSIONNEL

### Étape 1: Créer Database Upstash

**URL:** https://console.upstash.com

**Actions:**
1. Créer compte (gratuit)
2. Create Database
3. Configuration:
   - **Name:** luneo-production-redis
   - **Region:** us-east-1 (même que Vercel)
   - **Type:** Global (multi-region)
   - **Eviction:** allkeys-lru (recommandé)

**Résultat:**
```
UPSTASH_REDIS_REST_URL=https://us1-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxx
```

### Étape 2: Configurer Variables Vercel

**URL:** https://vercel.com/luneos-projects/frontend/settings/environment-variables

**Variables à ajouter:**
```env
UPSTASH_REDIS_REST_URL=https://us1-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxxxxxx
```

**Environnements:** Production, Preview, Development

### Étape 3: Installer Packages

```bash
cd apps/frontend
pnpm add @upstash/redis @upstash/ratelimit
```

**Versions:**
- `@upstash/redis`: ^1.35.6 ✅ (déjà installé)
- `@upstash/ratelimit`: ^2.0.6 ✅ (déjà installé)

---

## 🔧 IMPLÉMENTATION PROFESSIONNELLE

### Architecture Rate Limiting

```
Request
  ↓
Middleware (middleware.ts)
  ↓
rateLimitMiddleware (middleware-rate-limit.ts)
  ↓
checkRateLimit (lib/rate-limit.ts)
  ↓
Upstash Ratelimit
  ↓
Allow/Block
```

### Configuration rate-limit.ts

**Fichier:** `/apps/frontend/src/lib/rate-limit.ts`

**Stratégies professionnelles:**

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Client Redis singleton
let redis: Redis | null = null;

function getRedisClient() {
  if (!redis && process.env.UPSTASH_REDIS_REST_URL) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

// Rate limiters avec stratégies différentes par use case

// 1. API General (100 requests / minute)
export const apiRateLimit = new Ratelimit({
  redis: getRedisClient()!,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: 'ratelimit:api',
});

// 2. Auth (Strict - 5 requests / minute)
export const authRateLimit = new Ratelimit({
  redis: getRedisClient()!,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
  prefix: 'ratelimit:auth',
});

// 3. AI Generation (Premium - 20 requests / hour)
export const aiRateLimit = new Ratelimit({
  redis: getRedisClient()!,
  limiter: Ratelimit.slidingWindow(20, '1 h'),
  analytics: true,
  prefix: 'ratelimit:ai',
});

// 4. File Upload (10 requests / minute)
export const uploadRateLimit = new Ratelimit({
  redis: getRedisClient()!,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'ratelimit:upload',
});

// Client identifier (IP + User-Agent)
export function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Hash pour éviter d'exposer l'IP
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(`${ip}-${userAgent}`).digest('hex');
}

// Check rate limit avec retry
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit
): Promise<{ success: boolean; remaining: number; reset: Date }> {
  try {
    const result = await limiter.limit(identifier);
    
    return {
      success: result.success,
      remaining: result.remaining,
      reset: new Date(result.reset),
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Fail open (allow request si Redis down)
    return {
      success: true,
      remaining: 100,
      reset: new Date(Date.now() + 60000),
    };
  }
}
```

**Algorithmes disponibles:**

```typescript
// Sliding Window (recommandé pour API)
Ratelimit.slidingWindow(100, '1 m')

// Fixed Window (simple)
Ratelimit.fixedWindow(100, '1 m')

// Token Bucket (burst allowed)
Ratelimit.tokenBucket(100, '1 m', 10)

// Cached Fixed Window (performance)
Ratelimit.cachedFixedWindow(100, '1 m')
```

### Middleware Integration

**Fichier:** `/apps/frontend/middleware.ts`

**Update professionnel:**

```typescript
import { rateLimitMiddleware } from '@/middleware-rate-limit';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. RATE LIMITING (si Upstash configuré)
  if (process.env.UPSTASH_REDIS_REST_URL) {
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) return rateLimitResponse;
  }

  // 2. AUTHENTICATION
  // ... (reste du code)
}
```

---

## 💾 CACHING STRATEGY

### Cache Layers

```
Level 1: Browser Cache (Vercel CDN)
  ↓
Level 2: Redis Cache (Upstash)
  ↓
Level 3: Database (Supabase)
```

### Redis Cache Keys

**Convention de nommage:**
```
cache:{resource}:{id}:{variant}

Exemples:
cache:product:abc123:full
cache:dashboard:stats:user:xyz789:7d
cache:templates:featured:page:1
cache:designs:user:xyz789:recent:10
```

### TTL Strategy

| Resource | TTL | Stratégie |
|----------|-----|-----------|
| Dashboard stats | 5 min | Revalidate on mutation |
| Products list | 10 min | LRU eviction |
| Templates | 1 hour | Rarely changes |
| Cliparts | 1 hour | Rarely changes |
| User profile | 15 min | Revalidate on update |
| Analytics | 30 min | Expensive queries |

### Implementation Cache Service

**Fichier:** `/apps/frontend/src/lib/redis-cache.ts`

**Upgrade professionnel:**

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export class CacheService {
  /**
   * Get from cache with type safety
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key);
      return data as T | null;
    } catch (error) {
      console.error(`Cache GET error for key ${key}:`, error);
      return null; // Fail gracefully
    }
  }

  /**
   * Set cache with TTL
   */
  static async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error(`Cache SET error for key ${key}:`, error);
      // Don't throw, caching is optional
    }
  }

  /**
   * Delete cache key
   */
  static async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache DEL error for key ${key}:`, error);
    }
  }

  /**
   * Pattern-based deletion
   */
  static async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error(`Cache DEL pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Cache with stale-while-revalidate
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 300
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached) return cached;

    // Fetch fresh data
    const fresh = await fetcher();
    
    // Set cache (fire and forget)
    this.set(key, fresh, ttl).catch(console.error);
    
    return fresh;
  }
}
```

### Usage dans API Routes

**Exemple:** `/api/dashboard/stats`

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '7d';
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const cacheKey = `cache:dashboard:stats:user:${user.id}:${period}`;
  
  // Get or fetch with cache
  const stats = await CacheService.getOrSet(
    cacheKey,
    async () => {
      // Expensive query
      const result = await supabase
        .from('designs')
        .select('count')
        .eq('user_id', user.id);
      return result.data;
    },
    300 // 5 minutes
  );
  
  return NextResponse.json({ success: true, data: stats });
}
```

---

## 🎯 STRATÉGIES AVANCÉES

### 1. Cache Warming

```typescript
// Préchauffer le cache pour les données fréquentes
async function warmCache() {
  const featuredTemplates = await fetchFeaturedTemplates();
  await CacheService.set('cache:templates:featured', featuredTemplates, 3600);
  
  const topCliparts = await fetchTopCliparts();
  await CacheService.set('cache:cliparts:top', topCliparts, 3600);
}
```

### 2. Cache Invalidation

```typescript
// Invalidation ciblée après mutation
async function createProduct(data) {
  const product = await supabase.from('products').insert(data);
  
  // Invalider caches liés
  await CacheService.delPattern('cache:products:*');
  await CacheService.del(`cache:dashboard:stats:user:${userId}:*`);
  
  return product;
}
```

### 3. Geo-replication

```typescript
// Upstash Global Database (multi-region)
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  enableAutoPipelining: true, // Batch requests
  enableOfflineQueue: false, // Fail fast
});
```

---

## 📊 MONITORING

### Upstash Dashboard

**Métriques disponibles:**
- Requests per second
- Latency (p50, p95, p99)
- Cache hit rate
- Storage usage
- Bandwidth

**URL:** https://console.upstash.com/redis/[database-id]

### Alertes

**Configurer:**
- High latency (>100ms)
- Error rate (>1%)
- Storage limit (80% capacity)

---

## ✅ CHECKLIST IMPLÉMENTATION

- [ ] Compte Upstash créé
- [ ] Database Redis créée (région US East)
- [ ] Variables Vercel ajoutées
- [ ] Packages installés (@upstash/redis, @upstash/ratelimit)
- [ ] CacheService implémenté
- [ ] Rate limiting actif
- [ ] Caching dashboard stats
- [ ] Caching templates/cliparts
- [ ] Monitoring dashboard vérifié
- [ ] Tests de charge effectués

---

## 🎉 RÉSULTAT ATTENDU

**Sans Redis:**
- Latence API: 500-1000ms
- Rate limiting: ❌
- Cache: ❌
- Scalability: Limited

**Avec Redis:**
- Latence API: 50-150ms ✅ (5-10x plus rapide)
- Rate limiting: ✅ Protection DDoS
- Cache: ✅ Hit rate >80%
- Scalability: ✅ Illimité

---

*Guide professionnel créé le 29 Oct 2025*

