import { ChannelReliabilityService } from './channel-reliability.service';

describe('ChannelReliabilityService', () => {
  const channelRouterService = {
    routeOutgoing: jest.fn(),
  };
  const prisma = {
    analyticsEvent: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const service = new ChannelReliabilityService(
    channelRouterService as never,
    prisma as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (service as unknown as { deadLetterQueue: unknown[] }).deadLetterQueue = [];
  });

  it('ne retourne que la DLQ de l’organisation demandée', () => {
    (service as unknown as { deadLetterQueue: unknown[] }).deadLetterQueue = [
      {
        id: 'a1',
        organizationId: 'org-a',
        channelType: 'EMAIL',
        recipientId: 'r1',
        content: 'c1',
        config: {},
        reason: 'e1',
        failedAt: new Date().toISOString(),
      },
      {
        id: 'b1',
        organizationId: 'org-b',
        channelType: 'EMAIL',
        recipientId: 'r2',
        content: 'c2',
        config: {},
        reason: 'e2',
        failedAt: new Date().toISOString(),
      },
    ];

    const items = service.getDeadLetterQueue('org-a', 50);
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('a1');
  });

  it('empêche le retry d’un item DLQ d’une autre organisation', async () => {
    (service as unknown as { deadLetterQueue: unknown[] }).deadLetterQueue = [
      {
        id: 'a1',
        organizationId: 'org-a',
        channelType: 'EMAIL',
        recipientId: 'r1',
        content: 'c1',
        config: {},
        reason: 'e1',
        failedAt: new Date().toISOString(),
      },
    ];

    await expect(service.retryDeadLetterItem('org-b', 'a1')).rejects.toThrow(
      'DLQ item introuvable',
    );
  });
});

