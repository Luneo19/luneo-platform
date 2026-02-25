import { NextRequest } from 'next/server';

type AdminForwardHeadersOptions = {
  contentType?: string;
  includeAuthorization?: boolean;
  includeCsrf?: boolean;
};

export function buildAdminForwardHeaders(
  request: NextRequest,
  options: AdminForwardHeadersOptions = {},
): HeadersInit {
  const {
    contentType = 'application/json',
    includeAuthorization = true,
    includeCsrf = true,
  } = options;

  const headers: HeadersInit = {
    'Content-Type': contentType,
    Cookie: request.headers.get('cookie') || '',
  };

  if (includeAuthorization) {
    const auth = request.headers.get('authorization');
    if (auth) headers.Authorization = auth;
  }

  if (includeCsrf) {
    const csrf = request.headers.get('x-csrf-token');
    if (csrf) headers['x-csrf-token'] = csrf;
  }

  return headers;
}
