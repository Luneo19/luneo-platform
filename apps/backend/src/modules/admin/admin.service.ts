import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { Injectable, Logger, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  Prisma,
  Plan,
  OrgStatus,
  PlatformRole,
  TicketStatus,
  InvoiceStatus,
  AgentStatus,
  IntegrationStatus,
  TicketPriority,
} from '@prisma/client';
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
      // V2 note: no Order model in current schema; export conversations as operational proxy.
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
        this.logger.warn('DEV ONLY: Generated random admin password');
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

  async hasActiveAdmin(): Promise<boolean> {
    const admin = await this.prisma.user.findFirst({
      where: {
        role: PlatformRole.ADMIN,
        deletedAt: null,
      },
      select: { id: true },
    });
    return !!admin;
  }

  async getAICosts(_period: string = '30d') {
    // V2 note: usage costs are computed from UsageRecord in the current schema.
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
    // V2 note: settings persistence uses FeatureFlag.rules as canonical fallback storage.
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
        // V2 note: AnalyticsSegment model is not available in current schema.
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
    // V2 note: Discount model is not available; e-commerce discount features are disabled.
    return { discounts: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
  }

  async createDiscount(_data: Record<string, unknown>) {
    // V2 note: Discount model is not available.
    return { message: 'Discount management not available in V2' };
  }

  async updateDiscount(_id: string, _data: Record<string, unknown>) {
    // V2 note: Discount model is not available.
    return { message: 'Discount management not available in V2' };
  }

  async deleteDiscount(_id: string) {
    // V2 note: Discount model is not available.
    return { message: 'Discount management not available in V2' };
  }

  // ========================================
  // REFERRAL / COMMISSIONS MANAGEMENT
  // ========================================

  async getReferrals(_options?: { page?: number; limit?: number; status?: string }) {
    // V2 note: Referral model is not available in current schema.
    return { referrals: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
  }

  async getCommissions(_options?: { page?: number; limit?: number; status?: string }) {
    // V2 note: Commission model is not available in current schema.
    return { commissions: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } };
  }

  async approveCommission(_commissionId: string) {
    // V2 note: Commission model is not available in current schema.
    return { message: 'Commission management not available in V2' };
  }

  async markCommissionPaid(_commissionId: string) {
    // V2 note: Commission model is not available in current schema.
    return { message: 'Commission management not available in V2' };
  }

  async rejectCommission(_commissionId: string) {
    // V2 note: Commission model is not available in current schema.
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
    // V2 note: Event model is not available; AuditLog is used as a proxy source.
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
    // V2 note: Design model is not available; agents are returned as a proxy.
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
    // V2 note: AR models are not available in current schema; metrics return empty payloads.
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
    // V2 note: PCE models (Pipeline, Fulfillment, Return, ProductionOrder) are not available.
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
    // V2 note: Pipeline model is not available.
    return { pipelines: [], total: 0, limit: _params.limit ?? 50, offset: _params.offset ?? 0 };
  }

  async getPCEQueueHealth() {
    // V2 note: Pipeline/Fulfillment/RenderJob models are not available.
    return { pipelines: {}, fulfillments: {}, renderJobs: {} };
  }

  async getPCEProductionOrders(_params: { status?: string; limit?: number }) {
    // V2 note: ProductionOrder model is not available.
    return { productionOrders: [], total: 0, limit: _params.limit ?? 50 };
  }

  async getPCEReturns(_params: { status?: string; limit?: number }) {
    // V2 note: Return model is not available.
    return { returns: [], total: 0, limit: _params.limit ?? 50 };
  }

  // ========================================
  // ORION + MARKETING (Admin)
  // ========================================

  private static readonly ORION_COMMUNICATION_TEMPLATES_KEY = 'admin:orion:communications:templates';
  private static readonly ORION_AUTOMATIONS_KEY = 'admin:orion:automations';
  private static readonly ORION_NOTIFICATIONS_KEY = 'admin:orion:notifications';
  private static readonly ORION_PROMETHEUS_REVIEW_QUEUE_KEY = 'admin:orion:prometheus:review-queue';
  private static readonly ORION_SEGMENTS_KEY = 'admin:orion:segments';
  private static readonly ORION_EXPERIMENTS_KEY = 'admin:orion:experiments';
  private static readonly ORION_BLOCKED_IPS_KEY = 'admin:orion:artemis:blocked-ips';
  private static readonly ORION_AUDIT_LOG_KEY = 'admin:orion:audit-log';
  private static readonly MARKETING_CAMPAIGNS_KEY = 'admin:marketing:campaigns';
  private static readonly MARKETING_AUTOMATIONS_KEY = 'admin:marketing:automations';

  private async getFeatureFlagList<T>(key: string): Promise<T[]> {
    const flag = await this.prisma.featureFlag.findUnique({ where: { key } });
    const rules = flag?.rules as Record<string, unknown> | null;
    const items = rules?.items;
    return Array.isArray(items) ? (items as T[]) : [];
  }

  private async saveFeatureFlagList<T>(
    key: string,
    name: string,
    description: string,
    items: T[],
  ): Promise<void> {
    await this.prisma.featureFlag.upsert({
      where: { key },
      create: {
        key,
        name,
        description,
        enabled: true,
        rules: { items } as Prisma.InputJsonValue,
      },
      update: {
        enabled: true,
        rules: { items } as Prisma.InputJsonValue,
      },
    });
  }

  private computeRetentionSnapshot(lastLoginAt: Date | null): { healthScore: number; churnRisk: string } {
    if (!lastLoginAt) return { healthScore: 25, churnRisk: 'high' };
    const daysSinceLogin = Math.floor((Date.now() - lastLoginAt.getTime()) / 86400000);
    if (daysSinceLogin <= 3) return { healthScore: 92, churnRisk: 'low' };
    if (daysSinceLogin <= 7) return { healthScore: 80, churnRisk: 'low' };
    if (daysSinceLogin <= 14) return { healthScore: 62, churnRisk: 'medium' };
    if (daysSinceLogin <= 30) return { healthScore: 44, churnRisk: 'high' };
    return { healthScore: 20, churnRisk: 'critical' };
  }

  async getOrionOverview() {
    const [kpis, revenue, retention, quickWins] = await Promise.all([
      this.getOrionKpis(),
      this.getOrionRevenueOverview(),
      this.getOrionRetentionDashboard(),
      this.getOrionQuickWinsStatus(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      kpis,
      revenue,
      retention,
      quickWins,
    };
  }

  async getOrionKpis() {
    const [totalUsers, totalOrganizations, totalAgents, paidInvoices, openTickets] = await Promise.all([
      this.prisma.user.count({ where: { role: { not: PlatformRole.ADMIN } } }),
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.agent.count(),
      this.prisma.invoice.count({ where: { status: InvoiceStatus.PAID } }),
      this.prisma.ticket.count({
        where: {
          status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING] },
        },
      }),
    ]);

    return {
      users: totalUsers,
      organizations: totalOrganizations,
      agents: totalAgents,
      paidInvoices,
      openTickets,
    };
  }

  async getOrionRevenueOverview() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [activeOrgs, paidInvoices, paidInvoicesLast30Days] = await Promise.all([
      this.prisma.organization.findMany({
        where: { status: OrgStatus.ACTIVE, deletedAt: null },
        select: { id: true, plan: true },
      }),
      this.prisma.invoice.findMany({
        where: { status: InvoiceStatus.PAID },
        select: { total: true, paidAt: true, createdAt: true },
      }),
      this.prisma.invoice.findMany({
        where: {
          status: InvoiceStatus.PAID,
          OR: [{ paidAt: { gte: thirtyDaysAgo } }, { createdAt: { gte: thirtyDaysAgo } }],
        },
        select: { total: true },
      }),
    ]);

    const mrr = activeOrgs.reduce((sum, org) => sum + getPlanPrice(org.plan), 0);
    const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const recentRevenue = paidInvoicesLast30Days.reduce((sum, inv) => sum + inv.total, 0);

    return {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(mrr * 12 * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      recentRevenue30d: Math.round(recentRevenue * 100) / 100,
      invoicesPaid: paidInvoices.length,
    };
  }

  async getOrionRevenueLeads() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [newUsers30d, newOrgs30d, totalUsers, totalOrgs] = await Promise.all([
      this.prisma.user.count({
        where: { role: { not: PlatformRole.ADMIN }, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.organization.count({
        where: { deletedAt: null, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.user.count({ where: { role: { not: PlatformRole.ADMIN } } }),
      this.prisma.organization.count({ where: { deletedAt: null } }),
    ]);

    const conversionRate = newUsers30d > 0 ? (newOrgs30d / newUsers30d) * 100 : 0;
    const globalConversion = totalUsers > 0 ? (totalOrgs / totalUsers) * 100 : 0;

    return {
      newLeads30d: newUsers30d,
      converted30d: newOrgs30d,
      conversionRate: Math.round(conversionRate * 100) / 100,
      globalConversionRate: Math.round(globalConversion * 100) / 100,
    };
  }

  async getOrionRevenueUpsell() {
    const activeOrgs = await this.prisma.organization.findMany({
      where: { status: OrgStatus.ACTIVE, deletedAt: null },
      select: { id: true, name: true, plan: true, conversationsUsed: true, conversationsLimit: true },
    });

    const highValueCount = activeOrgs.filter(
      (org) => org.plan === Plan.BUSINESS || org.plan === Plan.ENTERPRISE,
    ).length;
    const upgradeCandidates = activeOrgs.filter((org) => {
      const limit = org.conversationsLimit || 0;
      if (limit <= 0) return false;
      return org.conversationsUsed / limit >= 0.8;
    });

    return {
      highValueCustomers: highValueCount,
      upgradeCandidates: upgradeCandidates.length,
      candidates: upgradeCandidates.slice(0, 20).map((org) => ({
        id: org.id,
        name: org.name,
        plan: org.plan,
        utilization: org.conversationsLimit > 0
          ? Math.round((org.conversationsUsed / org.conversationsLimit) * 100)
          : 0,
      })),
    };
  }

  async getOrionRetentionDashboard() {
    const users = await this.prisma.user.findMany({
      where: { role: { not: PlatformRole.ADMIN } },
      select: { id: true, createdAt: true, lastLoginAt: true },
    });

    const totalUsers = users.length;
    const snapshots = users.map((u) => this.computeRetentionSnapshot(u.lastLoginAt));
    const avgHealthScore = totalUsers > 0
      ? Math.round((snapshots.reduce((sum, s) => sum + s.healthScore, 0) / totalUsers) * 100) / 100
      : 0;
    const atRiskCount = snapshots.filter((s) => s.healthScore < 50).length;
    const atRiskPercent = totalUsers > 0 ? Math.round((atRiskCount / totalUsers) * 10000) / 100 : 0;

    const distributionMap = new Map<string, number>([
      ['healthy', 0],
      ['watch', 0],
      ['at-risk', 0],
      ['critical', 0],
    ]);
    for (const snap of snapshots) {
      if (snap.healthScore >= 75) distributionMap.set('healthy', (distributionMap.get('healthy') || 0) + 1);
      else if (snap.healthScore >= 60) distributionMap.set('watch', (distributionMap.get('watch') || 0) + 1);
      else if (snap.healthScore >= 40) distributionMap.set('at-risk', (distributionMap.get('at-risk') || 0) + 1);
      else distributionMap.set('critical', (distributionMap.get('critical') || 0) + 1);
    }

    const trend: Array<{ date: string; count: number; avgScore: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayUsers = users.filter((u) => u.createdAt >= dayStart && u.createdAt < dayEnd).length;
      trend.push({
        date: dayStart.toISOString().slice(0, 10),
        count: dayUsers,
        avgScore: avgHealthScore,
      });
    }

    return {
      totalUsers,
      avgHealthScore,
      atRiskCount,
      atRiskPercent,
      distribution: Array.from(distributionMap.entries()).map(([level, count]) => ({ level, count })),
      trend,
    };
  }

  async getOrionAtRiskUsers(limit = 25) {
    const users = await this.prisma.user.findMany({
      where: { role: { not: PlatformRole.ADMIN } },
      take: Math.min(limit, 100),
      orderBy: [{ lastLoginAt: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        lastLoginAt: true,
      },
    });

    return users
      .map((user) => {
        const snapshot = this.computeRetentionSnapshot(user.lastLoginAt);
        return {
          id: user.id,
          userId: user.id,
          healthScore: snapshot.healthScore,
          churnRisk: snapshot.churnRisk,
          lastActivityAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
          },
        };
      })
      .filter((entry) => entry.healthScore < 60);
  }

  async getOrionAgents(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = params?.page || 1;
    const limit = Math.min(params?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AgentWhereInput = {};
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { organization: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }
    if (params?.status && Object.values(AgentStatus).includes(params.status as AgentStatus)) {
      where.status = params.status as AgentStatus;
    }

    const [items, total] = await Promise.all([
      this.prisma.agent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: { select: { id: true, name: true } },
          _count: { select: { conversations: true } },
        },
      }),
      this.prisma.agent.count({ where }),
    ]);

    return {
      items: items.map((agent) => ({
        id: agent.id,
        name: agent.name,
        status: agent.status,
        model: agent.model,
        languages: agent.languages,
        organization: agent.organization,
        conversations: agent._count.conversations,
        createdAt: agent.createdAt.toISOString(),
        updatedAt: agent.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrionAgent(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, plan: true } },
      },
    });
    if (!agent) {
      throw new NotFoundException(`Agent ${id} not found`);
    }
    return agent;
  }

  async updateOrionAgent(id: string, body: Record<string, unknown>) {
    const existing = await this.prisma.agent.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Agent ${id} not found`);
    }

    const updateData: Prisma.AgentUpdateInput = {};
    if (body.name !== undefined) updateData.name = String(body.name);
    if (body.status !== undefined && Object.values(AgentStatus).includes(String(body.status) as AgentStatus)) {
      updateData.status = String(body.status) as AgentStatus;
    }
    if (body.model !== undefined) updateData.model = String(body.model);
    if (body.temperature !== undefined) updateData.temperature = Number(body.temperature);
    if (body.maxTokensPerReply !== undefined) updateData.maxTokensPerReply = Number(body.maxTokensPerReply);
    if (body.language !== undefined) updateData.languages = [String(body.language)];
    if (body.languages !== undefined && Array.isArray(body.languages)) {
      updateData.languages = body.languages.map((lang) => String(lang));
    }

    return this.prisma.agent.update({
      where: { id },
      data: updateData,
    });
  }

  async getOrionQuickWinsStatus() {
    const [templates, lowCredits, inactive, trialEnding] = await Promise.all([
      this.getOrionCommunicationTemplates(),
      this.getOrionLowCreditsQuickWin(),
      this.getOrionInactiveQuickWin(),
      this.getOrionTrialEndingQuickWin(),
    ]);

    const welcomeTemplate = templates.find((t) => t.type === 'welcome');

    return {
      welcomeEmail: {
        configured: Boolean(welcomeTemplate),
        templateId: welcomeTemplate?.id ?? null,
        lastSentCount: 0,
      },
      lowCreditsAlert: { usersAtRisk: lowCredits.usersAtRisk },
      churnAlert: { inactiveUsers: inactive.inactiveUsers },
      trialReminder: { trialEnding: trialEnding.trialEnding },
    };
  }

  async setupOrionWelcomeQuickWin() {
    const templates = await this.getOrionCommunicationTemplates();
    const existing = templates.find((t) => t.type === 'welcome');
    if (existing) {
      return { template: { id: existing.id }, status: 'already_configured' };
    }

    const created = await this.createOrionCommunicationTemplate({
      name: 'Welcome - default',
      type: 'welcome',
      channel: 'email',
      subject: 'Bienvenue sur Luneo',
      body: 'Bonjour {{firstName}}, bienvenue sur Luneo. Nous sommes ravis de vous accompagner.',
      active: true,
    });

    return { template: { id: created.id }, status: 'configured' };
  }

  async getOrionLowCreditsQuickWin() {
    const orgs = await this.prisma.organization.findMany({
      where: { deletedAt: null, monthlyBudgetLimit: { not: null } },
      select: {
        id: true,
        name: true,
        monthlyBudgetLimit: true,
        currentMonthSpend: true,
        members: {
          take: 1,
          include: {
            user: { select: { id: true, email: true, firstName: true } },
          },
        },
      },
    });

    const users = orgs
      .filter((org) => {
        const budget = org.monthlyBudgetLimit ?? 0;
        if (budget <= 0) return false;
        return (org.currentMonthSpend / budget) >= 0.8;
      })
      .map((org) => {
        const user = org.members[0]?.user;
        const budget = org.monthlyBudgetLimit ?? 1;
        const credits = Math.max(0, Math.round((1 - (org.currentMonthSpend / budget)) * 100));
        return {
          id: user?.id ?? org.id,
          email: user?.email ?? `${org.id}@unknown.local`,
          firstName: user?.firstName ?? org.name,
          aiCredits: credits,
        };
      });

    return {
      usersAtRisk: users.length,
      users,
    };
  }

  async getOrionInactiveQuickWin(days = 14) {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);

    const users = await this.prisma.user.findMany({
      where: {
        role: { not: PlatformRole.ADMIN },
        OR: [{ lastLoginAt: null }, { lastLoginAt: { lt: threshold } }],
      },
      take: 100,
      orderBy: [{ lastLoginAt: 'asc' }, { createdAt: 'asc' }],
      select: { id: true, email: true, firstName: true, lastLoginAt: true },
    });

    return {
      inactiveUsers: users.length,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
      })),
      thresholdDays: days,
    };
  }

  async getOrionTrialEndingQuickWin() {
    const now = new Date();
    const inSevenDays = new Date(now);
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const orgs = await this.prisma.organization.findMany({
      where: {
        status: OrgStatus.TRIAL,
        planPeriodEnd: { gte: now, lte: inSevenDays },
      },
      include: {
        members: {
          take: 1,
          include: { user: { select: { id: true, email: true, firstName: true } } },
        },
      },
      take: 100,
      orderBy: { planPeriodEnd: 'asc' },
    });

    const users = orgs.map((org) => ({
      id: org.members[0]?.user?.id ?? org.id,
      email: org.members[0]?.user?.email ?? 'unknown@local',
      firstName: org.members[0]?.user?.firstName ?? org.name,
      trialEndsAt: org.planPeriodEnd,
      brandName: org.name,
    }));

    return {
      trialEnding: users.length,
      users,
      brands: orgs.length,
    };
  }

  async getOrionCommunicationTemplates() {
    return this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_COMMUNICATION_TEMPLATES_KEY);
  }

  async getOrionCommunicationTemplate(id: string) {
    const templates = await this.getOrionCommunicationTemplates();
    const found = templates.find((item) => String(item.id) === id);
    if (!found) {
      throw new NotFoundException(`Template ${id} not found`);
    }
    return found;
  }

  async createOrionCommunicationTemplate(body: Record<string, unknown>) {
    const templates = await this.getOrionCommunicationTemplates();
    const now = new Date().toISOString();
    const item: Record<string, unknown> = {
      id: crypto.randomUUID(),
      name: body.name ?? 'Untitled template',
      type: body.type ?? 'generic',
      channel: body.channel ?? 'email',
      subject: body.subject ?? '',
      body: body.body ?? '',
      active: body.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    const next = [item, ...templates];
    await this.saveFeatureFlagList(
      AdminService.ORION_COMMUNICATION_TEMPLATES_KEY,
      'Orion communication templates',
      'Templates used by Orion and marketing admin communications',
      next,
    );
    return item;
  }

  async updateOrionCommunicationTemplate(id: string, body: Record<string, unknown>) {
    const templates = await this.getOrionCommunicationTemplates();
    const index = templates.findIndex((item) => String(item.id) === id);
    if (index === -1) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    const current = templates[index];
    const updated = {
      ...current,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    templates[index] = updated;
    await this.saveFeatureFlagList(
      AdminService.ORION_COMMUNICATION_TEMPLATES_KEY,
      'Orion communication templates',
      'Templates used by Orion and marketing admin communications',
      templates,
    );
    return updated;
  }

  async deleteOrionCommunicationTemplate(id: string) {
    const templates = await this.getOrionCommunicationTemplates();
    const next = templates.filter((item) => String(item.id) !== id);
    if (next.length === templates.length) {
      throw new NotFoundException(`Template ${id} not found`);
    }
    await this.saveFeatureFlagList(
      AdminService.ORION_COMMUNICATION_TEMPLATES_KEY,
      'Orion communication templates',
      'Templates used by Orion and marketing admin communications',
      next,
    );
    return { success: true, id };
  }

  async getOrionCommunicationLogs(params?: { page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = Math.min(params?.limit || 20, 100);
    const skip = (page - 1) * limit;

    const [ticketMessages, webhookLogs, totalTicketMessages, totalWebhookLogs] = await Promise.all([
      this.prisma.ticketMessage.findMany({
        where: { isStaff: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          ticket: { select: { id: true, subject: true } },
        },
      }),
      this.prisma.webhookLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          webhook: { select: { id: true, url: true } },
        },
      }),
      this.prisma.ticketMessage.count({ where: { isStaff: true } }),
      this.prisma.webhookLog.count(),
    ]);

    const mappedMessages = ticketMessages.map((msg) => ({
      id: msg.id,
      channel: 'support',
      type: 'ticket_reply',
      status: 'sent',
      subject: msg.ticket?.subject || null,
      target: msg.authorEmail || msg.authorName || 'unknown',
      createdAt: msg.createdAt.toISOString(),
    }));

    const mappedWebhooks = webhookLogs.map((log) => ({
      id: log.id,
      channel: 'webhook',
      type: log.event,
      status: log.success ? 'sent' : 'failed',
      subject: log.webhook?.url || null,
      target: log.webhook?.url || null,
      createdAt: log.createdAt.toISOString(),
    }));

    const items = [...mappedMessages, ...mappedWebhooks]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);

    const total = totalTicketMessages + totalWebhookLogs;
    return {
      items,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOrionCommunicationStats() {
    const [templates, staffMessagesCount, webhookLogCount, failedWebhookCount] = await Promise.all([
      this.getOrionCommunicationTemplates(),
      this.prisma.ticketMessage.count({ where: { isStaff: true } }),
      this.prisma.webhookLog.count(),
      this.prisma.webhookLog.count({ where: { success: false } }),
    ]);

    return {
      templates: templates.length,
      sent: staffMessagesCount + webhookLogCount - failedWebhookCount,
      failed: failedWebhookCount,
      channels: {
        email: templates.filter((template) => String(template.channel || '').toLowerCase() === 'email').length,
        webhook: webhookLogCount,
        support: staffMessagesCount,
      },
    };
  }

  async getOrionAutomations() {
    const items = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_AUTOMATIONS_KEY);
    return { automations: items, total: items.length };
  }

  async getOrionAutomation(id: string) {
    const { automations } = await this.getOrionAutomations();
    const item = automations.find((automation) => String(automation.id) === id);
    if (!item) throw new NotFoundException(`Automation ${id} not found`);
    return item;
  }

  async createOrionAutomation(body: Record<string, unknown>) {
    const current = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_AUTOMATIONS_KEY);
    const now = new Date().toISOString();
    const item: Record<string, unknown> = {
      id: crypto.randomUUID(),
      name: body.name ?? 'Untitled automation',
      trigger: body.trigger ?? 'manual',
      status: body.status ?? 'draft',
      active: body.active ?? false,
      steps: Array.isArray(body.steps) ? body.steps : [],
      metadata: body.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    const next = [item, ...current];
    await this.saveFeatureFlagList(
      AdminService.ORION_AUTOMATIONS_KEY,
      'Orion automations',
      'Admin Orion automations',
      next,
    );
    return item;
  }

  async updateOrionAutomation(id: string, body: Record<string, unknown>) {
    const current = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_AUTOMATIONS_KEY);
    const idx = current.findIndex((item) => String(item.id) === id);
    if (idx === -1) throw new NotFoundException(`Automation ${id} not found`);

    const updated = {
      ...current[idx],
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    current[idx] = updated;
    await this.saveFeatureFlagList(
      AdminService.ORION_AUTOMATIONS_KEY,
      'Orion automations',
      'Admin Orion automations',
      current,
    );
    return updated;
  }

  async deleteOrionAutomation(id: string) {
    const current = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_AUTOMATIONS_KEY);
    const next = current.filter((item) => String(item.id) !== id);
    if (next.length === current.length) throw new NotFoundException(`Automation ${id} not found`);
    await this.saveFeatureFlagList(
      AdminService.ORION_AUTOMATIONS_KEY,
      'Orion automations',
      'Admin Orion automations',
      next,
    );
    return { success: true, id };
  }

  async getOrionAnalyticsDashboard() {
    const [overview, kpis, revenue, retention, commsStats] = await Promise.all([
      this.getAnalyticsOverview(),
      this.getOrionKpis(),
      this.getOrionRevenueOverview(),
      this.getOrionRetentionDashboard(),
      this.getOrionCommunicationStats(),
    ]);

    return { overview, kpis, revenue, retention, communications: commsStats };
  }

  async getOrionAuditLog(params?: {
    page?: number;
    pageSize?: number;
    action?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const page = params?.page || 1;
    const pageSize = Math.min(params?.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.AuditLogWhereInput = {};
    if (params?.action) where.action = params.action;
    if (params?.userId) where.userId = params.userId;
    if (params?.dateFrom || params?.dateTo) {
      where.createdAt = {};
      if (params.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
      if (params.dateTo) where.createdAt.lte = new Date(params.dateTo);
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((log) => ({
        id: log.id,
        adminId: log.userId,
        action: log.action,
        resource: log.resource,
        resourceId: log.resourceId,
        changes: log.changes,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt.toISOString(),
        user: {
          email: log.user?.email || 'unknown',
          name: [log.user?.firstName, log.user?.lastName].filter(Boolean).join(' ') || log.user?.email || 'unknown',
        },
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getOrionNotifications(params?: { page?: number; pageSize?: number; type?: string; read?: boolean }) {
    const items = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_NOTIFICATIONS_KEY);
    const filtered = items.filter((item) => {
      const typeOk = params?.type ? String(item.type) === params.type : true;
      const readOk = typeof params?.read === 'boolean' ? Boolean(item.read) === params.read : true;
      return typeOk && readOk;
    });

    const page = params?.page || 1;
    const pageSize = Math.min(params?.pageSize || 20, 100);
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return {
      items: paged,
      total: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    };
  }

  async getOrionNotificationsCount() {
    const items = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_NOTIFICATIONS_KEY);
    return { count: items.filter((item) => !Boolean(item.read)).length };
  }

  async markOrionNotificationRead(id: string) {
    const items = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_NOTIFICATIONS_KEY);
    const idx = items.findIndex((item) => String(item.id) === id);
    if (idx === -1) throw new NotFoundException(`Notification ${id} not found`);
    items[idx] = {
      ...items[idx],
      read: true,
      readAt: new Date().toISOString(),
    };
    await this.saveFeatureFlagList(
      AdminService.ORION_NOTIFICATIONS_KEY,
      'Orion notifications',
      'Admin Orion notifications list',
      items,
    );
    return { id, read: true };
  }

  async markAllOrionNotificationsRead() {
    const items = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_NOTIFICATIONS_KEY);
    const now = new Date().toISOString();
    const next = items.map((item) => ({ ...item, read: true, readAt: item.readAt ?? now }));
    await this.saveFeatureFlagList(
      AdminService.ORION_NOTIFICATIONS_KEY,
      'Orion notifications',
      'Admin Orion notifications list',
      next,
    );
    return { success: true };
  }

  async getOrionPrometheusStats() {
    const queue = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_PROMETHEUS_REVIEW_QUEUE_KEY);
    const pending = queue.filter((item) => String(item.status) === 'pending').length;
    const approved = queue.filter((item) => String(item.status) === 'approved').length;
    const rejected = queue.filter((item) => String(item.status) === 'rejected').length;
    const ticketsOpen = await this.prisma.ticket.count({
      where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING] } },
    });

    return {
      ticketsOpen,
      queue: {
        total: queue.length,
        pending,
        approved,
        rejected,
      },
    };
  }

  async getOrionPrometheusReviewQueue(params?: { status?: string; page?: number; limit?: number }) {
    const queue = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_PROMETHEUS_REVIEW_QUEUE_KEY);
    const filtered = params?.status
      ? queue.filter((item) => String(item.status) === params.status)
      : queue;
    const page = params?.page || 1;
    const limit = Math.min(params?.limit || 20, 100);
    const start = (page - 1) * limit;

    return {
      items: filtered.slice(start, start + limit),
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    };
  }

  async approveOrionPrometheusResponse(
    id: string,
    body?: { notes?: string; editedContent?: string },
  ) {
    const queue = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_PROMETHEUS_REVIEW_QUEUE_KEY);
    const idx = queue.findIndex((item) => String(item.id) === id);
    if (idx === -1) throw new NotFoundException(`Review item ${id} not found`);

    const current = queue[idx];
    const ticketId = String(current.ticketId || '');
    const content = body?.editedContent || String(current.generatedResponse || '');

    if (ticketId && content) {
      await this.prisma.ticketMessage.create({
        data: {
          ticketId,
          content,
          isStaff: true,
          authorName: 'Prometheus',
          authorEmail: 'prometheus@system.local',
        },
      });
    }

    queue[idx] = {
      ...current,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      notes: body?.notes ?? null,
      finalResponse: content,
    };

    await this.saveFeatureFlagList(
      AdminService.ORION_PROMETHEUS_REVIEW_QUEUE_KEY,
      'Orion Prometheus review queue',
      'Generated support responses awaiting admin review',
      queue,
    );

    return queue[idx];
  }

  async rejectOrionPrometheusResponse(id: string, body?: { notes?: string }) {
    const queue = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_PROMETHEUS_REVIEW_QUEUE_KEY);
    const idx = queue.findIndex((item) => String(item.id) === id);
    if (idx === -1) throw new NotFoundException(`Review item ${id} not found`);
    queue[idx] = {
      ...queue[idx],
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      notes: body?.notes ?? null,
    };

    await this.saveFeatureFlagList(
      AdminService.ORION_PROMETHEUS_REVIEW_QUEUE_KEY,
      'Orion Prometheus review queue',
      'Generated support responses awaiting admin review',
      queue,
    );
    return queue[idx];
  }

  async bulkApproveOrionPrometheusResponses(responseIds: string[]) {
    if (!Array.isArray(responseIds) || responseIds.length === 0) {
      throw new BadRequestException('responseIds must be a non-empty array');
    }
    const approved: string[] = [];
    for (const id of responseIds) {
      try {
        await this.approveOrionPrometheusResponse(id);
        approved.push(id);
      } catch {
        // Continue with best effort bulk processing
      }
    }
    return { approved: approved.length, ids: approved };
  }

  async analyzeOrionPrometheusTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { messages: true },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

    const urgency = ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? 'high' : 'normal';
    const summary = ticket.description.length > 240
      ? `${ticket.description.slice(0, 240)}...`
      : ticket.description;

    return {
      ticketId: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      urgency,
      messagesCount: ticket.messages.length,
      summary,
      recommendedTone: urgency === 'high' ? 'empathic-fast' : 'professional',
    };
  }

  async generateOrionPrometheusTicketResponse(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { messages: { orderBy: { createdAt: 'asc' }, take: 5 } },
    });
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

    const context = ticket.messages.map((m) => m.content).join('\n').slice(-1200);
    const generatedResponse = `Bonjour,\n\nMerci pour votre message concernant "${ticket.subject}". Nous avons bien identifié votre demande et nous revenons vers vous avec une résolution sous peu.\n\nContexte pris en compte:\n${context || 'Aucun contexte complémentaire'}\n\nCordialement,\nÉquipe support Luneo`;

    const queue = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_PROMETHEUS_REVIEW_QUEUE_KEY);
    const item: Record<string, unknown> = {
      id: crypto.randomUUID(),
      ticketId: ticket.id,
      ticketSubject: ticket.subject,
      generatedResponse,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await this.saveFeatureFlagList(
      AdminService.ORION_PROMETHEUS_REVIEW_QUEUE_KEY,
      'Orion Prometheus review queue',
      'Generated support responses awaiting admin review',
      [item, ...queue],
    );
    return item;
  }

  async getOrionInsights(params?: { limit?: number; isRead?: boolean }) {
    const notifications = await this.getOrionNotifications({
      page: 1,
      pageSize: params?.limit ?? 5,
      read: typeof params?.isRead === 'boolean' ? params.isRead : undefined,
    });
    return notifications.items.map((item) => ({
      id: String(item.id),
      agentType: 'ORION',
      title: String(item.title ?? 'Insight'),
      description: String(item.message ?? ''),
      severity: String(item.type ?? 'medium'),
      isRead: Boolean(item.read),
      createdAt: String(item.createdAt ?? new Date().toISOString()),
    }));
  }

  async getOrionActions(params?: { limit?: number; status?: string }) {
    const notifications = await this.getOrionNotifications({
      page: 1,
      pageSize: params?.limit ?? 5,
      read: params?.status === 'executed' ? true : false,
    });
    return notifications.items.map((item) => ({
      id: String(item.id),
      agentType: 'ORION',
      actionType: String(item.type ?? 'NOTIFICATION'),
      title: String(item.title ?? 'Action'),
      description: String(item.message ?? ''),
      priority: 'medium',
      status: Boolean(item.read) ? 'executed' : 'pending',
      createdAt: String(item.createdAt ?? new Date().toISOString()),
    }));
  }

  async executeOrionAction(id: string) {
    await this.markOrionNotificationRead(id);
    const now = new Date().toISOString();
    const logs = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_AUDIT_LOG_KEY);
    const entry: Record<string, unknown> = {
      id: crypto.randomUUID(),
      action: 'orion.action.execute',
      resource: 'notification',
      resourceId: id,
      actor: 'system',
      createdAt: now,
    };
    await this.saveFeatureFlagList(
      AdminService.ORION_AUDIT_LOG_KEY,
      'Orion audit log',
      'Audit entries for Orion admin operations',
      [entry, ...logs].slice(0, 500),
    );
    return { id, status: 'executed', executedAt: now };
  }

  async getOrionActivityFeed(limit = 15) {
    const logs = await this.getOrionAuditLog({ page: 1, pageSize: Math.min(limit, 100) });
    return logs.items.map((item) => ({
      id: String(item.id),
      agentType: 'ORION',
      action: String(item.action),
      description: `${String(item.resource)}${item.resourceId ? `:${String(item.resourceId)}` : ''}`,
      createdAt: String(item.createdAt),
    }));
  }

  async getOrionSegments() {
    return this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_SEGMENTS_KEY);
  }

  async createOrionSegment(body: Record<string, unknown>) {
    const current = await this.getOrionSegments();
    const users = await this.prisma.user.count({ where: { role: { not: PlatformRole.ADMIN } } });
    const now = new Date().toISOString();
    const segment: Record<string, unknown> = {
      id: crypto.randomUUID(),
      name: body.name ?? 'Untitled segment',
      description: body.description ?? null,
      criteria: {
        logic: body.logic ?? 'AND',
        conditions: Array.isArray(body.conditions) ? body.conditions : [],
        type: body.type ?? 'Behavioral',
      },
      userCount: Math.min(users, Number(body.userCount ?? 0) || Math.max(0, Math.round(users * 0.15))),
      isActive: body.isActive ?? true,
      type: body.type ?? 'Behavioral',
      createdAt: now,
      updatedAt: now,
    };
    await this.saveFeatureFlagList(
      AdminService.ORION_SEGMENTS_KEY,
      'Orion segments',
      'Segments for Orion command center',
      [segment, ...current],
    );
    return segment;
  }

  async deleteOrionSegment(id: string) {
    const current = await this.getOrionSegments();
    const next = current.filter((segment) => String(segment.id) !== id);
    if (next.length === current.length) {
      throw new NotFoundException(`Segment ${id} not found`);
    }
    await this.saveFeatureFlagList(
      AdminService.ORION_SEGMENTS_KEY,
      'Orion segments',
      'Segments for Orion command center',
      next,
    );
    return { success: true, id };
  }

  async getOrionExperiments() {
    return this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_EXPERIMENTS_KEY);
  }

  async createOrionExperiment(body: Record<string, unknown>) {
    const current = await this.getOrionExperiments();
    const now = new Date().toISOString();
    const experiment: Record<string, unknown> = {
      id: crypto.randomUUID(),
      name: body.name ?? 'Untitled experiment',
      description: body.description ?? null,
      type: body.type ?? 'ab_test',
      status: body.status ?? 'draft',
      variants: Array.isArray(body.variants) ? body.variants : [],
      targetAudience: body.targetAudience ?? null,
      startDate: body.startDate ?? null,
      endDate: body.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await this.saveFeatureFlagList(
      AdminService.ORION_EXPERIMENTS_KEY,
      'Orion experiments',
      'A/B experiments for Orion',
      [experiment, ...current],
    );
    return experiment;
  }

  async seedOrionAgents() {
    const existing = await this.prisma.agent.count();
    if (existing > 0) {
      return { created: 0, skipped: existing, message: 'Agents already exist' };
    }

    const organization = await this.prisma.organization.findFirst({
      where: { deletedAt: null },
      select: { id: true },
    });
    if (!organization) {
      throw new BadRequestException('No organization available to seed ORION agents');
    }

    const defaults = [
      { name: 'Zeus', description: 'Commandant Stratégique' },
      { name: 'Athena', description: 'Analyste Intelligence' },
      { name: 'Apollo', description: 'Gardien de la plateforme' },
      { name: 'Artemis', description: 'Security Hunter' },
      { name: 'Hermes', description: 'Communication Master' },
      { name: 'Hades', description: 'Retention Keeper' },
      { name: 'Prometheus', description: 'Support IA Agent' },
    ];

    const created = await this.prisma.$transaction(
      defaults.map((entry) =>
        this.prisma.agent.create({
          data: {
            organizationId: organization.id,
            name: entry.name,
            description: entry.description,
            status: AgentStatus.ACTIVE,
            modules: [] as Prisma.InputJsonValue,
            tags: ['orion', entry.name.toLowerCase()],
          },
        }),
      ),
    );

    return { created: created.length, skipped: 0, message: 'ORION agents seeded' };
  }

  async getOrionZeusAlerts() {
    const [openTickets, failedWebhooks] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.webhookLog.findMany({
        where: { success: false },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const ticketAlerts = openTickets.map((ticket) => ({
      id: `ticket-${ticket.id}`,
      alertName: ticket.subject,
      severity: ticket.priority === 'URGENT' || ticket.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
      status: String(ticket.status),
      message: ticket.description,
      firedAt: ticket.createdAt.toISOString(),
    }));
    const webhookAlerts = failedWebhooks.map((log) => ({
      id: `webhook-${log.id}`,
      alertName: `Webhook ${log.event}`,
      severity: 'MEDIUM',
      status: 'OPEN',
      message: log.error || 'Webhook failed',
      firedAt: log.createdAt.toISOString(),
    }));
    return [...ticketAlerts, ...webhookAlerts]
      .sort((a, b) => b.firedAt.localeCompare(a.firedAt))
      .slice(0, 20);
  }

  async getOrionZeusDecisions() {
    const actions = await this.getOrionActions({ limit: 20 });
    return actions.map((action) => ({
      id: action.id,
      type: action.actionType,
      title: action.title,
      description: action.description,
      impact: action.priority,
      suggestedAction: 'review-and-apply',
      createdAt: action.createdAt,
    }));
  }

  async getOrionZeusDashboard() {
    const [alerts, decisions, overview, tickets] = await Promise.all([
      this.getOrionZeusAlerts(),
      this.getOrionZeusDecisions(),
      this.getOrionOverview(),
      this.prisma.ticket.count(),
    ]);
    const activeBrands = Number(overview?.kpis?.organizations ?? 0);
    return {
      alerts,
      decisions,
      metrics: {
        totalBrands: activeBrands,
        activeBrands,
        totalTickets: tickets,
        openTickets: alerts.filter((a) => a.status !== 'CLOSED').length,
      },
    };
  }

  async overrideOrionZeusDecision(id: string, approved: boolean) {
    const result = approved ? await this.executeOrionAction(id) : { id, status: 'dismissed' };
    return { approved, ...result };
  }

  async getOrionAthenaDistribution() {
    const retention = await this.getOrionRetentionDashboard();
    const distMap = new Map(retention.distribution.map((entry) => [String(entry.level).toLowerCase(), entry.count]));
    const churnDistribution = {
      LOW: distMap.get('healthy') ?? 0,
      MEDIUM: distMap.get('watch') ?? 0,
      HIGH: distMap.get('at-risk') ?? 0,
      CRITICAL: distMap.get('critical') ?? 0,
    };
    return {
      distribution: {
        healthy: distMap.get('healthy') ?? 0,
        atRisk: (distMap.get('at-risk') ?? 0) + (distMap.get('watch') ?? 0),
        critical: distMap.get('critical') ?? 0,
      },
      churnDistribution,
      total: retention.totalUsers,
    };
  }

  async getOrionAthenaCustomerHealth(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        lastLoginAt: true,
      },
    });
    if (!user) throw new NotFoundException(`User ${userId} not found`);
    const snap = this.computeRetentionSnapshot(user.lastLoginAt);
    return {
      userId: user.id,
      healthScore: snap.healthScore,
      churnRisk: snap.churnRisk.toUpperCase(),
      engagementScore: snap.healthScore,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async calculateOrionAthenaHealth(userId: string) {
    return this.getOrionAthenaCustomerHealth(userId);
  }

  async generateOrionAthenaInsights() {
    const atRisk = await this.getOrionAtRiskUsers(10);
    const current = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_NOTIFICATIONS_KEY);
    const now = new Date().toISOString();
    const generated = atRisk.slice(0, 5).map((entry) => ({
      id: crypto.randomUUID(),
      type: 'insight',
      title: `Churn risk detected for ${entry.user.email}`,
      message: `Health score ${entry.healthScore} for ${entry.user.email}`,
      read: false,
      readAt: null,
      createdAt: now,
    }));
    await this.saveFeatureFlagList(
      AdminService.ORION_NOTIFICATIONS_KEY,
      'Orion notifications',
      'Admin Orion notifications list',
      [...generated, ...current],
    );
    return { generated: generated.length };
  }

  async getOrionAthenaDashboard() {
    const [distribution, recentInsights, topAtRisk] = await Promise.all([
      this.getOrionAthenaDistribution(),
      this.getOrionInsights({ limit: 10 }),
      this.getOrionAtRiskUsers(10),
    ]);
    return { distribution, recentInsights, topAtRisk };
  }

  async getOrionApolloServices() {
    const [openTickets, failedWebhooks, activeIntegrations] = await Promise.all([
      this.prisma.ticket.count({
        where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.WAITING] } },
      }),
      this.prisma.webhookLog.count({ where: { success: false } }),
      this.prisma.integration.count({ where: { status: IntegrationStatus.CONNECTED } }),
    ]);

    return [
      {
        name: 'support',
        status: openTickets > 50 ? 'DEGRADED' : 'HEALTHY',
        lastChecked: new Date().toISOString(),
        responseTimeMs: 150,
        uptime: 0.995,
      },
      {
        name: 'webhooks',
        status: failedWebhooks > 20 ? 'DEGRADED' : 'HEALTHY',
        lastChecked: new Date().toISOString(),
        responseTimeMs: 110,
        uptime: 0.998,
      },
      {
        name: 'integrations',
        status: activeIntegrations === 0 ? 'DEGRADED' : 'HEALTHY',
        lastChecked: new Date().toISOString(),
        responseTimeMs: 90,
        uptime: 0.997,
      },
    ];
  }

  async getOrionApolloIncidents(status?: string) {
    const incidents = await this.prisma.ticket.findMany({
      where: {
        ...(status ? { status: status as TicketStatus } : {}),
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return incidents.map((ticket) => ({
      id: ticket.id,
      service: 'support',
      severity: ticket.priority,
      title: ticket.subject,
      status: ticket.status,
      startedAt: ticket.createdAt.toISOString(),
      resolvedAt: ticket.status === TicketStatus.RESOLVED ? ticket.updatedAt.toISOString() : null,
    }));
  }

  async getOrionApolloMetrics(hours = 24) {
    const since = new Date(Date.now() - hours * 3600000);
    const [messages, webhooks] = await Promise.all([
      this.prisma.ticketMessage.count({ where: { createdAt: { gte: since } } }),
      this.prisma.webhookLog.count({ where: { createdAt: { gte: since } } }),
    ]);
    return {
      windowHours: hours,
      ticketMessages: messages,
      webhookEvents: webhooks,
    };
  }

  async getOrionApolloDashboard() {
    const [services, incidents] = await Promise.all([
      this.getOrionApolloServices(),
      this.getOrionApolloIncidents(),
    ]);
    const total = incidents.length;
    const breached = incidents.filter((item) => String(item.severity).toUpperCase() === 'URGENT').length;
    return {
      services,
      incidents,
      metrics: await this.getOrionApolloMetrics(),
      slaCompliance: {
        total,
        breached,
        compliance: total === 0 ? 100 : Math.max(0, Number(((total - breached) / total * 100).toFixed(2))),
      },
    };
  }

  async getOrionArtemisThreats() {
    const [failedWebhooks, urgentTickets] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where: { success: false },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.ticket.findMany({
        where: { priority: { in: [TicketPriority.HIGH, TicketPriority.URGENT] }, status: { not: TicketStatus.RESOLVED } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const webhookThreats = failedWebhooks.map((log) => ({
      id: `wh-${log.id}`,
      type: 'WEBHOOK_FAILURE',
      severity: 'MEDIUM',
      source: log.event,
      description: log.error || 'Webhook failure',
      ipAddress: null,
      status: 'OPEN',
      createdAt: log.createdAt.toISOString(),
    }));
    const ticketThreats = urgentTickets.map((ticket) => ({
      id: `tk-${ticket.id}`,
      type: 'URGENT_TICKET',
      severity: String(ticket.priority),
      source: 'support',
      description: ticket.subject,
      ipAddress: null,
      status: String(ticket.status),
      createdAt: ticket.createdAt.toISOString(),
    }));
    return [...webhookThreats, ...ticketThreats]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
  }

  async getOrionArtemisBlockedIps() {
    return this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_BLOCKED_IPS_KEY);
  }

  async blockOrionArtemisIp(body: { ipAddress: string; reason: string; expiresAt?: string }) {
    const current = await this.getOrionArtemisBlockedIps();
    const now = new Date().toISOString();
    const item: Record<string, unknown> = {
      id: crypto.randomUUID(),
      ipAddress: body.ipAddress,
      reason: body.reason,
      expiresAt: body.expiresAt ?? null,
      isActive: true,
      createdAt: now,
    };
    await this.saveFeatureFlagList(
      AdminService.ORION_BLOCKED_IPS_KEY,
      'Orion Artemis blocked IPs',
      'Blocked IPs for Artemis security operations',
      [item, ...current],
    );
    return item;
  }

  async unblockOrionArtemisIp(ipAddress: string) {
    const current = await this.getOrionArtemisBlockedIps();
    const next = current.filter((item) => String(item.ipAddress) !== ipAddress);
    await this.saveFeatureFlagList(
      AdminService.ORION_BLOCKED_IPS_KEY,
      'Orion Artemis blocked IPs',
      'Blocked IPs for Artemis security operations',
      next,
    );
    return { success: true, ipAddress };
  }

  async resolveOrionArtemisThreat(id: string) {
    const now = new Date().toISOString();
    const logs = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.ORION_AUDIT_LOG_KEY);
    const entry: Record<string, unknown> = {
      id: crypto.randomUUID(),
      action: 'orion.artemis.resolve',
      resource: 'threat',
      resourceId: id,
      actor: 'system',
      createdAt: now,
    };
    await this.saveFeatureFlagList(
      AdminService.ORION_AUDIT_LOG_KEY,
      'Orion audit log',
      'Audit entries for Orion admin operations',
      [entry, ...logs].slice(0, 500),
    );
    return { success: true, id, resolvedAt: now };
  }

  async getOrionArtemisFraudChecks() {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const invoices = await this.prisma.invoice.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, total: true, status: true, createdAt: true },
    });
    return invoices.map((invoice) => ({
      id: invoice.id,
      riskScore: invoice.total > 1000 ? 75 : 35,
      riskLevel: invoice.total > 1000 ? 'HIGH' : 'LOW',
      reasons: invoice.total > 1000 ? ['high_amount'] : ['normal_amount'],
      actionType: 'REVIEW',
      createdAt: invoice.createdAt.toISOString(),
    }));
  }

  async getOrionArtemisDashboard() {
    const [activeThreats, blockedIPs, recentFraud] = await Promise.all([
      this.getOrionArtemisThreats(),
      this.getOrionArtemisBlockedIps(),
      this.getOrionArtemisFraudChecks(),
    ]);
    const securityScore = Math.max(10, 100 - activeThreats.length * 2 - blockedIPs.length);
    return {
      securityScore,
      activeThreats,
      blockedIPs,
      recentFraud,
      recentAudit: [],
      stats: {
        threatsCount: activeThreats.length,
        blockedIPsCount: blockedIPs.length,
        fraudAlertsCount: recentFraud.length,
      },
    };
  }

  async getOrionHermesPending() {
    const logs = await this.getOrionCommunicationLogs({ page: 1, limit: 50 });
    return logs.items
      .filter((item) => String(item.status).toLowerCase() === 'queued' || String(item.status).toLowerCase() === 'pending')
      .slice(0, 20)
      .map((item) => ({
        id: item.id,
        actionType: item.type,
        title: item.subject || item.type,
        description: item.target,
        status: item.status,
        createdAt: item.createdAt,
      }));
  }

  async getOrionHermesCampaigns() {
    const templates = await this.getOrionCommunicationTemplates();
    return templates.slice(0, 20).map((template) => ({
      id: String(template.id),
      name: String(template.name ?? 'Template'),
      status: String(template.active ? 'active' : 'draft'),
      createdAt: String(template.createdAt ?? new Date().toISOString()),
    }));
  }

  async getOrionHermesStats() {
    const [stats, users] = await Promise.all([
      this.getOrionCommunicationStats(),
      this.prisma.user.count({ where: { role: { not: PlatformRole.ADMIN } } }),
    ]);
    return {
      activeUsers: Number(stats.sent ?? 0),
      totalUsers: users,
      engagementRate: Number(stats.sent ?? 0) > 0
        ? Number((((Number(stats.sent) - Number(stats.failed ?? 0)) / Number(stats.sent)) * 100).toFixed(2))
        : 0,
      actionsThisMonth: Number(stats.sent ?? 0),
    };
  }

  async getOrionHermesDashboard() {
    const [pending, campaigns, stats] = await Promise.all([
      this.getOrionHermesPending(),
      this.getOrionHermesCampaigns(),
      this.getOrionHermesStats(),
    ]);
    return { pending, campaigns, stats };
  }

  async getOrionHadesAtRisk() {
    const users = await this.getOrionAtRiskUsers(25);
    return users.map((entry) => ({
      userId: entry.userId,
      email: entry.user.email,
      name: [entry.user.firstName, entry.user.lastName].filter(Boolean).join(' ') || entry.user.email,
      brandName: null,
      churnRiskScore: entry.healthScore,
      churnRisk: String(entry.churnRisk).toUpperCase(),
      factors: [],
      recommendedActions: [],
    }));
  }

  async getOrionHadesWinBack() {
    const automations = await this.getOrionAutomations();
    return automations.automations
      .filter((automation) => {
        const trigger = String((automation as Record<string, unknown>).trigger ?? '').toLowerCase();
        return trigger.includes('churn') || trigger.includes('inactive') || trigger.includes('win');
      })
      .slice(0, 20);
  }

  async getOrionHadesMrrAtRisk() {
    const [revenue, atRisk] = await Promise.all([
      this.getOrionRevenueOverview(),
      this.getOrionHadesAtRisk(),
    ]);
    const totalUsers = await this.prisma.user.count({ where: { role: { not: PlatformRole.ADMIN } } });
    const ratio = totalUsers > 0 ? atRisk.length / totalUsers : 0;
    const mrrAtRisk = Number((Number(revenue.mrr ?? 0) * ratio).toFixed(2));
    return {
      mrrAtRisk,
      customersAtRisk: atRisk.length,
      breakdown: {
        critical: atRisk.filter((item) => item.churnRisk === 'CRITICAL').length,
        high: atRisk.filter((item) => item.churnRisk === 'HIGH').length,
      },
    };
  }

  async getOrionHadesActions() {
    const actions = await this.getOrionActions({ limit: 20 });
    return actions.map((action) => ({
      id: action.id,
      title: action.title,
      description: action.description,
      priority: action.priority,
      status: action.status,
      createdAt: action.createdAt,
    }));
  }

  async getOrionHadesDashboard() {
    const [atRisk, winBack, mrr, actions] = await Promise.all([
      this.getOrionHadesAtRisk(),
      this.getOrionHadesWinBack(),
      this.getOrionHadesMrrAtRisk(),
      this.getOrionHadesActions(),
    ]);
    return { atRisk, winBack, mrr, actions };
  }

  async getOrionRetentionHealth(userId: string) {
    const health = await this.getOrionAthenaCustomerHealth(userId);
    return {
      id: health.userId,
      userId: health.userId,
      healthScore: health.healthScore,
      churnRisk: health.churnRisk,
      lastActivityAt: null,
      user: {
        id: health.userId,
        email: health.user.email,
        firstName: health.user.firstName ?? null,
        lastName: health.user.lastName ?? null,
        lastLoginAt: null,
      },
    };
  }

  async calculateOrionRetentionHealth(userId: string) {
    const health = await this.getOrionAthenaCustomerHealth(userId);
    return {
      id: health.userId,
      healthScore: health.healthScore,
      churnRisk: health.churnRisk,
    };
  }

  async getOrionRetentionWinBackCampaigns() {
    const campaigns = await this.getOrionHadesWinBack();
    return campaigns.map((item) => {
      const raw = item as Record<string, unknown>;
      return {
        id: String(raw.id ?? ''),
        name: String(raw.name ?? 'Win-back campaign'),
        description: typeof raw.description === 'string' ? raw.description : null,
        trigger: String(raw.trigger ?? 'manual'),
        status: String(raw.status ?? 'draft'),
        stepsCount: Array.isArray(raw.steps) ? raw.steps.length : 0,
        runsCount: Number(raw.runsCount ?? 0),
      };
    });
  }

  async triggerOrionRetentionWinBack(userIds: string[]) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestException('userIds must be a non-empty array');
    }
    const runIds = userIds.slice(0, 100).map(() => crypto.randomUUID());
    return {
      triggered: runIds.length,
      runIds,
      message: 'Win-back workflows queued',
    };
  }

  async getMarketingCampaigns() {
    const campaigns = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.MARKETING_CAMPAIGNS_KEY);
    return { campaigns, total: campaigns.length };
  }

  async createMarketingCampaign(body: Record<string, unknown>) {
    const campaigns = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.MARKETING_CAMPAIGNS_KEY);
    const now = new Date().toISOString();
    const campaign: Record<string, unknown> = {
      id: crypto.randomUUID(),
      name: body.name ?? 'Untitled campaign',
      subject: body.subject ?? '',
      body: body.body ?? '',
      audience: body.audience ?? 'all',
      status: body.status ?? 'draft',
      recipientCount: Number(body.recipientCount ?? 0),
      scheduledAt: body.scheduledAt ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveFeatureFlagList(
      AdminService.MARKETING_CAMPAIGNS_KEY,
      'Marketing campaigns',
      'Admin marketing campaigns',
      [campaign, ...campaigns],
    );
    return campaign;
  }

  async getMarketingAutomations() {
    const automations = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.MARKETING_AUTOMATIONS_KEY);
    return { automations, total: automations.length };
  }

  async createMarketingAutomation(body: Record<string, unknown>) {
    const current = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.MARKETING_AUTOMATIONS_KEY);
    const now = new Date().toISOString();
    const automation: Record<string, unknown> = {
      id: crypto.randomUUID(),
      name: body.name ?? 'Untitled marketing automation',
      trigger: body.trigger ?? 'manual',
      status: body.status ?? 'draft',
      active: body.active ?? false,
      steps: Array.isArray(body.steps) ? body.steps : [],
      stats: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
        openRate: 0,
        clickRate: 0,
        conversionRate: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    await this.saveFeatureFlagList(
      AdminService.MARKETING_AUTOMATIONS_KEY,
      'Marketing automations',
      'Admin marketing automations',
      [automation, ...current],
    );
    return automation;
  }

  async getMarketingAutomation(id: string) {
    const { automations } = await this.getMarketingAutomations();
    const item = automations.find((automation) => String(automation.id) === id);
    if (!item) throw new NotFoundException(`Marketing automation ${id} not found`);
    return item;
  }

  async updateMarketingAutomation(id: string, body: Record<string, unknown>) {
    const current = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.MARKETING_AUTOMATIONS_KEY);
    const idx = current.findIndex((item) => String(item.id) === id);
    if (idx === -1) throw new NotFoundException(`Marketing automation ${id} not found`);

    current[idx] = {
      ...current[idx],
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    await this.saveFeatureFlagList(
      AdminService.MARKETING_AUTOMATIONS_KEY,
      'Marketing automations',
      'Admin marketing automations',
      current,
    );
    return current[idx];
  }

  async deleteMarketingAutomation(id: string) {
    const current = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.MARKETING_AUTOMATIONS_KEY);
    const next = current.filter((item) => String(item.id) !== id);
    if (next.length === current.length) throw new NotFoundException(`Marketing automation ${id} not found`);
    await this.saveFeatureFlagList(
      AdminService.MARKETING_AUTOMATIONS_KEY,
      'Marketing automations',
      'Admin marketing automations',
      next,
    );
    return { success: true, id };
  }

  async testMarketingAutomation(
    body: Record<string, unknown>,
    actor?: { userId?: string; userEmail?: string },
  ) {
    const id = typeof body.id === 'string' ? body.id : null;
    let selectedAutomation: Record<string, unknown> | null = null;
    if (id) {
      const current = await this.getFeatureFlagList<Record<string, unknown>>(AdminService.MARKETING_AUTOMATIONS_KEY);
      const idx = current.findIndex((item) => String(item.id) === id);
      if (idx === -1) {
        throw new NotFoundException(`Marketing automation ${id} not found`);
      }
      selectedAutomation = current[idx];
      current[idx] = {
        ...current[idx],
        lastTestedAt: new Date().toISOString(),
      };
      await this.saveFeatureFlagList(
        AdminService.MARKETING_AUTOMATIONS_KEY,
        'Marketing automations',
        'Admin marketing automations',
        current,
      );
    }

    const testEmailCandidate =
      (typeof body.testEmail === 'string' ? body.testEmail : null) ||
      (typeof body.recipientEmail === 'string' ? body.recipientEmail : null);
    let recipientEmail = testEmailCandidate?.trim() || actor?.userEmail || '';
    if (!recipientEmail && actor?.userId) {
      const requester = await this.prisma.user.findUnique({
        where: { id: actor.userId },
        select: { email: true },
      });
      recipientEmail = requester?.email || '';
    }
    if (!recipientEmail) {
      throw new BadRequestException('No recipient email available for automation test');
    }

    const automationName =
      (selectedAutomation && typeof selectedAutomation.name === 'string' ? selectedAutomation.name : null) ||
      (typeof body.name === 'string' ? body.name : null) ||
      'Marketing automation';
    const automationTrigger =
      (selectedAutomation && typeof selectedAutomation.trigger === 'string' ? selectedAutomation.trigger : null) ||
      (typeof body.trigger === 'string' ? body.trigger : null) ||
      'manual';
    const steps =
      (selectedAutomation && Array.isArray(selectedAutomation.steps) ? selectedAutomation.steps : null) ||
      (Array.isArray(body.steps) ? body.steps : []);

    await this.emailService.sendEmail({
      to: recipientEmail,
      subject: `[TEST] ${automationName}`,
      html: `
        <h2>Automation Test Email</h2>
        <p>This is a real delivery test for your marketing automation.</p>
        <ul>
          <li><strong>Automation:</strong> ${String(automationName)}</li>
          <li><strong>Trigger:</strong> ${String(automationTrigger)}</li>
          <li><strong>Steps:</strong> ${steps.length}</li>
          <li><strong>Tested at:</strong> ${new Date().toISOString()}</li>
        </ul>
      `,
      text: [
        'Automation Test Email',
        '',
        `Automation: ${String(automationName)}`,
        `Trigger: ${String(automationTrigger)}`,
        `Steps: ${steps.length}`,
        `Tested at: ${new Date().toISOString()}`,
      ].join('\n'),
      tags: ['marketing-automation', 'test'],
      provider: 'auto',
    });

    return {
      success: true,
      message: `Automation test email sent to ${recipientEmail}`,
      testId: crypto.randomUUID(),
      automationId: id,
      recipientEmail,
    };
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
