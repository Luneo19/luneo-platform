import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { ApiResponseBuilder } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let query = supabase
      .from('tickets')
      .select('*, ticket_messages(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data: tickets, error } = await query;

    if (error) {
      logger.dbError('fetch tickets', error, { userId: user.id });
      throw {
        status: 500,
        message: 'Erreur lors de la récupération des tickets',
        code: 'DATABASE_ERROR',
      };
    }

    const formattedTickets = (tickets || []).map((ticket: any) => ({
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      messages_count: ticket.ticket_messages?.[0]?.count || 0,
    }));

    return { tickets: formattedTickets };
  }, '/api/support/tickets', 'GET');
}

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    const { subject, description, category, priority } = body;

    if (!subject || !description) {
      throw {
        status: 400,
        message: 'Le sujet et la description sont requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const { data: ticket, error } = await supabase
      .from('tickets')
      .insert({
        user_id: user.id,
        subject,
        description,
        category: category || 'technical',
        priority: priority || 'medium',
        status: 'open',
      })
      .select()
      .single();

    if (error) {
      logger.dbError('create ticket', error, {
        userId: user.id,
        subject,
        category,
        priority,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la création du ticket',
        code: 'DATABASE_ERROR',
      };
    }

    logger.info('Ticket created successfully', {
      userId: user.id,
      ticketId: ticket.id,
      subject,
    });

    return {
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        messages_count: 0,
      },
      message: 'Ticket créé avec succès',
    };
  }, '/api/support/tickets', 'POST');
}
