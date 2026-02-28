import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { getUserFromRequest } from '@/lib/auth/get-user';
import { sendEmailSchema } from '@/lib/validation/zod-schemas';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

/**
 * POST /api/email/send
 * Envoie un email via SendGrid
 * Forward to backend
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(sendEmailSchema, request, async (validatedData) => {
    const user = await getUserFromRequest(request);
    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { to, subject, template, data, html, text } = validatedData as {
      to: string;
      subject: string;
      template?: string;
      data?: Record<string, unknown>;
      html?: string;
      text?: string;
    };

    // Préparer les données d'email
    const emailData: Record<string, unknown> = {
      to,
      subject,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@luneo.app',
      fromName: process.env.SENDGRID_FROM_NAME || 'Luneo',
    };

    // Si un template est fourni, utiliser le template SendGrid
    if (template) {
      emailData.templateId = process.env[`EMAIL_TEMPLATE_${template.toUpperCase()}`] || null;
      if (!emailData.templateId) {
        serverLogger.warn('Email template not configured', {
          template,
          userId: user.id,
        });
        // Fallback sur HTML/text si template non configuré
        if (!html && !text) {
          throw {
            status: 400,
            message: `Template ${template} non configuré et aucun contenu HTML/text fourni`,
            code: 'TEMPLATE_NOT_CONFIGURED',
          };
        }
      } else {
        emailData.dynamicTemplateData = data || {};
      }
    }

    // Si HTML ou text est fourni, l'utiliser
    if (html) {
      emailData.html = html;
    }
    if (text) {
      emailData.text = text;
    }

    // Forward to backend
    const backendResponse = await fetch(`${API_URL}/api/v1/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(emailData),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      serverLogger.error('Error sending email via backend', new Error(errorText), {
        to,
        subject,
        userId: user.id,
        status: backendResponse.status,
      });
      throw {
        status: 500,
        message: 'Erreur lors de l\'envoi de l\'email',
        code: 'EMAIL_SEND_ERROR',
      };
    }

    const result = await backendResponse.json();
    serverLogger.info('Email sent via backend', {
      to,
      subject,
      template,
      userId: user.id,
    });

    return ApiResponseBuilder.success({
      messageId: result.messageId,
    }, 'Email envoyé avec succès');
  });
}
