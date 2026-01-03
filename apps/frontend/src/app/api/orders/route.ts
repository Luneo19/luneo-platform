import { ApiResponseBuilder, getPaginationParams, validateWithZodSchema } from '@/lib/api-response';
import { cacheKeys, cacheService, cacheTTL } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';
import { checkRateLimit, getApiRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { createOrderSchema } from '@/lib/validation/zod-schemas';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/orders
 * Liste des commandes de l'utilisateur avec pagination
 * Query params: page, limit, status, search
 */
export async function GET(request: NextRequest) {
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

    // Pagination et filtres
    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Vérifier le cache
    const cacheKey = cacheKeys.orders(user.id, page, limit, status || 'all', search || '');
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Orders served from cache', { userId: user.id, page, status, search });
      const response = NextResponse.json(cached);
      response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    // Query de base
    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          id,
          product_name,
          design_name,
          design_preview_url,
          quantity,
          unit_price,
          total_price,
          production_status
        )
      `, { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filtre par statut
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Recherche par order_number ou customer_email
    if (search && search.trim() !== '') {
      query = query.or(`order_number.ilike.%${search.trim()}%,customer_email.ilike.%${search.trim()}%`);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      logger.dbError('fetch orders', error, {
        userId: user.id,
        filters: { status, search },
      });
      throw { status: 500, message: 'Erreur lors de la récupération des commandes' };
    }

    // Calculer pagination
    const totalPages = Math.ceil((count || 0) / limit);

    const result = {
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };

    // Mettre en cache
    await cacheService.set(cacheKey, result, { ttl: cacheTTL.ORDERS_LIST });
    
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
    response.headers.set('X-Cache', 'MISS');
    return response;
  }, '/api/orders', 'GET');
}

/**
 * POST /api/orders
 * Créer une nouvelle commande
 * Body: { items, shipping_address, billing_address, payment_method, notes }
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Rate limiting (stricter for mutations)
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
    const validation = validateWithZodSchema(createOrderSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const validatedData = validation.data as {
      items: Array<{
        product_id: string;
        design_id?: string;
        design_name?: string;
        design_preview_url?: string;
        design_print_url?: string;
        quantity: number;
        customization?: Record<string, any>;
        production_notes?: string;
      }>;
      shipping_address: {
        name: string;
        street: string;
        city: string;
        postal_code: string;
        country: string;
        phone?: string;
      };
      billing_address?: {
        name: string;
        street: string;
        city: string;
        postal_code: string;
        country: string;
        phone?: string;
      };
      payment_method?: 'card' | 'paypal' | 'bank_transfer';
      shipping_method?: 'standard' | 'express' | 'overnight';
      customer_notes?: string;
      discount_code?: string;
    };
    const {
      items,
      shipping_address,
      billing_address,
      payment_method = 'card',
      customer_notes,
      shipping_method = 'standard',
      discount_code,
    } = validatedData;

    // Récupérer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.dbError('fetch user profile', profileError, { userId: user.id });
    }

    // Calculer les montants
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      // Les items sont déjà validés par Zod (product_id, quantity, etc.)
      // Récupérer le produit pour vérifier le prix
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('name, base_price, stock')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        logger.warn('Product not found for order', {
          productId: item.product_id,
          userId: user.id,
        });
        throw {
          status: 400,
          message: `Produit ${item.product_id} introuvable`,
          code: 'PRODUCT_NOT_FOUND',
        };
      }

      // Vérifier le stock
      if (product.stock !== null && product.stock < item.quantity) {
        throw {
          status: 400,
          message: `Stock insuffisant pour ${product.name}`,
          code: 'INSUFFICIENT_STOCK',
        };
      }

      const itemTotal = product.base_price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product_id: item.product_id,
        design_id: item.design_id,
        product_name: product.name,
        design_name: item.design_name,
        design_preview_url: item.design_preview_url,
        design_print_url: item.design_print_url,
        quantity: item.quantity,
        unit_price: product.base_price,
        total_price: itemTotal,
        customization: item.customization,
        production_notes: item.production_notes,
      });
    }

    // Calculer taxes (20% TVA pour France)
    const tax_amount = Math.round(subtotal * 0.20);

    // Frais de livraison
    let shipping_amount = 0;
    if (shipping_method === 'standard') shipping_amount = 500; // 5€
    else if (shipping_method === 'express') shipping_amount = 1500; // 15€
    else if (shipping_method === 'overnight') shipping_amount = 3000; // 30€

    // Appliquer réduction si code fourni
    let discount_amount = 0;
    let discount_code_id: string | null = null;
    
    if (discount_code) {
      const { validateDiscountCode } = await import('@/lib/discount-codes');
      
      // Extraire les IDs des produits de la commande
      const itemIds = items.map(item => item.product_id || item.design_id).filter(Boolean) as string[];
      
      // Valider le code promo
      const validation = await validateDiscountCode(
        discount_code,
        user.id,
        subtotal,
        itemIds.length > 0 ? itemIds : undefined
      );

      if (validation.valid && validation.discountCode) {
        discount_amount = validation.discountAmount;
        discount_code_id = validation.discountCode.id;
        
        logger.info('Discount code applied', {
          code: discount_code,
          userId: user.id,
          discountAmount: discount_amount,
          discountCodeId: discount_code_id,
        });
      } else {
        // Code invalide, retourner erreur
        throw {
          status: 400,
          message: validation.reason || 'Code promo invalide',
          code: validation.error || 'INVALID_DISCOUNT_CODE',
        };
      }
    }

    const total_amount = subtotal + tax_amount + shipping_amount - discount_amount;

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        customer_email: profile?.email || user.email,
        customer_name: profile?.name || '',
        status: 'pending',
        payment_status: 'pending',
        payment_method,
        subtotal,
        tax_amount,
        shipping_amount,
        discount_amount,
        total_amount,
        currency: 'EUR',
        shipping_address,
        billing_address: billing_address || shipping_address,
        shipping_method,
        customer_notes,
        metadata: {
          discount_code,
          discount_code_id,
          created_from: 'web_app',
        },
      })
      .select()
      .single();

    if (orderError) {
      logger.dbError('create order', orderError, {
        userId: user.id,
        itemsCount: items.length,
      });
      throw { status: 500, message: 'Erreur lors de la création de la commande' };
    }

    // Créer les order items
    const itemsWithOrderId = validatedItems.map((item) => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId);

    if (itemsError) {
      logger.dbError('create order items', itemsError, {
        orderId: order.id,
        userId: user.id,
      });
      // Rollback: supprimer la commande
      await supabase.from('orders').delete().eq('id', order.id);
      throw { status: 500, message: 'Erreur lors de l\'ajout des produits' };
    }

    // Mettre à jour le stock des produits
    for (const item of validatedItems) {
      try {
        await supabase.rpc('decrement_product_stock', {
          product_uuid: item.product_id,
          quantity: item.quantity,
        });
      } catch (stockError: any) {
        logger.error('Error decrementing product stock', stockError, {
          productId: item.product_id,
          quantity: item.quantity,
        });
        // Ne pas bloquer la commande si le stock échoue
      }
    }

    // Retourner la commande créée avec les items
    const { data: fullOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (*)
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) {
      logger.dbError('fetch created order', fetchError, { orderId: order.id });
      // Retourner quand même la commande de base
      return { order };
    }

    // Enregistrer l'utilisation du code promo si applicable
    if (discount_code_id && discount_amount > 0) {
      try {
        const { recordDiscountCodeUsage } = await import('@/lib/discount-codes');
        await recordDiscountCodeUsage(discount_code_id, user.id, order.id, discount_amount);
      } catch (discountError) {
        // Log error but don't fail the order creation
        logger.error('Error recording discount code usage', discountError instanceof Error ? discountError : new Error(String(discountError)), {
          orderId: order.id,
          discountCodeId: discount_code_id,
          userId: user.id,
        });
      }
    }

    logger.info('Order created', {
      orderId: order.id,
      userId: user.id,
      totalAmount: total_amount,
      itemsCount: validatedItems.length,
      discountAmount: discount_amount,
      discountCode: discount_code || null,
    });

    return { order: fullOrder || order };
  }, '/api/orders', 'POST');
}
