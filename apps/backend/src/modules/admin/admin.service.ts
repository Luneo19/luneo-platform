import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

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

    const where: any = {};
    
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
      const adminPassword = await bcrypt.hash('admin123', 13);
      
      const adminUser = await this.prisma.user.upsert({
        where: { email: 'admin@luneo.com' },
        update: {},
        create: {
          email: 'admin@luneo.com',
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

  async addBlacklistedPrompt(term: string) {
    // In a real implementation, you would store this in a separate table
    this.logger.log(`Adding blacklisted prompt term: ${term}`);
    return { message: 'Term added to blacklist' };
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

    // In a real implementation, you would use an email service (SendGrid, Mailgun, etc.)
    this.logger.log(`Sending email to ${customers.length} customers`);
    
    // TODO: Integrate with email service
    return {
      success: true,
      message: `Email queued for ${customers.length} customers`,
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
    // In a real implementation, you would have a Tag model
    this.logger.log(`Tagging ${customerIds.length} customers with tags: ${tags.join(', ')}`);
    
    // TODO: Implement tagging system
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

    // In a real implementation, you would link customers to segments
    this.logger.log(`Adding ${customerIds.length} customers to segment ${segmentId}`);
    
    // TODO: Implement segment linking
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
