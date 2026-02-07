import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * GET /api/public/marketing
 * Récupère les données marketing publiques (témoignages, stats, logos)
 * Ces données peuvent être affichées sur les pages publiques sans authentification
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const industry = searchParams.get('industry');
    const solution = searchParams.get('solution');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Forward to backend API (public route, no auth required)
    const url = new URL(`${API_URL}/api/v1/public/marketing`);
    url.searchParams.set('type', type);
    if (industry) url.searchParams.set('industry', industry);
    if (solution) url.searchParams.set('solution', solution);
    url.searchParams.set('limit', limit.toString());

    const backendResponse = await fetch(url.toString());

    if (!backendResponse.ok) {
      logger.error('Failed to fetch marketing data', {
        status: backendResponse.status,
        type,
        industry,
        solution,
      });
      // Return fallback data
      return NextResponse.json({
        success: false,
        error: 'Erreur lors de la récupération des données',
        data: {
          testimonials: [],
          stats: [],
          integrations: [],
          industries: [],
        },
      }, { status: 500 });
    }

    const result = await backendResponse.json();
    const response = NextResponse.json(result);
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    return response;
  } catch (error) {
    logger.error('Error fetching marketing data', { error });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des données',
        data: {
          testimonials: [],
          stats: [],
          integrations: [],
          industries: [],
        }
      },
      { status: 500 }
    );
  }
}
