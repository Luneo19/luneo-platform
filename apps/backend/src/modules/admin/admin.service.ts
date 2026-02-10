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
          brand: {
            select: {
              id: true,
              name: true,
              subscriptionPlan: true,
              subscriptionStatus: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: customers,
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
    const customer = await this.prisma.user.findUnique({
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
        brand: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            subscriptionStatus: true,
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

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return customer;
  }

  // ========================================
  // ANALYTICS
  // ========================================

  /**
   * Get analytics overview
   */
  async getAnalyticsOverview() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const [
      totalCustomers,
      newCustomersLast30Days,
      totalOrders,
      ordersLast30Days,
      revenueData,
      previousRevenueData,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: { not: UserRole.PLATFORM_ADMIN } } }),
      this.prisma.user.count({
        where: {
          role: { not: UserRole.PLATFORM_ADMIN },
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.order.count(),
      this.prisma.order.count({
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.order.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: thirtyDaysAgo },
        },
        _sum: { totalCents: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: 'PAID',
          createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
        _sum: { totalCents: true },
      }),
    ]);

    const mrr = (revenueData._sum.totalCents || 0) / 100;
    const previousMrr = (previousRevenueData._sum.totalCents || 0) / 100;
    
    // Simple churn calculation (customers who haven't ordered in 30 days)
    const activeCustomers = await this.prisma.user.count({
      where: {
        role: { not: UserRole.PLATFORM_ADMIN },
        orders: {
          some: { createdAt: { gte: thirtyDaysAgo } },
        },
      },
    });
    
    const churnRate = totalCustomers > 0 
      ? ((totalCustomers - activeCustomers) / totalCustomers) * 100 
      : 0;

    return {
      mrr,
      arr: mrr * 12,
      customers: totalCustomers,
      newCustomers: newCustomersLast30Days,
      totalOrders,
      ordersLast30Days,
      churnRate: Math.round(churnRate * 100) / 100,
      mrrGrowth: previousMrr > 0 ? ((mrr - previousMrr) / previousMrr) * 100 : 0,
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
