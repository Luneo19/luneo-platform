import { DistributedLockService } from './distributed-lock.service';
import { RedisOptimizedService } from './redis-optimized.service';

describe('DistributedLockService', () => {
  const makeService = (client: Record<string, jest.Mock> | null) => {
    const redisMock = {
      client,
    } as unknown as RedisOptimizedService;
    return new DistributedLockService(redisMock);
  };

  it('acquires lock when Redis set returns OK', async () => {
    const client = {
      set: jest.fn().mockResolvedValue('OK'),
      eval: jest.fn().mockResolvedValue(1),
    };
    const service = makeService(client);

    const acquired = await service.acquire('job:1', 30, false);

    expect(acquired).toBe(true);
    expect(client.set).toHaveBeenCalledWith(
      'dlock:job:1',
      expect.any(String),
      'EX',
      30,
      'NX',
    );
  });

  it('does not acquire lock when Redis set returns null', async () => {
    const client = {
      set: jest.fn().mockResolvedValue(null),
      eval: jest.fn(),
    };
    const service = makeService(client);

    const acquired = await service.acquire('job:2', 30, false);

    expect(acquired).toBe(false);
  });

  it('releases lock using compare-and-del script', async () => {
    const client = {
      set: jest.fn().mockResolvedValue('OK'),
      eval: jest.fn().mockResolvedValue(1),
    };
    const service = makeService(client);

    await service.acquire('job:3', 30, false);
    await service.release('job:3');

    expect(client.eval).toHaveBeenCalledWith(
      expect.stringContaining('redis.call("GET", KEYS[1]) == ARGV[1]'),
      1,
      'dlock:job:3',
      expect.any(String),
    );
  });

  it('returns false in fail-safe mode when Redis is unavailable', async () => {
    const service = makeService(null);

    const acquired = await service.acquire('job:4', 30, false);

    expect(acquired).toBe(false);
  });
});
