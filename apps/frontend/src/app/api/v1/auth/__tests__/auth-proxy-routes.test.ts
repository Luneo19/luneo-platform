import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const {
  rawHttpRequestMock,
  getAccessTokenMock,
  getRefreshTokenMock,
  forwardCookiesToResponseMock,
  setNoCacheHeadersMock,
} = vi.hoisted(() => ({
  rawHttpRequestMock: vi.fn(),
  getAccessTokenMock: vi.fn(),
  getRefreshTokenMock: vi.fn(),
  forwardCookiesToResponseMock: vi.fn(),
  setNoCacheHeadersMock: vi.fn(),
}));

vi.mock('../_helpers', () => ({
  rawHttpRequest: rawHttpRequestMock,
  getAccessToken: getAccessTokenMock,
  getRefreshToken: getRefreshTokenMock,
  forwardCookiesToResponse: forwardCookiesToResponseMock,
  setNoCacheHeaders: setNoCacheHeadersMock,
  authUrl: (path: string) => `https://api.example.com/api/v1/auth/${path}`,
}));

vi.mock('@/lib/api/server-url', () => ({
  getBackendUrl: () => 'https://api.example.com',
}));

vi.mock('@/lib/logger-server', () => ({
  serverLogger: {
    error: vi.fn(),
  },
}));

import { POST as loginPost } from '../login/route';
import { POST as refreshPost } from '../refresh/route';
import { POST as catchAllPost } from '../[...path]/route';

describe('auth proxy routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAccessTokenMock.mockResolvedValue(undefined);
    getRefreshTokenMock.mockResolvedValue(undefined);
    rawHttpRequestMock.mockResolvedValue({
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ok: true }),
      setCookieHeaders: ['accessToken=abc; Path=/; HttpOnly'],
    });
  });

  it('login proxy forwarde cookie + csrf', async () => {
    const req = new NextRequest('https://luneo.app/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: 'csrf_token=token123',
        'x-csrf-token': 'token123',
      },
      body: JSON.stringify({ email: 'a@b.com', password: 'pw' }),
    });

    const res = await loginPost(req);

    expect(rawHttpRequestMock).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          cookie: 'csrf_token=token123',
          'x-csrf-token': 'token123',
        }),
      }),
    );
    expect(res.status).toBe(200);
    expect(forwardCookiesToResponseMock).toHaveBeenCalled();
  });

  it('refresh retourne 401 si refreshToken absent', async () => {
    getRefreshTokenMock.mockResolvedValue(undefined);
    const req = new NextRequest('https://luneo.app/api/v1/auth/refresh', {
      method: 'POST',
    });

    const res = await refreshPost(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ message: 'No refresh token' });
    expect(rawHttpRequestMock).not.toHaveBeenCalled();
  });

  it('catch-all gère les redirects backend et forwarde les cookies', async () => {
    rawHttpRequestMock.mockResolvedValueOnce({
      statusCode: 302,
      headers: {
        location: 'https://luneo.app/login',
        'content-type': 'text/html',
      },
      body: '',
      setCookieHeaders: ['refreshToken=abc; Path=/; HttpOnly'],
    });

    const req = new NextRequest('https://luneo.app/api/v1/auth/2fa/setup', {
      method: 'POST',
      headers: {
        cookie: 'refreshToken=abc',
      },
      body: JSON.stringify({}),
    });

    const res = await catchAllPost(req);

    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('https://luneo.app/login');
    expect(forwardCookiesToResponseMock).toHaveBeenCalled();
  });
});
