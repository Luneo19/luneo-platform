import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest } from '@/lib/api-response';
import { logger } from '@/lib/logger';

type ProductRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/products/[id]
 * Récupère un produit spécifique
 */
export async function GET(request: Request, { params }: ProductRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (productError || !product) {
      if (productError?.code === 'PGRST116') {
        throw { status: 404, message: 'Produit non trouvé', code: 'PRODUCT_NOT_FOUND' };
      }
      logger.dbError('fetch product', productError, { productId: id, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du produit' };
    }

    return { product };
  }, '/api/products/[id]', 'GET');
}

/**
 * PUT /api/products/[id]
 * Mettre à jour un produit
 */
export async function PUT(request: Request, { params }: ProductRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que le produit existe et appartient à l'utilisateur
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingProduct) {
      logger.warn('Product update attempt on non-existent or unauthorized product', {
        productId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Produit non trouvé', code: 'PRODUCT_NOT_FOUND' };
    }

    const body = await request.json();
    const {
      name,
      description,
      sku,
      base_price,
      images,
      customization_options,
      is_active,
    } = body;

    // Validation du prix si fourni
    if (base_price !== undefined) {
      if (typeof base_price !== 'number' || base_price < 0) {
        throw {
          status: 400,
          message: 'Le prix doit être un nombre positif',
          code: 'VALIDATION_ERROR',
        };
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (sku !== undefined) updateData.sku = sku?.trim() || null;
    if (base_price !== undefined) updateData.base_price = base_price;
    if (images !== undefined) updateData.images = Array.isArray(images) ? images : [];
    if (customization_options !== undefined) updateData.customization_options = customization_options || {};
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update product', updateError, {
        productId: id,
        userId: user.id,
      });
      
      // Handle unique constraint violation
      if (updateError.code === '23505') {
        throw {
          status: 409,
          message: 'Un produit avec ce SKU existe déjà',
          code: 'DUPLICATE_PRODUCT',
        };
      }

      throw { status: 500, message: 'Erreur lors de la mise à jour du produit' };
    }

    logger.info('Product updated', {
      productId: id,
      userId: user.id,
    });

    return { product, message: 'Produit mis à jour avec succès' };
  }, '/api/products/[id]', 'PUT');
}

/**
 * DELETE /api/products/[id]
 * Supprimer un produit
 */
export async function DELETE(request: Request, { params }: ProductRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que le produit existe et appartient à l'utilisateur
    const { data: existingProduct, error: checkError } = await supabase
      .from('products')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingProduct) {
      logger.warn('Product delete attempt on non-existent or unauthorized product', {
        productId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Produit non trouvé', code: 'PRODUCT_NOT_FOUND' };
    }

    // Supprimer d'abord les variantes
    const { error: variantsError } = await supabase
      .from('product_variants')
      .delete()
      .eq('product_id', id);

    if (variantsError) {
      logger.dbError('delete product variants', variantsError, { productId: id });
      // Continuer quand même la suppression du produit
    }

    // Supprimer le produit
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.dbError('delete product', deleteError, {
        productId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression du produit' };
    }

    logger.info('Product deleted', {
      productId: id,
      userId: user.id,
    });

    return { message: 'Produit supprimé avec succès' };
  }, '/api/products/[id]', 'DELETE');
}
