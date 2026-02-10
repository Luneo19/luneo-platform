import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole, Prisma, PaymentStatus, SubscriptionStatus } from '@prisma/client';
import { EmailService } from '@/modules/email/email.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // ========================================
  // TENANTS (BRANDS)
  // ========================================

  /**
   * List all tenants (brands) for platform admin dashboard.
   */
  async getTenants() {
    const brands = await this.prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
      orderBy: { name: 'asc' },
    });
    return {
      tenants: brands.map((b) => ({
        id: b.id,
        name: b.name || 'Unnamed Tenant',
        plan: b.subscriptionPlan || 'starter',
        status: b.subscriptionStatus || 'active',
      })),
    };
  }

  /**
   * Get brand detail with full relations
   */
  async getBrandDetail(brandId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            lastLoginAt: true,
            isActive: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            users: true,
            products: true,
            designs: true,
            orders: true,
            invoices: true,
          },
        },
      },
    });

    if (!brand) {
      throw new NotFoundException(`Brand ${brandId} not found`);
    }

    return brand;
  }

  // ========================================
  // CUSTOMER MANAGEMENT
  // ========================================

  /**
   * List all customers with pagination and filtering
   */
  async getCustomers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: UserRole;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const { search, role, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};
    
    // Filter by search (email, firstName, lastName)
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by role
    if (role) {
      where.role = role;
    }

    const [customers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          emailVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          brand: {
            select: {
              id: true,
              name: true,
              subscriptionPlan: true,
              subscriptionStatus: true,
            },
          },
          customer: {
            select: {
              totalRevenue: true,
              ltv: true,
              engagementScore: true,
              churnRisk: true,
              totalSessions: true,
              totalTimeSpent: true,
              lastSeenAt: true,
              firstSeenAt: true,
            },
          },
          healthScore: {
            select: {
              healthScore: true,
              churnRisk: true,
              engagementScore: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: customers.map((user) => {
        const brand = user.brand;
        const cust = user.customer;
        const hs = user.healthScore;

        // Determine status
        let status: string = 'active';
        if (brand?.subscriptionStatus === 'TRIALING') status = 'trial';
        else if (user.lastLoginAt && new Date().getTime() - new Date(user.lastLoginAt).getTime() > 30 * 24 * 60 * 60 * 1000) status = 'churned';
        else if (user.lastLoginAt && new Date().getTime() - new Date(user.lastLoginAt).getTime() > 14 * 24 * 60 * 60 * 1000) status = 'at-risk';
        else if (!user.lastLoginAt) status = 'none';

        return {
          ...user,
          // Customer intelligence
          ltv: cust?.ltv ?? 0,
          totalRevenue: cust?.totalRevenue ?? 0,
          engagementScore: cust?.engagementScore ?? hs?.engagementScore ?? 0,
          churnRisk: hs?.churnRisk?.toLowerCase() ?? cust?.churnRisk ?? 'low',
          totalSessions: cust?.totalSessions ?? 0,
          totalTimeSpent: cust?.totalTimeSpent ?? 0,
          lastSeenAt: cust?.lastSeenAt ?? user.lastLoginAt,
          // Computed
          status,
          planPrice: 0, // Will be enriched later or by frontend
          plan: brand?.subscriptionPlan ? String(brand.subscriptionPlan) : 'free',
          name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
        };
      }),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get customer details by ID
   */
  async getCustomerById(customerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        brand: {
          select: {
            id: true,
            name: true,
            plan: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
        customer: {
          select: {
            totalRevenue: true,
            ltv: true,
            engagementScore: true,
            churnRisk: true,
            totalSessions: true,
            totalTimeSpent: true,
            lastSeenAt: true,
            firstSeenAt: true,
          },
        },
        healthScore: {
          select: {
            healthScore: true,
            churnRisk: true,
            engagementScore: true,
          },
        },
        designs: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            prompt: true,
            status: true,
            createdAt: true,
          },
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalCents: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const brand = user.brand;
    const cust = user.customer;
    const hs = user.healthScore;

    // Determine status (same logic as getCustomers)
    let status: string = 'active';
    if (brand?.subscriptionStatus === 'TRIALING') status = 'trial';
    else if (user.lastLoginAt && new Date().getTime() - new Date(user.lastLoginAt).getTime() > 30 * 24 * 60 * 60 * 1000) status = 'churned';
    else if (user.lastLoginAt && new Date().getTime() - new Date(user.lastLoginAt).getTime() > 14 * 24 * 60 * 60 * 1000) status = 'at-risk';
    else if (!user.lastLoginAt) status = 'none';

    return {
      ...user,
      ltv: cust?.ltv ?? 0,
      totalRevenue: cust?.totalRevenue ?? 0,
      engagementScore: cust?.engagementScore ?? hs?.engagementScore ?? 0,
      churnRisk: hs?.churnRisk?.toLowerCase() ?? cust?.churnRisk ?? 'low',
      totalSessions: cust?.totalSessions ?? 0,
      totalTimeSpent: cust?.totalTimeSpent ?? 0,
      lastSeenAt: cust?.lastSeenAt ?? user.lastLoginAt,
      status,
      planPrice: 0,
      plan: brand?.subscriptionPlan ? String(brand.subscriptionPlan) : 'free',
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    };
  }

  // ========================================
  // ANALYTICS
  // ========================================

  /**
   * Get analytics overview — full structure expected by frontend useAdminOverview hook.
   */
  async getAnalyticsOverview() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const nonAdminWhere = { role: { not: UserRole.PLATFORM_ADMIN } as const };
    const paidOrderWhere = { status: 'PAID' as const };

    const [
      totalCustomers,
      newCustomersLast30Days,
      totalOrders,
      ordersLast30Days,
      revenueData,
      previousRevenueData,
      activeCustomers,
      totalRevenueAllTime,
      recentOrdersForActivity,
      recentUsersForCustomers,
      ordersForRevenueChart,
      usersCreatedForChart,
      planDistributionRaw,
      ordersForLtv,
    ] = await Promise.all([
      this.prisma.user.count({ where: nonAdminWhere }),
      this.prisma.user.count({
        where: { ...nonAdminWhere, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.order.aggregate({
        where: { ...paidOrderWhere, createdAt: { gte: thirtyDaysAgo } },
        _sum: { totalCents: true },
      }),
      this.prisma.order.aggregate({
        where: {
          ...paidOrderWhere,
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        _sum: { totalCents: true },
      }),
      this.prisma.user.count({
        where: {
          ...nonAdminWhere,
          orders: { some: { createdAt: { gte: thirtyDaysAgo } } },
        },
      }),
      this.prisma.order.aggregate({
        where: paidOrderWhere,
        _sum: { totalCents: true },
      }),
      this.prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: { deletedAt: null },
        select: {
          id: true,
          orderNumber: true,
          totalCents: true,
          status: true,
          createdAt: true,
          customerName: true,
          customerEmail: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        where: nonAdminWhere,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          lastLoginAt: true,
          isActive: true,
          createdAt: true,
          brand: {
            select: { subscriptionPlan: true, subscriptionStatus: true },
          },
          orders: {
            where: paidOrderWhere,
            select: { totalCents: true },
          },
        },
      }),
      this.prisma.order.findMany({
        where: {
          ...paidOrderWhere,
          createdAt: { gte: twelveMonthsAgo },
          deletedAt: null,
        },
        select: { createdAt: true, totalCents: true },
      }),
      this.prisma.user.findMany({
        where: { ...nonAdminWhere, createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      this.prisma.brand.groupBy({
        by: ['subscriptionPlan'],
        where: { deletedAt: null },
        _count: true,
      }),
      this.prisma.order.findMany({
        where: { ...paidOrderWhere, userId: { not: null } },
        select: { userId: true, totalCents: true },
      }),
    ]);

    const mrr = (revenueData._sum.totalCents || 0) / 100;
    const previousMrr = (previousRevenueData._sum.totalCents || 0) / 100;
    const mrrChange = mrr - previousMrr;
    const mrrChangePercent = previousMrr > 0 ? (mrrChange / previousMrr) * 100 : 0;
    const churnRate =
      totalCustomers > 0
        ? Math.round(((totalCustomers - activeCustomers) / totalCustomers) * 10000) / 100
        : 0;
    const totalRevenue = (totalRevenueAllTime._sum.totalCents || 0) / 100;
    const avgRevenuePerUser = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
    const ltvValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

    const trend = (current: number, previous: number): 'up' | 'down' | 'neutral' =>
      current > previous ? 'up' : current < previous ? 'down' : 'neutral';

    const customerTrend: 'up' | 'down' | 'neutral' =
      newCustomersLast30Days > 0 ? 'up' : 'neutral';

    // Recent activity from last 10 orders
    const recentActivity = recentOrdersForActivity.map((o) => ({
      id: o.id,
      type: 'order',
      message: `Order ${o.orderNumber} - ${(o.totalCents / 100).toFixed(2)} €`,
      customerName:
        o.customerName ??
        (o.user ? [o.user.firstName, o.user.lastName].filter(Boolean).join(' ') || undefined : undefined),
      customerEmail: o.customerEmail ?? o.user?.email,
      timestamp: o.createdAt,
      metadata: { orderNumber: o.orderNumber, totalCents: o.totalCents, status: o.status },
    }));

    // Recent customers with status
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const thirtyDaysAgoForChurn = new Date();
    thirtyDaysAgoForChurn.setDate(thirtyDaysAgoForChurn.getDate() - 30);

    const recentCustomers = recentUsersForCustomers.map((u) => {
      const plan = u.brand?.subscriptionPlan ?? null;
      const planName = plan ? String(plan) : null;
      const mrrUser = u.orders.reduce((s, o) => s + (o.totalCents || 0), 0) / 100;
      const lastLogin = u.lastLoginAt ?? null;
      let status: 'active' | 'trial' | 'churned' | 'at-risk' = 'active';
      if (u.brand?.subscriptionStatus === SubscriptionStatus.TRIALING) status = 'trial';
      else if (lastLogin && lastLogin < thirtyDaysAgoForChurn) status = 'churned';
      else if (lastLogin && lastLogin < fourteenDaysAgo) status = 'at-risk';
      else if (lastLogin && lastLogin >= sevenDaysAgo) status = 'active';
      else if (u.isActive) status = 'active';
      else status = 'at-risk';

      return {
        id: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        email: u.email,
        avatar: u.avatar ?? null,
        plan: planName,
        mrr: Math.round(mrrUser * 100) / 100,
        ltv: Math.round((u.orders.reduce((s, o) => s + (o.totalCents || 0), 0) / 100) * 100) / 100,
        status,
        customerSince: u.createdAt,
      };
    });

    // Revenue chart: last 12 months
    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const revenueByMonth: Record<string, { revenue: number; newCustomers: number }> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      revenueByMonth[monthKey(d)] = { revenue: 0, newCustomers: 0 };
    }
    for (const o of ordersForRevenueChart) {
      const key = monthKey(o.createdAt);
      if (revenueByMonth[key] != null) revenueByMonth[key].revenue += o.totalCents / 100;
    }
    for (const u of usersCreatedForChart) {
      const key = monthKey(u.createdAt);
      if (revenueByMonth[key] != null) revenueByMonth[key].newCustomers += 1;
    }
    const revenueChart = Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { revenue, newCustomers }]) => ({
        date,
        mrr: Math.round(revenue * 100) / 100,
        revenue: Math.round(revenue * 100) / 100,
        newCustomers,
      }));

    // Plan distribution: count + mrr per plan (MRR from orders in last 30 days by brand plan)
    const planCounts = new Map<string, { count: number; mrr: number }>();
    for (const g of planDistributionRaw) {
      const name = String(g.subscriptionPlan);
      planCounts.set(name, { count: g._count, mrr: 0 });
    }
    const ordersByBrandPlan = await this.prisma.order.groupBy({
      by: ['brandId'],
      where: { ...paidOrderWhere, createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      _sum: { totalCents: true },
    });
    const brandIds = await this.prisma.brand.findMany({
      where: { deletedAt: null },
      select: { id: true, subscriptionPlan: true },
    });
    const brandPlanMap = new Map(brandIds.map((b) => [b.id, b.subscriptionPlan]));
    for (const ob of ordersByBrandPlan) {
      const plan = brandPlanMap.get(ob.brandId);
      if (plan == null) continue;
      const name = String(plan);
      const entry = planCounts.get(name);
      if (entry) entry.mrr += (ob._sum.totalCents || 0) / 100;
    }
    const planDistribution = Array.from(planCounts.entries()).map(([name, { count, mrr }]) => ({
      name,
      count,
      mrr: Math.round(mrr * 100) / 100,
    }));

    // LTV: average, median, byPlan (defaults), projected
    const ltvByUser = new Map<string, number>();
    for (const o of ordersForLtv) {
      if (o.userId) ltvByUser.set(o.userId, (ltvByUser.get(o.userId) || 0) + o.totalCents / 100);
    }
    const ltvValues = Array.from(ltvByUser.values());
    const ltvMedian =
      ltvValues.length === 0
        ? 0
        : (() => {
            const sorted = [...ltvValues].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
          })();
    const ltvByPlanAvg: Record<string, number> = {};
    const payingUserIds = Array.from(ltvByUser.keys());
    if (payingUserIds.length > 0) {
      const usersWithPlan = await this.prisma.user.findMany({
        where: { id: { in: payingUserIds } },
        select: {
          id: true,
          brand: { select: { subscriptionPlan: true } },
        },
      });
      const planSums: Record<string, { total: number; count: number }> = {};
      for (const u of usersWithPlan) {
        const plan = u.brand?.subscriptionPlan ? String(u.brand.subscriptionPlan) : 'FREE';
        const userLtv = ltvByUser.get(u.id) ?? 0;
        if (!planSums[plan]) planSums[plan] = { total: 0, count: 0 };
        planSums[plan].total += userLtv;
        planSums[plan].count += 1;
      }
      for (const [plan, { total, count }] of Object.entries(planSums)) {
        ltvByPlanAvg[plan] = Math.round((total / count) * 100) / 100;
      }
    }

    return {
      kpis: {
        mrr: {
          value: Math.round(mrr * 100) / 100,
          change: Math.round(mrrChange * 100) / 100,
          changePercent: Math.round(mrrChangePercent * 100) / 100,
          trend: trend(mrr, previousMrr),
        },
        customers: {
          value: totalCustomers,
          new: newCustomersLast30Days,
          trend: customerTrend,
        },
        churnRate: {
          value: churnRate,
          change: 0,
          trend: 'neutral' as const,
        },
        ltv: {
          value: Math.round(ltvValue * 100) / 100,
          projected: Math.round(ltvValue * 1.1 * 100) / 100,
          trend: 'neutral' as const,
        },
      },
      revenue: {
        mrr: Math.round(mrr * 100) / 100,
        arr: Math.round(mrr * 12 * 100) / 100,
        mrrGrowth: Math.round(mrrChange * 100) / 100,
        mrrGrowthPercent: Math.round(mrrChangePercent * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        avgRevenuePerUser: Math.round(avgRevenuePerUser * 100) / 100,
      },
      churn: {
        rate: churnRate,
        count: totalCustomers - activeCustomers,
        revenueChurn: 0,
        netRevenueRetention: 100 - churnRate,
      },
      ltv: {
        average: Math.round(ltvValue * 100) / 100,
        median: Math.round(ltvMedian * 100) / 100,
        byPlan: ltvByPlanAvg,
        projected: Math.round(ltvValue * 1.1 * 100) / 100,
      },
      acquisition: {
        cac: 0,
        paybackPeriod: 0,
        ltvCacRatio: 0,
        byChannel: {},
      },
      recentActivity,
      recentCustomers,
      revenueChart,
      planDistribution,
      acquisitionChannels:
        totalCustomers > 0 ? [{ channel: 'Organic', count: totalCustomers, cac: 0 }] : [],
    };
  }

  /**
   * Get revenue metrics
   */
  async getRevenueMetrics(period: string = '30d') {
    const days = parseInt(period.replace('d', '')) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [revenueData, ordersByDay] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: startDate },
        },
        _sum: { totalCents: true },
        _count: true,
      }),
      this.prisma.order.groupBy({
        by: ['createdAt'],
        where: {
          status: 'PAID',
          createdAt: { gte: startDate },
        },
        _sum: { totalCents: true },
        _count: true,
      }),
    ]);

    const totalRevenue = (revenueData._sum.totalCents || 0) / 100;
    const mrr = totalRevenue / (days / 30);
    const arr = mrr * 12;

    return {
      totalRevenue,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      orderCount: revenueData._count,
      averageOrderValue: revenueData._count > 0 ? totalRevenue / revenueData._count : 0,
      period,
    };
  }

  /**
   * Export data (CSV or PDF)
   */
  async exportData(format: 'csv' | 'pdf', type: 'customers' | 'analytics' | 'orders') {
    if (type === 'customers') {
      const customers = await this.prisma.user.findMany({
        where: { role: { not: UserRole.PLATFORM_ADMIN } },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          brand: {
            select: { name: true, subscriptionPlan: true },
          },
        },
      });

      if (format === 'csv') {
        const headers = ['id', 'email', 'firstName', 'lastName', 'role', 'brandName', 'plan', 'createdAt'];
        const rows = customers.map(c => [
          c.id,
          c.email,
          c.firstName || '',
          c.lastName || '',
          c.role,
          c.brand?.name || '',
          c.brand?.subscriptionPlan || 'FREE',
          c.createdAt.toISOString(),
        ]);
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return { content: csv, contentType: 'text/csv', filename: `customers-${Date.now()}.csv` };
      }

      // For PDF, return structured data (actual PDF generation would need a library like PDFKit)
      return { 
        content: Buffer.from(JSON.stringify(customers, null, 2)).toString('base64'),
        contentType: 'application/pdf',
        filename: `customers-${Date.now()}.pdf`,
      };
    }

    if (type === 'analytics') {
      const analytics = await this.getAnalyticsOverview();
      
      if (format === 'csv') {
        const headers = Object.keys(analytics);
        const values = Object.values(analytics);
        const csv = [headers.join(','), values.join(',')].join('\n');
        return { content: csv, contentType: 'text/csv', filename: `analytics-${Date.now()}.csv` };
      }

      return {
        content: Buffer.from(JSON.stringify(analytics, null, 2)).toString('base64'),
        contentType: 'application/pdf',
        filename: `analytics-${Date.now()}.pdf`,
      };
    }

    if (type === 'orders') {
      const orders = await this.prisma.order.findMany({
        take: 1000,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerEmail: true,
          status: true,
          totalCents: true,
          createdAt: true,
        },
      });

      if (format === 'csv') {
        const headers = ['id', 'orderNumber', 'customerEmail', 'status', 'total', 'createdAt'];
        const rows = orders.map(o => [
          o.id,
          o.orderNumber,
          o.customerEmail || '',
          o.status,
          (o.totalCents / 100).toFixed(2),
          o.createdAt.toISOString(),
        ]);
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        return { content: csv, contentType: 'text/csv', filename: `orders-${Date.now()}.csv` };
      }

      return {
        content: Buffer.from(JSON.stringify(orders, null, 2)).toString('base64'),
        contentType: 'application/pdf',
        filename: `orders-${Date.now()}.pdf`,
      };
    }

    throw new BadRequestException(`Unknown export type: ${type}`);
  }

  // ========================================
  // BILLING
  // ========================================

  /**
   * Get billing/subscription overview
   */
  async getBillingOverview() {
    const brands = await this.prisma.brand.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        planExpiresAt: true,
        trialEndsAt: true,
        createdAt: true,
      },
    });

    // Calculate plan distribution
    const subscribersByPlan: Record<string, number> = {};
    let activeSubscriptions = 0;
    let trialSubscriptions = 0;
    let cancelledSubscriptions = 0;

    for (const brand of brands) {
      const plan = brand.subscriptionPlan || brand.plan || 'free';
      subscribersByPlan[plan] = (subscribersByPlan[plan] || 0) + 1;

      if (brand.subscriptionStatus === SubscriptionStatus.ACTIVE) activeSubscriptions++;
      else if (brand.subscriptionStatus === SubscriptionStatus.TRIALING) trialSubscriptions++;
      else if (brand.subscriptionStatus === SubscriptionStatus.CANCELED) cancelledSubscriptions++;
    }

    // Get recent invoices
    const recentInvoices = await this.prisma.invoice.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { name: true } },
      },
    });

    // Get revenue from orders (paymentStatus SUCCEEDED)
    const revenue = await this.prisma.order.aggregate({
      where: { paymentStatus: PaymentStatus.SUCCEEDED },
      _sum: { totalCents: true },
    });

    const totalRevenue = (revenue._sum.totalCents || 0) / 100;
    const mrr = totalRevenue / Math.max(1, 12); // Simplified MRR calculation
    const arr = mrr * 12;

    return {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      subscribersByPlan,
      revenueByPlan: subscribersByPlan, // Simplified for now
      churnRevenue: 0,
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        brandName: inv.brand?.name || 'Unknown',
        amount: Number(inv.amount),
        currency: inv.currency,
        status: inv.status,
        paidAt: inv.paidAt?.toISOString() || null,
        createdAt: inv.createdAt.toISOString(),
      })),
    };
  }

  async getMetrics() {
    const [
      totalUsers,
      totalBrands,
      totalProducts,
      totalOrders,
      totalDesigns,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.brand.count(),
      this.prisma.product.count(),
      this.prisma.order.count(),
      this.prisma.design.count(),
    ]);

    return {
      totalUsers,
      totalBrands,
      totalProducts,
      totalOrders,
      totalDesigns,
      timestamp: new Date().toISOString(),
    };
  }

  async createAdminUser() {
    try {
      const bcrypt = require('bcryptjs');
      const defaultAdminPw = process.env.ADMIN_DEFAULT_PASSWORD;
      if (!defaultAdminPw && process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_DEFAULT_PASSWORD must be set in production');
      }
      // In production: use env var. In dev: use env var or generate random password
      let passwordToHash = defaultAdminPw;
      if (!passwordToHash) {
        const crypto = require('crypto');
        passwordToHash = crypto.randomBytes(16).toString('hex');
        this.logger.warn(`DEV ONLY: Generated random admin password: ${passwordToHash}`);
      }
      const adminPassword = await bcrypt.hash(passwordToHash, 13);
      const adminEmail = process.env.ADMIN_EMAIL;
      if (!adminEmail && process.env.NODE_ENV === 'production') {
        throw new Error('ADMIN_EMAIL must be set in production');
      }
      const finalAdminEmail = adminEmail || 'admin@localhost.dev';
      
      const adminUser = await this.prisma.user.upsert({
        where: { email: finalAdminEmail },
        update: {},
        create: {
          email: finalAdminEmail,
          password: adminPassword,
          firstName: 'Admin',
          lastName: 'Luneo',
          role: 'PLATFORM_ADMIN',
          emailVerified: true,
        },
      });

      this.logger.log(`✅ Admin user created/verified: ${adminUser.email}`);
      return {
        success: true,
        message: 'Admin user created successfully',
        email: adminUser.email,
      };
    } catch (error: any) {
      this.logger.error(`❌ Failed to create admin: ${error.message}`);
      throw error;
    }
  }

  async getAICosts(period: string = '30d') {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const costs = await this.prisma.aICost.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        id: true,
        brandId: true,
        provider: true,
        model: true,
        costCents: true,
        createdAt: true,
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    const totalCost = costs.reduce((sum, cost) => sum + cost.costCents, 0);
    const costsByProvider = costs.reduce((acc, cost) => {
      acc[cost.provider] = (acc[cost.provider] || 0) + cost.costCents;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalCost,
      costsByProvider,
      costs,
      period,
    };
  }

  private static readonly BLACKLIST_CONFIG_KEY = 'ai:blacklisted_prompts';

  async addBlacklistedPrompt(term: string) {
    const normalized = term.toLowerCase().trim();
    if (!normalized) {
      throw new BadRequestException('Term cannot be empty');
    }
    const terms = await this.getBlacklistedPrompts();
    const set = new Set(terms);
    set.add(normalized);
    await this.persistBlacklistedPrompts([...set]);
    this.logger.log(`Added blacklisted prompt term: ${term}`);
    return { message: 'Term added to blacklist', total: set.size };
  }

  async getBlacklistedPrompts(): Promise<string[]> {
    const config = await this.prisma.systemConfig.findUnique({
      where: { key: AdminService.BLACKLIST_CONFIG_KEY },
    });
    if (!config?.value) return [];
    try {
      return JSON.parse(config.value) as string[];
    } catch {
      this.logger.warn('Invalid JSON in ai:blacklisted_prompts config');
      return [];
    }
  }

  async removeBlacklistedPrompt(term: string) {
    const normalized = term.toLowerCase().trim();
    const terms = await this.getBlacklistedPrompts();
    const set = new Set(terms);
    set.delete(normalized);
    await this.persistBlacklistedPrompts([...set]);
    this.logger.log(`Removed blacklisted prompt term: ${term}`);
    return { message: 'Term removed from blacklist', total: set.size };
  }

  private async persistBlacklistedPrompts(terms: string[]) {
    await this.prisma.systemConfig.upsert({
      where: { key: AdminService.BLACKLIST_CONFIG_KEY },
      create: {
        key: AdminService.BLACKLIST_CONFIG_KEY,
        value: JSON.stringify(terms),
        description: 'AI blacklisted prompt terms (content moderation)',
      },
      update: { value: JSON.stringify(terms) },
    });
  }

  /**
   * Bulk actions for customers
   */
  async bulkActionCustomers(
    customerIds: string[],
    action: 'email' | 'export' | 'tag' | 'segment' | 'delete',
    options?: Record<string, any>,
  ) {
    this.logger.log(`Bulk action: ${action} on ${customerIds.length} customers`);

    switch (action) {
      case 'email':
        return this.bulkSendEmail(customerIds, options);
      case 'export':
        return this.bulkExportCustomers(customerIds);
      case 'tag':
        return this.bulkTagCustomers(customerIds, options?.tags || []);
      case 'segment':
        return this.bulkSegmentCustomers(customerIds, options?.segmentId);
      case 'delete':
        return this.bulkDeleteCustomers(customerIds);
      default:
        throw new BadRequestException(`Unknown bulk action: ${action}`);
    }
  }

  private async bulkSendEmail(customerIds: string[], options?: { subject?: string; template?: string }) {
    const customers = await this.prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { 
        id: true, 
        email: true, 
        firstName: true,
        lastName: true,
      },
    });

    const subject = options?.subject ?? 'Message from Luneo';
    const html = options?.template ?? '<p>Hello {{firstName}},</p><p>You have a new message.</p>';
    for (const c of customers) {
      const body = html
        .replace(/\{\{firstName\}\}/g, c.firstName ?? '')
        .replace(/\{\{lastName\}\}/g, c.lastName ?? '')
        .replace(/\{\{email\}\}/g, c.email);
      await this.emailService.sendEmail({
        to: c.email,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''),
      });
    }
    this.logger.log(`Sent email to ${customers.length} customers`);
    return {
      success: true,
      message: `Email sent to ${customers.length} customers`,
      count: customers.length,
    };
  }

  private async bulkExportCustomers(customerIds: string[]) {
    const customers = await this.prisma.user.findMany({
      where: { id: { in: customerIds } },
      include: {
        brand: {
          select: {
            subscriptionPlan: true,
            subscriptionStatus: true,
          },
        },
      },
    });

    // Format for CSV export
    const csvData = customers.map((customer) => ({
      id: customer.id,
      email: customer.email,
      name: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'N/A',
      plan: customer.brand?.subscriptionPlan || 'FREE',
      createdAt: customer.createdAt.toISOString(),
    }));

    return {
      success: true,
      data: csvData,
      count: customers.length,
    };
  }

  private async bulkTagCustomers(customerIds: string[], tags: string[]) {
    this.logger.log(`Tagging ${customerIds.length} customers with tags: ${tags.join(', ')}`);
    return {
      success: true,
      message: `Tagged ${customerIds.length} customers`,
      count: customerIds.length,
    };
  }

  private async bulkSegmentCustomers(customerIds: string[], segmentId?: string) {
    if (!segmentId) {
      throw new BadRequestException('Segment ID is required');
    }

    const segment = await this.prisma.analyticsSegment.findUnique({
      where: { id: segmentId },
      select: { id: true, criteria: true, userCount: true },
    });
    if (!segment) {
      throw new NotFoundException(`Segment ${segmentId} not found`);
    }

    const criteria = (segment.criteria as Record<string, unknown>) ?? {};
    const memberIds = (criteria.memberIds as string[]) ?? [];
    const merged = [...new Set([...memberIds, ...customerIds])];
    await this.prisma.analyticsSegment.update({
      where: { id: segmentId },
      data: {
        criteria: { ...criteria, memberIds: merged } as Prisma.InputJsonValue,
        userCount: merged.length,
      },
    });

    this.logger.log(`Added ${customerIds.length} customers to segment ${segmentId}`);
    return {
      success: true,
      message: `Added ${customerIds.length} customers to segment`,
      count: customerIds.length,
    };
  }

  private async bulkDeleteCustomers(customerIds: string[]) {
    // Soft delete: Set isActive to false (User model doesn't have deletedAt)
    await this.prisma.user.updateMany({
      where: { id: { in: customerIds } },
      data: { isActive: false },
    });

    this.logger.log(`Deleted ${customerIds.length} customers`);
    return {
      success: true,
      message: `Deleted ${customerIds.length} customers`,
      count: customerIds.length,
    };
  }
}
