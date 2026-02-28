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
  type: z.enum(['general', 'support', 'enterprise', 'enterprise_pricing', 'partnership']).optional().default('general'),
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
    const backendUrl = getBackendUrl();
    const backendResponse = await fetch(`${backendUrl}/api/v1/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, company, subject, message, type, captchaToken }),
      cache: 'no-store',
    });

    let backendPayload: unknown = null;
    try {
      backendPayload = await backendResponse.json();
    } catch {
      backendPayload = null;
    }

    if (!backendResponse.ok) {
      serverLogger.warn('Backend contact processing failed', {
        status: backendResponse.status,
        payload: backendPayload,
        email,
        subject,
      });
      throw {
        status: backendResponse.status,
        message: 'Impossible d\'envoyer le message de contact pour le moment.',
        code: 'CONTACT_BACKEND_ERROR',
      };
    }

    const payload = (backendPayload ?? {}) as { trackingId?: string; message?: string };
    return {
      success: true,
      trackingId: payload.trackingId,
      message: payload.message || 'Message envoyé avec succès. Nous vous répondrons sous 24h.',
    };
  }, '/api/contact', 'POST');
}

