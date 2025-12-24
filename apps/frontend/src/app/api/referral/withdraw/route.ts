import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

/**
 * POST /api/referral/withdraw
 * Demande de retrait des commissions
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier le montant disponible
    const { data: commissions } = await supabase
      .from('commissions')
      .select('id, amount')
      .eq('user_id', user.id)
      .eq('status', 'pending');

    const totalPending = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

    if (totalPending < 50) {
      throw {
        status: 400,
        message: 'Montant minimum de retrait non atteint (50€)',
        code: 'MIN_AMOUNT_NOT_REACHED',
      };
    }

    // Récupérer le profil pour les informations bancaires
    const { data: profile } = await supabase
      .from('profiles')
      .select('iban, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.iban) {
      throw {
        status: 400,
        message: 'Veuillez configurer vos informations bancaires dans les paramètres',
        code: 'MISSING_BANK_INFO',
      };
    }

    // Créer la demande de retrait
    const withdrawalId = `WD-${Date.now().toString(36).toUpperCase()}`;

    await supabase.from('withdrawals').insert({
      id: withdrawalId,
      user_id: user.id,
      amount: totalPending,
      status: 'pending',
      iban: profile.iban,
      created_at: new Date().toISOString(),
    });

    // Marquer les commissions comme "en cours de paiement"
    const commissionIds = commissions?.map((c) => c.id) || [];
    await supabase
      .from('commissions')
      .update({ status: 'processing', withdrawal_id: withdrawalId })
      .in('id', commissionIds);

    // Notifier l'équipe
    if (process.env.SENDGRID_API_KEY) {
      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: 'finance@luneo.app' }],
              subject: `[Retrait] ${withdrawalId} - ${totalPending.toFixed(2)}€`,
            }],
            from: { email: 'noreply@luneo.app', name: 'Luneo System' },
            content: [{
              type: 'text/html',
              value: `
                <h2>Nouvelle demande de retrait</h2>
                <p><strong>ID:</strong> ${withdrawalId}</p>
                <p><strong>Utilisateur:</strong> ${user.email}</p>
                <p><strong>Montant:</strong> ${totalPending.toFixed(2)}€</p>
                <p><strong>IBAN:</strong> ${profile.iban.substring(0, 8)}***</p>
              `,
            }],
          }),
        });
      } catch (emailError) {
        logger.warn('Withdrawal notification email failed', { error: emailError });
      }
    }

    logger.info('Withdrawal requested', {
      withdrawalId,
      userId: user.id,
      amount: totalPending,
    });

    return {
      withdrawalId,
      amount: totalPending,
      status: 'pending',
      message: 'Demande de retrait enregistrée. Paiement sous 3-5 jours ouvrés.',
    };
  }, '/api/referral/withdraw', 'POST');
}

