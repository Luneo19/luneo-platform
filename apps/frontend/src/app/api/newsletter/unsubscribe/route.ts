import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { z } from 'zod';
import { getBackendUrl } from '@/lib/api/server-url';

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

    serverLogger.info('Newsletter unsubscribe request', {
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

        serverLogger.info('Contact removed from SendGrid', { email: email.replace(/(.{2}).*@/, '$1***@') });
      } catch (sendgridError) {
        serverLogger.error('SendGrid unsubscribe error', { error: sendgridError });
      }
    }

    // Update subscription status via backend API
    const backendUrl = getBackendUrl();
    try {
      await fetch(`${backendUrl}/api/v1/newsletter/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason }),
      });
    } catch (dbError) {
      serverLogger.warn('Backend unsubscribe update failed', { error: dbError });
    }

    return {
      success: true,
      message: 'Désabonnement effectué avec succès',
    };
  }, '/api/newsletter/unsubscribe', 'POST');
}

