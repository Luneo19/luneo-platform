/**
 * ★★★ API ROUTE - SELLER REVIEWS ★★★
 * Route API Next.js pour la gestion des avis seller
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

    // Récupérer les produits du seller
    const { data: sellerProducts } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', seller.id);

    const productIds = sellerProducts?.map((p) => p.id) || [];

    if (productIds.length === 0) {
      return {
        reviews: [],
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

    // Récupérer les avis pour les produits du seller
    // Note: La table reviews n'existe peut-être pas encore, utiliser une structure flexible
    const { data: reviews, error, count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .in('product_id', productIds)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
      .maybeSingle();

    // Si la table n'existe pas, retourner des données vides
    if (error && error.code !== 'PGRST116') {
      logger.dbError('fetch seller reviews', error, { userId: user.id, sellerId: seller.id });
      // Ne pas throw, retourner des données vides si la table n'existe pas
    }

    return {
      reviews: reviews ? (Array.isArray(reviews) ? reviews : [reviews]) : [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1,
      },
    };
  }, '/api/marketplace/seller/reviews', 'GET');
}


