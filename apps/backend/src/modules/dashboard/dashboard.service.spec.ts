/**
 * DashboardService - Unit tests
 * Tests for getConfig, getKpiValues, updatePreferences, resetPreferences
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { KpiService } from './kpi/kpi.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: jest.Mocked<PrismaService>;
  let kpiService: jest.Mocked<KpiService>;

  const userId = 'user-1';
  const brandId = 'brand-1';
  const orgId = 'org-1';

  const mockIndustryConfig = {
    id: 'ind-1',
    slug: 'jewelry',
    moduleConfigs: [
      { id: 'mc1', moduleSlug: 'catalog', sortOrder: 0 },
      { id: 'mc2', moduleSlug: 'orders', sortOrder: 1 },
    ],
    widgetConfigs: [
      { id: 'wc1', widgetSlug: 'revenue', position: 0, gridColumn: 1 },
      { id: 'wc2', widgetSlug: 'orders', position: 1, gridColumn: 2 },
    ],
    kpiConfigs: [
      { id: 'kc1', kpiSlug: 'monthly-revenue', labelFr: 'CA', labelEn: 'Revenue', icon: 'trending-up', sortOrder: 0, isDefaultVisible: true },
      { id: 'kc2', kpiSlug: 'orders-pending', labelFr: 'Commandes', labelEn: 'Orders', icon: 'package', sortOrder: 1, isDefaultVisible: true },
    ],
  };

  const mockBrandWithIndustry = {
    id: brandId,
    name: 'Test Brand',
    organization: {
      id: orgId,
      industry: mockIndustryConfig,
    },
  };

  beforeEach(async () => {
    const mockPrisma: Record<string, any> = {
      brand: {
        findUnique: jest.fn(),
      },
      userDashboardPreference: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      order: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      product: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const mockKpiService = {
      calculateKpi: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
        {
          provide: KpiService,
          useValue: mockKpiService,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get(PrismaService);
    kpiService = module.get(KpiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should return merged config (industry + user preferences)', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrandWithIndustry);
      (prisma.userDashboardPreference.findUnique as jest.Mock).mockResolvedValue({
        userId,
        organizationId: orgId,
        sidebarOrder: ['orders', 'catalog'],
        widgetOverrides: { revenue: { gridColumn: 2 } },
      });

      const result = await service.getConfig(userId, brandId);

      expect(result.sidebar).toEqual(['orders', 'catalog']);
      expect(result.widgets).toHaveLength(2);
      expect(result.widgets[0]).toMatchObject({ widgetSlug: 'revenue', gridColumn: 2 });
      expect(result.kpis).toHaveLength(2);
      expect(result.kpis[0]).toMatchObject({
        slug: 'monthly-revenue',
        labelEn: 'Revenue',
        labelFr: 'CA',
        icon: 'trending-up',
        sortOrder: 0,
      });
    });

    it('should return industry defaults when no user preferences', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrandWithIndustry);
      (prisma.userDashboardPreference.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.getConfig(userId, brandId);

      expect(result.sidebar).toEqual(['catalog', 'orders']);
      expect(result.widgets).toHaveLength(2);
      expect(result.widgets[0]).toMatchObject({ widgetSlug: 'revenue', gridColumn: 1 });
      expect(result.kpis).toHaveLength(2);
    });

    it('should apply user overrides when available', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrandWithIndustry);
      (prisma.userDashboardPreference.findUnique as jest.Mock).mockResolvedValue({
        sidebarOrder: ['orders', 'catalog'],
        widgetOverrides: { orders: { gridWidth: 2 } },
      });

      const result = await service.getConfig(userId, brandId);

      expect(result.sidebar).toEqual(['orders', 'catalog']);
      const ordersWidget = result.widgets.find((w: { widgetSlug: string }) => w.widgetSlug === 'orders');
      expect(ordersWidget).toMatchObject(expect.objectContaining({ gridWidth: 2 }));
    });

    it('should return empty config when brand has no organization or industry', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue({
        id: brandId,
        organization: null,
      });

      const result = await service.getConfig(userId, brandId);

      expect(result).toEqual({ sidebar: [], widgets: [], kpis: [] });
    });

    it('should throw BadRequestException when brandId is null', async () => {
      await expect(service.getConfig(userId, null)).rejects.toThrow(BadRequestException);
      await expect(service.getConfig(userId, null)).rejects.toThrow('Brand required');
    });
  });

  describe('getKpiValues', () => {
    it('should return calculated KPI values for the org\'s industry', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrandWithIndustry);
      (kpiService.calculateKpi as jest.Mock)
        .mockResolvedValueOnce({ value: 1500, trend: 5 })
        .mockResolvedValueOnce({ value: 3, trend: 0 });

      const result = await service.getKpiValues(brandId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        slug: 'monthly-revenue',
        label: 'Revenue',
        labelFr: 'CA',
        value: 1500,
        trend: 5,
        icon: 'trending-up',
      });
      expect(result[1]).toMatchObject({
        slug: 'orders-pending',
        value: 3,
        trend: 0,
      });
      expect(kpiService.calculateKpi).toHaveBeenCalledWith(brandId, 'monthly-revenue');
      expect(kpiService.calculateKpi).toHaveBeenCalledWith(brandId, 'orders-pending');
    });

    it('should return empty array when no KPI configs', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue({
        id: brandId,
        organization: {
          id: orgId,
          industry: { ...mockIndustryConfig, kpiConfigs: [] },
        },
      });

      const result = await service.getKpiValues(brandId);

      expect(result).toEqual([]);
      expect(kpiService.calculateKpi).not.toHaveBeenCalled();
    });
  });

  describe('updatePreferences', () => {
    it('should upsert user preferences', async () => {
      (prisma.userDashboardPreference.upsert as jest.Mock).mockResolvedValue({});

      const result = await service.updatePreferences(userId, orgId, {
        sidebarOrder: ['orders', 'catalog'],
        widgetOverrides: { revenue: { visible: true } },
      });

      expect(result).toMatchObject({ success: true });
      expect(prisma.userDashboardPreference.upsert).toHaveBeenCalledWith({
        where: { userId_organizationId: { userId, organizationId: orgId } },
        create: expect.objectContaining({
          userId,
          organizationId: orgId,
          widgetOverrides: { revenue: { visible: true } },
          sidebarOrder: ['orders', 'catalog'],
        }),
        update: expect.objectContaining({
          sidebarOrder: ['orders', 'catalog'],
          widgetOverrides: { revenue: { visible: true } },
        }),
      });
    });
  });

  describe('resetPreferences', () => {
    it('should delete user preferences', async () => {
      (prisma.userDashboardPreference.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const result = await service.resetPreferences(userId, orgId);

      expect(result).toMatchObject({ success: true });
      expect(prisma.userDashboardPreference.deleteMany).toHaveBeenCalledWith({
        where: { userId, organizationId: orgId },
      });
    });
  });

  describe('getWidgetData', () => {
    it('should return widget data with industry slug', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(mockBrandWithIndustry);

      const result = await service.getWidgetData(brandId, 'revenue');

      expect(result).toMatchObject({
        widgetSlug: 'revenue',
        brandId,
        industrySlug: 'jewelry',
        data: {},
      });
    });

    it('should throw NotFoundException when brand not found', async () => {
      (prisma.brand.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getWidgetData(brandId, 'revenue')).rejects.toThrow(NotFoundException);
      await expect(service.getWidgetData(brandId, 'revenue')).rejects.toThrow('Brand not found');
    });
  });
});
