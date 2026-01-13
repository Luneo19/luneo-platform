/**
 * ★★★ ADMIN CUSTOMERS API ★★★
 * API route pour récupérer la liste des customers avec filtres et pagination
 * Protection: Vérifie que l'utilisateur est PLATFORM_ADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { db } from '@/lib/db';

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

    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filtres
    const status = searchParams.get('status'); // active, trial, churned, at-risk
    const plan = searchParams.get('plan');
    const segment = searchParams.get('segment');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Construction du where
    const where: any = {};

    if (search) {
      where.OR = [
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status === 'active') {
      where.user = {
        ...where.user,
        subscriptions: {
          some: {
            status: 'active',
          },
        },
      };
    } else if (status === 'trial') {
      where.user = {
        ...where.user,
        subscriptions: {
          some: {
            status: 'trialing',
          },
        },
      };
    } else if (status === 'churned') {
      where.user = {
        ...where.user,
        subscriptions: {
          some: {
            status: 'cancelled',
          },
        },
      };
    } else if (status === 'at-risk') {
      where.churnRisk = 'high';
    }

    if (plan) {
      where.user = {
        ...where.user,
        subscriptions: {
          some: {
            plan: {
              name: plan,
            },
            status: 'active',
          },
        },
      };
    }

    if (segment) {
      where.segments = {
        some: {
          id: segment,
        },
      };
    }

    // Query
    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
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
                where: {
                  status: {
                    in: ['active', 'trialing'],
                  },
                },
                take: 1,
              },
            },
          },
          segments: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      db.customer.count({ where }),
    ]);

    // Enrichir avec les métriques
    const enrichedCustomers = customers.map((customer: any) => {
      const subscription = customer.user.subscriptions?.[0];
      return {
        id: customer.id,
        userId: customer.userId,
        name: customer.user.name || 'Unknown',
        email: customer.user.email,
        avatar: customer.user.image,
        plan: subscription?.plan?.name || null,
        planPrice: subscription?.plan?.price || 0,
        status: subscription?.status || 'none',
        ltv: customer.ltv,
        engagementScore: customer.engagementScore,
        churnRisk: customer.churnRisk as 'low' | 'medium' | 'high',
        totalTimeSpent: customer.totalTimeSpent,
        totalSessions: customer.totalSessions,
        lastSeenAt: customer.lastSeenAt,
        segments: customer.segments,
        createdAt: customer.createdAt,
        customerSince: customer.user.createdAt,
      };
    });

    return NextResponse.json({
      customers: enrichedCustomers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
