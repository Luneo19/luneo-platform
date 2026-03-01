import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ensureSession', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.defineProperty(document, 'cookie', {
      value: 'csrf_token=test-csrf-token',
      writable: true,
      configurable: true,
    });
  });

  it('returns true immediately when /auth/me is already valid', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const { ensureSession } = await import('./session-client');
    const result = await ensureSession();

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/me',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    );
  });

  it('refreshes session when /auth/me returns 401', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true, status: 200 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    const { ensureSession } = await import('./session-client');
    const result = await ensureSession();

    expect(result).toBe(true);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/v1/auth/refresh',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'X-CSRF-Token': 'test-csrf-token',
        }),
      }),
    );
  });

  it('deduplicates concurrent recovery attempts', async () => {
    let resolveFirst: ((value: { ok: boolean; status: number }) => void) | null = null;
    const firstCall = new Promise<{ ok: boolean; status: number }>((resolve) => {
      resolveFirst = resolve;
    });

    const fetchMock = vi.fn().mockImplementation(() => firstCall);
    vi.stubGlobal('fetch', fetchMock);

    const { ensureSession } = await import('./session-client');
    const promiseA = ensureSession();
    const promiseB = ensureSession();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveFirst?.({ ok: true, status: 200 });

    const [resultA, resultB] = await Promise.all([promiseA, promiseB]);
    expect(resultA).toBe(true);
    expect(resultB).toBe(true);
  });
});
