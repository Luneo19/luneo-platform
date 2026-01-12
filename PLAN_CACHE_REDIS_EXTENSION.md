# 🚀 PLAN D'EXTENSION CACHE REDIS

## Objectif
Étendre le cache Redis à tous les endpoints critiques pour améliorer les performances.

## Endpoints à Cacher

### 1. Products Module ✅
- `GET /api/v1/products` - Liste produits (5 min)
- `GET /api/v1/products/:id` - Détail produit (10 min)
- `GET /api/v1/products/:id/specs` - Spécifications (10 min)

**Invalidation** :
- `POST /api/v1/products` → Invalide `products:list`
- `PUT /api/v1/products/:id` → Invalide `product:{id}`, `products:list`
- `DELETE /api/v1/products/:id` → Invalide `product:{id}`, `products:list`

### 2. Orders Module
- `GET /api/v1/orders` - Liste commandes (2 min)
- `GET /api/v1/orders/:id` - Détail commande (5 min)

**Invalidation** :
- `POST /api/v1/orders` → Invalide `orders:list`, `orders:{userId}`
- `PUT /api/v1/orders/:id` → Invalide `order:{id}`, `orders:list`
- `PATCH /api/v1/orders/:id/status` → Invalide `order:{id}`, `orders:list`

### 3. Designs Module
- `GET /api/v1/designs` - Liste designs (2 min)
- `GET /api/v1/designs/:id` - Détail design (5 min)

**Invalidation** :
- `POST /api/v1/designs` → Invalide `designs:list`, `designs:{userId}`
- `PUT /api/v1/designs/:id` → Invalide `design:{id}`, `designs:list`
- `DELETE /api/v1/designs/:id` → Invalide `design:{id}`, `designs:list`

### 4. Users Module
- `GET /api/v1/users` - Liste utilisateurs (5 min)
- `GET /api/v1/users/:id` - Détail utilisateur (10 min)
- `GET /api/v1/auth/me` - Profil utilisateur (5 min)

**Invalidation** :
- `PUT /api/v1/users/:id` → Invalide `user:{id}`, `users:list`
- `DELETE /api/v1/users/:id` → Invalide `user:{id}`, `users:list`

### 5. Analytics Module
- `GET /api/v1/analytics/overview` - Vue d'ensemble (1 min)
- `GET /api/v1/analytics/designs` - Analytics designs (2 min)
- `GET /api/v1/analytics/orders` - Analytics commandes (2 min)
- `GET /api/v1/analytics/revenue` - Revenus (2 min)

**Invalidation** :
- Automatique après TTL (données analytiques changent fréquemment)

### 6. Brands Module
- `GET /api/v1/brands/current` - Brand actuel (10 min)
- `GET /api/v1/brands/settings` - Paramètres brand (10 min)

**Invalidation** :
- `PUT /api/v1/brands/current` → Invalide `brand:{id}`, `brand:current`
- `PUT /api/v1/brands/settings` → Invalide `brand:{id}:settings`

## Implémentation

### Étape 1 : Créer les décorateurs et services ✅
- ✅ `Cache` decorator
- ✅ `InvalidateCache` decorator
- ✅ `EnhancedCacheableInterceptor`
- ✅ `CacheInvalidationService`

### Étape 2 : Ajouter cache aux services
Pour chaque service, ajouter les décorateurs :

```typescript
// products.service.ts
import { Cache, InvalidateCache } from '@/libs/cache/cache.decorator';
import { CacheInvalidationService } from '@/libs/cache/cache-invalidation.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheInvalidation: CacheInvalidationService,
  ) {}

  @Cache({ ttl: 300, tags: ['products', 'products:list'] })
  async findAll(brandId: string, filters?: any) {
    // ... existing code
  }

  @Cache({ ttl: 600, tags: ['products', 'product:{id}'] })
  async findOne(id: string) {
    // ... existing code
  }

  @InvalidateCache(['products', 'products:list'])
  async create(data: CreateProductDto, brandId: string) {
    const product = await this.prisma.product.create({ ... });
    return product;
  }

  @InvalidateCache(['products', 'products:list', 'product:{id}'])
  async update(id: string, data: UpdateProductDto) {
    const product = await this.prisma.product.update({ ... });
    await this.cacheInvalidation.invalidateByTags([`product:${id}`]);
    return product;
  }

  @InvalidateCache(['products', 'products:list', 'product:{id}'])
  async remove(id: string) {
    await this.prisma.product.delete({ ... });
    await this.cacheInvalidation.invalidateByTags([`product:${id}`]);
  }
}
```

### Étape 3 : Activer l'interceptor
L'interceptor `EnhancedCacheableInterceptor` est déjà créé et peut être appliqué globalement ou par module.

## Configuration TTL Recommandée

- **Données statiques** (produits, utilisateurs) : 5-10 minutes
- **Données dynamiques** (commandes, designs) : 2-5 minutes
- **Analytics** : 1-2 minutes
- **Données utilisateur** : 5 minutes

## Monitoring

- Surveiller le hit rate du cache
- Surveiller la taille du cache Redis
- Alerter si le cache est plein (>80%)

## Tests

- Tester le cache hit/miss
- Tester l'invalidation
- Tester la performance avec/sans cache

---

*Dernière mise à jour : Janvier 2025*
