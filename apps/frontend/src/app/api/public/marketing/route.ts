import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

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

    const supabase = await createClient();

    const result: {
      testimonials?: any[];
      stats?: any;
      clients?: any[];
      caseStudies?: any[];
    } = {};

    // Récupérer les témoignages
    if (type === 'all' || type === 'testimonials') {
      let query = supabase
        .from('testimonials')
        .select('id, author_name, author_role, author_company, author_avatar, content, rating, industry, solution, metric_label, metric_value, featured, created_at')
        .eq('is_published', true)
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (industry) {
        query = query.eq('industry', industry);
      }
      if (solution) {
        query = query.eq('solution', solution);
      }

      const { data: testimonials, error } = await query;

      if (error) {
        logger.dbError('fetch testimonials', error, { type, industry, solution });
      } else {
        result.testimonials = testimonials || [];
      }
    }

    // Récupérer les statistiques globales
    if (type === 'all' || type === 'stats') {
      // Statistiques calculées depuis les données réelles
      const [
        { count: totalUsers },
        { count: totalDesigns },
        { count: totalOrders },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('designs').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
      ]);

      // Récupérer les stats marketing depuis la table de configuration
      const { data: marketingStats } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'marketing_stats')
        .single();

      const defaultStats = {
        totalBrands: 500,
        totalProducts: 10000000,
        avgConversion: 40,
        avgReturnReduction: 50,
        uptime: 99.9,
        avgRating: 4.8,
      };

      const configStats = marketingStats?.value ? JSON.parse(marketingStats.value) : {};

      result.stats = {
        // Stats réelles (peuvent être masquées ou augmentées pour le marketing)
        users: totalUsers || 0,
        designs: totalDesigns || 0,
        orders: totalOrders || 0,
        // Stats marketing (configurables)
        ...defaultStats,
        ...configStats,
      };
    }

    // Récupérer les logos clients
    if (type === 'all' || type === 'clients') {
      const { data: clients, error } = await supabase
        .from('client_logos')
        .select('id, name, logo_url, website_url, industry, featured')
        .eq('is_published', true)
        .order('featured', { ascending: false })
        .order('name', { ascending: true })
        .limit(limit);

      if (error) {
        logger.dbError('fetch client logos', error, { type });
      } else {
        result.clients = clients || [];
      }
    }

    // Récupérer les case studies
    if (type === 'all' || type === 'case-studies') {
      let query = supabase
        .from('case_studies')
        .select('id, title, slug, excerpt, cover_image, industry, solution, metrics, client_name, client_logo, featured, published_at')
        .eq('is_published', true)
        .order('featured', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(limit);

      if (industry) {
        query = query.eq('industry', industry);
      }
      if (solution) {
        query = query.eq('solution', solution);
      }

      const { data: caseStudies, error } = await query;

      if (error) {
        logger.dbError('fetch case studies', error, { type, industry, solution });
      } else {
        result.caseStudies = caseStudies || [];
      }
    }

    // Cache headers pour CDN
    const response = NextResponse.json({
      success: true,
      data: result,
    });

    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

    return response;
  } catch (error) {
    logger.error('Error fetching marketing data', { error });
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}

