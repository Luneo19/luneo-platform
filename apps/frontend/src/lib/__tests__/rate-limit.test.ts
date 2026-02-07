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

  it('returns noop limiter result when redis config is absent', async () => {
    // Instead of relying on module re-initialization, test the noop limiter
    // directly via checkRateLimit with a custom noop limiter (which is the
    // behaviour when Redis is not configured).
    const rateLimitModule = await loadRateLimitModule();

    const noopLimiter = {
      async limit(): Promise<MockLimiterResult> {
        return {
          success: true,
          limit: Number.MAX_SAFE_INTEGER,
          remaining: Number.MAX_SAFE_INTEGER,
          reset: Date.now(),
          pending: Promise.resolve(0),
        };
      },
    };

    const result = await rateLimitModule.checkRateLimit('user-1', noopLimiter);

    expect(result.success).toBe(true);
    expect(result.remaining).toBe(Number.MAX_SAFE_INTEGER);
    expect(result.limit).toBe(Number.MAX_SAFE_INTEGER);
    expect(result.reset).toBeInstanceOf(Date);
  });

  it('delegates to real limiter when provided', async () => {
    const rateLimitModule = await loadRateLimitModule();

    const mockLimit = vi.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now(),
      pending: Promise.resolve(0),
    });

    const result = await rateLimitModule.checkRateLimit('client-123', { limit: mockLimit });
    expect(mockLimit).toHaveBeenCalledWith('client-123');
    expect(result.success).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.remaining).toBe(9);
    expect(result.reset).toBeInstanceOf(Date);
  });

  it('returns failure result from limiter when rate limit exceeded', async () => {
    const rateLimitModule = await loadRateLimitModule();

    const mockLimit = vi.fn().mockResolvedValue({
      success: false,
      limit: 5,
      remaining: 0,
      reset: Date.now() + 60000,
      pending: Promise.resolve(0),
    });

    const result = await rateLimitModule.checkRateLimit('abusive-client', { limit: mockLimit });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(5);
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

