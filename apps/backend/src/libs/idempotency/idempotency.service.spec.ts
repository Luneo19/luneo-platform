import { IdempotencyService } from './idempotency.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('IdempotencyService', () => {
  const createService = () => {
    const prismaMock = {
      idempotencyKey: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as unknown as PrismaService;

    return {
      service: new IdempotencyService(prismaMock),
      prismaMock: prismaMock as unknown as {
        idempotencyKey: {
          findUnique: jest.Mock;
          create: jest.Mock;
          update: jest.Mock;
          upsert: jest.Mock;
          delete: jest.Mock;
          deleteMany: jest.Mock;
        };
      },
    };
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('claims processing key atomically when key is new', async () => {
    const { service, prismaMock } = createService();
    prismaMock.idempotencyKey.create.mockResolvedValue({});

    const claimed = await service.claimForProcessing('k1', 60);

    expect(claimed).toBe(true);
    expect(prismaMock.idempotencyKey.create).toHaveBeenCalledWith({
      data: {
        key: 'k1',
        result: JSON.stringify({ status: 'PROCESSING' }),
        expiresAt: expect.any(Date),
      },
    });
  });

  it('returns false when key already exists (duplicate)', async () => {
    const { service, prismaMock } = createService();
    prismaMock.idempotencyKey.create.mockRejectedValue({ code: 'P2002' });

    const claimed = await service.claimForProcessing('k2', 60);

    expect(claimed).toBe(false);
  });

  it('completes processing by updating stored result and expiry', async () => {
    const { service, prismaMock } = createService();
    prismaMock.idempotencyKey.update.mockResolvedValue({});

    await service.completeProcessing('k3', { ok: true }, 120);

    expect(prismaMock.idempotencyKey.update).toHaveBeenCalledWith({
      where: { key: 'k3' },
      data: {
        result: JSON.stringify({ ok: true }),
        expiresAt: expect.any(Date),
      },
    });
  });

  it('releases claim by deleting the key', async () => {
    const { service, prismaMock } = createService();
    prismaMock.idempotencyKey.delete.mockResolvedValue({});

    await service.releaseClaim('k4');

    expect(prismaMock.idempotencyKey.delete).toHaveBeenCalledWith({
      where: { key: 'k4' },
    });
  });
});
