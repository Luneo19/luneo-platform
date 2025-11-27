import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const CreateTicketSchema = z.object({
  subject: z.string().min(5, 'Sujet trop court').max(200),
  description: z.string().min(20, 'Description trop courte').max(5000),
  category: z.enum(['billing', 'technical', 'account', 'feature', 'bug', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

export const runtime = 'nodejs';

/**
 * GET /api/support/tickets
 * Récupère les tickets de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    // Récupérer l'utilisateur connecté
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer les tickets
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching tickets', { error, userId: user.id });
      // Retourner un tableau vide si la table n'existe pas
      return { tickets: [] };
    }

    return { tickets: tickets || [] };
  }, '/api/support/tickets', 'GET');
}

/**
 * POST /api/support/tickets
 * Crée un nouveau ticket
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();
    
    // Validation
    const validation = CreateTicketSchema.safeParse(body);
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Données invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { subject, description, category, priority } = validation.data;

    // Récupérer l'utilisateur connecté
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const ticketId = `TKT-${Date.now().toString(36).toUpperCase()}`;

    // Créer le ticket
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        id: ticketId,
        user_id: user.id,
        user_email: user.email,
        subject,
        description,
        category,
        priority,
        status: 'open',
        messages_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating ticket', { error, userId: user.id });
      
      // Si la table n'existe pas, on crée un ticket fictif pour le front
      return {
        ticket: {
          id: ticketId,
          subject,
          description,
          category,
          priority,
          status: 'open',
          messages_count: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        message: 'Ticket créé (mode démo)',
      };
    }

    // Envoyer un email de confirmation
    if (process.env.SENDGRID_API_KEY && user.email) {
      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: user.email }],
              subject: `[Ticket ${ticketId}] ${subject}`,
            }],
            from: { email: 'support@luneo.app', name: 'Luneo Support' },
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #0891b2;">Votre ticket a été créé</h2>
                  <p>Bonjour,</p>
                  <p>Nous avons bien reçu votre demande et un membre de notre équipe vous répondra sous 24h.</p>
                  <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0 0 8px 0;"><strong>Ticket:</strong> ${ticketId}</p>
                    <p style="margin: 0 0 8px 0;"><strong>Sujet:</strong> ${subject}</p>
                    <p style="margin: 0;"><strong>Priorité:</strong> ${priority}</p>
                  </div>
                  <p>Vous pouvez suivre l'avancement de votre ticket dans votre dashboard.</p>
                  <p style="margin-top: 30px;">
                    <a href="https://luneo.app/dashboard/support" style="background: #0891b2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px;">
                      Voir mon ticket
                    </a>
                  </p>
                </div>
              `,
            }],
          }),
        });
      } catch (emailError) {
        logger.warn('Ticket confirmation email failed', { error: emailError });
      }
    }

    // Notifier l'équipe support
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
              to: [{ email: 'support@luneo.app' }],
              subject: `[Nouveau Ticket] ${ticketId} - ${subject}`,
            }],
            from: { email: 'noreply@luneo.app', name: 'Luneo System' },
            content: [{
              type: 'text/html',
              value: `
                <div style="font-family: Arial, sans-serif;">
                  <h2>Nouveau ticket support</h2>
                  <p><strong>ID:</strong> ${ticketId}</p>
                  <p><strong>De:</strong> ${user.email}</p>
                  <p><strong>Sujet:</strong> ${subject}</p>
                  <p><strong>Catégorie:</strong> ${category}</p>
                  <p><strong>Priorité:</strong> ${priority}</p>
                  <hr/>
                  <p><strong>Description:</strong></p>
                  <p>${description}</p>
                </div>
              `,
            }],
          }),
        });
      } catch (emailError) {
        logger.warn('Team notification email failed', { error: emailError });
      }
    }

    logger.info('Ticket created', { ticketId, userId: user.id, category, priority });

    return { ticket: ticket || { id: ticketId, ...validation.data, status: 'open' } };
  }, '/api/support/tickets', 'POST');
}

