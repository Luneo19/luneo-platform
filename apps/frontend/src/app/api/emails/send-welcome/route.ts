import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { sendWelcomeEmailSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/emails/send-welcome
 * Envoie un email de bienvenue à un nouvel utilisateur
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(sendWelcomeEmailSchema, request, async (validatedData) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { email, name } = validatedData;

    // Envoyer l'email via le backend (ou service email)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    let emailResponse: Response;

    try {
      emailResponse = await fetch(`${backendUrl}/api/emails/send-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY || ''}`,
        },
        body: JSON.stringify({
          email,
          name: name || user.email?.split('@')[0] || 'Utilisateur',
          userId: user.id,
        }),
      });
    } catch (fetchError: any) {
      logger.error('Email service fetch error', fetchError, {
        userId: user.id,
        email,
      });
      throw {
        status: 500,
        message: 'Erreur lors de l\'envoi de l\'email',
        code: 'EMAIL_SERVICE_ERROR',
      };
    }

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      logger.error('Email service error', new Error(errorText), {
        userId: user.id,
        email,
        status: emailResponse.status,
      });
      throw {
        status: emailResponse.status,
        message: 'Erreur lors de l\'envoi de l\'email de bienvenue',
        code: 'EMAIL_SERVICE_ERROR',
      };
    }

    logger.info('Welcome email sent', {
      userId: user.id,
      email,
      recipientName: name,
    });

    return ApiResponseBuilder.success({
      email,
    }, 'Email de bienvenue envoyé avec succès');
  });
}
