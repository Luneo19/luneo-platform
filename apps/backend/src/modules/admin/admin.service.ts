import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole, Prisma, PaymentStatus, SubscriptionPlan, SubscriptionStatus, DiscountType, ReferralStatus, CommissionStatus, TicketStatus } from '@prisma/client';
import { EmailService } from '@/modules/email/email.service';
import { BillingService } from '@/modules/billing/billing.service';
import { PLAN_CONFIGS } from '@/libs/plans/plan-config';
import { PlanTier } from '@/libs/plans/plan-config.types';

/**
 * Helper: Get the monthly price for a SubscriptionPlan enum value.
 */
function getPlanPrice(subscriptionPlan: SubscriptionPlan | string | null | undefined): number {
  if (!subscriptionPlan) return 0;
  // Map Prisma SubscriptionPlan enum to PlanTier
  const tierMap: Record<string, PlanTier> = {
    FREE: PlanTier.FREE,
    STARTER: PlanTier.STARTER,
    PROFESSIONAL: PlanTier.PROFESSIONAL,
    BUSINESS: PlanTier.BUSINESS,
    ENTERPRISE: PlanTier.ENTERPRISE,
  };
  const tier = tierMap[String(subscriptionPlan).toUpperCase()];
  if (!tier) return 0;
  return PLAN_CONFIGS[tier]?.pricing?.monthlyPrice ?? 0;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly billingService: BillingService,
  ) {}

  // ========================================
  // TENANTS (BRANDS)
  // ========================================

  /**
   * List all tenants (brands) for platform admin dashboard.
   */
  async getTenants(params?: { page?: number; limit?: number; search?: string; plan?: string; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = params?.sortBy || 'createdAt';
    const sortOrder = params?.sortOrder || 'desc';

    const where: Prisma.BrandWhereInput = {};
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params?.plan) where.subscriptionPlan = params.plan as SubscriptionPlan;
    if (params?.status) where.subscriptionStatus = params.status as SubscriptionStatus;

    const [brands, total] = await Promise.all([
      this.prisma.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          plan: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          status: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          aiCostLimitCents: true,
          aiCostUsedCents: true,
          monthlyGenerations: true,
          maxMonthlyGenerations: true,
          maxProducts: true,
          trialEndsAt: true,
          planExpiresAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              products: true,
              designs: true,
              orders: true,
            },
          },
        },
      }),
      this.prisma.brand.count({ where }),
    ]);

    return {
      brands: brands.map((b) => ({
        ...b,
        plan: b.plan || b.subscriptionPlan || 'starter',
        status: b.status || b.subscriptionStatus || 'active',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      // Keep backward compatibility
      tenants: brands.map((b) => ({
        id: b.id,
        name: b.name || 'Unnamed Tenant',
        plan: b.subscriptionPlan || 'starter',
        status: b.subscriptionStatus || 'active',
      })),
    };
  }

  /**
   * Suspend a brand - disables all access for the brand and its users
   */
  async suspendBrand(brandId: string, reason?: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException(`Brand ${brandId} not found`);

    await this.prisma.brand.update({
      where: { id: brandId },
      data: { status: 'SUSPENDED' },
    });

    this.logger.warn(`Brand ${brandId} (${brand.name}) suspended. Reason: ${reason || 'No reason provided'}`);

    return {
      success: true,
      brandId,
      status: 'SUSPENDED',
      reason: reason || null,
      suspendedAt: new Date().toISOString(),
    };
  }

  /**
   * Unsuspend a brand - restores access
   */
  async unsuspendBrand(brandId: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException(`Brand ${brandId} not found`);

    await this.prisma.brand.update({
      where: { id: brandId },
      data: { status: 'ACTIVE' },
    });

    this.logger.log(`Brand ${brandId} (${brand.name}) unsuspended.`);

    return {
      success: true,
      brandId,
      status: 'ACTIVE',
      unsuspendedAt: new Date().toISOString(),
    };
  }

  /**
   * Ban a user - disables their account
   */
  async banUser(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    this.logger.warn(`User ${userId} (${user.email}) banned. Reason: ${reason || 'No reason provided'}`);

    return {
      success: true,
      userId,
      email: user.email,
      isActive: false,
      reason: reason || null,
      bannedAt: new Date().toISOString(),
    };
  }

  /**
   * Unban a user - restores their account access
   */
  async unbanUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    this.logger.log(`User ${userId} (${user.email}) unbanned.`);

    return {
      success: true,
      userId,
      email: user.email,
      isActive: true,
      unbannedAt: new Date().toISOString(),
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

  /**
   * Update brand details (admin)
   * @param syncStripe - If true and plan changed, sync the change to Stripe via BillingService.changePlan
   */
  async updateBrand(
    brandId: string,
    data: {
      name?: string;
      description?: string;
      website?: string;
      industry?: string;
      status?: string;
      plan?: string;
      subscriptionPlan?: string;
      subscriptionStatus?: string;
      maxProducts?: number;
      maxMonthlyGenerations?: number;
      aiCostLimitCents?: number;
      companyName?: string;
      vatNumber?: string;
      address?: string;
      city?: string;
      country?: string;
      phone?: string;
      syncStripe?: boolean;
    },
  ) {
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException(`Brand ${brandId} not found`);

    const newPlan = data.subscriptionPlan ?? data.plan;
    const planChanged =
      newPlan !== undefined &&
      newPlan !== null &&
      String(newPlan).toLowerCase() !== String(brand.subscriptionPlan ?? brand.plan ?? '').toLowerCase();

    if (data.syncStripe === true && planChanged && newPlan) {
      const brandUser = await this.prisma.user.findFirst({
        where: { brandId },
        select: { id: true },
      });
      if (brandUser) {
        try {
          await this.billingService.changePlan(brandUser.id, String(newPlan).toLowerCase(), {
            immediateChange: true,
          });
          this.logger.log(`Stripe plan synced for brand ${brandId} -> ${newPlan}`);
        } catch (err) {
          this.logger.warn(
            `Stripe sync failed for brand ${brandId} (plan ${newPlan}): ${err instanceof Error ? err.message : String(err)}`,
          );
          // Continue with DB update; admin can retry Stripe separately
        }
      } else {
        this.logger.warn(`Stripe sync skipped for brand ${brandId}: no user found for brand`);
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.subscriptionPlan !== undefined) updateData.subscriptionPlan = data.subscriptionPlan;
    if (data.subscriptionStatus !== undefined) updateData.subscriptionStatus = data.subscriptionStatus;
    if (data.maxProducts !== undefined) updateData.maxProducts = data.maxProducts;
    if (data.maxMonthlyGenerations !== undefined) updateData.maxMonthlyGenerations = data.maxMonthlyGenerations;
    if (data.aiCostLimitCents !== undefined) updateData.aiCostLimitCents = data.aiCostLimitCents;
    if (data.companyName !== undefined) updateData.companyName = data.companyName;
    if (data.vatNumber !== undefined) updateData.vatNumber = data.vatNumber;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.phone !== undefined) updateData.phone = data.phone;

    const updated = await this.prisma.brand.update({
      where: { id: brandId },
      data: updateData,
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

    this.logger.log(`Brand ${brandId} updated by admin`);
    return updated;
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
          planPrice: getPlanPrice(brand?.subscriptionPlan),
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
      planPrice: getPlanPrice(brand?.subscriptionPlan),
      plan: brand?.subscriptionPlan ? String(brand.subscriptionPlan) : 'free',
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    };
  }

  // ========================================
  // CREATE / UPDATE CUSTOMER (Admin)
  // ========================================

  /**
   * Create a new user (admin action).
   */
  async createCustomer(data: {
    email: string;
    name?: string;
    role?: string;
    brandId?: string;
    password?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException(`User with email ${data.email} already exists`);
    }

    // Split name into first/last for DB schema
    const nameParts = (data.name || '').split(' ');
    const firstName = nameParts[0] || undefined;
    const lastName = nameParts.slice(1).join(' ') || undefined;

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        firstName,
        lastName,
        role: (data.role as UserRole) || UserRole.CONSUMER,
        brandId: data.brandId || undefined,
        emailVerified: true, // Admin-created users are pre-verified
        isActive: true,
        // Password is optional — admin-created users may need to set via reset flow
        ...(data.password ? { password: data.password } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        brandId: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    this.logger.log(`Admin created user ${user.id} (${user.email})`);
    return user;
  }

  /**
   * Update a user (admin action).
   */
  async updateCustomer(
    customerId: string,
    data: {
      name?: string;
      role?: string;
      brandId?: string;
      isActive?: boolean;
    },
  ) {
    const existing = await this.prisma.user.findUnique({ where: { id: customerId } });
    if (!existing) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const nameParts = data.name ? data.name.split(' ') : [];
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) {
      updateData.firstName = nameParts[0] || undefined;
      updateData.lastName = nameParts.slice(1).join(' ') || undefined;
    }
    if (data.role !== undefined) updateData.role = data.role as UserRole;
    if (data.brandId !== undefined) updateData.brandId = data.brandId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const user = await this.prisma.user.update({
      where: { id: customerId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        brandId: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Admin updated user ${user.id}`);
    return user;
  }

  /**
   * Create a new brand (admin action).
   */
  async createBrand(data: { name: string; slug: string; userId: string }) {
    const existingSlug = await this.prisma.brand.findUnique({ where: { slug: data.slug } });
    if (existingSlug) {
      throw new BadRequestException(`Brand with slug "${data.slug}" already exists`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${data.userId} not found`);
    }

    const brand = await this.prisma.brand.create({
      data: {
        name: data.name,
        slug: data.slug,
        users: { connect: { id: data.userId } },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    // Link user to brand
    await this.prisma.user.update({
      where: { id: data.userId },
      data: { brandId: brand.id },
    });

    this.logger.log(`Admin created brand ${brand.id} (${brand.name}) for user ${data.userId}`);
    return brand;
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
        take: 1000,
      }),
      this.prisma.user.findMany({
        where: { ...nonAdminWhere, createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
        take: 1000,
      }),
      this.prisma.brand.groupBy({
        by: ['subscriptionPlan'],
        where: { deletedAt: null },
        _count: true,
      }),
      this.prisma.order.findMany({
        where: { ...paidOrderWhere, userId: { not: null } },
        select: { userId: true, totalCents: true },
        take: 1000,
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
      take: 100,
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
      // ADMIN FIX: Calculate churn revenue from canceled/downgraded subscriptions
      churn: await (async () => {
        try {
          // Get brands that canceled in the period
          const canceledBrands = await this.prisma.brand.findMany({
            where: {
              subscriptionStatus: SubscriptionStatus.CANCELED,
              updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
            select: { subscriptionPlan: true },
          });
          const churnRevenue = canceledBrands.reduce(
            (sum, b) => sum + getPlanPrice(b.subscriptionPlan),
            0,
          );
          // NRR = (MRR start + expansion - contraction - churn) / MRR start * 100
          // Simplified: we don't have expansion/contraction tracking yet
          const nrr = mrr > 0 ? Math.round(((mrr - churnRevenue) / mrr) * 10000) / 100 : 100;
          return {
            rate: churnRate,
            count: totalCustomers - activeCustomers,
            revenueChurn: Math.round(churnRevenue * 100) / 100,
            netRevenueRetention: nrr,
          };
        } catch {
          return {
            rate: churnRate,
            count: totalCustomers - activeCustomers,
            revenueChurn: 0,
            netRevenueRetention: 100 - churnRate,
          };
        }
      })(),
      ltv: {
        average: Math.round(ltvValue * 100) / 100,
        median: Math.round(ltvMedian * 100) / 100,
        byPlan: ltvByPlanAvg,
        projected: Math.round(ltvValue * 1.1 * 100) / 100,
      },
      // ADMIN FIX: Derive acquisition channels from registration data
      acquisition: await (async () => {
        try {
          // Count users by registration method
          const [oauthUsers, referredUsers] = await Promise.all([
            this.prisma.oAuthAccount.groupBy({
              by: ['provider'],
              _count: true,
            }),
            this.prisma.referral.count({
              where: { status: ReferralStatus.COMPLETED },
            }),
          ]);

          const oauthTotal = oauthUsers.reduce((sum, g) => sum + g._count, 0);
          const organicCount = Math.max(0, totalCustomers - oauthTotal - referredUsers);

          const byChannel: Record<string, number> = { organic: organicCount };
          for (const g of oauthUsers) {
            byChannel[g.provider] = g._count;
          }
          if (referredUsers > 0) {
            byChannel['referral'] = referredUsers;
          }

          // CAC requires marketing spend data which is not tracked yet
          return {
            cac: null as number | null, // N/A until marketing spend is tracked
            paybackPeriod: null as number | null,
            ltvCacRatio: null as number | null,
            byChannel,
          };
        } catch {
          return { cac: null, paybackPeriod: null, ltvCacRatio: null, byChannel: {} };
        }
      })(),
      recentActivity,
      recentCustomers,
      revenueChart,
      planDistribution,
      acquisitionChannels: await (async () => {
        try {
          const oauthGroups = await this.prisma.oAuthAccount.groupBy({
            by: ['provider'],
            _count: true,
          });
          const referredCount = await this.prisma.referral.count({
            where: { status: ReferralStatus.COMPLETED },
          });
          const oauthTotal = oauthGroups.reduce((sum, g) => sum + g._count, 0);
          const channels = [
            { channel: 'Organic', count: Math.max(0, totalCustomers - oauthTotal - referredCount), cac: null as number | null },
            ...oauthGroups.map(g => ({ channel: g.provider.charAt(0).toUpperCase() + g.provider.slice(1), count: g._count, cac: null as number | null })),
          ];
          if (referredCount > 0) {
            channels.push({ channel: 'Referral', count: referredCount, cac: null });
          }
          return channels.filter(c => c.count > 0);
        } catch {
          return totalCustomers > 0 ? [{ channel: 'Organic', count: totalCustomers, cac: null }] : [];
        }
      })(),
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
        take: 100,
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
      take: 100,
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
      // ADMIN FIX: Calculate actual revenue per plan (subscribers * monthly price)
      revenueByPlan: Object.fromEntries(
        Object.entries(subscribersByPlan).map(([plan, count]) => [
          plan,
          count * getPlanPrice(plan),
        ]),
      ),
      // ADMIN FIX: Calculate churn revenue from cancelled subscriptions
      churnRevenue: brands
        .filter(b => b.subscriptionStatus === SubscriptionStatus.CANCELED)
        .reduce((sum, b) => sum + getPlanPrice(b.subscriptionPlan), 0),
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
      const defaultAdminPw = this.configService.get<string>('ADMIN_DEFAULT_PASSWORD');
      const nodeEnv = this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
      if (!defaultAdminPw && nodeEnv === 'production') {
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
      const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (!adminEmail && nodeEnv === 'production') {
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`❌ Failed to create admin: ${message}`);
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
      take: 1000,
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

  // ========================================
  // SETTINGS
  // ========================================

  private static readonly SETTINGS_PREFIX = 'platform:settings:';

  /**
   * Get all platform settings
   */
  async getSettings() {
    const configs = await this.prisma.systemConfig.findMany({
      where: { key: { startsWith: AdminService.SETTINGS_PREFIX } },
      take: 100,
    });

    const settings: Record<string, string | boolean | number> = {
      enforce2FA: false,
      sessionTimeout: 30,
      ipWhitelist: '',
      emailNotifications: true,
      webhookAlerts: true,
      maintenanceMode: false,
      platformName: 'Luneo',
      defaultLanguage: 'fr',
      timezone: 'Europe/Paris',
    };

    for (const config of configs) {
      const key = config.key.replace(AdminService.SETTINGS_PREFIX, '');
      try {
        settings[key] = JSON.parse(config.value);
      } catch {
        settings[key] = config.value;
      }
    }

    return { settings };
  }

  /**
   * Update platform settings
   */
  async updateSettings(updates: Record<string, unknown>) {
    const validKeys = [
      'enforce2FA', 'sessionTimeout', 'ipWhitelist',
      'emailNotifications', 'webhookAlerts', 'maintenanceMode',
      'platformName', 'defaultLanguage', 'timezone',
    ];

    const updated: string[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (!validKeys.includes(key)) continue;

      const configKey = `${AdminService.SETTINGS_PREFIX}${key}`;
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

      await this.prisma.systemConfig.upsert({
        where: { key: configKey },
        create: { key: configKey, value: stringValue, description: `Platform setting: ${key}` },
        update: { value: stringValue },
      });

      updated.push(key);
    }

    this.logger.log(`Updated platform settings: ${updated.join(', ')}`);
    return { success: true, updated };
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
    options?: Record<string, unknown>,
  ) {
    this.logger.log(`Bulk action: ${action} on ${customerIds.length} customers`);

    switch (action) {
      case 'email':
        return this.bulkSendEmail(customerIds, options);
      case 'export':
        return this.bulkExportCustomers(customerIds);
      case 'tag':
        return this.bulkTagCustomers(customerIds, Array.isArray(options?.tags) ? options.tags : []);
      case 'segment':
        return this.bulkSegmentCustomers(customerIds, typeof options?.segmentId === 'string' ? options.segmentId : undefined);
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

  // ========================================
  // DISCOUNT CODES MANAGEMENT
  // ========================================

  async getDiscounts(options?: { page?: number; limit?: number; isActive?: boolean }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.DiscountWhereInput = {};
    if (options?.isActive !== undefined) where.isActive = options.isActive;

    const [discounts, total] = await Promise.all([
      this.prisma.discount.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.discount.count({ where }),
    ]);

    return { discounts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createDiscount(data: {
    code: string;
    type: string;
    value: number;
    minPurchaseCents?: number;
    maxDiscountCents?: number;
    validFrom?: string | Date;
    validUntil?: string | Date;
    usageLimit?: number;
    isActive?: boolean;
    brandId?: string;
    description?: string;
  }) {
    const code = data.code.toUpperCase().trim();

    // Check uniqueness
    const existing = await this.prisma.discount.findUnique({ where: { code } });
    if (existing) {
      throw new Error(`Discount code "${code}" already exists`);
    }

    const discountType = data.type.toUpperCase() === 'FIXED' ? 'FIXED' : 'PERCENTAGE';

    return this.prisma.discount.create({
      data: {
        code,
        type: discountType as DiscountType,
        value: data.value,
        minPurchaseCents: data.minPurchaseCents ?? 0,
        maxDiscountCents: data.maxDiscountCents,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: data.usageLimit,
        usageCount: 0,
        isActive: data.isActive ?? true,
        brandId: data.brandId,
        description: data.description,
      },
    });
  }

  async updateDiscount(id: string, data: Record<string, unknown>) {
    return this.prisma.discount.update({
      where: { id },
      data: data as Prisma.DiscountUpdateInput,
    });
  }

  async deleteDiscount(id: string) {
    return this.prisma.discount.delete({ where: { id } });
  }

  // ========================================
  // REFERRAL / COMMISSIONS MANAGEMENT
  // ========================================

  async getReferrals(options?: { page?: number; limit?: number; status?: string }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.ReferralWhereInput = {};
    if (options?.status) where.status = options.status as ReferralStatus;

    const [referrals, total] = await Promise.all([
      this.prisma.referral.findMany({
        where,
        include: {
          referrer: { select: { id: true, firstName: true, lastName: true, email: true } },
          referredUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.referral.count({ where }),
    ]);

    return { referrals, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getCommissions(options?: { page?: number; limit?: number; status?: string }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.CommissionWhereInput = {};
    if (options?.status) where.status = options.status as CommissionStatus;

    const [commissions, total] = await Promise.all([
      this.prisma.commission.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          referral: { select: { id: true, referralCode: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.commission.count({ where }),
    ]);

    return { commissions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async approveCommission(commissionId: string) {
    return this.prisma.commission.update({
      where: { id: commissionId },
      data: { status: 'APPROVED' },
    });
  }

  async markCommissionPaid(commissionId: string) {
    return this.prisma.commission.update({
      where: { id: commissionId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async rejectCommission(commissionId: string) {
    return this.prisma.commission.update({
      where: { id: commissionId },
      data: { status: 'CANCELLED' },
    });
  }

  // ========================================
  // SUPPORT - AGENT ASSIGNMENT & TICKETS
  // ========================================

  async getAllTickets(options?: { page?: number; limit?: number; status?: string; assignedTo?: string }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {};
    if (options?.status) where.status = options.status as TicketStatus;
    if (options?.assignedTo) where.assignedTo = options.assignedTo;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { tickets, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async assignTicket(ticketId: string, agentId: string) {
    const agent = await this.prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) throw new Error('Agent not found');

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assignedTo: agentId },
    });

    // Create activity
    await this.prisma.ticketActivity.create({
      data: {
        ticketId,
        action: 'assigned',
        userId: agentId,
        newValue: `Assigned to ${agent.firstName || agent.email}`,
      },
    });

    return updated;
  }

  async addAgentReply(ticketId: string, agentId: string, content: string) {
    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        userId: agentId,
        content,
        type: 'AGENT',
      },
    });

    // Update ticket
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    // Create activity
    await this.prisma.ticketActivity.create({
      data: {
        ticketId,
        action: 'message_added',
        userId: agentId,
        newValue: 'Staff reply added',
      },
    });

    return message;
  }

  async updateTicketStatus(ticketId: string, status: string, agentId: string) {
    const data: Prisma.TicketUpdateInput = { status: status as TicketStatus };
    if (status === 'RESOLVED') data.resolvedAt = new Date();
    if (status === 'CLOSED') data.closedAt = new Date();

    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data,
    });

    await this.prisma.ticketActivity.create({
      data: {
        ticketId,
        action: 'status_changed',
        userId: agentId,
        oldValue: 'previous',
        newValue: status,
      },
    });

    return ticket;
  }

  // ========================================
  // WEBHOOKS MANAGEMENT (Admin)
  // ========================================

  async getWebhooks(params: { page?: number; limit?: number; brandId?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.WebhookWhereInput = {};
    if (params.brandId) where.brandId = params.brandId;

    const [webhooks, total] = await Promise.all([
      this.prisma.webhook.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { id: true, name: true } },
        },
      }),
      this.prisma.webhook.count({ where }),
    ]);

    return {
      data: webhooks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getWebhookById(id: string) {
    const webhook = await this.prisma.webhook.findUnique({
      where: { id },
      include: {
        brand: { select: { id: true, name: true } },
        webhookLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');
    return webhook;
  }

  async createWebhook(data: {
    brandId: string;
    name: string;
    url: string;
    events?: string[];
    isActive?: boolean;
  }) {
    const { randomBytes } = await import('crypto');
    const secret = randomBytes(32).toString('hex');

    return this.prisma.webhook.create({
      data: {
        brandId: data.brandId,
        name: data.name,
        url: data.url,
        secret,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateWebhook(id: string, data: Record<string, unknown>) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook not found');

    const updateData: Prisma.WebhookUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name as string;
    if (data.url !== undefined) updateData.url = data.url as string;
    if (data.isActive !== undefined) updateData.isActive = data.isActive as boolean;

    return this.prisma.webhook.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteWebhook(id: string) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook not found');

    await this.prisma.webhook.delete({ where: { id } });
    return { success: true, message: 'Webhook deleted' };
  }

  async testWebhook(id: string) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook not found');

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'webhook.test',
          timestamp: new Date().toISOString(),
          data: { message: 'Test webhook from Luneo admin' },
        }),
      });

      return {
        success: response.ok,
        statusCode: response.status,
        message: response.ok ? 'Webhook test successful' : `Webhook returned ${response.status}`,
      };
    } catch (error) {
      return {
        success: false,
        statusCode: null,
        message: `Failed to reach webhook URL: ${(error as Error).message}`,
      };
    }
  }

  // ========================================
  // EVENTS (Admin)
  // ========================================

  async getEvents(params: { days?: number; type?: string; page?: number; limit?: number }) {
    const days = params.days || 30;
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: Prisma.EventWhereInput = {
      createdAt: { gte: since },
    };
    if (params.type) where.type = params.type;

    const [events, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              userId: true,
              user: { select: { email: true, firstName: true, lastName: true } },
            },
          },
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      data: events,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ========================================
  // TENANT FEATURES (Admin)
  // ========================================

  async getTenantFeatures(brandId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        name: true,
        plan: true,
        subscriptionPlan: true,
        maxProducts: true,
        maxMonthlyGenerations: true,
        aiCostLimitCents: true,
        aiCostUsedCents: true,
        monthlyGenerations: true,
      },
    });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  async updateTenantFeatures(
    brandId: string,
    features: Record<string, unknown>,
  ) {
    const brand = await this.prisma.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new NotFoundException('Brand not found');

    const updateData: Prisma.BrandUpdateInput = {};
    if (features.maxProducts !== undefined) updateData.maxProducts = features.maxProducts as number;
    if (features.maxMonthlyGenerations !== undefined) updateData.maxMonthlyGenerations = features.maxMonthlyGenerations as number;
    if (features.aiCostLimitCents !== undefined) updateData.aiCostLimitCents = features.aiCostLimitCents as number;

    return this.prisma.brand.update({
      where: { id: brandId },
      data: updateData,
    });
  }
}
