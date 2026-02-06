/**
 * ★★★ ADMIN ANALYTICS FUNNEL API ★★★
 * API route pour récupérer les données de funnel analysis
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

    const { searchParams } = new URL(request.url);
    const periodDays = parseInt(searchParams.get('period') || '30');
    const endDate = new Date();
    const startDate = subDays(endDate, periodDays);

    // Calculer les étapes du funnel
    // 1. Visiteurs (tous les users créés)
    const totalVisitors = await db.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // 2. Signups (users avec email vérifié)
    const signups = await db.user.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        emailVerified: {
          not: null,
        },
      },
    });

    // 3. Trials (subscriptions en trial)
    const trials = await db.subscription.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'trialing',
      },
    });

    // 4. Conversions (subscriptions actives)
    const conversions = await db.subscription.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'active',
      },
    });

    // 5. Paying Customers (avec au moins un paiement réussi)
    const payingCustomers = await db.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: 'completed',
      },
      distinct: ['userId'],
    });

    // Construire le funnel
    const funnel = [
      {
        stage: 'Visitors',
        count: totalVisitors,
        conversion: 100,
        dropoff: 0,
      },
      {
        stage: 'Signups',
        count: signups,
        conversion: totalVisitors > 0 ? (signups / totalVisitors) * 100 : 0,
        dropoff: totalVisitors > 0 ? ((totalVisitors - signups) / totalVisitors) * 100 : 0,
      },
      {
        stage: 'Trials',
        count: trials,
        conversion: signups > 0 ? (trials / signups) * 100 : 0,
        dropoff: signups > 0 ? ((signups - trials) / signups) * 100 : 0,
      },
      {
        stage: 'Conversions',
        count: conversions,
        conversion: trials > 0 ? (conversions / trials) * 100 : 0,
        dropoff: trials > 0 ? ((trials - conversions) / trials) * 100 : 0,
      },
      {
        stage: 'Paying Customers',
        count: payingCustomers,
        conversion: conversions > 0 ? (payingCustomers / conversions) * 100 : 0,
        dropoff: conversions > 0 ? ((conversions - payingCustomers) / conversions) * 100 : 0,
      },
    ];

    return NextResponse.json(funnel);
  } catch (error) {
    serverLogger.apiError('/api/admin/analytics/funnel', 'GET', error, 500);
    return NextResponse.json(
      { error: 'Failed to fetch funnel data' },
      { status: 500 }
    );
  }
}
