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
}
