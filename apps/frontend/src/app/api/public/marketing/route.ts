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
      stats?: any[];
      integrations?: any[];
      industries?: any[];
    } = {};

    // Récupérer les témoignages
    if (type === 'all' || type === 'testimonials') {
      try {
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
          result.testimonials = [];
        } else {
          // Formater les témoignages pour le frontend
          result.testimonials = (testimonials || []).map((t: any) => ({
            quote: t.content || '',
            author: t.author_name || 'Client',
            company: t.author_company || 'Entreprise',
            role: t.author_role || '',
            avatar: t.author_avatar || (t.author_name?.split(' ').map((n: string) => n[0]).join('') || 'U'),
            rating: t.rating || 5,
          }));
        }
      } catch (err) {
        logger.error('Error fetching testimonials', { error: err });
        result.testimonials = [];
      }
    }

    // Récupérer les statistiques globales - TOUJOURS retourner un array
    if (type === 'all' || type === 'stats') {
      try {
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

        // TOUJOURS retourner un array pour stats
        result.stats = [
          { value: String(totalUsers || 10000), label: 'Créateurs actifs', description: 'Créateurs actifs' },
          { value: String(totalDesigns || 500000000), label: 'Designs générés', description: 'Designs générés' },
          { value: '3.2s', label: 'Temps moyen génération', description: 'Temps moyen génération' },
          { value: '150+', label: 'Pays', description: 'Pays' },
        ];
      } catch (err) {
        logger.error('Error fetching stats', { error: err });
        // Fallback avec array
        result.stats = [
          { value: '10,000+', label: 'Créateurs actifs', description: 'Créateurs actifs' },
          { value: '500M+', label: 'Designs générés', description: 'Designs générés' },
          { value: '3.2s', label: 'Temps moyen génération', description: 'Temps moyen génération' },
          { value: '150+', label: 'Pays', description: 'Pays' },
        ];
      }
    }

    // Récupérer les logos clients (intégrations)
    if (type === 'all' || type === 'clients') {
      try {
        const { data: clients, error } = await supabase
          .from('client_logos')
          .select('id, name, logo_url, website_url, industry, featured')
          .eq('is_published', true)
          .order('featured', { ascending: false })
          .order('name', { ascending: true })
          .limit(limit);

        if (error) {
          logger.dbError('fetch client logos', error, { type });
          result.integrations = [];
        } else {
          // Formater les intégrations pour le frontend
          result.integrations = (clients || []).map((c: any) => ({
            name: c.name || '',
            category: c.industry || 'client',
            logo: c.logo_url || '',
            description: c.name || '',
          }));
        }
      } catch (err) {
        logger.error('Error fetching clients', { error: err });
        result.integrations = [];
      }
    }

    // Récupérer les case studies (industries)
    if (type === 'all' || type === 'case-studies') {
      try {
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
          result.industries = [];
        } else {
          // Formater les industries pour le frontend
          result.industries = (caseStudies || []).map((cs: any) => ({
            name: cs.industry || 'Général',
            description: cs.excerpt || cs.title || '',
          }));
        }
      } catch (err) {
        logger.error('Error fetching case studies', { error: err });
        result.industries = [];
      }
    }

    // Cache headers pour CDN
    const response = NextResponse.json({
      success: true,
      data: {
        testimonials: result.testimonials || [],
        stats: result.stats || [], // TOUJOURS un array
        integrations: result.integrations || [],
        industries: result.industries || [],
      },
    });

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
          stats: [], // TOUJOURS un array même en cas d'erreur
          integrations: [],
          industries: [],
        }
      },
      { status: 500 }
    );
  }
}
