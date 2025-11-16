import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { EncryptionService } from '@/libs/encryption/encryption.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { ShopifyService } from './shopify.service';
import { of, throwError } from 'rxjs';
import * as crypto from 'crypto';

describe('ShopifyService', () => {
  let service: ShopifyService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;
  let prismaService: any;
  let encryptionService: jest.Mocked<EncryptionService>;
  let cacheService: jest.Mocked<SmartCacheService>;

  const mockShopDomain = 'test-shop.myshopify.com';
  const mockBrandId = 'test-brand-id';
  const mockAccessToken = 'test-access-token';
  const mockWebhookSecret = 'test-webhook-secret';

  beforeEach(async () => {
    const mockHttpService = {
      post: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          'shopify.apiKey': 'test-api-key',
          'shopify.apiSecret': 'test-api-secret',
          'shopify.scopes': 'read_products,write_products',
          'app.url': 'https://api.luneo.app',
        };
        return config[key];
      }),
    };

    const mockPrismaService = {
      shopifyInstall: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const mockEncryptionService = {
      encrypt: jest.fn((text: string) => `encrypted_${text}`),
      decrypt: jest.fn((text: string) => text.replace('encrypted_', '')),
    };

    const mockCacheService = {
      setSimple: jest.fn(),
      getSimple: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShopifyService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: SmartCacheService,
          useValue: mockCacheService,
        },
      ],
    }).compile();

    service = module.get<ShopifyService>(ShopifyService);
    httpService = module.get(HttpService);
    configService = module.get(ConfigService);
    prismaService = module.get(PrismaService);
    encryptionService = module.get(EncryptionService);
    cacheService = module.get(SmartCacheService);
  });

  describe('generateInstallUrl', () => {
    it('should generate valid Shopify OAuth install URL', () => {
      const url = service.generateInstallUrl(mockShopDomain, mockBrandId);
      
      expect(url).toContain(mockShopDomain);
      expect(url).toContain('admin/oauth/authorize');
      expect(url).toContain('client_id=test-api-key');
      expect(cacheService.setSimple).toHaveBeenCalled();
    });

    it('should throw error for invalid shop domain', () => {
      expect(() => {
        service.generateInstallUrl('invalid-domain', mockBrandId);
      }).toThrow('Invalid shop domain format');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange code for access token', async () => {
      const mockResponse = {
        data: {
          access_token: mockAccessToken,
          scope: 'read_products,write_products',
        },
      };

      httpService.post.mockReturnValue(of(mockResponse) as any);

      const result = await service.exchangeCodeForToken(mockShopDomain, 'test-code');

      expect(result.access_token).toBe(mockAccessToken);
      expect(httpService.post).toHaveBeenCalledWith(
        expect.stringContaining(mockShopDomain),
        expect.any(Object)
      );
    });

    it('should throw error on failed token exchange', async () => {
      httpService.post.mockReturnValue(throwError(() => new Error('API Error')));

      await expect(
        service.exchangeCodeForToken(mockShopDomain, 'invalid-code')
      ).rejects.toThrow('Failed to obtain access token from Shopify');
    });
  });

  describe('verifyWebhookHmac', () => {
    it('should verify valid HMAC signature', () => {
      const payload = JSON.stringify({ id: '123', title: 'Test Product' });
      const secret = mockWebhookSecret;
      const hmac = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('base64');

      const isValid = service.verifyWebhookHmac(payload, hmac, secret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC signature', () => {
      const payload = JSON.stringify({ id: '123', title: 'Test Product' });
      const secret = mockWebhookSecret;
      const invalidHmac = 'invalid-hmac-signature';

      const isValid = service.verifyWebhookHmac(payload, invalidHmac, secret);

      expect(isValid).toBe(false);
    });
  });

  describe('validateScopes', () => {
    it('should validate required scopes are present', () => {
      const requestedScopes = ['read_products', 'write_products', 'read_orders'];
      const requiredScopes = ['read_products', 'write_products'];

      const isValid = service.validateScopes(requestedScopes, requiredScopes);

      expect(isValid).toBe(true);
    });

    it('should reject when required scopes are missing', () => {
      const requestedScopes = ['read_products'];
      const requiredScopes = ['read_products', 'write_products'];

      const isValid = service.validateScopes(requestedScopes, requiredScopes);

      expect(isValid).toBe(false);
    });
  });

  describe('storeInstallation', () => {
    it('should create new installation', async () => {
      prismaService.shopifyInstall.findUnique.mockResolvedValue(null);
      prismaService.shopifyInstall.create.mockResolvedValue({
        id: 'test-id',
        shopDomain: mockShopDomain,
      });

      await service.storeInstallation(
        mockShopDomain,
        mockAccessToken,
        ['read_products'],
        mockBrandId
      );

      expect(encryptionService.encrypt).toHaveBeenCalledWith(mockAccessToken);
      expect(prismaService.shopifyInstall.create).toHaveBeenCalled();
    });

    it('should update existing installation', async () => {
      prismaService.shopifyInstall.findUnique.mockResolvedValue({
        id: 'test-id',
        shopDomain: mockShopDomain,
      });
      prismaService.shopifyInstall.update.mockResolvedValue({});

      await service.storeInstallation(
        mockShopDomain,
        mockAccessToken,
        ['read_products'],
        mockBrandId
      );

      expect(prismaService.shopifyInstall.update).toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('should return decrypted access token', async () => {
      prismaService.shopifyInstall.findUnique.mockResolvedValue({
        shopDomain: mockShopDomain,
        accessToken: `encrypted_${mockAccessToken}`,
        status: 'active',
      });

      const token = await service.getAccessToken(mockShopDomain);

      expect(token).toBe(mockAccessToken);
      expect(encryptionService.decrypt).toHaveBeenCalled();
    });

    it('should throw error if installation not found', async () => {
      prismaService.shopifyInstall.findUnique.mockResolvedValue(null);

      await expect(service.getAccessToken(mockShopDomain)).rejects.toThrow(
        'Active Shopify installation not found'
      );
    });
  });
});
