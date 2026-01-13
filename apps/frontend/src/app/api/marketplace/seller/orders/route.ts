/**
 * ★★★ API ROUTE - SELLER ORDERS ★★★
 * Route API Next.js pour la gestion des commandes seller
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que l'utilisateur est un seller
    const { data: seller, error: sellerError } = await supabase
      .from('artisans')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller || seller.status !== 'active') {
      throw { status: 403, message: 'Vous devez être un seller actif', code: 'FORBIDDEN' };
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);
    const status = searchParams.get('status') || undefined;

    // Récupérer les commandes du seller via les order items
    // Les commandes sont liées aux produits du seller
    const { data: sellerProducts } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', seller.id);

    const productIds = sellerProducts?.map((p: any) => p.id) || [];

    if (productIds.length === 0) {
      return {
        orders: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    // Récupérer les commandes contenant les produits du seller
    const { data: orders, error, count } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items!inner(
          product_id,
          quantity,
          price_cents
        )
      `,
        { count: 'exact' },
      )
      .in(
        'id',
        supabase
          .from('order_items')
          .select('order_id')
          .in('product_id', productIds)
          .then((res: any) => res.data?.map((item: any) => item.order_id) || []),
      )
      .eq(status ? 'status' : 'id', status || 'id', status ? status : undefined)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.dbError('fetch seller orders', error, { userId: user.id, sellerId: seller.id });
      throw { status: 500, message: 'Erreur lors de la récupération des commandes', code: 'DATABASE_ERROR' };
    }

    return {
      orders: orders || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1,
      },
    };
  }, '/api/marketplace/seller/orders', 'GET');
}



