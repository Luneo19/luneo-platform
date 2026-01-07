/**
 * ★★★ API ROUTE - SELLER PAYOUTS ★★★
 * Route API Next.js pour la gestion des paiements seller
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
      .select('id, stripe_account_id, status')
      .eq('user_id', user.id)
      .single();

    if (sellerError || !seller || seller.status !== 'active') {
      throw { status: 403, message: 'Vous devez être un seller actif', code: 'FORBIDDEN' };
    }

    const { searchParams } = new URL(request.url);
    const { page, limit, offset } = getPaginationParams(searchParams);

    // Récupérer les payouts depuis Stripe Connect
    // Pour l'instant, retourner des données mockées structurées
    // TODO: Intégrer avec Stripe Connect API pour récupérer les vrais payouts

    const mockPayouts = [
      {
        id: 'payout_1',
        amount: 1250.50,
        currency: 'EUR',
        status: 'paid',
        created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        arrivalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        description: 'Paiement commandes semaine 1',
      },
      {
        id: 'payout_2',
        amount: 890.25,
        currency: 'EUR',
        status: 'pending',
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        arrivalDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        description: 'Paiement commandes semaine 2',
      },
    ];

    return {
      payouts: mockPayouts.slice(offset, offset + limit),
      pagination: {
        page,
        limit,
        total: mockPayouts.length,
        totalPages: Math.ceil(mockPayouts.length / limit),
        hasNext: offset + limit < mockPayouts.length,
        hasPrev: page > 1,
      },
      summary: {
        totalPaid: mockPayouts.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
        totalPending: mockPayouts.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
        nextPayoutDate: mockPayouts.find((p) => p.status === 'pending')?.arrivalDate,
      },
    };
  }, '/api/marketplace/seller/payouts', 'GET');
}


