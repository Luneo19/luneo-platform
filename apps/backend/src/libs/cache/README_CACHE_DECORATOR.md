# 🚀 Cache Decorator - Guide d'utilisation

## Vue d'ensemble

Le système de cache decorator permet de mettre en cache automatiquement les résultats des méthodes de service avec une simple annotation.

## Installation

L'interceptor est déjà enregistré globalement dans `app.module.ts`. Aucune configuration supplémentaire n'est nécessaire.

## Utilisation

### @Cacheable - Mettre en cache les résultats

```typescript
import { Cacheable } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class ProductsService {
  @Cacheable({ 
    type: 'product', 
    ttl: 3600,
    keyGenerator: (args) => `product:${args[0]}`,
    tags: () => ['products:list'],
  })
  async findOne(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }
}
```

### @CacheInvalidate - Invalider le cache

```typescript
import { CacheInvalidate } from '@/libs/cache/cacheable.decorator';

@Injectable()
export class ProductsService {
  @CacheInvalidate({ 
    type: 'product',
    tags: (args) => ['products:list', `brand:${args[0]}`],
  })
  async create(brandId: string, data: any) {
    return this.prisma.product.create({ data: { ...data, brandId } });
  }
}
```

## Options

### CacheableOptions

| Option | Type | Description | Défaut |
|--------|------|-------------|--------|
| `type` | `string` | Type de cache (détermine TTL par défaut) | `'api'` |
| `ttl` | `number` | Time to live en secondes | TTL du type |
| `keyGenerator` | `function` | Générateur de clé personnalisé | `defaultKeyGenerator` |
| `tags` | `string[]` ou `function` | Tags pour invalidation | `[]` |
| `skipIfNull` | `boolean` | Ne pas cacher si résultat null | `true` |
| `cacheErrors` | `boolean` | Cacher les erreurs (non recommandé) | `false` |

### CacheInvalidateOptions

| Option | Type | Description | Défaut |
|--------|------|-------------|--------|
| `type` | `string` | Type de cache | `'api'` |
| `pattern` | `string` ou `function` | Pattern de clé à invalider | - |
| `tags` | `string[]` ou `function` | Tags à invalider | - |

## Types de cache disponibles

| Type | TTL par défaut | Usage |
|------|----------------|-------|
| `user` | 1800s (30min) | Données utilisateur |
| `brand` | 3600s (1h) | Données brand |
| `product` | 7200s (2h) | Produits |
| `design` | 900s (15min) | Designs (données changeantes) |
| `analytics` | 300s (5min) | Métriques analytics |
| `session` | 86400s (24h) | Sessions |
| `api` | 600s (10min) | Cache API général |

## Exemples

### Exemple 1: Cache simple

```typescript
@Cacheable({ type: 'product', ttl: 3600 })
async findOne(id: string) {
  return this.prisma.product.findUnique({ where: { id } });
}
```

### Exemple 2: Cache avec clé personnalisée

```typescript
@Cacheable({ 
  type: 'product',
  keyGenerator: (args) => `product:${args[0]}:${args[1]}`,
})
async findByBrandAndStatus(brandId: string, status: string) {
  return this.prisma.product.findMany({
    where: { brandId, status },
  });
}
```

### Exemple 3: Cache avec tags dynamiques

```typescript
@Cacheable({ 
  type: 'product',
  tags: (args) => ['products:list', `brand:${args[0]?.brandId}`],
})
async findAll(query: any) {
  return this.prisma.product.findMany({ where: query });
}
```

### Exemple 4: Invalidation par tags

```typescript
@CacheInvalidate({ 
  type: 'product',
  tags: (args) => ['products:list', `brand:${args[0]}`],
})
async create(brandId: string, data: any) {
  return this.prisma.product.create({ data: { ...data, brandId } });
}
```

### Exemple 5: Invalidation par pattern

```typescript
@CacheInvalidate({ 
  type: 'product',
  pattern: (args) => `product:${args[1]}`,
})
async update(brandId: string, id: string, data: any) {
  return this.prisma.product.update({ where: { id }, data });
}
```

## Bonnes pratiques

1. **Utilisez des clés descriptives** : `product:${id}` plutôt que `p:${id}`
2. **Ajoutez des tags** : Facilite l'invalidation groupée
3. **TTL approprié** : 
   - Données statiques : TTL long (1-2h)
   - Données changeantes : TTL court (5-15min)
4. **Invalidation après modification** : Toujours invalider après create/update/delete
5. **Évitez de cacher les erreurs** : `cacheErrors: false` par défaut

## Monitoring

Les logs de cache sont automatiquement générés :
- `Cache hit` : Données récupérées du cache
- `Cache miss` : Données récupérées de la source
- `Cached` : Données mises en cache
- `Cache invalidated` : Cache invalidé

## Performance

- **Hit rate attendu** : 70-90% pour les requêtes fréquentes
- **Réduction de charge DB** : 50-80% pour les requêtes en cache
- **Temps de réponse** : < 10ms pour les hits (vs 50-200ms pour DB)

