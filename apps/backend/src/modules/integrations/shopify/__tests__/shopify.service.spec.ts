import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { getQueueToken } from '@nestjs/bull';
import { of } from 'rxjs';
import { ShopifyService } from '../shopify.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { EncryptionService } from '@/libs/crypto/encryption.service';

describe('ShopifyService', () => {
  let service: ShopifyService;
  let httpService: jest.Mocked<HttpService>;
  let prisma: jest.Mocked<PrismaService>;

  const mockQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
  const mockCache = { get: jest.fn(), set: jest.fn(), setSimple: jest.fn().mockResolvedValue(undefined), invalidate: jest.fn(), getOrSet: jest.fn((_k: string, fn: () => Promise<unknown>) => fn()) };
  const mockEncryption = { encrypt: jest.fn((v: string) => Promise.resolve('enc:' + v)), decrypt: jest.fn((v: string) => Promise.resolve(v.replace('enc:', ''))) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const mockHttp = { get: jest.fn(), post: jest.fn(), request: jest.fn().mockReturnValue(of({ data: { products: [] } })) };
    const mockConfig = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          'shopify.clientId': 'shopify-client-id',
          'shopify.clientSecret': 'shopify-client-secret',
          'shopify.scopes': 'read_products,write_products,read_orders',
          'SHOPIFY_CLIENT_ID': 'shopify-client-id',
          'SHOPIFY_CLIENT_SECRET': 'shopify-client-secret',
          'SHOPIFY_REDIRECT_URI': 'http://localhost:3001/api/v1/integrations/shopify/callback',
          'API_URL': 'http://localhost:3001',
        };
        return map[key];
      }),
    };
    const mockPrisma = {
      ecommerceIntegration: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn(), deleteMany: jest.fn() },
      productMapping: { count: jest.fn().mockResolvedValue(0) },
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopifyService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: HttpService, useValue: mockHttp },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
        { provide: EncryptionService, useValue: mockEncryption },
        { provide: getQueueToken('integration-sync'), useValue: mockQueue },
      ],
    }).compile();
    service = module.get<ShopifyService>(ShopifyService);
    httpService = module.get(HttpService);
    prisma = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateOAuth', () => {
    it('should generate correct auth URL with scopes', async () => {
      const result = await service.initiateOAuth('brand-1', 'mystore.myshopify.com');
      expect(result.authUrl).toContain('https://');
      expect(result.authUrl).toContain('mystore.myshopify.com');
      expect(result.authUrl).toContain('shopify-client-id');
      expect(result.authUrl).toMatch(/scope=/);
      expect(result.state).toBeDefined();
    });
  });

  describe('handleCallback', () => {
    it('should exchange code for token', async () => {
      (httpService.post as jest.Mock).mockReturnValue(of({ data: { access_token: 'shpat_xxx', scope: 'read_products' } }));
      (prisma.ecommerceIntegration).findFirst = jest.fn().mockResolvedValue(null);
      (prisma.ecommerceIntegration).create = jest.fn().mockResolvedValue({ id: 'int-1', brandId: 'brand-1', platform: 'shopify', status: 'active' });
      const result = await service.handleCallback('brand-1', 'mystore.myshopify.com', 'auth-code', 'state');
      expect(result).toBeDefined();
      expect(httpService.post).toHaveBeenCalled();
    });
  });

  describe('syncProducts', () => {
    it('should fetch and map products', async () => {
      (prisma.ecommerceIntegration).findFirst = jest.fn().mockResolvedValue({ id: 'int-1', brandId: 'brand-1', platform: 'shopify', status: 'active', credentials: {}, accessToken: 'token', shopDomain: 'mystore.myshopify.com' });
      (mockEncryption.decrypt as jest.Mock).mockResolvedValue('decrypted-token');
      (httpService.get as jest.Mock).mockReturnValue(of({ data: { products: [{ id: 1, title: 'Test', body_html: null, vendor: 'V', product_type: 'T-Shirt', handle: 'test', status: 'active', variants: [{ id: 1, title: 'Default', price: '19.99', sku: null, inventory_quantity: 10 }], images: [] }] } }));
      const result = await service.syncProducts('brand-1');
      expect(result).toBeDefined();
      expect(result.synced).toBeDefined();
      expect(result.errors).toBeDefined();
    });
  });

  describe('getConnectionStatus', () => {
    it('should return correct status when connected', async () => {
      (prisma.ecommerceIntegration).findFirst = jest.fn().mockResolvedValue({ id: 'int-1', brandId: 'brand-1', platform: 'shopify', status: 'active', metadata: { shopDomain: 'mystore.myshopify.com' } });
      const result = await service.getConnectionStatus('brand-1');
      expect(result).toMatchObject({ connected: true, status: expect.any(String) });
    });
    it('should return disconnected when no integration', async () => {
      (prisma.ecommerceIntegration).findFirst = jest.fn().mockResolvedValue(null);
      const result = await service.getConnectionStatus('brand-1');
      expect(result.connected).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('should mark integration as inactive', async () => {
      (prisma.ecommerceIntegration).update = jest.fn().mockResolvedValue({});
      (prisma.ecommerceIntegration).findFirst = jest.fn().mockResolvedValue({ id: 'int-1', brandId: 'brand-1', platform: 'shopify' });
      await service.disconnect('brand-1');
      expect(prisma.ecommerceIntegration.update).toHaveBeenCalled();
    });
  });
});
