import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * GET /api/credits/packs
 * Récupère tous les packs de crédits disponibles
 */
export async function GET(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    // Option 1: Appeler backend API (Prisma)
    try {
      // Use NEXT_PUBLIC_API_URL from environment variables
      // Fallback to localhost for development only
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 
        (process.env.NODE_ENV === 'production' 
          ? null // Should be configured in Vercel
          : 'http://localhost:3001');
      
      // Essayer de récupérer l'utilisateur pour l'auth
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const response = await fetch(`${backendUrl}/credits/packs`, {
        headers: {
          'Authorization': user ? `Bearer ${user.id}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          // Formater les packs
          const formattedPacks = data.map((pack: any) => ({
            id: pack.id,
            name: pack.name,
            credits: pack.credits,
            priceCents: pack.priceCents || pack.price_cents,
            price: (pack.priceCents || pack.price_cents) / 100,
            stripePriceId: pack.stripePriceId || pack.stripe_price_id,
            isFeatured: pack.isFeatured || pack.is_featured || false,
            badge: pack.badge,
            savings: pack.savings || 0,
          }));
          return { packs: formattedPacks };
        }
      }
    } catch (fetchError: any) {
      logger.warn('Failed to fetch packs from backend, using fallback', {
        error: fetchError?.message,
      });
    }

    // Fallback: Packs par défaut avec Price IDs de la DB
    return {
      packs: [
        {
          id: 'pack_100',
          name: 'Pack 100 Crédits IA',
          credits: 100,
          priceCents: 1900,
          price: 19,
          isFeatured: false,
          savings: 0,
          stripePriceId: 'price_1SgiPqKG9MsM6fdS8zMD8VuY',
        },
        {
          id: 'pack_500',
          name: 'Pack 500 Crédits IA',
          credits: 500,
          priceCents: 7900,
          price: 79,
          isFeatured: true,
          badge: 'Best Value',
          savings: 16,
          stripePriceId: 'price_1SgiPrKG9MsM6fdSwAJaHCLj',
        },
        {
          id: 'pack_1000',
          name: 'Pack 1000 Crédits IA',
          credits: 1000,
          priceCents: 13900,
          price: 139,
          isFeatured: false,
          savings: 26,
          stripePriceId: 'price_1SgiPsKG9MsM6fdS5lPGuAdd',
        },
      ],
    };
  }, '/api/credits/packs', 'GET');
}
















