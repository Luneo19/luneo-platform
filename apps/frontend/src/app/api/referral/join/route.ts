import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const JoinSchema = z.object({
  email: z.string().email('Email invalide'),
});

export const runtime = 'nodejs';

/**
 * POST /api/referral/join
 * Inscription au programme d'affiliation
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    const validation = JoinSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Email invalide',
        code: 'VALIDATION_ERROR',
      };
    }

    const { email } = validation.data;

    logger.info('Referral program join request', { email: email.replace(/(.{2}).*@/, '$1***@') });

    // Enregistrer dans Supabase si disponible
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        await supabase.from('referral_applications').upsert({
          email,
          status: 'pending',
          applied_at: new Date().toISOString(),
        }, { onConflict: 'email' });
      } catch (dbError) {
        logger.warn('Database insert failed', { error: dbError });
      }
    }

    // Envoyer un email de notification
    if (process.env.SENDGRID_API_KEY) {
      try {
        // Email à l'équipe
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: 'affiliate@luneo.app' }],
              subject: `Nouvelle demande d'affiliation - ${email}`,
            }],
            from: { email: 'noreply@luneo.app', name: 'Luneo System' },
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif;">
                  <h2>Nouvelle demande d'affiliation</h2>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Date:</strong> ${new Date().toLocaleString('fr-FR')}</p>
                </div>
              `,
            }],
          }),
        });

        // Email de confirmation au demandeur
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email }],
              subject: 'Votre demande d\'affiliation Luneo',
            }],
            from: { email: 'affiliate@luneo.app', name: 'Luneo Affiliation' },
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #9333ea;">Merci pour votre intérêt !</h2>
                  <p>Bonjour,</p>
                  <p>Nous avons bien reçu votre demande pour rejoindre le programme d'affiliation Luneo.</p>
                  <p>Notre équipe va examiner votre candidature et vous recontactera sous 24 à 48h avec tous les détails pour commencer.</p>
                  <p>En attendant, n'hésitez pas à créer un compte sur <a href="https://luneo.app/register" style="color: #9333ea;">Luneo</a> si ce n'est pas déjà fait.</p>
                  <p style="margin-top: 30px;">À très vite,<br/>L'équipe Luneo</p>
                </div>
              `,
            }],
          }),
        });
      } catch (emailError) {
        logger.warn('Email notification failed', { error: emailError });
      }
    }

    return {
      success: true,
      message: 'Demande envoyée avec succès',
    };
  }, '/api/referral/join', 'POST');
}

