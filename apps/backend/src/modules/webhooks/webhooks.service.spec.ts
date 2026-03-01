import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { QueuesService } from '@/libs/queues';

describe('WebhooksService', () => {
  let service: WebhooksService;

  const prisma = {
    webhook: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    failedJob: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const queues = {
    addDLQJob: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        { provide: PrismaOptimizedService, useValue: prisma },
        { provide: QueuesService, useValue: queues },
      ],
    }).compile();

    service = module.get(WebhooksService);
  });

  it('listFailedJobs exige une organisation', async () => {
    await expect(
      service.listFailedJobs({ id: 'u1', organizationId: null } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('listFailedJobs filtre queue webhook_delivery', async () => {
    prisma.failedJob.findMany.mockResolvedValue([{ id: 'f1' }]);

    const result = await service.listFailedJobs(
      { id: 'u1', organizationId: 'org_1' } as any,
      25,
    );

    expect(prisma.failedJob.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org_1',
          queue: 'webhook_delivery',
        }),
        take: 25,
      }),
    );
    expect(result).toEqual([{ id: 'f1' }]);
  });

  it('replayFailedJob throw si failed job introuvable', async () => {
    prisma.failedJob.findFirst.mockResolvedValue(null);

    await expect(
      service.replayFailedJob(
        { id: 'u1', organizationId: 'org_1' } as any,
        'missing',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('replayFailedJob appelle deliver puis resolve le job', async () => {
    prisma.failedJob.findFirst.mockResolvedValue({
      id: 'f1',
      organizationId: 'org_1',
      queue: 'webhook_delivery',
      attempts: 2,
      data: {
        webhookId: 'w1',
        event: 'public.message.created',
        payload: { a: 1 },
      },
    });
    prisma.failedJob.update.mockResolvedValue({});
    const deliverSpy = jest
      .spyOn(service as any, 'deliver')
      .mockResolvedValue(undefined);

    const result = await service.replayFailedJob(
      { id: 'u1', organizationId: 'org_1' } as any,
      'f1',
    );

    expect(deliverSpy).toHaveBeenCalledWith(
      'w1',
      { event: 'public.message.created', payload: { a: 1 } },
      2,
    );
    expect(prisma.failedJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'f1' },
      }),
    );
    expect(result).toEqual({ replayed: true });
  });
});
