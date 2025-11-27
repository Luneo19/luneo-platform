import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const UnsubscribeSchema = z.object({
  email: z.string().email('Email invalide'),
  reason: z.string().optional(),
});

export const runtime = 'nodejs';

/**
 * POST /api/newsletter/unsubscribe
 * Désabonne un email de la newsletter
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    const validation = UnsubscribeSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Email invalide',
        code: 'VALIDATION_ERROR',
      };
    }

    const { email, reason } = validation.data;

    logger.info('Newsletter unsubscribe request', {
      email: email.replace(/(.{2}).*@/, '$1***@'),
      reason,
    });

    // Mettre à jour dans SendGrid
    if (process.env.SENDGRID_API_KEY) {
      try {
        // Supprimer des listes de contacts
        const searchResponse = await fetch(
          `https://api.sendgrid.com/v3/marketing/contacts/search/emails`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ emails: [email] }),
          }
        );

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const contactId = searchData.result?.[email]?.contact?.id;
          
          if (contactId) {
            await fetch(
              `https://api.sendgrid.com/v3/marketing/contacts?ids=${contactId}`,
              {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                },
              }
            );
          }
        }

        // Ajouter à la liste de suppression
        await fetch('https://api.sendgrid.com/v3/asm/suppressions/global', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            recipient_emails: [email],
          }),
        });

        logger.info('Contact removed from SendGrid', { email: email.replace(/(.{2}).*@/, '$1***@') });
      } catch (sendgridError) {
        logger.error('SendGrid unsubscribe error', { error: sendgridError });
      }
    }

    // Mettre à jour dans Supabase
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        await supabase
          .from('newsletter_subscribers')
          .update({
            status: 'unsubscribed',
            unsubscribe_reason: reason,
            unsubscribed_at: new Date().toISOString(),
          })
          .eq('email', email);
      } catch (dbError) {
        logger.warn('Database update failed', { error: dbError });
      }
    }

    return {
      success: true,
      message: 'Désabonnement effectué avec succès',
    };
  }, '/api/newsletter/unsubscribe', 'POST');
}

