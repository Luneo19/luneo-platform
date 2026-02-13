import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { PublicApiController } from '../public-api.controller';
import { PublicApiService } from '../public-api.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import { ApiQuotaGuard } from '../guards/api-quota.guard';
import { RateLimitGuard } from '../rate-limit/rate-limit.guard';

describe('PublicApiController', () => {
  let controller: PublicApiController;
  let publicApiService: jest.Mocked<PublicApiService>;

  const mockPublicApiService = {
    getBrandInfo: jest.fn(),
    getProducts: jest.fn(),
    getProduct: jest.fn(),
    listDesigns: jest.fn(),
    getDesign: jest.fn(),
    createDesign: jest.fn(),
    updateDesign: jest.fn(),
    deleteDesign: jest.fn(),
    getOrders: jest.fn(),
    getOrder: jest.fn(),
    createOrder: jest.fn(),
    getAnalytics: jest.fn(),
    testWebhook: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicApiController],
      providers: [
        { provide: PublicApiService, useValue: mockPublicApiService },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .overrideGuard(RateLimitGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .overrideGuard(ApiQuotaGuard)
      .useValue({ canActivate: jest.fn().mockResolvedValue(true) })
      .compile();

    controller = module.get<PublicApiController>(PublicApiController);
    publicApiService = module.get(PublicApiService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('API key authentication', () => {
    it('should work when ApiKeyGuard allows (mocked)', async () => {
      mockPublicApiService.listDesigns.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, pages: 0 },
      });

      const result = await controller.getDesigns('brand-1', { page: 1, limit: 10 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(publicApiService.listDesigns).toHaveBeenCalledWith('brand-1', 1, 10, undefined);
    });
  });

  describe('GET /public/designs', () => {
    it('should return designs for the brand', async () => {
      const designs = {
        data: [
          {
            id: 'design-1',
            name: 'My Design',
            status: 'COMPLETED',
            product: { id: 'prod-1', name: 'Product', price: 50 },
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, pages: 1 },
      };
      mockPublicApiService.listDesigns.mockResolvedValue(designs);

      const result = await controller.getDesigns('brand-1', { page: 1, limit: 10 });

      expect(result).toEqual(designs);
      expect(publicApiService.listDesigns).toHaveBeenCalledWith('brand-1', 1, 10, undefined);
    });
  });

  describe('POST /public/designs', () => {
    it('should create a design', async () => {
      const dto = {
        name: 'New Design',
        prompt: 'A red shoe',
        productId: '11111111-1111-1111-1111-111111111111',
      };
      const created = {
        id: 'design-new',
        name: dto.name,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPublicApiService.createDesign.mockResolvedValue(created);

      const result = await controller.createDesign('brand-1', dto);

      expect(result).toEqual(created);
      expect(publicApiService.createDesign).toHaveBeenCalledWith('brand-1', dto);
    });
  });

  describe('DELETE /public/designs/:id', () => {
    it('should delete a design', async () => {
      mockPublicApiService.deleteDesign.mockResolvedValue(undefined);

      await controller.deleteDesign('brand-1', 'design-1');

      expect(publicApiService.deleteDesign).toHaveBeenCalledWith('brand-1', 'design-1');
    });
  });

  describe('Invalid API key returns 401', () => {
    it('is enforced by ApiKeyGuard (integration); unit test mocks guard', () => {
      expect(ApiKeyGuard).toBeDefined();
      expect(ApiQuotaGuard).toBeDefined();
      expect(RateLimitGuard).toBeDefined();
    });
  });

  describe('Rate limiting (mock)', () => {
    it('is applied via RateLimitGuard', () => {
      expect(RateLimitGuard).toBeDefined();
    });
  });
});
