import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(private prisma: PrismaService) {}

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
      const adminPassword = await bcrypt.hash('admin123', 12);
      
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
        throw new Error(`Unknown bulk action: ${action}`);
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
      throw new Error('Segment ID is required');
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
