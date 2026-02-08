import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { getBackendUrl } from '@/lib/api/server-url';

// Validation schema
const SubscribeSchema = z.object({
  email: z.string().email('Email invalide'),
  source: z.string().optional().default('website'),
});

export const runtime = 'nodejs';

/**
 * POST /api/newsletter/subscribe
 * Inscrit un email à la newsletter
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    // Validation
    const validation = SubscribeSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Email invalide',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { email, source } = validation.data;

    logger.info('Newsletter subscription request', {
      email: email.replace(/(.{2}).*@/, '$1***@'), // Masquer l'email dans les logs
      source,
    });

    // Option 1: Ajouter à SendGrid Contacts (Marketing)
    if (process.env.SENDGRID_API_KEY) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/marketing/contacts', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contacts: [{
              email,
              custom_fields: {
                source,
                subscribed_at: new Date().toISOString(),
              },
            }],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          logger.warn('SendGrid contact add failed', { status: response.status, error: errorText });
        } else {
          logger.info('Contact added to SendGrid', { email: email.replace(/(.{2}).*@/, '$1***@') });
        }
      } catch (sendgridError) {
        logger.error('SendGrid API error', { error: sendgridError });
      }
    }

    // Option 2: Store subscription via backend API
    const backendUrl = getBackendUrl();
    try {
      await fetch(`${backendUrl}/api/v1/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      logger.info('Subscriber stored via backend', { email: email.replace(/(.{2}).*@/, '$1***@') });
    } catch (dbError) {
      logger.warn('Backend newsletter storage failed', { error: dbError });
    }

    // Envoyer email de confirmation
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
              to: [{ email }],
              subject: '✅ Bienvenue dans la newsletter Luneo !',
            }],
            from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@luneo.app', name: 'Luneo' },
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 16px; border-radius: 16px;">
                      <span style="color: white; font-size: 24px; font-weight: bold;">L</span>
                    </div>
                  </div>
                  
                  <h1 style="color: #1f2937; text-align: center;">Bienvenue ! 🎉</h1>
                  
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Merci de vous être inscrit à la newsletter Luneo !
                  </p>
                  
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                    Vous recevrez désormais :
                  </p>
                  
                  <ul style="color: #4b5563; font-size: 16px; line-height: 1.8;">
                    <li>🚀 Les dernières nouveautés produit</li>
                    <li>💡 Tips et tutorials exclusifs</li>
                    <li>🎁 Offres spéciales réservées aux abonnés</li>
                    <li>📊 Études de cas inspirantes</li>
                  </ul>
                  
                  <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                    En attendant notre prochaine newsletter, découvrez ce que Luneo peut faire pour vous :
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app'}/demo" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                      Voir les démos
                    </a>
                  </div>
                  
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  
                  <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                    Vous recevez cet email car vous vous êtes inscrit à la newsletter Luneo.<br>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app'}/unsubscribe?email=${encodeURIComponent(email)}" style="color: #6b7280;">Se désabonner</a>
                  </p>
                </div>
              `,
            }],
          }),
        });
        logger.info('Welcome newsletter email sent', { email: email.replace(/(.{2}).*@/, '$1***@') });
      } catch (emailError) {
        logger.error('Newsletter welcome email failed', { error: emailError });
      }
    }

    return {
      success: true,
      message: 'Inscription réussie ! Vérifiez votre boîte de réception.',
    };
  }, '/api/newsletter/subscribe', 'POST');
}

