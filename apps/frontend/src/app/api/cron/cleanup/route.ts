/**
 * GET/POST /api/cron/cleanup
 * Scheduled cron job to clean up old data
 * Forward vers backend NestJS: GET/POST /cron/cleanup
 */

import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleCronJob(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleCronJob(request, 'POST');
}

async function handleCronJob(request: NextRequest, method: 'GET' | 'POST') {
  // Vérifier le secret cron
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    logger.warn('Unauthorized cron job request', {
      endpoint: '/api/cron/cleanup',
      hasAuth: !!authHeader,
    });
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Forward vers le backend
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';
    const apiUrl = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`;
    const url = `${apiUrl}/cron/cleanup`;

    logger.info('Forwarding cleanup cron job to backend', { url });

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Backend cron job failed', {
        status: response.status,
        error: data,
      });
      return new Response(
        JSON.stringify({ error: data.error || 'Cron job failed', message: data.message }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logger.error('Failed to forward cleanup cron job', {
      error: error instanceof Error ? error.message : String(error),
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to execute cron job',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
