import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/credits/balance
 * Récupère le solde de crédits IA de l'utilisateur
 */
export async function GET(request: Request) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer balance depuis Supabase (table profiles)
    // Si colonnes n'existent pas encore, retourner 0 (migration pas encore appliquée)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('ai_credits, ai_credits_purchased, ai_credits_used, metadata')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.dbError('fetch credits balance', profileError, { userId: user.id });
      // Si colonnes n'existent pas, retourner 0 (migration pas appliquée)
      if (profileError.message?.includes('column') || profileError.message?.includes('does not exist')) {
        return {
          balance: 0,
          purchased: 0,
          used: 0,
        };
      }
      throw { status: 500, message: 'Erreur lors de la récupération du solde' };
    }

    // Support pour colonnes dans metadata (fallback) ou colonnes directes
    const balance = profile?.ai_credits ?? profile?.metadata?.aiCredits ?? 0;
    const purchased = profile?.ai_credits_purchased ?? profile?.metadata?.aiCreditsPurchased ?? 0;
    const used = profile?.ai_credits_used ?? profile?.metadata?.aiCreditsUsed ?? 0;

    return {
      balance,
      purchased,
      used,
    };
  }, '/api/credits/balance', 'GET');
}












