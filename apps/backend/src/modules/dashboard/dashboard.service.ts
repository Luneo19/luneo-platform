import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { KpiService } from './kpi/kpi.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly kpiService: KpiService,
  ) {}

  async getConfig(userId: string, brandId: string | null) {
    if (!brandId) {
      // PLATFORM_ADMIN with no brand → return default config
      return { sidebar: [], widgets: [], kpis: [] };
    }
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        organization: {
          include: {
            industry: {
              include: {
                moduleConfigs: { orderBy: { sortOrder: 'asc' } },
                widgetConfigs: { orderBy: { position: 'asc' } },
                kpiConfigs: { orderBy: { sortOrder: 'asc' } },
              },
            },
          },
        },
      },
    });
    if (!brand?.organization?.industry) {
      return {
        sidebar: [],
        widgets: [],
        kpis: [],
      };
    }
    const orgId = brand.organization.id;
    const industry = brand.organization.industry;
    const pref = await this.prisma.userDashboardPreference.findUnique({
      where: {
        userId_organizationId: { userId, organizationId: orgId },
      },
    });
    const sidebar = (pref?.sidebarOrder as string[] | null) ?? industry.moduleConfigs.map((m) => m.moduleSlug);
    const widgetOverrides = (pref?.widgetOverrides as Record<string, unknown> | null) ?? {};
    const widgets = industry.widgetConfigs.map((w) => ({
      ...w,
      ...(widgetOverrides[w.widgetSlug] as object | undefined),
    }));
    const kpis = industry.kpiConfigs
      .filter((k) => k.isDefaultVisible)
      .map((k) => ({
        slug: k.kpiSlug,
        labelFr: k.labelFr,
        labelEn: k.labelEn,
        icon: k.icon,
        sortOrder: k.sortOrder,
      }));
    return {
      sidebar,
      widgets,
      kpis,
    };
  }

  async getKpiValues(brandId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: {
        organization: {
          include: {
            industry: {
              include: { kpiConfigs: { where: { isDefaultVisible: true }, orderBy: { sortOrder: 'asc' } } },
            },
          },
        },
      },
    });
    if (!brand?.organization?.industry?.kpiConfigs?.length) {
      return [];
    }
    const results = await Promise.all(
      brand.organization.industry.kpiConfigs.map(async (kpi) => {
        const { value, trend } = await this.kpiService.calculateKpi(brandId, kpi.kpiSlug);
        return {
          slug: kpi.kpiSlug,
          label: kpi.labelEn,
          labelFr: kpi.labelFr,
          value,
          trend: trend ?? 0,
          icon: kpi.icon,
        };
      }),
    );
    return results;
  }

  async getWidgetData(brandId: string, widgetSlug: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      include: { organization: { include: { industry: true } } },
    });
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const industrySlug = brand?.organization?.industry?.slug ?? null;
    let data: Record<string, unknown> = {};

    switch (widgetSlug) {
      case 'revenue-chart': {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const orders = await this.prisma.order.findMany({
          where: { brandId, createdAt: { gte: thirtyDaysAgo } },
          select: { totalCents: true, createdAt: true },
          take: 1000,
          orderBy: { createdAt: 'asc' },
        });
        data = {
          orders: orders.map((o) => ({ date: o.createdAt, amount: (o.totalCents ?? 0) / 100 })),
        };
        break;
      }
      case 'recent-orders': {
        const orders = await this.prisma.order.findMany({
          where: { brandId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, totalCents: true, createdAt: true },
        });
        data = { orders };
        break;
      }
      case 'top-products': {
        const products = await this.prisma.product.findMany({
          where: { brandId },
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, price: true, images: true },
        });
        data = { products };
        break;
      }
      case 'credits-balance': {
        // Aggregate credits from the brand owner or first user
        const brandOwner = await this.prisma.user.findFirst({
          where: { brandId },
          select: { aiCredits: true },
          orderBy: { createdAt: 'asc' },
        });
        data = { credits: brandOwner?.aiCredits ?? 0 };
        break;
      }
      default:
        data = {};
    }

    return { widgetSlug, brandId, industrySlug, data };
  }

  async updatePreferences(
    userId: string,
    orgId: string,
    data: { widgetOverrides?: Record<string, unknown>; sidebarOrder?: string[]; pinnedModules?: string[]; lastVisitedModule?: string; dashboardTheme?: string },
  ) {
    const preferences = await this.prisma.userDashboardPreference.upsert({
      where: {
        userId_organizationId: { userId, organizationId: orgId },
      },
      create: {
        userId,
        organizationId: orgId,
        widgetOverrides: (data.widgetOverrides ?? {}) as object,
        sidebarOrder: (data.sidebarOrder ?? []) as object,
        pinnedModules: (data.pinnedModules ?? []) as object,
        lastVisitedModule: data.lastVisitedModule ?? undefined,
        dashboardTheme: data.dashboardTheme ?? undefined,
      },
      update: {
        ...(data.widgetOverrides !== undefined && { widgetOverrides: data.widgetOverrides as object }),
        ...(data.sidebarOrder !== undefined && { sidebarOrder: data.sidebarOrder as object }),
        ...(data.pinnedModules !== undefined && { pinnedModules: data.pinnedModules as object }),
        ...(data.lastVisitedModule !== undefined && { lastVisitedModule: data.lastVisitedModule }),
        ...(data.dashboardTheme !== undefined && { dashboardTheme: data.dashboardTheme }),
      },
    });
    return { success: true, preferences };
  }

  async resetPreferences(userId: string, orgId: string) {
    await this.prisma.userDashboardPreference.deleteMany({
      where: {
        userId,
        organizationId: orgId,
      },
    });
    this.logger.log(`Dashboard preferences reset for user ${userId}, org ${orgId}`);
    return {
      success: true,
      userId,
      organizationId: orgId,
      resetAt: new Date().toISOString(),
    };
  }

  async getOrganizationIdByBrand(brandId: string): Promise<string> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { organizationId: true },
    });
    if (!brand?.organizationId) {
      throw new BadRequestException('Organization not configured');
    }
    return brand.organizationId;
  }
}
