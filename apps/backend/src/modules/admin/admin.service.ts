import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Injectable, Logger, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma, Plan, OrgStatus, PlatformRole, TicketStatus, InvoiceStatus } from '@prisma/client';
import { EmailService } from '@/modules/email/email.service';
import { BillingService } from '@/modules/billing/billing.service';
import { AuditLogsService, AuditEventType } from '@/modules/security/services/audit-logs.service';
import { PLAN_CONFIGS } from '@/libs/plans/plan-config';
import { PlanTier } from '@/libs/plans/plan-config.types';

function getPlanPrice(plan: Plan | string | null | undefined): number {
  if (!plan) return 0;
  const tierMap: Record<string, PlanTier> = {
    FREE: PlanTier.FREE,
    STARTER: PlanTier.PRO, // backward compat
    PRO: PlanTier.PRO,
    PROFESSIONAL: PlanTier.PRO, // backward compat
    BUSINESS: PlanTier.BUSINESS,
    ENTERPRISE: PlanTier.ENTERPRISE,
  };
  const tier = tierMap[String(plan).toUpperCase()];
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
    @Optional() private readonly auditLogService?: AuditLogsService,
  ) {}

  // ========================================
  // TENANTS (ORGANIZATIONS)
  // ========================================

  async getTenants(params?: { page?: number; limit?: number; search?: string; plan?: string; status?: string; sortBy?: string; sortOrder?: 'asc' | 'desc' }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;
    const sortBy = params?.sortBy || 'createdAt';
    const sortOrder = params?.sortOrder || 'desc';

    const where: Prisma.OrganizationWhereInput = {};
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params?.plan) where.plan = params.plan as Plan;
    if (params?.status) where.status = params.status as OrgStatus;

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
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
          status: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          currentMonthSpend: true,
          monthlyBudgetLimit: true,
          conversationsUsed: true,
          conversationsLimit: true,
          agentsUsed: true,
          agentsLimit: true,
          planPeriodEnd: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              members: true,
              agents: true,
              conversations: true,
            },
          },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      brands: organizations.map((o) => ({
        ...o,
        plan: o.plan || 'FREE',
        status: o.status || 'ACTIVE',
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      tenants: organizations.map((o) => ({
        id: o.id,
        name: o.name || 'Unnamed Tenant',
        plan: o.plan || 'FREE',
        status: o.status || 'ACTIVE',
      })),
    };
  }

  async suspendBrand(brandId: string, reason?: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: brandId } });
    if (!org) throw new NotFoundException(`Organization ${brandId} not found`);

    await this.prisma.organization.update({
      where: { id: brandId },
      data: { status: OrgStatus.SUSPENDED, suspendedAt: new Date(), suspendedReason: reason },
    });

    this.logger.warn(`Organization ${brandId} (${org.name}) suspended. Reason: ${reason || 'No reason provided'}`);

    return {
      success: true,
      brandId,
      status: 'SUSPENDED',
      reason: reason || null,
      suspendedAt: new Date().toISOString(),
    };
  }

  async unsuspendBrand(brandId: string) {
    const org = await this.prisma.organization.findUnique({ where: { id: brandId } });
    if (!org) throw new NotFoundException(`Organization ${brandId} not found`);

    await this.prisma.organization.update({
      where: { id: brandId },
      data: { status: OrgStatus.ACTIVE, suspendedAt: null, suspendedReason: null },
    });

    this.logger.log(`Organization ${brandId} (${org.name}) unsuspended.`);

    return {
      success: true,
      brandId,
      status: 'ACTIVE',
      unsuspendedAt: new Date().toISOString(),
    };
  }

  async banUser(userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
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

  async unbanUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User ${userId} not found`);

    await this.prisma.user.update({
      where: { id: userId },
      data: { deletedAt: null },
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

  async getBrandDetail(brandId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: brandId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                lastLoginAt: true,
                deletedAt: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            agents: true,
            conversations: true,
            invoices: true,
          },
        },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization ${brandId} not found`);
    }

    return {
      ...org,
      users: org.members.map((m) => ({
        ...m.user,
        orgRole: m.role,
        isActive: m.user.deletedAt === null,
      })),
    };
  }

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
    const org = await this.prisma.organization.findUnique({ where: { id: brandId } });
    if (!org) throw new NotFoundException(`Organization ${brandId} not found`);

    const newPlan = data.subscriptionPlan ?? data.plan;
    const planChanged =
      newPlan !== undefined &&
      newPlan !== null &&
      String(newPlan).toUpperCase() !== String(org.plan).toUpperCase();

    if (data.syncStripe === true && planChanged && newPlan) {
      const orgMember = await this.prisma.organizationMember.findFirst({
        where: { organizationId: brandId },
        select: { userId: true },
      });
      if (orgMember) {
        try {
          await this.billingService.changePlan(orgMember.userId, String(newPlan).toLowerCase(), {
            immediateChange: true,
          });
          this.logger.log(`Stripe plan synced for org ${brandId} -> ${newPlan}`);
        } catch (err) {
          this.logger.warn(
            `Stripe sync failed for org ${brandId} (plan ${newPlan}): ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      } else {
        this.logger.warn(`Stripe sync skipped for org ${brandId}: no member found`);
      }
    }

    const updateData: Prisma.OrganizationUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.status !== undefined) updateData.status = data.status as OrgStatus;
    if (newPlan !== undefined) updateData.plan = newPlan.toUpperCase() as Plan;
    if (data.country !== undefined) updateData.country = data.country;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.vatNumber !== undefined) updateData.taxId = data.vatNumber;
    if (data.maxMonthlyGenerations !== undefined) updateData.conversationsLimit = data.maxMonthlyGenerations;
    if (data.aiCostLimitCents !== undefined) updateData.monthlyBudgetLimit = data.aiCostLimitCents / 100;

    const updated = await this.prisma.organization.update({
      where: { id: brandId },
      data: updateData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                lastLoginAt: true,
                deletedAt: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            agents: true,
            conversations: true,
            invoices: true,
          },
        },
      },
    });

    this.logger.log(`Organization ${brandId} updated by admin`);

    try {
      const auditAction = planChanged
        ? AuditEventType.BILLING_UPDATED
        : AuditEventType.BRAND_UPDATED;

      await this.auditLogService?.logSuccess(auditAction, 'admin.org.update', {
        resourceType: 'Organization',
        resourceId: brandId,
        metadata: {
          changes: Object.keys(updateData),
          previousPlan: org.plan,
          newPlan: newPlan || org.plan,
          planChanged,
          syncedToStripe: data.syncStripe === true && planChanged,
        },
      });
    } catch (auditError) {
      this.logger.warn(`Failed to write audit log for org update: ${auditError instanceof Error ? auditError.message : String(auditError)}`);
    }

    return updated;
  }

  // ========================================
  // CUSTOMER MANAGEMENT
  // ========================================

  async getCustomers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const { search, role, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role as PlatformRole;
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
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          memberships: {
            select: {
              organization: {
                select: { id: true, name: true, plan: true, status: true },
              },
              role: true,
            },
            take: 1,
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: customers.map((user) => {
        const membership = user.memberships[0];
        const org = membership?.organization;

        let status: string = 'active';
        if (org?.status === OrgStatus.TRIAL) status = 'trial';
        else if (user.lastLoginAt && Date.now() - new Date(user.lastLoginAt).getTime() > 30 * 24 * 60 * 60 * 1000) status = 'churned';
        else if (user.lastLoginAt && Date.now() - new Date(user.lastLoginAt).getTime() > 14 * 24 * 60 * 60 * 1000) status = 'at-risk';
        else if (!user.lastLoginAt) status = 'none';

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          isActive: user.deletedAt === null,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt,
          brand: org ? { id: org.id, name: org.name, plan: org.plan, status: org.status } : null,
          ltv: 0,
          totalRevenue: 0,
          engagementScore: 0,
          churnRisk: 'low',
          totalSessions: 0,
          totalTimeSpent: 0,
          lastSeenAt: user.lastLoginAt,
          status,
          planPrice: getPlanPrice(org?.plan),
          plan: org?.plan ? String(org.plan) : 'FREE',
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
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        memberships: {
          select: {
            organization: {
              select: { id: true, name: true, plan: true, status: true },
            },
            role: true,
          },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    const membership = user.memberships[0];
    const org = membership?.organization;

    let status: string = 'active';
    if (org?.status === OrgStatus.TRIAL) status = 'trial';
    else if (user.lastLoginAt && Date.now() - new Date(user.lastLoginAt).getTime() > 30 * 24 * 60 * 60 * 1000) status = 'churned';
    else if (user.lastLoginAt && Date.now() - new Date(user.lastLoginAt).getTime() > 14 * 24 * 60 * 60 * 1000) status = 'at-risk';
    else if (!user.lastLoginAt) status = 'none';

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.deletedAt === null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      brand: org ? { id: org.id, name: org.name, plan: org.plan, status: org.status } : null,
      ltv: 0,
      totalRevenue: 0,
      engagementScore: 0,
      churnRisk: 'low',
      totalSessions: 0,
      totalTimeSpent: 0,
      lastSeenAt: user.lastLoginAt,
      status,
      planPrice: getPlanPrice(org?.plan),
      plan: org?.plan ? String(org.plan) : 'FREE',
      name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
    };
  }

  // ========================================
  // CREATE / UPDATE CUSTOMER (Admin)
  // ========================================

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

    const nameParts = (data.name || '').split(' ');
    const firstName = nameParts[0] || undefined;
    const lastName = nameParts.slice(1).join(' ') || undefined;

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        firstName,
        lastName,
        role: PlatformRole.USER,
        emailVerified: true,
        ...(data.password ? { passwordHash: await bcrypt.hash(data.password, 13) } : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        deletedAt: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (data.brandId) {
      const org = await this.prisma.organization.findUnique({ where: { id: data.brandId } });
      if (org) {
        await this.prisma.organizationMember.create({
          data: { organizationId: data.brandId, userId: user.id, role: 'MEMBER' },
        });
      }
    }

    this.logger.log(`Admin created user ${user.id} (${user.email})`);
    return { ...user, isActive: user.deletedAt === null, brandId: data.brandId || null };
  }

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
    const updateData: Prisma.UserUpdateInput = {};
    if (data.name !== undefined) {
      updateData.firstName = nameParts[0] || undefined;
      updateData.lastName = nameParts.slice(1).join(' ') || undefined;
    }
    if (data.role !== undefined) updateData.role = data.role as PlatformRole;
    if (data.isActive !== undefined) updateData.deletedAt = data.isActive ? null : new Date();

    const user = await this.prisma.user.update({
      where: { id: customerId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        deletedAt: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (data.brandId !== undefined) {
      await this.prisma.organizationMember.deleteMany({ where: { userId: customerId } });
      if (data.brandId) {
        await this.prisma.organizationMember.create({
          data: { organizationId: data.brandId, userId: customerId, role: 'MEMBER' },
        });
      }
    }

    this.logger.log(`Admin updated user ${user.id}`);
    return { ...user, isActive: user.deletedAt === null };
  }

  async createBrand(data: { name: string; slug: string; userId: string }) {
    const existingSlug = await this.prisma.organization.findUnique({ where: { slug: data.slug } });
    if (existingSlug) {
      throw new BadRequestException(`Organization with slug "${data.slug}" already exists`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: data.userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${data.userId} not found`);
    }

    const org = await this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        members: {
          create: { userId: data.userId, role: 'OWNER' },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
      },
    });

    this.logger.log(`Admin created organization ${org.id} (${org.name}) for user ${data.userId}`);
    return org;
  }

  // ========================================
  // ANALYTICS
  // ========================================

  async getAnalyticsOverview() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const nonAdminWhere: Prisma.UserWhereInput = { role: { not: PlatformRole.ADMIN } };

    const [
      totalCustomers,
      newCustomersLast30Days,
      totalConversations,
      conversationsLast30Days,
      activeOrgs,
      canceledOrgs,
      recentUsersForCustomers,
      usersCreatedForChart,
      planDistributionRaw,
      allActiveOrgs,
    ] = await Promise.all([
      this.prisma.user.count({ where: nonAdminWhere }),
      this.prisma.user.count({
        where: { ...nonAdminWhere, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.conversation.count(),
      this.prisma.conversation.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.organization.count({ where: { status: OrgStatus.ACTIVE, deletedAt: null } }),
      this.prisma.organization.count({ where: { status: OrgStatus.CANCELED, deletedAt: null } }),
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
          deletedAt: true,
          createdAt: true,
          memberships: {
            select: { organization: { select: { plan: true, status: true } } },
            take: 1,
          },
        },
      }),
      this.prisma.user.findMany({
        where: { ...nonAdminWhere, createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
        take: 1000,
      }),
      this.prisma.organization.groupBy({
        by: ['plan'],
        where: { deletedAt: null },
        _count: true,
      }),
      this.prisma.organization.findMany({
        where: { status: OrgStatus.ACTIVE, deletedAt: null },
        select: { plan: true },
      }),
    ]);

    const mrr = allActiveOrgs.reduce((sum, o) => sum + getPlanPrice(o.plan), 0);
    const totalOrgs = activeOrgs + canceledOrgs;
    const churnRate = totalOrgs > 0 ? Math.round((canceledOrgs / totalOrgs) * 10000) / 100 : 0;
    const avgRevenuePerUser = totalCustomers > 0 ? mrr / totalCustomers : 0;
    const ltvValue = avgRevenuePerUser * 12;

    const trend = (current: number, previous: number): 'up' | 'down' | 'neutral' =>
      current > previous ? 'up' : current < previous ? 'down' : 'neutral';
    const customerTrend: 'up' | 'down' | 'neutral' = newCustomersLast30Days > 0 ? 'up' : 'neutral';

    const recentActivity = [
      {
        id: 'conv-summary',
        type: 'conversation',
        message: `${conversationsLast30Days} conversations in the last 30 days`,
        timestamp: new Date(),
        metadata: { totalConversations, conversationsLast30Days },
      },
    ];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const thirtyDaysAgoForChurn = new Date();
    thirtyDaysAgoForChurn.setDate(thirtyDaysAgoForChurn.getDate() - 30);

    const recentCustomers = recentUsersForCustomers.map((u) => {
      const org = u.memberships[0]?.organization;
      const planName = org?.plan ? String(org.plan) : null;
      const mrrUser = getPlanPrice(org?.plan);
      const lastLogin = u.lastLoginAt ?? null;
      let status: 'active' | 'trial' | 'churned' | 'at-risk' = 'active';
      if (org?.status === OrgStatus.TRIAL) status = 'trial';
      else if (lastLogin && lastLogin < thirtyDaysAgoForChurn) status = 'churned';
      else if (lastLogin && lastLogin < fourteenDaysAgo) status = 'at-risk';
      else if (lastLogin && lastLogin >= sevenDaysAgo) status = 'active';
      else if (u.deletedAt === null) status = 'active';
      else status = 'at-risk';

      return {
        id: u.id,
        name: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email,
        email: u.email,
        avatar: u.avatar ?? null,
        plan: planName,
        mrr: Math.round(mrrUser * 100) / 100,
        ltv: Math.round(mrrUser * 12 * 100) / 100,
        status,
        customerSince: u.createdAt,
      };
    });

    const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const revenueByMonth: Record<string, { revenue: number; newCustomers: number }> = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      revenueByMonth[monthKey(d)] = { revenue: mrr, newCustomers: 0 };
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

    const planDistribution = planDistributionRaw.map((g) => ({
      name: String(g.plan),
      count: g._count,
      mrr: Math.round(g._count * getPlanPrice(g.plan) * 100) / 100,
    }));

    const churnRevenue = canceledOrgs > 0
      ? await (async () => {
          const canceledOrgPlans = await this.prisma.organization.findMany({
            where: { status: OrgStatus.CANCELED, deletedAt: null },
            select: { plan: true },
          });
          return canceledOrgPlans.reduce((sum, o) => sum + getPlanPrice(o.plan), 0);
        })()
      : 0;

    const nrr = mrr > 0 ? Math.round(((mrr - churnRevenue) / mrr) * 10000) / 100 : 100;

    return {
      kpis: {
        mrr: {
          value: Math.round(mrr * 100) / 100,
          change: 0,
          changePercent: 0,
          trend: 'neutral' as const,
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
        mrrGrowth: 0,
        mrrGrowthPercent: 0,
        totalRevenue: Math.round(mrr * 100) / 100,
        avgRevenuePerUser: Math.round(avgRevenuePerUser * 100) / 100,
      },
      churn: {
        rate: churnRate,
        count: canceledOrgs,
        revenueChurn: Math.round(churnRevenue * 100) / 100,
        netRevenueRetention: nrr,
      },
      ltv: {
        average: Math.round(ltvValue * 100) / 100,
        median: Math.round(ltvValue * 100) / 100,
        byPlan: Object.fromEntries(
          planDistribution.map((p) => [p.name, p.count > 0 ? Math.round((p.mrr / p.count) * 12 * 100) / 100 : 0]),
        ),
        projected: Math.round(ltvValue * 1.1 * 100) / 100,
      },
      acquisition: await (async () => {
        try {
          const oauthUsers = await this.prisma.oAuthAccount.groupBy({
            by: ['provider'],
            _count: true,
          });
          const oauthTotal = oauthUsers.reduce((sum, g) => sum + g._count, 0);
          const organicCount = Math.max(0, totalCustomers - oauthTotal);
          const byChannel: Record<string, number> = { organic: organicCount };
          for (const g of oauthUsers) {
            byChannel[g.provider] = g._count;
          }
          return { cac: null, paybackPeriod: null, ltvCacRatio: null, byChannel };
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
          const oauthTotal = oauthGroups.reduce((sum, g) => sum + g._count, 0);
          const channels = [
            { channel: 'Organic', count: Math.max(0, totalCustomers - oauthTotal), cac: null as number | null },
            ...oauthGroups.map((g) => ({
              channel: g.provider.charAt(0).toUpperCase() + g.provider.slice(1),
              count: g._count,
              cac: null as number | null,
            })),
          ];
          return channels.filter((c) => c.count > 0);
        } catch {
          return totalCustomers > 0 ? [{ channel: 'Organic', count: totalCustomers, cac: null }] : [];
        }
      })(),
    };
  }

  async getRevenueMetrics(period: string = '30d') {
    const activeOrgs = await this.prisma.organization.findMany({
      where: { status: OrgStatus.ACTIVE, deletedAt: null },
      select: { plan: true },
    });

    const mrr = activeOrgs.reduce((sum, o) => sum + getPlanPrice(o.plan), 0);
    const arr = mrr * 12;

    return {
      totalRevenue: Math.round(mrr * 100) / 100,
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      orderCount: activeOrgs.length,
      averageOrderValue: activeOrgs.length > 0 ? mrr / activeOrgs.length : 0,
      period,
    };
  }

  async exportData(format: 'csv' | 'pdf', type: 'customers' | 'analytics' | 'conversations') {
    if (type === 'customers') {
      const customers = await this.prisma.user.findMany({
        where: { role: { not: PlatformRole.ADMIN } },
        take: 100,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          memberships: {
            select: { organization: { select: { name: true, plan: true } } },
            take: 1,
          },
        },
      });

      if (format === 'csv') {
        const headers = ['id', 'email', 'firstName', 'lastName', 'role', 'orgName', 'plan', 'createdAt'];
        const rows = customers.map((c) => [
          c.id,
          c.email,
          c.firstName || '',
          c.lastName || '',
          c.role,
          c.memberships[0]?.organization?.name || '',
          c.memberships[0]?.organization?.plan || 'FREE',
          c.createdAt.toISOString(),
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        return { content: csv, contentType: 'text/csv', filename: `customers-${Date.now()}.csv` };
      }

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

    if (type === 'conversations') {
      // TODO: V2 has no Order model — export conversations instead
      const conversations = await this.prisma.conversation.findMany({
        take: 1000,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          visitorEmail: true,
          status: true,
          messageCount: true,
          createdAt: true,
        },
      });

      if (format === 'csv') {
        const headers = ['id', 'visitorEmail', 'status', 'messageCount', 'createdAt'];
        const rows = conversations.map((c) => [
          c.id,
          c.visitorEmail || '',
          c.status,
          String(c.messageCount),
          c.createdAt.toISOString(),
        ]);
        const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        return { content: csv, contentType: 'text/csv', filename: `conversations-${Date.now()}.csv` };
      }

      return {
        content: Buffer.from(JSON.stringify(conversations, null, 2)).toString('base64'),
        contentType: 'application/pdf',
        filename: `conversations-${Date.now()}.pdf`,
      };
    }

    throw new BadRequestException(`Unknown export type: ${type}`);
  }

  // ========================================
  // BILLING
  // ========================================

  async getBillingOverview() {
    const orgs = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        plan: true,
        status: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        planPeriodEnd: true,
        createdAt: true,
      },
    });

    const subscribersByPlan: Record<string, number> = {};
    let activeSubscriptions = 0;
    let trialSubscriptions = 0;
    let cancelledSubscriptions = 0;

    for (const org of orgs) {
      const plan = org.plan || 'FREE';
      subscribersByPlan[plan] = (subscribersByPlan[plan] || 0) + 1;

      if (org.status === OrgStatus.ACTIVE) activeSubscriptions++;
      else if (org.status === OrgStatus.TRIAL) trialSubscriptions++;
      else if (org.status === OrgStatus.CANCELED) cancelledSubscriptions++;
    }

    const recentInvoices = await this.prisma.invoice.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { name: true } },
      },
    });

    const mrr = orgs
      .filter((o) => o.status === OrgStatus.ACTIVE)
      .reduce((sum, o) => sum + getPlanPrice(o.plan), 0);
    const arr = mrr * 12;

    const totalRevenue = recentInvoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.total, 0);

    return {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      subscribersByPlan,
      revenueByPlan: Object.fromEntries(
        Object.entries(subscribersByPlan).map(([plan, count]) => [plan, count * getPlanPrice(plan)]),
      ),
      churnRevenue: orgs
        .filter((o) => o.status === OrgStatus.CANCELED)
        .reduce((sum, o) => sum + getPlanPrice(o.plan), 0),
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        brandName: inv.organization?.name || 'Unknown',
        amount: inv.total,
        currency: inv.currency,
        status: inv.status,
        paidAt: inv.paidAt?.toISOString() || null,
        createdAt: inv.createdAt.toISOString(),
      })),
    };
  }

  async getMetrics() {
    const [totalUsers, totalOrganizations, totalAgents, totalConversations, totalMessages] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.organization.count(),
      this.prisma.agent.count(),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
    ]);

    return {
      totalUsers,
      totalOrganizations,
      totalAgents,
      totalConversations,
      totalMessages,
      timestamp: new Date().toISOString(),
    };
  }

  async createAdminUser() {
    try {
      const defaultAdminPw = this.configService.get<string>('ADMIN_DEFAULT_PASSWORD');
      const nodeEnv = this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
      if (!defaultAdminPw && nodeEnv === 'production') {
        throw new Error('ADMIN_DEFAULT_PASSWORD must be set in production');
      }
      let passwordToHash = defaultAdminPw;
      if (!passwordToHash) {
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
          passwordHash: adminPassword,
          firstName: 'Admin',
          lastName: 'Luneo',
          role: PlatformRole.ADMIN,
          emailVerified: true,
        },
      });

      this.logger.log(`Admin user created/verified: ${adminUser.email}`);
      return {
        success: true,
        message: 'Admin user created successfully',
        email: adminUser.email,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create admin: ${message}`);
      throw error;
    }
  }

  async getAICosts(_period: string = '30d') {
    // TODO: V2 uses UsageRecord instead of AICost — implement when usage tracking is wired
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    try {
      const records = await this.prisma.usageRecord.findMany({
        where: { createdAt: { gte: startDate } },
        take: 1000,
        select: {
          id: true,
          organizationId: true,
          type: true,
          quantity: true,
          createdAt: true,
          organization: { select: { id: true, name: true, logo: true } },
        },
      });

      const totalCost = records.reduce((sum, r) => sum + r.quantity, 0);
      const costsByProvider: Record<string, number> = {};
      for (const r of records) {
        costsByProvider[r.type] = (costsByProvider[r.type] || 0) + r.quantity;
      }

      return { totalCost, costsByProvider, costs: records, period: _period };
    } catch {
      return { totalCost: 0, costsByProvider: {}, costs: [], period: _period };
    }
  }

  // ========================================
  // SETTINGS
  // ========================================

  private static readonly SETTINGS_PREFIX = 'platform:settings:';

  async getSettings() {
    // TODO: V2 has no SystemConfig model — using FeatureFlag.rules as fallback storage
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

    try {
      const flags = await this.prisma.featureFlag.findMany({
        where: { key: { startsWith: AdminService.SETTINGS_PREFIX } },
        take: 100,
      });

      for (const flag of flags) {
        const key = flag.key.replace(AdminService.SETTINGS_PREFIX, '');
        if (flag.rules) {
          try {
            const value = (flag.rules as Record<string, unknown>).value;
            if (value !== undefined) settings[key] = value as string | boolean | number;
          } catch { /* ignore parse errors */ }
        } else {
          settings[key] = flag.enabled;
        }
      }
    } catch {
      this.logger.warn('Could not load settings from FeatureFlag table');
    }

    return { settings };
  }

  async updateSettings(updates: Record<string, unknown>) {
    const validKeys = [
      'enforce2FA', 'sessionTimeout', 'ipWhitelist',
      'emailNotifications', 'webhookAlerts', 'maintenanceMode',
      'platformName', 'defaultLanguage', 'timezone',
    ];

    const updated: string[] = [];

    for (const [key, value] of Object.entries(updates)) {
      if (!validKeys.includes(key)) continue;

      const flagKey = `${AdminService.SETTINGS_PREFIX}${key}`;
      try {
        await this.prisma.featureFlag.upsert({
          where: { key: flagKey },
          create: {
            key: flagKey,
            name: `Platform setting: ${key}`,
            description: `Platform setting: ${key}`,
            enabled: typeof value === 'boolean' ? value : true,
            rules: { value } as Prisma.InputJsonValue,
          },
          update: {
            enabled: typeof value === 'boolean' ? value : true,
            rules: { value } as Prisma.InputJsonValue,
          },
        });
        updated.push(key);
      } catch {
        this.logger.warn(`Failed to persist setting: ${key}`);
      }
    }

    this.logger.log(`Updated platform settings: ${updated.join(', ')}`);
    return { success: true, updated };
  }

  private static readonly BLACKLIST_CONFIG_KEY = 'ai:blacklisted_prompts';

  async addBlacklistedPrompt(term: string) {
    const normalized = term.toLowerCase().trim();
    if (!normalized) throw new BadRequestException('Term cannot be empty');
    const terms = await this.getBlacklistedPrompts();
    const set = new Set(terms);
    set.add(normalized);
    await this.persistBlacklistedPrompts([...set]);
    this.logger.log(`Added blacklisted prompt term: ${term}`);
    return { message: 'Term added to blacklist', total: set.size };
  }

  async getBlacklistedPrompts(): Promise<string[]> {
    try {
      const flag = await this.prisma.featureFlag.findUnique({
        where: { key: AdminService.BLACKLIST_CONFIG_KEY },
      });
      if (!flag?.rules) return [];
      const rules = flag.rules as Record<string, unknown>;
      return (rules.terms as string[]) ?? [];
    } catch {
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
    await this.prisma.featureFlag.upsert({
      where: { key: AdminService.BLACKLIST_CONFIG_KEY },
      create: {
        key: AdminService.BLACKLIST_CONFIG_KEY,
        name: 'AI blacklisted prompt terms',
        description: 'Content moderation blacklist',
        enabled: true,
        rules: { terms } as Prisma.InputJsonValue,
      },
      update: { rules: { terms } as Prisma.InputJsonValue },
    });
  }

  // ========================================
  // BULK ACTIONS
  // ========================================

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
        return { success: true, message: `Tagged ${customerIds.length} customers`, count: customerIds.length };
      case 'segment':
        // TODO: V2 has no AnalyticsSegment model
        return { success: true, message: `Segment action not available in V2`, count: 0 };
      case 'delete':
        return this.bulkDeleteCustomers(customerIds);
      default:
        throw new BadRequestException(`Unknown bulk action: ${action}`);
    }
  }

  private async bulkSendEmail(customerIds: string[], options?: { subject?: string; template?: string }) {
    const customers = await this.prisma.user.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, email: true, firstName: true, lastName: true },
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
    return { success: true, message: `Email sent to ${customers.length} customers`, count: customers.length };
  }

  private async bulkExportCustomers(customerIds: string[]) {
    const customers = await this.prisma.user.findMany({
      where: { id: { in: customerIds } },
      include: {
        memberships: {
          select: { organization: { select: { plan: true, status: true } } },
          take: 1,
        },
      },
    });

    const csvData = customers.map((c) => ({
      id: c.id,
      email: c.email,
      name: [c.firstName, c.lastName].filter(Boolean).join(' ') || 'N/A',
      plan: c.memberships[0]?.organization?.plan || 'FREE',
      createdAt: c.createdAt.toISOString(),
    }));

    return { success: true, data: csvData, count: customers.length };
  }

  private async bulkDeleteCustomers(customerIds: string[]) {
    await this.prisma.user.updateMany({
      where: { id: { in: customerIds } },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Deleted ${customerIds.length} customers`);
    return { success: true, message: `Deleted ${customerIds.length} customers`, count: customerIds.length };
  }

  // ========================================
  // DISCOUNT CODES MANAGEMENT
  // ========================================

  async getDiscounts(_options?: { page?: number; limit?: number; isActive?: boolean }) {
    // TODO: V2 has no Discount model — e-commerce features removed
    return { discounts: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
  }

  async createDiscount(_data: Record<string, unknown>) {
    // TODO: V2 has no Discount model
    return { message: 'Discount management not available in V2' };
  }

  async updateDiscount(_id: string, _data: Record<string, unknown>) {
    // TODO: V2 has no Discount model
    return { message: 'Discount management not available in V2' };
  }

  async deleteDiscount(_id: string) {
    // TODO: V2 has no Discount model
    return { message: 'Discount management not available in V2' };
  }

  // ========================================
  // REFERRAL / COMMISSIONS MANAGEMENT
  // ========================================

  async getReferrals(_options?: { page?: number; limit?: number; status?: string }) {
    // TODO: V2 has no Referral model
    return { referrals: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
  }

  async getCommissions(_options?: { page?: number; limit?: number; status?: string }) {
    // TODO: V2 has no Commission model
    return { commissions: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
  }

  async approveCommission(_commissionId: string) {
    // TODO: V2 has no Commission model
    return { message: 'Commission management not available in V2' };
  }

  async markCommissionPaid(_commissionId: string) {
    // TODO: V2 has no Commission model
    return { message: 'Commission management not available in V2' };
  }

  async rejectCommission(_commissionId: string) {
    // TODO: V2 has no Commission model
    return { message: 'Commission management not available in V2' };
  }

  // ========================================
  // SUPPORT - TICKETS
  // ========================================

  async getAllTickets(options?: { page?: number; limit?: number; status?: string; assignedTo?: string }) {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {};
    if (options?.status) where.status = options.status as TicketStatus;
    if (options?.assignedTo) where.assignedToId = options.assignedTo;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      tickets: tickets.map((t) => ({
        ...t,
        user: t.createdBy,
        assignedUser: t.assignedTo,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async assignTicket(ticketId: string, agentId: string) {
    const agent = await this.prisma.user.findUnique({ where: { id: agentId } });
    if (!agent) throw new Error('Agent not found');

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { assignedToId: agentId },
    });

    return updated;
  }

  async addAgentReply(ticketId: string, agentId: string, content: string) {
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId },
      select: { firstName: true, email: true },
    });

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        authorId: agentId,
        authorName: agent?.firstName || agent?.email || 'Staff',
        authorEmail: agent?.email,
        isStaff: true,
        content,
      },
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  async updateTicketStatus(ticketId: string, status: string, _agentId: string) {
    const data: Prisma.TicketUpdateInput = { status: status as TicketStatus };
    if (status === 'RESOLVED') data.resolvedAt = new Date();
    if (status === 'CLOSED') data.closedAt = new Date();

    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data,
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
    if (params.brandId) where.organizationId = params.brandId;

    const [webhooks, total] = await Promise.all([
      this.prisma.webhook.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: { select: { id: true, name: true } },
        },
      }),
      this.prisma.webhook.count({ where }),
    ]);

    return {
      data: webhooks.map((w) => ({
        ...w,
        brand: w.organization,
        brandId: w.organizationId,
        isActive: w.status === 'ACTIVE',
      })),
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
        organization: { select: { id: true, name: true } },
        logs: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!webhook) throw new NotFoundException('Webhook not found');
    return { ...webhook, brand: webhook.organization, brandId: webhook.organizationId };
  }

  async createWebhook(data: {
    brandId: string;
    name?: string;
    url: string;
    events?: string[];
    isActive?: boolean;
  }) {
    const { randomBytes } = await import('crypto');
    const secret = randomBytes(32).toString('hex');

    return this.prisma.webhook.create({
      data: {
        organizationId: data.brandId,
        url: data.url,
        events: data.events ?? [],
        secret,
        status: data.isActive === false ? 'PAUSED' : 'ACTIVE',
      },
    });
  }

  async updateWebhook(id: string, data: Record<string, unknown>) {
    const webhook = await this.prisma.webhook.findUnique({ where: { id } });
    if (!webhook) throw new NotFoundException('Webhook not found');

    const updateData: Prisma.WebhookUpdateInput = {};
    if (data.url !== undefined) updateData.url = data.url as string;
    if (data.isActive !== undefined) updateData.status = (data.isActive as boolean) ? 'ACTIVE' : 'PAUSED';
    if (data.events !== undefined) updateData.events = data.events as string[];

    return this.prisma.webhook.update({ where: { id }, data: updateData });
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

  async getEvents(_params: { days?: number; type?: string; page?: number; limit?: number }) {
    // TODO: V2 has no Event model — use AuditLog as proxy
    const days = _params.days || 30;
    const page = _params.page || 1;
    const limit = _params.limit || 50;
    const skip = (page - 1) * limit;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where: Prisma.AuditLogWhereInput = { createdAt: { gte: since } };
    if (_params.type) where.action = _params.type;

    const [events, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          userId: true,
          metadata: true,
          createdAt: true,
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: events.map((e) => ({
        ...e,
        type: e.action,
        timestamp: e.createdAt,
      })),
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
    const org = await this.prisma.organization.findUnique({
      where: { id: brandId },
      select: {
        id: true,
        name: true,
        plan: true,
        conversationsLimit: true,
        agentsLimit: true,
        knowledgeSourcesLimit: true,
        teamMembersLimit: true,
        monthlyBudgetLimit: true,
        currentMonthSpend: true,
        conversationsUsed: true,
        agentsUsed: true,
        features: true,
      },
    });
    if (!org) throw new NotFoundException('Organization not found');
    return org;
  }

  async updateTenantFeatures(brandId: string, features: Record<string, unknown>) {
    const org = await this.prisma.organization.findUnique({ where: { id: brandId } });
    if (!org) throw new NotFoundException('Organization not found');

    const updateData: Prisma.OrganizationUpdateInput = {};
    if (features.conversationsLimit !== undefined) updateData.conversationsLimit = features.conversationsLimit as number;
    if (features.agentsLimit !== undefined) updateData.agentsLimit = features.agentsLimit as number;
    if (features.knowledgeSourcesLimit !== undefined) updateData.knowledgeSourcesLimit = features.knowledgeSourcesLimit as number;
    if (features.teamMembersLimit !== undefined) updateData.teamMembersLimit = features.teamMembersLimit as number;
    if (features.monthlyBudgetLimit !== undefined) updateData.monthlyBudgetLimit = features.monthlyBudgetLimit as number;
    if (features.maxProducts !== undefined) updateData.agentsLimit = features.maxProducts as number;
    if (features.maxMonthlyGenerations !== undefined) updateData.conversationsLimit = features.maxMonthlyGenerations as number;
    if (features.aiCostLimitCents !== undefined) updateData.monthlyBudgetLimit = (features.aiCostLimitCents as number) / 100;

    return this.prisma.organization.update({ where: { id: brandId }, data: updateData });
  }

  // ========================================
  // INVOICES (Admin)
  // ========================================

  async getAllInvoices(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    brandId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params?.page || 1;
    const limit = Math.min(params?.limit || 20, 100);
    const skip = (page - 1) * limit;
    const sortBy = params?.sortBy || 'createdAt';
    const sortOrder = params?.sortOrder || 'desc';

    const where: Prisma.InvoiceWhereInput = {};
    if (params?.brandId) where.organizationId = params.brandId;
    if (params?.status) where.status = params.status as InvoiceStatus;
    if (params?.search) {
      where.OR = [
        { id: { contains: params.search, mode: 'insensitive' } },
        { stripeInvoiceId: { contains: params.search, mode: 'insensitive' } },
        { organization: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: { select: { id: true, name: true, slug: true, plan: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      invoices: invoices.map((inv) => ({
        id: inv.id,
        stripeInvoiceId: inv.stripeInvoiceId,
        brandId: inv.organizationId,
        organizationId: inv.organizationId,
        brandName: inv.organization?.name || 'Unknown',
        brandPlan: inv.organization?.plan || null,
        amount: inv.total,
        currency: inv.currency,
        status: inv.status,
        paidAt: inv.paidAt?.toISOString() || null,
        invoicePdf: inv.pdfUrl || null,
        createdAt: inv.createdAt.toISOString(),
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // ========================================
  // PLAN CHANGE HISTORY (Admin)
  // ========================================

  async getPlanChangeHistory(params?: { brandId?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = Math.min(params?.limit || 20, 100);
    const skip = (page - 1) * limit;

    try {
      const where: Prisma.AuditLogWhereInput = {
        action: {
          in: [
            'SUBSCRIPTION_CREATED', 'SUBSCRIPTION_UPDATED', 'SUBSCRIPTION_CANCELED',
            'PLAN_CHANGED', 'subscription.updated', 'subscription.deleted',
            'checkout.session.completed',
          ],
        },
      };
      if (params?.brandId) where.resourceId = params.brandId;

      const [logs, total] = await Promise.all([
        this.prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            resource: true,
            resourceId: true,
            userId: true,
            metadata: true,
            createdAt: true,
          },
        }),
        this.prisma.auditLog.count({ where }),
      ]);

      const orgIds = [...new Set(logs.map((l) => l.resourceId).filter(Boolean))] as string[];
      const orgs = orgIds.length > 0
        ? await this.prisma.organization.findMany({
            where: { id: { in: orgIds } },
            select: { id: true, name: true, plan: true },
          })
        : [];
      const orgMap = new Map(orgs.map((o) => [o.id, o]));

      return {
        history: logs.map((log) => {
          const org = log.resourceId ? orgMap.get(log.resourceId) : null;
          const meta = log.metadata as Record<string, unknown> | null;
          return {
            id: log.id,
            action: log.action,
            brandId: log.resourceId,
            brandName: org?.name || 'Unknown',
            currentPlan: org?.plan || null,
            previousPlan: meta?.previousPlan || meta?.fromPlan || null,
            newPlan: meta?.newPlan || meta?.toPlan || meta?.plan || null,
            userId: log.userId,
            metadata: meta,
            createdAt: log.createdAt.toISOString(),
          };
        }),
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    } catch {
      this.logger.warn('AuditLog query for plan changes failed, returning empty history');
      return { history: [], meta: { total: 0, page, limit, totalPages: 0 } };
    }
  }

  // ========================================
  // UPDATE CUSTOMER EMAIL (Admin)
  // ========================================

  async updateCustomerEmail(customerId: string, newEmail: string) {
    const existing = await this.prisma.user.findUnique({ where: { id: customerId } });
    if (!existing) throw new NotFoundException(`Customer with ID ${customerId} not found`);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) throw new BadRequestException('Invalid email format');

    const duplicate = await this.prisma.user.findUnique({ where: { email: newEmail } });
    if (duplicate && duplicate.id !== customerId) {
      throw new BadRequestException('This email address is already used by another account');
    }

    const updated = await this.prisma.user.update({
      where: { id: customerId },
      data: { email: newEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        deletedAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Admin updated email for user ${customerId}: ${existing.email} -> ${newEmail}`);
    return { ...updated, isActive: updated.deletedAt === null };
  }

  // ========================================
  // GLOBAL AGENTS LIST (Admin)
  // ========================================

  async getAllDesigns(_params?: {
    page?: number;
    limit?: number;
    search?: string;
    brandId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    // TODO: V2 has no Design model — return agents as a proxy
    const page = _params?.page || 1;
    const limit = Math.min(_params?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AgentWhereInput = {};
    if (_params?.brandId) where.organizationId = _params.brandId;
    if (_params?.search) {
      where.OR = [
        { name: { contains: _params.search, mode: 'insensitive' } },
        { organization: { name: { contains: _params.search, mode: 'insensitive' } } },
      ];
    }

    const [agents, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [_params?.sortBy || 'createdAt']: _params?.sortOrder || 'desc' },
        select: {
          id: true,
          name: true,
          status: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          organization: { select: { id: true, name: true } },
        },
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      agents: agents.map((a) => ({
        id: a.id,
        name: a.name,
        status: a.status,
        thumbnailUrl: a.avatar || null,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        organization: a.organization,
      })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ========================================
  // AR Studio Metrics (Admin)
  // ========================================

  async getARStudioMetrics(_periodDays: number = 30) {
    // TODO: V2 has no AR models — return empty metrics
    return {
      period: { days: _periodDays, since: new Date(Date.now() - _periodDays * 86400000).toISOString() },
      totals: { projects: 0, models: 0, sessions: 0, qrCodes: 0, collaborationRooms: 0 },
      periodMetrics: { sessions: 0, sessionsPerDay: 0 },
      platformDistribution: [],
      conversionFunnel: {
        qrScans: 0, arLaunches: 0, modelPlacements: 0, engagedSessions: 0,
        screenshots: 0, shares: 0, addToCarts: 0, purchases: 0, totalRevenue: 0,
      },
      topProjects: [],
    };
  }

  // ========================================
  // PCE Analytics (Admin)
  // ========================================

  async getPCEOverview() {
    // TODO: V2 has no PCE models (Pipeline, Fulfillment, Return, ProductionOrder)
    return {
      totalPipelines: 0,
      activePipelines: 0,
      completedPipelines: 0,
      failedPipelines: 0,
      totalFulfillments: 0,
      totalReturns: 0,
      totalProductionOrders: 0,
      avgPipelineDurationMs: 0,
    };
  }

  async getPCEPipelines(_params: { status?: string; limit?: number; offset?: number }) {
    // TODO: V2 has no Pipeline model
    return { pipelines: [], total: 0, limit: _params.limit ?? 50, offset: _params.offset ?? 0 };
  }

  async getPCEQueueHealth() {
    // TODO: V2 has no Pipeline/Fulfillment/RenderJob models
    return { pipelines: {}, fulfillments: {}, renderJobs: {} };
  }

  async getPCEProductionOrders(_params: { status?: string; limit?: number }) {
    // TODO: V2 has no ProductionOrder model
    return { productionOrders: [], total: 0, limit: _params.limit ?? 50 };
  }

  async getPCEReturns(_params: { status?: string; limit?: number }) {
    // TODO: V2 has no Return model
    return { returns: [], total: 0, limit: _params.limit ?? 50 };
  }

  // ========================================
  // Offer Free Subscription (Admin)
  // ========================================

  async offerFreeSubscription(
    brandId: string,
    planValue: string,
    durationMonths: number,
    reason?: string,
  ) {
    const org = await this.prisma.organization.findUnique({ where: { id: brandId } });
    if (!org) throw new Error(`Organization ${brandId} not found`);

    const planEnum = planValue.toUpperCase() as Plan;
    const validPlans: string[] = Object.values(Plan);
    if (!validPlans.includes(planEnum)) {
      throw new Error(`Invalid plan: ${planValue}. Must be one of: ${validPlans.join(', ')}`);
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + durationMonths);

    const updated = await this.prisma.organization.update({
      where: { id: brandId },
      data: {
        plan: planEnum,
        status: OrgStatus.ACTIVE,
        planPeriodEnd: periodEnd,
      },
    });

    this.logger.log(
      `Offered free ${planValue} subscription to org ${brandId} for ${durationMonths} months. Reason: ${reason || 'N/A'}`,
    );

    return {
      success: true,
      brand: {
        id: updated.id,
        name: updated.name,
        plan: updated.plan,
        trialEndsAt: periodEnd,
      },
      durationMonths,
      reason,
    };
  }
}
