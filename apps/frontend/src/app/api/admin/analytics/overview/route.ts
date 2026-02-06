/**
 * ★★★ ADMIN ANALYTICS OVERVIEW API ★★★
 * API route pour récupérer toutes les métriques du dashboard admin
 * Protection: Vérifie que l'utilisateur est PLATFORM_ADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { db } from '@/lib/db';
import { subDays } from 'date-fns';
import { serverLogger } from '@/lib/logger-server';

export async function GET(request: NextRequest) {
  try {
    // Vérification admin
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Parse période depuis query params
    const { searchParams } = new URL(request.url);
    const periodDays = parseInt(searchParams.get('period') || '30');
    const dateTo = new Date();
    const dateFrom = subDays(dateTo, periodDays);

    // Calcul de toutes les métriques en parallèle
    const [
      totalCustomers,
      newCustomers,
      activeSubscriptions,
      recentActivity,
      recentCustomers,
      revenueChart,
    ] = await Promise.all([
      // Total customers
      db.customer.count(),
      
      // New customers sur la période
      db.customer.count({
        where: {
          createdAt: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
      }),

      // Active subscriptions (pour calculer MRR approximatif)
      db.user.findMany({
        where: {
          role: {
            not: 'PLATFORM_ADMIN',
          },
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
        take: 100, // Limite pour éviter les problèmes de performance
      }),

      // Recent activity (Events)
      db.event.findMany({
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                  image: true,
                },
              },
            },
          },
        },
      }),

      // Recent customers
      db.customer.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              image: true,
            },
          },
        },
      }),

      // Revenue chart data (depuis DailyMetrics si disponible)
      db.dailyMetrics.findMany({
        where: {
          date: {
            gte: dateFrom,
            lte: dateTo,
          },
        },
        orderBy: {
          date: 'asc',
        },
        select: {
          date: true,
          mrr: true,
          revenue: true,
          newCustomers: true,
        },
      }),
    ]);

    // Calcul MRR approximatif (basé sur les subscriptions actives)
    // Note: Ceci est une approximation - dans un vrai système, on utiliserait les données de paiement
    const estimatedMRR = activeSubscriptions.length * 50; // Estimation basique

    // KPIs principaux
    const kpis = {
      mrr: {
        value: estimatedMRR,
        change: 0, // À calculer vs période précédente
        changePercent: 0,
        trend: 'up' as const,
      },
      customers: {
        value: totalCustomers,
        new: newCustomers,
        trend: 'up' as const,
      },
      churnRate: {
        value: 0, // À calculer
        change: 0,
        trend: 'up' as const,
      },
      ltv: {
        value: 0, // À calculer depuis Customer.ltv
        projected: 0,
        trend: 'up' as const,
      },
    };

    // Format recent activity
    const formattedActivity = recentActivity.map((event: any) => ({
      id: event.id,
      type: event.type,
      message: getEventMessage(event.type),
      customerName: event.customer?.user?.name,
      customerEmail: event.customer?.user?.email,
      timestamp: event.createdAt,
      metadata: event.data,
    }));

    // Format recent customers
    const formattedCustomers = recentCustomers.map((customer: any) => ({
      id: customer.id,
      name: customer.user?.name || 'Unknown',
      email: customer.user?.email || '',
      avatar: customer.user?.image,
      plan: null, // À récupérer depuis les subscriptions
      mrr: 0, // À calculer
      ltv: customer.ltv,
      status: customer.churnRisk === 'high' ? 'at-risk' as const : 'active' as const,
      customerSince: customer.createdAt,
    }));

    // Format revenue chart
    const formattedRevenueChart = revenueChart.length > 0
      ? revenueChart.map((d: any) => ({
          date: d.date.toISOString().split('T')[0],
          mrr: d.mrr,
          revenue: d.revenue,
          newCustomers: d.newCustomers,
        }))
      : generateMockChartData(dateFrom, dateTo, periodDays);

    // Distribution par plan (mock pour l'instant)
    const planDistribution = [
      { name: 'Starter', count: Math.floor(totalCustomers * 0.3), mrr: estimatedMRR * 0.2 },
      { name: 'Pro', count: Math.floor(totalCustomers * 0.5), mrr: estimatedMRR * 0.6 },
      { name: 'Team', count: Math.floor(totalCustomers * 0.2), mrr: estimatedMRR * 0.2 },
    ];

    // Channels d'acquisition (mock pour l'instant)
    const acquisitionChannels = [
      { channel: 'Meta', count: Math.floor(newCustomers * 0.4), cac: 25 },
      { channel: 'Google', count: Math.floor(newCustomers * 0.3), cac: 30 },
      { channel: 'Organic', count: Math.floor(newCustomers * 0.2), cac: 0 },
      { channel: 'TikTok', count: Math.floor(newCustomers * 0.1), cac: 35 },
    ];

    return NextResponse.json({
      kpis,
      revenue: {
        mrr: estimatedMRR,
        arr: estimatedMRR * 12,
        mrrGrowth: 0,
        mrrGrowthPercent: 0,
        totalRevenue: 0,
        avgRevenuePerUser: totalCustomers > 0 ? estimatedMRR / totalCustomers : 0,
      },
      churn: {
        rate: 0,
        count: 0,
        revenueChurn: 0,
        netRevenueRetention: 100,
      },
      ltv: {
        average: 0,
        median: 0,
        byPlan: {},
        projected: 0,
      },
      acquisition: {
        cac: 0,
        paybackPeriod: 0,
        ltvCacRatio: 0,
        byChannel: acquisitionChannels.reduce((acc, ch) => {
          acc[ch.channel] = { count: ch.count, cac: ch.cac };
          return acc;
        }, {} as Record<string, { count: number; cac: number }>),
      },
      recentActivity: formattedActivity,
      recentCustomers: formattedCustomers,
      revenueChart: formattedRevenueChart,
      planDistribution,
      acquisitionChannels,
    });
  } catch (error) {
    serverLogger.apiError('/api/admin/analytics/overview', 'GET', error, 500);
    return NextResponse.json(
      { error: 'Failed to fetch overview data' },
      { status: 500 }
    );
  }
}

/**
 * Génère un message lisible depuis le type d'événement
 */
function getEventMessage(eventType: string): string {
  const messages: Record<string, string> = {
    'user.created': 'New user registered',
    'subscription.created': 'New subscription created',
    'subscription.cancelled': 'Subscription cancelled',
    'payment.succeeded': 'Payment succeeded',
    'payment.failed': 'Payment failed',
    'trial.started': 'Trial started',
    'trial.converted': 'Trial converted to paid',
  };
  return messages[eventType] || `Event: ${eventType}`;
}

/**
 * Génère des données mock pour le chart si aucune donnée n'est disponible
 */
function generateMockChartData(dateFrom: Date, dateTo: Date, days: number) {
  const data = [];
  const baseMRR = 10000;
  const baseRevenue = 500;

  for (let i = 0; i < days; i++) {
    const date = new Date(dateFrom);
    date.setDate(date.getDate() + i);
    
    // Simulation de croissance légère avec variation aléatoire
    const variation = (Math.random() - 0.5) * 0.1;
    const mrr = baseMRR * (1 + (i / days) * 0.1 + variation);
    const revenue = baseRevenue * (1 + (i / days) * 0.05 + variation * 0.5);

    data.push({
      date: date.toISOString().split('T')[0],
      mrr: Math.max(0, mrr),
      revenue: Math.max(0, revenue),
      newCustomers: Math.floor(Math.random() * 5),
    });
  }

  return data;
}
