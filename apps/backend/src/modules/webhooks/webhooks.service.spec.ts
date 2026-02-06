import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';

/**
 * TEST-03: Tests unitaires pour WebhooksService
 * Couverture de la gestion des webhooks et idempotency
 */
describe('WebhooksService', () => {
  let service: WebhooksService;

  const mockPrisma = {
    webhookLog: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    brand: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  // ============================================================================
  // generateIdempotencyKey
  // ============================================================================
  describe('generateIdempotencyKey', () => {
    it('should generate a 32-character hash', () => {
      const payload = { event: 'test', data: { id: '123' } };
      const brandId = 'brand-123';

      const key = service.generateIdempotencyKey(payload, brandId);

      expect(key).toBeDefined();
      expect(key.length).toBe(32);
    });

    it('should generate same key for same input', () => {
      const payload = { event: 'test', data: { id: '123' } };
      const brandId = 'brand-123';

      const key1 = service.generateIdempotencyKey(payload, brandId);
      const key2 = service.generateIdempotencyKey(payload, brandId);

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different payloads', () => {
      const payload1 = { event: 'test1', data: { id: '123' } };
      const payload2 = { event: 'test2', data: { id: '456' } };
      const brandId = 'brand-123';

      const key1 = service.generateIdempotencyKey(payload1, brandId);
      const key2 = service.generateIdempotencyKey(payload2, brandId);

      expect(key1).not.toBe(key2);
    });

    it('should generate different keys for different brands', () => {
      const payload = { event: 'test', data: { id: '123' } };
      const brandId1 = 'brand-123';
      const brandId2 = 'brand-456';

      const key1 = service.generateIdempotencyKey(payload, brandId1);
      const key2 = service.generateIdempotencyKey(payload, brandId2);

      expect(key1).not.toBe(key2);
    });

    it('should handle empty payload', () => {
      const key = service.generateIdempotencyKey({}, 'brand-123');

      expect(key).toBeDefined();
      expect(key.length).toBe(32);
    });

    it('should handle complex nested payload', () => {
      const payload = {
        event: 'order.created',
        data: {
          order: {
            id: '123',
            items: [
              { product: 'A', qty: 2 },
              { product: 'B', qty: 1 },
            ],
            customer: {
              name: 'John',
              email: 'john@example.com',
            },
          },
        },
      };

      const key = service.generateIdempotencyKey(payload, 'brand-123');

      expect(key).toBeDefined();
      expect(key.length).toBe(32);
    });
  });

  // ============================================================================
  // validateWebhook
  // ============================================================================
  describe('validateWebhook', () => {
    it('should return valid for new webhook', async () => {
      mockPrisma.webhookLog.findFirst.mockResolvedValue(null);

      const result = await service.validateWebhook('new-key-123', Date.now());

      expect(result.isValid).toBe(true);
      expect(result.existing).toBeUndefined();
    });

    it('should return existing webhook if already processed', async () => {
      const existingLog = {
        id: 'log-123',
        event: 'webhook_processed',
        payload: { idempotencyKey: 'existing-key' },
      };
      mockPrisma.webhookLog.findFirst.mockResolvedValue(existingLog);

      const result = await service.validateWebhook('existing-key', Date.now());

      expect(result.isValid).toBe(true);
      expect(result.existing).toEqual(existingLog);
    });

    it('should throw BadRequestException for old timestamp', async () => {
      mockPrisma.webhookLog.findFirst.mockResolvedValue(null);
      const oldTimestamp = Date.now() - 10 * 60 * 1000; // 10 minutes ago

      await expect(
        service.validateWebhook('key-123', oldTimestamp, 5) // 5 min max age
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw with replay attack message for old timestamp', async () => {
      mockPrisma.webhookLog.findFirst.mockResolvedValue(null);
      const oldTimestamp = Date.now() - 10 * 60 * 1000;

      try {
        await service.validateWebhook('key-123', oldTimestamp, 5);
        fail('Should have thrown');
      } catch (error) {
        expect(error.message).toContain('replay attack');
      }
    });

    it('should accept timestamp within max age', async () => {
      mockPrisma.webhookLog.findFirst.mockResolvedValue(null);
      const recentTimestamp = Date.now() - 2 * 60 * 1000; // 2 minutes ago

      const result = await service.validateWebhook('key-123', recentTimestamp, 5);

      expect(result.isValid).toBe(true);
    });

    it('should use default maxAge of 5 minutes', async () => {
      mockPrisma.webhookLog.findFirst.mockResolvedValue(null);
      const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago

      await expect(
        service.validateWebhook('key-123', oldTimestamp) // default maxAge
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================================================
  // processWebhook
  // ============================================================================
  describe('processWebhook', () => {
    const mockBrandId = 'brand-123';
    const mockPayload = { email: 'user@example.com', event: 'delivered' };

    beforeEach(() => {
      mockPrisma.webhookLog.findFirst.mockResolvedValue(null);
      mockPrisma.brand.findUnique.mockResolvedValue({
        id: mockBrandId,
        webhooks: [{ id: 'webhook-123' }],
      });
      mockPrisma.webhookLog.create.mockResolvedValue({ id: 'log-123' });
    });

    it('should process new webhook successfully', async () => {
      const result = await service.processWebhook(
        mockBrandId,
        'email.delivered',
        mockPayload
      );

      expect(result).toEqual({
        success: true,
        event: 'delivered',
        email: 'user@example.com',
      });
    });

    it('should create webhook log on success', async () => {
      await service.processWebhook(mockBrandId, 'email.delivered', mockPayload);

      expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          webhookId: 'webhook-123',
          event: 'webhook_processed',
          statusCode: 200,
        }),
      });
    });

    it('should return existing result for duplicate webhook', async () => {
      const existingResult = {
        id: 'log-123',
        response: JSON.stringify({ success: true }),
      };
      mockPrisma.webhookLog.findFirst.mockResolvedValue(existingResult);

      const result = await service.processWebhook(
        mockBrandId,
        'email.delivered',
        mockPayload,
        'duplicate-key'
      );

      expect(result).toEqual(existingResult);
      expect(mockPrisma.webhookLog.create).not.toHaveBeenCalled();
    });

    it('should use provided idempotency key', async () => {
      await service.processWebhook(
        mockBrandId,
        'email.delivered',
        mockPayload,
        'custom-key-123'
      );

      expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payload: expect.objectContaining({
            idempotencyKey: 'custom-key-123',
          }),
        }),
      });
    });

    it('should generate idempotency key if not provided', async () => {
      await service.processWebhook(
        mockBrandId,
        'email.delivered',
        mockPayload
      );

      expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          payload: expect.objectContaining({
            idempotencyKey: expect.any(String),
          }),
        }),
      });

      const call = mockPrisma.webhookLog.create.mock.calls[0][0];
      expect(call.data.payload.idempotencyKey.length).toBe(32);
    });

    it('should log error on processing failure', async () => {
      // Make processSendGridEvent throw
      jest.spyOn(service, 'processSendGridEvent').mockRejectedValue(
        new Error('Processing failed')
      );

      await expect(
        service.processWebhook(mockBrandId, 'email.delivered', mockPayload)
      ).rejects.toThrow('Processing failed');

      expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          statusCode: null,
          error: 'Processing failed',
        }),
      });
    });

    it('should handle brand without webhooks', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue({
        id: mockBrandId,
        webhooks: [],
      });

      await service.processWebhook(mockBrandId, 'email.delivered', mockPayload);

      expect(mockPrisma.webhookLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          webhookId: undefined,
        }),
      });
    });
  });

  // ============================================================================
  // processSendGridEvent
  // ============================================================================
  describe('processSendGridEvent', () => {
    it('should process SendGrid event and return result', async () => {
      const event = {
        email: 'user@example.com',
        event: 'delivered',
        timestamp: Date.now(),
      };

      const result = await service.processSendGridEvent(event);

      expect(result).toEqual({
        success: true,
        event: 'delivered',
        email: 'user@example.com',
      });
    });

    it('should handle different event types', async () => {
      const events = ['delivered', 'bounce', 'open', 'click', 'spam'];

      for (const eventType of events) {
        const result = await service.processSendGridEvent({
          email: 'test@example.com',
          event: eventType,
        });

        expect(result.event).toBe(eventType);
        expect(result.success).toBe(true);
      }
    });
  });

  // ============================================================================
  // logWebhookEvent
  // ============================================================================
  describe('logWebhookEvent', () => {
    it('should log event without error', async () => {
      const event = {
        type: 'test',
        data: { id: '123' },
      };

      await expect(service.logWebhookEvent(event)).resolves.not.toThrow();
    });
  });

  // ============================================================================
  // Edge cases
  // ============================================================================
  describe('Edge cases', () => {
    it('should handle very large payload', async () => {
      const largePayload = {
        data: 'x'.repeat(10000),
        nested: {
          array: Array(100).fill({ key: 'value' }),
        },
      };

      const key = service.generateIdempotencyKey(largePayload, 'brand-123');

      expect(key).toBeDefined();
      expect(key.length).toBe(32);
    });

    it('should handle special characters in payload', async () => {
      const payload = {
        text: 'Special: <>&"\' \n\t\r',
        unicode: '日本語 한국어 中文',
        emoji: '🎉🔥💯',
      };

      const key = service.generateIdempotencyKey(payload, 'brand-123');

      expect(key).toBeDefined();
      expect(key.length).toBe(32);
    });

    it('should handle null values in payload', async () => {
      const payload = {
        value: null,
        nested: { nullValue: null },
      };

      const key = service.generateIdempotencyKey(payload, 'brand-123');

      expect(key).toBeDefined();
    });

    it('should handle timestamp at edge of max age', async () => {
      mockPrisma.webhookLog.findFirst.mockResolvedValue(null);
      
      // Exactly at the edge (4m59s ago with 5 min max)
      const edgeTimestamp = Date.now() - (4 * 60 * 1000 + 59 * 1000);

      const result = await service.validateWebhook('key-123', edgeTimestamp, 5);

      expect(result.isValid).toBe(true);
    });
  });
});
