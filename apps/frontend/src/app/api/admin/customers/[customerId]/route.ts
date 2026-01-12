/**
 * ★★★ ADMIN CUSTOMER DETAIL API ★★★
 * API route pour récupérer les détails d'un customer
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  try {
    // Vérification admin
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { customerId } = params;

    // Récupérer le customer avec toutes les relations
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
          include: {
            subscriptions: {
              include: {
                plan: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        },
        segments: {
          select: {
            id: true,
            name: true,
          },
        },
        activities: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Récupérer l'historique de facturation (depuis les orders/payments)
    const subscription = customer.user.subscriptions?.[0];
    const billingHistory = subscription
      ? await db.order.findMany({
          where: {
            userId: customer.userId,
            status: 'completed',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        })
      : [];

    // Récupérer l'historique des emails
    const emailHistory = await db.emailLog.findMany({
      where: {
        customerId: customer.id,
      },
      orderBy: {
        sentAt: 'desc',
      },
      take: 20,
      select: {
        id: true,
        subject: true,
        status: true,
        sentAt: true,
      },
    });

    // Calculer les métriques
    const monthsActive = Math.max(
      1,
      Math.floor(
        (new Date().getTime() - new Date(customer.user.createdAt).getTime()) /
          (1000 * 60 * 60 * 24 * 30)
      )
    );
    const avgMonthlyRevenue = monthsActive > 0 ? customer.totalRevenue / monthsActive : 0;
    const predictedLtv = avgMonthlyRevenue > 0 ? avgMonthlyRevenue / 0.05 : 0; // Assuming 5% churn rate

    const enrichedCustomer = {
      id: customer.id,
      userId: customer.userId,
      name: customer.user.name || 'Unknown',
      email: customer.user.email,
      avatar: customer.user.image,
      plan: subscription?.plan?.name || null,
      planPrice: subscription?.plan?.price || 0,
      status: subscription?.status || 'none',
      ltv: customer.ltv,
      predictedLtv,
      engagementScore: customer.engagementScore,
      churnRisk: customer.churnRisk as 'low' | 'medium' | 'high',
      totalRevenue: customer.totalRevenue,
      avgMonthlyRevenue,
      monthsActive,
      totalTimeSpent: customer.totalTimeSpent,
      totalSessions: customer.totalSessions,
      lastSeenAt: customer.lastSeenAt,
      firstSeenAt: customer.firstSeenAt,
      segments: customer.segments,
      createdAt: customer.createdAt,
      customerSince: customer.user.createdAt,
    };

    return NextResponse.json({
      customer: enrichedCustomer,
      activities: customer.activities.map((a) => ({
        id: a.id,
        type: a.type,
        action: a.action,
        metadata: a.metadata || {},
        createdAt: a.createdAt,
      })),
      billingHistory: billingHistory.map((b) => ({
        id: b.id,
        amount: b.totalAmount,
        status: b.status,
        createdAt: b.createdAt,
      })),
      emailHistory: emailHistory.map((e) => ({
        id: e.id,
        subject: e.subject,
        status: e.status,
        sentAt: e.sentAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    );
  }
}
