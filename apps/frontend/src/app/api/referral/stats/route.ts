import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * GET /api/referral/stats
 * Récupère les statistiques de parrainage de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer le profil utilisateur avec le code de parrainage
    const { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, referral_tier, total_referrals, total_commissions')
      .eq('id', user.id)
      .single();

    // Générer un code si nécessaire
    const referralCode = profile?.referral_code || `LUNEO-${user.id.substring(0, 8).toUpperCase()}`;

    // Récupérer les filleuls
    const { data: referrals } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    const activeReferrals = referrals?.filter((r) => r.status === 'active').length || 0;
    const totalReferrals = referrals?.length || 0;

    // Calculer le palier
    const tiers = [
      { min: 0, max: 4, label: 'Bronze', rate: 20 },
      { min: 5, max: 14, label: 'Argent', rate: 25 },
      { min: 15, max: 29, label: 'Or', rate: 30 },
      { min: 30, max: Infinity, label: 'Diamant', rate: 35 },
    ];

    const currentTier = tiers.find((t) => activeReferrals >= t.min && activeReferrals <= t.max) || tiers[0];

    // Récupérer les commissions
    const { data: commissions } = await supabase
      .from('commissions')
      .select('amount, status')
      .eq('user_id', user.id);

    const pendingCommissions = commissions
      ?.filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

    const paidCommissions = commissions
      ?.filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

    return {
      stats: {
        totalReferrals,
        activeReferrals,
        pendingCommissions,
        paidCommissions,
        currentTier: currentTier.label,
        commissionRate: currentTier.rate,
        referralCode,
      },
      referrals: referrals?.map((r) => ({
        id: r.id,
        email: r.referred_email?.replace(/(.{3}).*@/, '$1***@') || '***@***.com',
        status: r.status,
        plan: r.plan || 'Starter',
        commission: r.commission_amount || 0,
        joined_at: r.created_at,
      })) || [],
    };
  }, '/api/referral/stats', 'GET');
}

