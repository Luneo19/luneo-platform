import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { sendEmailSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/email/send
 * Envoie un email via SendGrid
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(sendEmailSchema, request, async (validatedData) => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { to, subject, template, data, html, text } = validatedData as {
      to: string;
      subject: string;
      template?: string;
      data?: Record<string, any>;
      html?: string;
      text?: string;
    };

    // Préparer les données d'email
    const emailData: any = {
      to,
      subject,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@luneo.app',
      fromName: process.env.SENDGRID_FROM_NAME || 'Luneo',
    };

    // Si un template est fourni, utiliser le template SendGrid
    if (template) {
      emailData.templateId = process.env[`EMAIL_TEMPLATE_${template.toUpperCase()}`] || null;
      if (!emailData.templateId) {
        logger.warn('Email template not configured', {
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

    // Envoyer l'email via l'API backend ou directement via SendGrid
    const backendUrl = process.env.INTERNAL_API_URL || process.env.LUNEO_API_URL;
    
    if (backendUrl) {
      // Utiliser le backend pour envoyer l'email
      try {
        const response = await fetch(`${backendUrl}/api/emails/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-internal-token': process.env.INTERNAL_API_TOKEN || '',
          },
          body: JSON.stringify(emailData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend email error: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        
        logger.info('Email sent via backend', {
          to,
          subject,
          template,
          userId: user.id,
        });

        return ApiResponseBuilder.success({
          messageId: result.messageId,
        }, 'Email envoyé avec succès');
      } catch (backendError: any) {
        logger.error('Error sending email via backend', backendError, {
          to,
          subject,
          userId: user.id,
        });
        throw {
          status: 500,
          message: 'Erreur lors de l\'envoi de l\'email',
          code: 'EMAIL_SEND_ERROR',
        };
      }
    } else {
      // Fallback: envoyer directement via SendGrid (si configuré côté frontend)
      // Note: En production, il est recommandé d'utiliser le backend
      logger.warn('Sending email directly from frontend (not recommended)', {
        to,
        subject,
        userId: user.id,
      });

      throw {
        status: 500,
        message: 'Service d\'envoi d\'email non configuré',
        code: 'EMAIL_SERVICE_NOT_CONFIGURED',
      };
    }
  });
}
