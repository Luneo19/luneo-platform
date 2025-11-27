import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema
const ContactSchema = z.object({
  name: z.string().min(2, 'Nom trop court').max(100),
  email: z.string().email('Email invalide'),
  company: z.string().optional(),
  subject: z.string().min(3, 'Sujet trop court').max(200),
  message: z.string().min(10, 'Message trop court').max(5000),
  type: z.enum(['general', 'support', 'enterprise', 'partnership']).optional().default('general'),
});

export const runtime = 'nodejs';

/**
 * POST /api/contact
 * Envoie un message de contact
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
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

    const { name, email, company, subject, message, type } = validation.data;

    // Log du message de contact
    logger.info('Contact form submission', {
      name,
      email,
      company,
      subject,
      type,
      messageLength: message.length,
    });

    // Option 1: Envoyer via Resend/SendGrid si configuré
    if (process.env.RESEND_API_KEY) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Luneo Contact <contact@luneo.app>',
            to: ['contact@luneo.app'],
            reply_to: email,
            subject: `[Contact ${type}] ${subject}`,
            html: `
              <h2>Nouveau message de contact</h2>
              <p><strong>Nom:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${company ? `<p><strong>Entreprise:</strong> ${company}</p>` : ''}
              <p><strong>Type:</strong> ${type}</p>
              <p><strong>Sujet:</strong> ${subject}</p>
              <hr/>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br/>')}</p>
            `,
          }),
        });

        if (!response.ok) {
          logger.warn('Resend API error', { status: response.status });
        }
      } catch (emailError) {
        logger.error('Email sending failed', { error: emailError });
        // Continue anyway - message is logged
      }
    }

    // Option 2: Stocker dans Supabase si configuré
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        await supabase.from('contact_messages').insert({
          name,
          email,
          company,
          subject,
          message,
          type,
          created_at: new Date().toISOString(),
        });
      } catch (dbError) {
        logger.warn('Database storage failed', { error: dbError });
        // Continue anyway - message is logged
      }
    }

    return {
      success: true,
      message: 'Message envoyé avec succès. Nous vous répondrons sous 24h.',
    };
  }, '/api/contact', 'POST');
}

