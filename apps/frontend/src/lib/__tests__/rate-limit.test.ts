import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type MockLimiterResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<number>;
};

const redisConstructor = vi.fn().mockImplementation(() => ({ client: true }));
vi.mock('@upstash/redis', () => ({
  Redis: redisConstructor,
}));

const slidingWindowMock = vi.fn();
const limitMocks: Array<(identifier: string) => Promise<MockLimiterResult>> = [];
const ratelimitConstructorBase = vi.fn(() => {
  const limit = vi.fn().mockResolvedValue({
    success: true,
    limit: 10,
    remaining: 9,
    reset: Date.now(),
    pending: Promise.resolve(0),
  }) as unknown as (identifier: string) => Promise<MockLimiterResult>;
  limitMocks.push(limit);
  return { limit };
});

const ratelimitConstructor = ratelimitConstructorBase as unknown as ReturnType<typeof vi.fn> & {
  slidingWindow: typeof slidingWindowMock;
};
ratelimitConstructor.slidingWindow = slidingWindowMock;

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: ratelimitConstructor,
}));

const loadRateLimitModule = async () => {
  vi.resetModules();
  return import('../rate-limit');
};

describe('rate-limit utilities', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    limitMocks.length = 0;
    slidingWindowMock.mockClear();
    ratelimitConstructor.mockClear();
    redisConstructor.mockClear();
    Object.assign(process.env, originalEnv);
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    Object.assign(process.env, { NODE_ENV: 'test' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // TODO: Ces tests nécessitent une refactorisation car le module caching
  // de Vitest empêche le bon fonctionnement des mocks dynamiques
  it.skip('returns noop limiter result when redis config is absent', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rateLimitModule = await loadRateLimitModule();

    const result = await rateLimitModule.checkRateLimit('user-1');

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(Number.MAX_SAFE_INTEGER);
    expect(result.limit).toBe(Number.MAX_SAFE_INTEGER);
    expect(result.reset).toBeInstanceOf(Date);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  // TODO: Refactoriser avec un mock plus robuste
  it.skip('instantiates real redis limiter when configuration is provided', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';

    const rateLimitModule = await loadRateLimitModule();

    expect(ratelimitConstructor).toHaveBeenCalledTimes(4);
    expect(slidingWindowMock).toHaveBeenCalled();
    expect(ratelimitConstructor).toHaveBeenCalledTimes(4);

    const authLimiterFn = limitMocks[1];
    expect(authLimiterFn).toBeDefined();

    const directOutcome = await authLimiterFn('client-123');
    expect(authLimiterFn).toHaveBeenCalledWith('client-123');
    expect(directOutcome.limit).toBe(10);

    const wrappedOutcome = await rateLimitModule.checkRateLimit('client-123', { limit: authLimiterFn });
    expect(wrappedOutcome.limit).toBe(10);
  });

  it('computes client identifier from request headers or user id', async () => {
    const rateLimitModule = await loadRateLimitModule();

    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '203.0.113.1, 10.0.0.2',
      },
    });

    expect(rateLimitModule.getClientIdentifier(request)).toBe('ip:203.0.113.1');
    const withUser = rateLimitModule.getClientIdentifier(request, 'usr_1');
    expect(withUser).toBe('user:usr_1');

    const realIpRequest = new Request('https://example.com', {
      headers: { 'x-real-ip': '198.51.100.5' },
    });
    expect(rateLimitModule.getClientIdentifier(realIpRequest)).toBe('ip:198.51.100.5');

    const fallbackRequest = new Request('https://example.com');
    expect(rateLimitModule.getClientIdentifier(fallbackRequest)).toBe('ip:unknown');
  });
});

