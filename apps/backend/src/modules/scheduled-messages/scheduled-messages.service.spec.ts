import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ScheduledMessagesService } from './scheduled-messages.service';
import { PrismaOptimizedService } from '@/libs/prisma/prisma-optimized.service';
import { DistributedLockService } from '@/libs/redis/distributed-lock.service';

describe('ScheduledMessagesService', () => {
  let service: ScheduledMessagesService;

  const prisma = {
    $transaction: jest.fn(),
    conversation: {
      findFirst: jest.fn(),
    },
    scheduledMessage: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    message: {
      create: jest.fn(),
    },
    failedJob: {
      create: jest.fn(),
    },
  };
  const distributedLock = {
    acquire: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    distributedLock.acquire.mockResolvedValue(true);
    distributedLock.release.mockResolvedValue(undefined);
    prisma.$transaction.mockImplementation(async (callback: any) => callback(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledMessagesService,
        { provide: PrismaOptimizedService, useValue: prisma },
        { provide: DistributedLockService, useValue: distributedLock },
      ],
    }).compile();

    service = module.get(ScheduledMessagesService);
  });

  it('create refuse si org absente', async () => {
    await expect(
      service.create(
        { id: 'u1', organizationId: null } as any,
        {
          conversationId: 'conv_1',
          channelType: 'WIDGET' as any,
          content: 'hello',
          scheduledAt: new Date(Date.now() + 60_000).toISOString(),
        },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('create refuse si conversation introuvable', async () => {
    prisma.conversation.findFirst.mockResolvedValue(null);

    await expect(
      service.create(
        { id: 'u1', organizationId: 'org_1' } as any,
        {
          conversationId: 'conv_missing',
          channelType: 'WIDGET' as any,
          content: 'hello',
          scheduledAt: new Date(Date.now() + 60_000).toISOString(),
        },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('create persiste un scheduled message valide', async () => {
    prisma.conversation.findFirst.mockResolvedValue({ id: 'conv_1' });
    prisma.scheduledMessage.create.mockResolvedValue({ id: 's1' });

    const result = await service.create(
      { id: 'u1', organizationId: 'org_1' } as any,
      {
        conversationId: 'conv_1',
        channelType: 'WIDGET' as any,
        content: 'hello',
        scheduledAt: new Date(Date.now() + 60_000).toISOString(),
      },
    );

    expect(prisma.scheduledMessage.create).toHaveBeenCalled();
    expect(result).toEqual({ id: 's1' });
  });

  it('processDueBatch agrège sent/failed', async () => {
    prisma.scheduledMessage.findMany.mockResolvedValue([{ id: 's1' }, { id: 's2' }]);
    jest
      .spyOn(service as any, 'processSingle')
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('boom'));

    const result = await service.processDueBatch(new Date(), 100);

    expect(result).toEqual({ scanned: 2, sent: 1, failed: 1 });
  });

  it('processDueBatch skip si lock batch non acquis', async () => {
    distributedLock.acquire.mockResolvedValueOnce(false);

    const result = await service.processDueBatch(new Date(), 100);

    expect(result).toEqual({ scanned: 0, sent: 0, failed: 0 });
    expect(prisma.scheduledMessage.findMany).not.toHaveBeenCalled();
  });
});
