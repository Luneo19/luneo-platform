import { Test, TestingModule } from '@nestjs/testing';
import { CreditsService } from './credits.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { BillingService } from '@/modules/billing/billing.service';
import { ConfigService } from '@nestjs/config';

describe('CreditsService', () => {
  let service: CreditsService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
    organization: {
      update: jest.fn(),
    },
  };

  const mockBillingService = {
    getSubscription: jest.fn(),
    getStripe: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'app.frontendUrl') return 'https://luneo.app';
      if (key === 'app.url') return 'https://luneo.app';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreditsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: BillingService, useValue: mockBillingService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CreditsService>(CreditsService);
    jest.clearAllMocks();
  });

  it('returns stable packs payload shape', async () => {
    const result = await service.getPacks();
    expect(Array.isArray(result.packs)).toBe(true);
    expect(result.packs.length).toBeGreaterThan(0);
    expect(result.packs[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        credits: expect.any(Number),
        price: expect.any(Number),
        priceCents: expect.any(Number),
      }),
    );
  });

  it('computes balance from subscription limits and usage', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      memberships: [
        {
          organization: {
            id: 'org-1',
            name: 'Org',
            stripeCustomerId: null,
            conversationsLimit: 0,
          },
        },
      ],
    });
    mockBillingService.getSubscription.mockResolvedValue({
      limits: { aiGenerationsPerMonth: 2000 },
      currentUsage: { aiGenerations: 450 },
    });

    const result = await service.getBalance('user-1');
    expect(result).toEqual(
      expect.objectContaining({
        balance: 1550,
        used: 450,
        planIncluded: 2000,
      }),
    );
  });

  it('rejects unknown packs at buy endpoint', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      memberships: [
        {
          organization: {
            id: 'org-1',
            name: 'Org',
            stripeCustomerId: null,
            conversationsLimit: 0,
          },
        },
      ],
    });

    await expect(service.buyCredits('user-1', { packSize: 9999 })).rejects.toThrow(
      'Unknown credit pack',
    );
  });
});
