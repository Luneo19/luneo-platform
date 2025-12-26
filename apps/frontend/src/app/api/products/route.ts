import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, getPaginationParams, validateRequest, validateWithZodSchema } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createProductSchema } from '@/lib/validation/zod-schemas';
import { cacheService, cacheKeys, cacheTTL } from '@/lib/cache/redis';
import { checkRateLimit, getApiRateLimit, getClientIdentifier } from '@/lib/rate-limit';

/**
 * GET /api/products
 * Récupère la liste des produits de l'utilisateur
 */
export async function GET(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting
    const identifier = getClientIdentifier(request, user.id);
    const { success, remaining, reset } = await checkRateLimit(identifier, getApiRateLimit());
    
    if (!success) {
      throw {
        status: 429,
        message: `Trop de requêtes. Réessayez après ${reset.toLocaleTimeString()}.`,
        code: 'RATE_LIMIT_EXCEEDED',
        remaining: 0,
        reset: reset.toISOString(),
      };
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);

    // Vérifier le cache
    const cacheKey = cacheKeys.products(user.id, page, limit);
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Products served from cache', { userId: user.id, page });
      const response = NextResponse.json(cached);
      response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    const { data: products, error: productsError, count } = await supabase
      .from('products')
      .select('*, product_variants(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (productsError) {
      logger.dbError('fetch products', productsError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération des produits' };
    }

    const result = {
      products: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    };

    // Mettre en cache (10 minutes TTL)
    await cacheService.set(cacheKey, result, { ttl: cacheTTL.products });

    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1200');
    response.headers.set('X-Cache', 'MISS');
    return response;
  }, '/api/products', 'GET');
}

/**
 * POST /api/products
 * Créer un nouveau produit
 */
export async function POST(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting (stricter pour mutations)
    const identifier = getClientIdentifier(request, user.id);
    const { success, remaining, reset } = await checkRateLimit(identifier, getApiRateLimit());
    
    if (!success) {
      throw {
        status: 429,
        message: `Trop de requêtes. Réessayez après ${reset.toLocaleTimeString()}.`,
        code: 'RATE_LIMIT_EXCEEDED',
        remaining: 0,
        reset: reset.toISOString(),
      };
    }

    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(createProductSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const validatedData = validation.data as {
      name: string;
      description?: string;
      sku?: string;
      base_price: number;
      currency?: 'EUR' | 'USD' | 'GBP';
      images?: string[];
      variants?: Array<{
        name: string;
        sku?: string;
        price?: number;
        stock?: number | null;
        attributes?: Record<string, any>;
      }>;
      customization_options?: Record<string, any>;
    };
    const {
      name,
      description,
      sku,
      base_price,
      currency = 'EUR',
      images = [],
      variants = [],
      customization_options,
    } = validatedData;

    // Créer le produit
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        sku: sku?.trim() || null,
        base_price,
        currency,
        images: Array.isArray(images) ? images : [],
        customization_options: customization_options || {},
      })
      .select()
      .single();

    if (productError) {
      logger.dbError('create product', productError, {
        userId: user.id,
        productName: name,
      });
      
      // Handle unique constraint violation
      if (productError.code === '23505') {
        throw {
          status: 409,
          message: 'Un produit avec ce SKU existe déjà',
          code: 'DUPLICATE_PRODUCT',
        };
      }

      throw { status: 500, message: 'Erreur lors de la création du produit' };
    }

    // Créer les variantes si fournies
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const variantsData = variants.map((variant: any) => ({
        product_id: product.id,
        name: variant.name,
        sku: variant.sku,
        price: variant.price || base_price,
        stock: variant.stock,
        attributes: variant.attributes || {},
      }));

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantsData);

      if (variantsError) {
        logger.dbError('create product variants', variantsError, {
          productId: product.id,
          variantsCount: variants.length,
        });
        // Ne pas bloquer la création du produit si les variantes échouent
        logger.warn('Product created but variants failed', {
          productId: product.id,
        });
      }
    }

    logger.info('Product created', {
      productId: product.id,
      userId: user.id,
      productName: name,
    });

    // Récupérer le produit avec ses variantes
    const { data: fullProduct } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', product.id)
      .single();

    // Invalider le cache des produits
    await cacheService.deleteMany([
      cacheKeys.products(user.id, 1, 20), // Page 1 par défaut
      cacheKeys.products(user.id, 1, 50), // Autres pages possibles
    ]);

    return { product: fullProduct || product };
  }, '/api/products', 'POST');
}
