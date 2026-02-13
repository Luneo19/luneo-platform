import { Injectable, Inject } from '@nestjs/common';
import { RedisOptimizedService } from '@/libs/redis/redis-optimized.service';

/**
 * Service de cache pour les produits
 * Optimise les requêtes fréquentes avec Redis
 */
@Injectable()
export class ProductsCacheService {
  constructor(
    @Inject(RedisOptimizedService)
    private readonly cache: RedisOptimizedService,
  ) {}

  /**
   * Génère une clé de cache pour une liste de produits
   */
  private getListKey(filters: Record<string, unknown>): string {
    const filterStr = JSON.stringify(filters);
    return `products:list:${Buffer.from(filterStr).toString('base64')}`;
  }

  /**
   * Génère une clé de cache pour un produit spécifique
   */
  private getProductKey(id: string): string {
    return `products:${id}`;
  }

  /**
   * Récupère une liste de produits depuis le cache
   */
  async getList(filters: Record<string, unknown>): Promise<unknown[] | null> {
    const key = this.getListKey(filters);
    return this.cache.get<unknown[]>(key, 'product');
  }

  /**
   * Met en cache une liste de produits
   */
  async setList(filters: Record<string, unknown>, products: unknown[]): Promise<void> {
    const key = this.getListKey(filters);
    await this.cache.set(key, products, 'product', {
      ttl: 300, // 5 minutes
      tags: ['products', 'products:list'],
    });
  }

  /**
   * Récupère un produit depuis le cache
   */
  async getProduct(id: string): Promise<unknown | null> {
    const key = this.getProductKey(id);
    return this.cache.get<unknown>(key, 'product');
  }

  /**
   * Met en cache un produit
   */
  async setProduct(id: string, product: unknown): Promise<void> {
    const key = this.getProductKey(id);
    await this.cache.set(key, product, 'product', {
      ttl: 600, // 10 minutes
      tags: ['products', `products:${id}`],
    });
  }

  /**
   * Invalide le cache d'un produit
   */
  async invalidateProduct(id: string): Promise<void> {
    const key = this.getProductKey(id);
    await this.cache.del(key, 'product');
    // Invalider aussi les listes
    await this.cache.invalidateByTags(['products:list']);
  }

  /**
   * Invalide tout le cache des produits
   */
  async invalidateAll(): Promise<void> {
    await this.cache.invalidateByTags(['products']);
  }
}
