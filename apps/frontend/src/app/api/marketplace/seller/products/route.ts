/**
 * ★★★ API ROUTE - SELLER PRODUCTS ★★★
 * Route API Next.js pour la gestion des produits seller
 * Respecte la Bible Luneo : Server Component, ApiResponseBuilder, validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ApiResponseBuilder, getPaginationParams } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const CreateProductSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive().optional(),
  currency: z.string().length(3).default('EUR'),
  category: z.string().optional(),
  images: z.array(z.string().url()).optional(),
  sku: z.string().optional(),
  stock: z.number().int().nonnegative().optional(),
});

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
      .select('id, stripe_account_id, status, brand_id')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller || seller.status !== 'active') {
      throw { status: 403, message: 'Vous devez être un seller actif', code: 'FORBIDDEN' };
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);

    // Récupérer les produits du seller
    const { data: products, error, count } = await supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.dbError('fetch seller products', error, { userId: user.id, sellerId: seller.id });
      throw { status: 500, message: 'Erreur lors de la récupération des produits', code: 'DATABASE_ERROR' };
    }

    return {
      products: products || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1,
      },
    };
  }, '/api/marketplace/seller/products', 'GET');
}

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier seller status
    const { data: seller, error: sellerError } = await supabase
      .from('artisans')
      .select('id, status, brand_id')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller || seller.status !== 'active') {
      throw { status: 403, message: 'Vous devez être un seller actif', code: 'FORBIDDEN' };
    }

    const body = await request.json();
    const validation = CreateProductSchema.safeParse(body);

    if (!validation.success) {
      throw { status: 400, message: 'Données invalides', code: 'VALIDATION_ERROR', details: validation.error.issues };
    }

    // Créer le produit
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...validation.data,
        seller_id: seller.id,
        brand_id: seller.brand_id,
        is_active: true,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error) {
      logger.dbError('create seller product', error, { userId: user.id, sellerId: seller.id });
      throw { status: 500, message: 'Erreur lors de la création du produit', code: 'DATABASE_ERROR' };
    }

    logger.info('Seller product created', { userId: user.id, sellerId: seller.id, productId: product.id });

    return { product };
  }, '/api/marketplace/seller/products', 'POST');
}



