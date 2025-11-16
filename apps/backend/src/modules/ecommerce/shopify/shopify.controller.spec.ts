import { Test, TestingModule } from '@nestjs/testing';
import { ShopifyController } from './shopify.controller';
import { ShopifyService } from './shopify.service';
import { Response } from 'express';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('ShopifyController', () => {
  let controller: ShopifyController;
  let service: jest.Mocked<ShopifyService>;

  const mockShopDomain = 'test-shop.myshopify.com';
  const mockBrandId = 'test-brand-id';
  const mockCode = 'test-oauth-code';
  const mockState = 'test-nonce-state';

  beforeEach(async () => {
    const mockService = {
      generateInstallUrl: jest.fn(),
      exchangeCodeForToken: jest.fn(),
      storeInstallation: jest.fn(),
      enableWebhooks: jest.fn(),
      validateNonce: jest.fn(),
      getWebhookSecret: jest.fn(),
      verifyWebhookHmac: jest.fn(),
      validateScopes: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShopifyController],
      providers: [
        {
          provide: ShopifyService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ShopifyController>(ShopifyController);
    service = module.get(ShopifyService);
  });

  describe('install', () => {
    it('should redirect to Shopify OAuth URL', async () => {
      const mockRes = {
        redirect: jest.fn(),
      } as unknown as Response;

      service.generateInstallUrl.mockReturnValue('https://shopify-oauth-url.com');

      await controller.install(mockShopDomain, mockBrandId, mockRes);

      expect(service.generateInstallUrl).toHaveBeenCalledWith(mockShopDomain, mockBrandId);
      expect(mockRes.redirect).toHaveBeenCalledWith('https://shopify-oauth-url.com');
    });

    it('should throw error if shop or brandId missing', async () => {
      const mockRes = {} as Response;

      await expect(controller.install('', mockBrandId, mockRes)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('callback', () => {
    it('should process OAuth callback successfully', async () => {
      const mockRes = {
        redirect: jest.fn(),
      } as unknown as Response;

      service.validateNonce.mockResolvedValue(true);
      service.exchangeCodeForToken.mockResolvedValue({
        access_token: 'test-token',
        scope: 'read_products,write_products',
      });
      service.validateScopes.mockReturnValue(true);
      service.storeInstallation.mockResolvedValue();
      service.enableWebhooks.mockResolvedValue();

      await controller.callback(mockCode, mockShopDomain, mockState, mockBrandId, mockRes);

      expect(service.validateNonce).toHaveBeenCalledWith(mockShopDomain, mockBrandId, mockState);
      expect(service.exchangeCodeForToken).toHaveBeenCalledWith(mockShopDomain, mockCode);
      expect(service.storeInstallation).toHaveBeenCalled();
      expect(service.enableWebhooks).toHaveBeenCalled();
    });

    it('should reject invalid nonce', async () => {
      const mockRes = {
        redirect: jest.fn(),
      } as unknown as Response;

      service.validateNonce.mockResolvedValue(false);

      await controller.callback(mockCode, mockShopDomain, mockState, mockBrandId, mockRes);

      expect(mockRes.redirect).toHaveBeenCalledWith(
        expect.stringContaining('shopify=error')
      );
    });
  });

  describe('handleProductWebhook', () => {
    it('should process valid webhook', async () => {
      const mockReq = {
        body: Buffer.from(JSON.stringify({ id: '123', title: 'Test Product' })),
      } as any;

      service.getWebhookSecret.mockResolvedValue('test-secret');
      service.verifyWebhookHmac.mockReturnValue(true);

      const result = await controller.handleProductWebhook(
        mockReq,
        mockShopDomain,
        'valid-hmac',
        'products/update'
      );

      expect(result.success).toBe(true);
      expect(service.verifyWebhookHmac).toHaveBeenCalled();
    });

    it('should reject webhook with invalid HMAC', async () => {
      const mockReq = {
        body: Buffer.from(JSON.stringify({ id: '123' })),
      } as any;

      service.getWebhookSecret.mockResolvedValue('test-secret');
      service.verifyWebhookHmac.mockReturnValue(false);

      await expect(
        controller.handleProductWebhook(mockReq, mockShopDomain, 'invalid-hmac', 'products/update')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject webhook with missing headers', async () => {
      const mockReq = { body: Buffer.from('{}') } as any;

      await expect(
        controller.handleProductWebhook(mockReq, '', '', 'products/update')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
