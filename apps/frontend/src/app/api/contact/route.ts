import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { z } from 'zod';
import { getBackendUrl } from '@/lib/api/server-url';

// Validation schema
const ContactSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100),
  email: z.string().email('Email invalide'),
  company: z.string().optional(),
  subject: z.string().min(3, 'Sujet trop court').max(200),
  message: z.string().min(10, 'Message trop court').max(5000),
  type: z.enum(['general', 'support', 'enterprise', 'partnership']).optional().default('general'),
  captchaToken: z.string().optional(), // CAPTCHA token from reCAPTCHA v3
});

export const runtime = 'nodejs';

/**
 * POST /api/contact
 * Envoie un message de contact
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    // Rate limiting avec Redis
    const { checkRateLimit, getApiRateLimit, getClientIdentifier } = await import('@/lib/rate-limit');
    const identifier = getClientIdentifier(request);
    const { success, remaining, reset } = await checkRateLimit(identifier, getApiRateLimit());
    
    if (!success) {
      throw {
        status: 429,
        message: `Trop de requêtes. Réessayez après ${reset.toLocaleTimeString()}.`,
        code: 'RATE_LIMIT_EXCEEDED',
        remaining: 0,
        reset: reset.toISOString(),
      };
    }
    
    // Log de la requête
    serverLogger.info('Contact form request', {
      ip: identifier,
      userAgent: request.headers.get('user-agent'),
      timestamp: new Date().toISOString(),
      remaining,
    });

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      serverLogger.error('Contact form JSON parse error', parseError instanceof Error ? parseError : undefined, { error: parseError });
      throw {
        status: 400,
        message: 'Format de données invalide',
        code: 'INVALID_JSON',
      };
    }
    
    // Validation
    const validation = ContactSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Données invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { name, email, company, subject, message, type, captchaToken } = validation.data;

    // ✅ Verify CAPTCHA (if provided)
    if (captchaToken) {
      try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (secretKey) {
          const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
          const response = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              secret: secretKey,
              response: captchaToken,
            }),
          });

          const data = await response.json();

          if (!data.success) {
            serverLogger.warn('CAPTCHA verification failed', {
              errors: data['error-codes'],
              email,
            });
            throw {
              status: 400,
              message: 'Vérification CAPTCHA échouée. Veuillez réessayer.',
              code: 'CAPTCHA_FAILED',
            };
          }

          // Verify action matches
          if (data.action !== 'contact') {
            serverLogger.warn('CAPTCHA action mismatch', {
              expected: 'contact',
              received: data.action,
            });
            throw {
              status: 400,
              message: 'Vérification CAPTCHA échouée.',
              code: 'CAPTCHA_ACTION_MISMATCH',
            };
          }

          // Verify score meets threshold (0.5 minimum)
          if (data.score < 0.5) {
            serverLogger.warn('CAPTCHA score too low', {
              score: data.score,
              email,
            });
            throw {
              status: 400,
              message: 'Vérification CAPTCHA échouée. Veuillez réessayer.',
              code: 'CAPTCHA_SCORE_TOO_LOW',
            };
          }

          serverLogger.debug('CAPTCHA verification successful', {
            action: data.action,
            score: data.score,
            email,
          });
        } else {
          // In development, allow requests without CAPTCHA if not configured
          if (process.env.NODE_ENV === 'development') {
            serverLogger.warn('CAPTCHA secret key not configured, skipping verification in development');
          } else {
            throw {
              status: 400,
              message: 'Vérification CAPTCHA requise mais non configurée.',
              code: 'CAPTCHA_NOT_CONFIGURED',
            };
          }
        }
      } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'status' in error) {
          throw error;
        }
        serverLogger.error('CAPTCHA verification error', error instanceof Error ? error : undefined, { error });
        throw {
          status: 400,
          message: 'Erreur lors de la vérification CAPTCHA. Veuillez réessayer.',
          code: 'CAPTCHA_ERROR',
        };
      }
    } else {
      // In production, CAPTCHA is required
      if (process.env.NODE_ENV === 'production') {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (secretKey) {
          throw {
            status: 400,
            message: 'Token CAPTCHA requis.',
            code: 'CAPTCHA_TOKEN_REQUIRED',
          };
        }
      }
    }

    // Log du message de contact
    serverLogger.info('Contact form submission', {
      name,
      email,
      company,
      subject,
      type,
      messageLength: message.length,
    });

    // Option 1: Envoyer via SendGrid si configuré
    if (process.env.SENDGRID_API_KEY) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: process.env.CONTACT_EMAIL || 'contact@luneo.app' }],
              subject: `[Contact ${type}] ${subject}`,
            }],
            from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@luneo.app', name: 'Luneo Contact' },
            reply_to: { email: email, name: name },
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #3b82f6;">Nouveau message de contact</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Nom:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${name}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Email:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${email}</td></tr>
                    ${company ? `<tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Entreprise:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${company}</td></tr>` : ''}
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Type:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${type}</td></tr>
                    <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Sujet:</strong></td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${subject}</td></tr>
                  </table>
                  <h3 style="color: #374151; margin-top: 20px;">Message:</h3>
                  <div style="background: #f9fafb; padding: 16px; border-radius: 8px; white-space: pre-wrap;">${message}</div>
                  <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
                  <p style="color: #6b7280; font-size: 12px;">Envoyé depuis le formulaire de contact Luneo</p>
                </div>
              `,
            }],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          serverLogger.warn('SendGrid API error', { status: response.status, error: errorText });
        } else {
          serverLogger.info('Contact email sent via SendGrid', { to: 'contact@luneo.app', from: email });
        }
      } catch (emailError) {
        serverLogger.error('Email sending failed', emailError instanceof Error ? emailError : undefined, { error: emailError });
        // Continue anyway - message is logged
      }
    }

    // Option 2: Store contact message via backend API
    const backendUrl = getBackendUrl();
    try {
      await fetch(`${backendUrl}/api/v1/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, subject, message, type }),
      });
    } catch (dbError) {
      serverLogger.warn('Backend contact storage failed', { error: dbError });
      // Continue anyway - message is logged and email was sent
    }

    return {
      success: true,
      message: 'Message envoyé avec succès. Nous vous répondrons sous 24h.',
    };
  }, '/api/contact', 'POST');
}

