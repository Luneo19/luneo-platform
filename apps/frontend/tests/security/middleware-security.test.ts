import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../../middleware';

function createRequest(
  url: string,
  init?: { method?: string; headers?: Record<string, string> },
): NextRequest {
  return new NextRequest(url, {
    method: init?.method ?? 'GET',
    headers: init?.headers,
  });
}

describe('middleware security flows', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    delete process.env.ENABLE_CSRF_IN_DEV;
  });

  it('canonicalise /Admin vers /admin', async () => {
    const req = createRequest('https://luneo.app/Admin');
    const res = await middleware(req);

    expect(res.status).toBe(308);
    expect(res.headers.get('location')).toContain('/admin');
  });

  it('redirige une route protégée vers login sans tokens', async () => {
    const req = createRequest('https://luneo.app/dashboard');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
    expect(res.headers.get('location')).toContain('redirect=%2Fdashboard');
  });

  it('bloque CSRF sur mutation API avec cookie mais sans header', async () => {
    process.env.ENABLE_CSRF_IN_DEV = 'true';
    const req = createRequest('https://luneo.app/api/profile/password', {
      method: 'POST',
      headers: {
        cookie: 'csrf_token=token123',
      },
    });
    const res = await middleware(req);

    expect(res.status).toBe(403);
  });

  it('n applique pas CSRF aux webhooks', async () => {
    process.env.ENABLE_CSRF_IN_DEV = 'true';
    const req = createRequest('https://luneo.app/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        cookie: 'csrf_token=token123',
      },
    });
    const res = await middleware(req);

    expect(res.status).toBe(200);
  });

  it('applique no-cache sur /admin quand authentifié', async () => {
    const req = createRequest('https://luneo.app/admin', {
      headers: {
        cookie: 'refreshToken=refresh_123',
      },
    });
    const res = await middleware(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('no-store');
    expect(res.headers.get('Vercel-CDN-Cache-Control')).toContain('no-store');
  });
});
