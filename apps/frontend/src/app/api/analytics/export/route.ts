import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/analytics/export
 * Exporte les données analytics au format CSV
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const format = searchParams.get('format') || 'csv'; // csv, json

    // Calculer la date de début
    let startDate: Date | null = null;
    switch (period) {
      case '7d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        break;
      case 'all':
        startDate = null;
        break;
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
    }

    // Récupérer les données analytics
    const [designs, orders, views] = await Promise.all([
      // Designs créés
      supabase
        .from('designs')
        .select('id, created_at, status')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch designs for export', error, { userId: user.id });
            return [];
          }
          return (data || []).filter((d) => 
            !startDate || new Date(d.created_at) >= startDate!
          );
        }),

      // Commandes
      supabase
        .from('orders')
        .select('id, created_at, total_amount, status')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch orders for export', error, { userId: user.id });
            return [];
          }
          return (data || []).filter((o) => 
            !startDate || new Date(o.created_at) >= startDate!
          );
        }),

      // Vues (si table existe)
      supabase
        .from('design_views')
        .select('id, design_id, viewed_at')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            // Table peut ne pas exister, ce n'est pas critique
            return [];
          }
          return (data || []).filter((v) => 
            !startDate || new Date(v.viewed_at) >= startDate!
          );
        }),
    ]);

    if (format === 'json') {
      const response = NextResponse.json({
        period,
        startDate: startDate?.toISOString() || null,
        data: {
          designs: designs.length,
          orders: orders.length,
          revenue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
          views: views.length,
        },
        details: {
          designs,
          orders,
          views,
        },
      });
      response.headers.set('Content-Disposition', `attachment; filename="analytics-${period}-${new Date().toISOString().split('T')[0]}.json"`);
      return response;
    }

    // Format CSV
    const csvRows: string[] = [];
    
    // En-têtes
    csvRows.push('Type,Date,Valeur,Statut');
    
    // Designs
    designs.forEach((design) => {
      csvRows.push(`Design,${design.created_at},1,${design.status || 'completed'}`);
    });
    
    // Commandes
    orders.forEach((order) => {
      csvRows.push(`Commande,${order.created_at},${(order.total_amount || 0) / 100},${order.status || 'pending'}`);
    });
    
    // Vues
    views.forEach((view) => {
      csvRows.push(`Vue,${view.viewed_at},1,viewed`);
    });

    const csv = csvRows.join('\n');
    const csvBuffer = Buffer.from(csv, 'utf-8');

    const response = new NextResponse(csvBuffer);
    response.headers.set('Content-Type', 'text/csv; charset=utf-8');
    response.headers.set('Content-Disposition', `attachment; filename="analytics-${period}-${new Date().toISOString().split('T')[0]}.csv"`);
    
    return response;
  }, '/api/analytics/export', 'GET');
}

