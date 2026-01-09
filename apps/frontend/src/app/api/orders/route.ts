import { ApiResponseBuilder, getPaginationParams, validateWithZodSchema } from '@/lib/api-response';
import { forwardGet, forwardPost } from '@/lib/backend-forward';
import { createOrderSchema } from '@/lib/validation/zod-schemas';
import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/orders
 * Liste des commandes de l'utilisateur avec pagination
 * Query params: page, limit, status, search
 * Forward vers backend NestJS: GET /orders
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const { page, limit } = getPaginationParams(searchParams);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = await forwardGet('/orders', request, {
      page,
      limit,
      ...(status && { status }),
      ...(search && { search }),
    });
    return result.data;
  }, '/api/orders', 'GET');
}

/**
 * POST /api/orders
 * Créer une nouvelle commande
 * Body: { items, shipping_address, billing_address, payment_method, notes }
 * Note: Le backend actuel gère un seul design par commande. Pour plusieurs items, créer plusieurs commandes.
 * TODO: Améliorer le backend pour gérer plusieurs items dans une seule commande.
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
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

    // Récupérer l'email de l'utilisateur
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Formater l'adresse pour le backend
    const shippingAddressString = `${shipping_address.street}, ${shipping_address.city}, ${shipping_address.postal_code}, ${shipping_address.country}`;

    // Appeler le backend avec le nouveau format supportant plusieurs items
    const result = await forwardPost('/orders', request, {
      items: items.map(item => ({
        product_id: item.product_id,
        design_id: item.design_id,
        quantity: item.quantity,
        customization: item.customization,
        production_notes: item.production_notes,
      })),
      customerEmail: user.email || shipping_address.name,
      customerName: shipping_address.name,
      customerPhone: shipping_address.phone,
      shippingAddress: shippingAddressString,
      shippingMethod: shipping_method,
      discountCode: discount_code,
    });

    return result.data;
  }, '/api/orders', 'POST');
}
