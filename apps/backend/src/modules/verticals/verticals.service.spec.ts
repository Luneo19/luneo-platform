import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VerticalsService } from './verticals.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { PlatformRole } from '@prisma/client';

describe('VerticalsService', () => {
  let service: VerticalsService;

  const mockPrisma = {
    verticalTemplate: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    organization: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerticalsService,
        { provide: PrismaOptimizedService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<VerticalsService>(VerticalsService);
    jest.clearAllMocks();
  });

  it('should list seed templates when DB is empty', async () => {
    mockPrisma.verticalTemplate.findMany.mockResolvedValue([]);
    const templates = await service.listTemplates();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toHaveProperty('slug');
  });

  it('should throw when selecting unknown template', async () => {
    mockPrisma.verticalTemplate.findUnique.mockResolvedValue(null);
    await expect(
      service.selectVerticalForOrganization(
        {
          id: 'u1',
          email: 'u@example.com',
          role: PlatformRole.USER,
          organizationId: 'org_1',
        },
        'unknown-template',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
