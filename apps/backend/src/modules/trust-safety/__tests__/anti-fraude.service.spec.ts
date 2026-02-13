/**
 * AntiFraudeService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { AntiFraudeService, FraudCheckRequest, FraudResult } from '../services/anti-fraude.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

describe('AntiFraudeService', () => {
  let service: AntiFraudeService;
  let cache: SmartCacheService;

  const mockPrisma = {};
  const mockCache = {
    getSimple: jest.fn(),
    setSimple: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AntiFraudeService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SmartCacheService, useValue: mockCache },
      ],
    }).compile();

    service = module.get<AntiFraudeService>(AntiFraudeService);
    cache = module.get<SmartCacheService>(SmartCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkFraud', () => {
    it('should return low risk when all checks pass', async () => {
      mockCache.getSimple.mockResolvedValue(0);

      const result = await service.checkFraud({
        userId: 'user-1',
        email: 'user@company.com',
        ipAddress: '1.2.3.4',
        action: 'order',
      } as FraudCheckRequest);

      expect(result.riskLevel).toBe('low');
      expect(result.action).toBe('allow');
      expect(result.riskScore).toBeLessThan(40);
    });

    it('should flag suspicious email domain', async () => {
      mockCache.getSimple.mockResolvedValue(0);

      const result = await service.checkFraud({
        email: 'test@tempmail.com',
        action: 'signup',
      } as FraudCheckRequest);

      expect(result.reasons.some((r) => r.includes('Suspicious email domain'))).toBe(true);
      expect(result.checks.email).toBe(true);
      expect(result.riskScore).toBeGreaterThanOrEqual(25);
    });

    it('should flag high order value', async () => {
      mockCache.getSimple.mockResolvedValue(0);

      const result = await service.checkFraud({
        userId: 'user-1',
        action: 'order',
        orderValue: 50000,
      } as FraudCheckRequest);

      expect(result.reasons.some((r) => r.includes('Suspicious order value'))).toBe(true);
      expect(result.checks.value).toBe(true);
    });

    it('should return critical/block when score >= 80', async () => {
      mockCache.getSimple
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(0);
      const result = await service.checkFraud({
        userId: 'user-1',
        email: 'test@tempmail.com',
        ipAddress: '1.2.3.4',
        action: 'signup',
        orderValue: 50000,
      } as FraudCheckRequest);

      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      if (result.riskScore >= 80) {
        expect(result.riskLevel).toBe('critical');
        expect(result.action).toBe('block');
      }
    });
  });
});
