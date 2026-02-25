import type { NextRequest } from 'next/server';
import { buildAdminForwardHeaders } from '@/lib/api/admin-forward-headers';

function createRequest(headers: Record<string, string>): NextRequest {
  return {
    headers: new Headers(headers),
  } as unknown as NextRequest;
}

describe('buildAdminForwardHeaders', () => {
  it('forwarde cookie, authorization et x-csrf-token', () => {
    const request = createRequest({
      cookie: 'refreshToken=abc; csrf_token=token123',
      authorization: 'Bearer access123',
      'x-csrf-token': 'token123',
    });

    const forwarded = buildAdminForwardHeaders(request) as Record<string, string>;

    expect(forwarded.Cookie).toContain('refreshToken=abc');
    expect(forwarded.Authorization).toBe('Bearer access123');
    expect(forwarded['x-csrf-token']).toBe('token123');
    expect(forwarded['Content-Type']).toBe('application/json');
  });

  it('n injecte pas x-csrf-token si absent', () => {
    const request = createRequest({
      cookie: 'refreshToken=abc',
    });

    const forwarded = buildAdminForwardHeaders(request) as Record<string, string>;

    expect(forwarded.Cookie).toContain('refreshToken=abc');
    expect(forwarded['x-csrf-token']).toBeUndefined();
  });
});
